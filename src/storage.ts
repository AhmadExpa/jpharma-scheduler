import { createDefaultState } from './dateUtils'
import type { DaySchedule, Employee, ScheduleEntry, SchedulerState, Weekday, WeeklyTemplate } from './types'

const STORAGE_KEY = 'jpharma-scheduler:v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function cleanEntry(value: unknown): ScheduleEntry | null {
  if (!isRecord(value)) return null
  if (typeof value.id !== 'string' || typeof value.employeeId !== 'string') return null
  if (value.kind !== 'shift' && value.kind !== 'off') return null
  if (typeof value.label !== 'string') return null
  return { id: value.id, employeeId: value.employeeId, kind: value.kind, label: value.label }
}

function cleanDay(value: unknown): DaySchedule {
  if (!isRecord(value)) return { entries: [], note: '' }
  const entries = Array.isArray(value.entries)
    ? value.entries.map(cleanEntry).filter((entry): entry is ScheduleEntry => entry !== null)
    : []
  return { entries, note: typeof value.note === 'string' ? value.note : '' }
}

function cleanTemplate(value: unknown): WeeklyTemplate {
  const template = {} as WeeklyTemplate
  for (let index = 0; index < 7; index += 1) {
    template[index as Weekday] = cleanDay(isRecord(value) ? value[index] : undefined)
  }
  return template
}

function cleanState(value: unknown): SchedulerState {
  const fallback = createDefaultState()
  if (!isRecord(value)) return fallback

  const employees: Employee[] = Array.isArray(value.employees)
    ? value.employees
        .filter(isRecord)
        .filter((employee) => typeof employee.id === 'string' && typeof employee.name === 'string')
        .map((employee) => ({ id: employee.id as string, name: (employee.name as string).trim() }))
        .filter((employee) => employee.name.length > 0)
    : []

  const selectedYear = typeof value.selectedYear === 'number' && Number.isFinite(value.selectedYear)
    ? Math.round(value.selectedYear)
    : fallback.selectedYear
  const selectedMonth = typeof value.selectedMonth === 'number' && value.selectedMonth >= 0 && value.selectedMonth <= 11
    ? Math.round(value.selectedMonth)
    : fallback.selectedMonth
  const overrides: Record<string, DaySchedule> = {}
  if (isRecord(value.currentMonthOverrides)) {
    for (const [key, day] of Object.entries(value.currentMonthOverrides)) overrides[key] = cleanDay(day)
  }

  return {
    version: 1,
    employees,
    weeklyTemplate: cleanTemplate(value.weeklyTemplate),
    selectedYear,
    selectedMonth,
    currentMonthOverrides: overrides,
  }
}

export function loadState(): SchedulerState {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? cleanState(JSON.parse(saved)) : createDefaultState()
  } catch {
    return createDefaultState()
  }
}

export function saveState(state: SchedulerState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // The app remains usable in memory if browser storage is unavailable.
  }
}
