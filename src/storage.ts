import { cloneWeeklyTemplate, createDefaultState, createOctober30Override, createSampleTemplate, createSimpleWeeklyTemplate, getEmployeeDefaultTime, hydrateEmployeeTimes, normalizeTimeValue, SAMPLE_TEMPLATE_ID } from './dateUtils'
import type { DaySchedule, Employee, ScheduleEntry, ScheduleTemplate, SchedulerState, Weekday, WeeklyTemplate } from './types'

const STORAGE_KEY = 'jpharma-scheduler:v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function cleanEntry(value: unknown): ScheduleEntry | null {
  if (!isRecord(value)) return null
  if (typeof value.id !== 'string' || typeof value.employeeId !== 'string') return null
  if (value.kind !== 'shift' && value.kind !== 'off' && value.kind !== 'unknown') return null
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
        .map((employee) => ({
          id: employee.id as string,
          name: (employee.name as string).trim(),
          defaultTime: normalizeTimeValue(employee.defaultTime),
        }))
        .filter((employee) => employee.name.length > 0)
    : []
}

function cleanOverrides(value: unknown): Record<string, DaySchedule> {
  const overrides: Record<string, DaySchedule> = {}
  if (isRecord(value)) {
    for (const [key, day] of Object.entries(value)) overrides[key] = cleanDay(day)
  }
  return overrides
}

function cleanTemplateRecord(value: unknown): ScheduleTemplate | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') return null
  const name = value.name.trim()
  if (!name) return null
  const monthOverrides = cleanOverrides(value.monthOverrides)
  const weeklyTemplate = cleanTemplate(value.weeklyTemplate)
  return {
    id: value.id,
    name,
    builtIn: value.builtIn === true,
    employees: hydrateEmployeeTimes(cleanEmployees(value.employees), weeklyTemplate),
    weeklyTemplate,
    monthDayOverrides: cleanOverrides(value.monthDayOverrides),
    monthOverrides,
  }
}

function cleanState(value: unknown): SchedulerState {
  const fallback = createDefaultState()
  if (!isRecord(value)) return fallback

  const storedActiveTemplateId = typeof value.activeTemplateId === 'string' ? value.activeTemplateId : null
  const oldBuiltInSample = storedActiveTemplateId?.startsWith('builtin-pharmacists-schedule-') === true
  const storedEmployees = cleanEmployees(value.employees)
  const savedTemplates = Array.isArray(value.templates)
    ? value.templates.map(cleanTemplateRecord).filter((template): template is ScheduleTemplate => template !== null)
    : []
  const sampleTemplate = createSampleTemplate()
  const templates = [sampleTemplate, ...savedTemplates.filter((template) => template.id !== SAMPLE_TEMPLATE_ID && !template.builtIn)]

  const today = new Date()
  const storedTemplate = cleanTemplate(value.weeklyTemplate)
  const legacySampleExtras = new Set(['sample-beena', 'sample-chris'])
  const workspaceEmployees = oldBuiltInSample
    ? storedEmployees.filter((employee) => !legacySampleExtras.has(employee.id)
      || employee.defaultTime || getEmployeeDefaultTime(employee.id, storedTemplate))
    : storedEmployees
  const blankWorkspace = value.version !== 2 && storedEmployees.length === 0
    && Object.values(storedTemplate).every((day) => day.entries.length === 0)
  const useBuiltInSample = oldBuiltInSample || blankWorkspace
  const restoreBuiltInPattern = useBuiltInSample
    && Object.values(storedTemplate).every((day) => day.entries.length === 0)
  const restoreEmployeePattern = value.version !== 2 && !restoreBuiltInPattern
    && Object.values(storedTemplate).every((day) => day.entries.length === 0)
    && workspaceEmployees.some((employee) => employee.defaultTime)
  const workspaceTemplate = restoreBuiltInPattern
    ? cloneWeeklyTemplate(sampleTemplate.weeklyTemplate)
    : restoreEmployeePattern ? createSimpleWeeklyTemplate(workspaceEmployees, storedTemplate) : storedTemplate
  const employees = hydrateEmployeeTimes(
    blankWorkspace ? sampleTemplate.employees.map((employee) => ({ ...employee })) : workspaceEmployees,
    workspaceTemplate,
  )
  const storedOverrides = cleanOverrides(value.dateOverrides ?? value.currentMonthOverrides)
  const dateOverrides = useBuiltInSample && value.version !== 2
    ? { ...cleanOverrides(sampleTemplate.monthOverrides), ...storedOverrides }
    : storedOverrides
  if (value.version !== 2 && !dateOverrides['2026-10-30']) {
    const october30 = createOctober30Override(employees, workspaceTemplate)
    if (october30) dateOverrides['2026-10-30'] = october30
  }

  return {
    version: 2,
    scheduleTitle: typeof value.scheduleTitle === 'string' && value.scheduleTitle.trim().length > 0
      ? value.scheduleTitle.trim()
      : fallback.scheduleTitle,
    employees,
    weeklyTemplate: workspaceTemplate,
    templates,
    activeTemplateId: useBuiltInSample
      ? sampleTemplate.id
      : typeof value.activeTemplateId === 'string' && templates.some((template) => template.id === value.activeTemplateId)
        ? value.activeTemplateId
        : null,
    selectedYear: today.getFullYear(),
    selectedMonth: today.getMonth(),
    dateOverrides,
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
