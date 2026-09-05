import { createDefaultState, createSampleTemplate, SAMPLE_TEMPLATE_ID } from './dateUtils'
import type { DaySchedule, Employee, ScheduleEntry, ScheduleTemplate, SchedulerState, Weekday, WeeklyTemplate } from './types'

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

function cleanEmployees(value: unknown): Employee[] {
  return Array.isArray(value)
    ? value
        .filter(isRecord)
        .filter((employee) => typeof employee.id === 'string' && typeof employee.name === 'string')
        .map((employee) => ({ id: employee.id as string, name: (employee.name as string).trim() }))
        .filter((employee) => employee.name.length > 0)
    : []
}

function cleanTemplateRecord(value: unknown): ScheduleTemplate | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') return null
  const name = value.name.trim()
  if (!name) return null
  const monthOverrides: Record<string, DaySchedule> = {}
  if (isRecord(value.monthOverrides)) {
    for (const [key, day] of Object.entries(value.monthOverrides)) monthOverrides[key] = cleanDay(day)
  }
  return {
    id: value.id,
    name,
    builtIn: value.builtIn === true,
    employees: cleanEmployees(value.employees),
    weeklyTemplate: cleanTemplate(value.weeklyTemplate),
    monthOverrides,
  }
}

function cleanState(value: unknown): SchedulerState {
  const fallback = createDefaultState()
  if (!isRecord(value)) return fallback

  const employees = cleanEmployees(value.employees)
  const savedTemplates = Array.isArray(value.templates)
    ? value.templates.map(cleanTemplateRecord).filter((template): template is ScheduleTemplate => template !== null)
    : []
  const sampleTemplate = createSampleTemplate()
  const templates = [sampleTemplate, ...savedTemplates.filter((template) => template.id !== SAMPLE_TEMPLATE_ID && !template.builtIn)]

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
    scheduleTitle: typeof value.scheduleTitle === 'string' && value.scheduleTitle.trim().length > 0
      ? value.scheduleTitle.trim()
      : fallback.scheduleTitle,
    employees,
    weeklyTemplate: cleanTemplate(value.weeklyTemplate),
    templates,
    activeTemplateId: typeof value.activeTemplateId === 'string' && templates.some((template) => template.id === value.activeTemplateId)
      ? value.activeTemplateId
      : null,
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
