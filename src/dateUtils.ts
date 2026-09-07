import type { DaySchedule, Employee, EntryKind, ScheduleEntry, ScheduleTemplate, SchedulerState, Weekday, WeeklyTemplate } from './types'

export const WEEKDAYS: Array<{ value: Weekday; short: string; long: string }> = [
  { value: 0, short: 'Sun', long: 'Sunday' },
  { value: 1, short: 'Mon', long: 'Monday' },
  { value: 2, short: 'Tue', long: 'Tuesday' },
  { value: 3, short: 'Wed', long: 'Wednesday' },
  { value: 4, short: 'Thu', long: 'Thursday' },
  { value: 5, short: 'Fri', long: 'Friday' },
  { value: 6, short: 'Sat', long: 'Saturday' },
]

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const SAMPLE_TEMPLATE_ID = 'builtin-pharmacists-schedule-v6'

type SampleRow = { employeeId: string; kind: EntryKind; label: string }

const SAMPLE_EMPLOYEE_NAMES = ['Bunmi', 'Chinenye', 'Esther', 'Elile', 'Gerren', 'Jonathan', 'Obi', 'Santana', 'Jose', 'Beena', 'Chris']
const SAMPLE_EMPLOYEE_IDS = SAMPLE_EMPLOYEE_NAMES.map((name) => `sample-${name.toLowerCase()}`)

function sampleShift(employeeId: string, label: string): SampleRow {
  return { employeeId, kind: 'shift', label }
}

function sampleOff(employeeId: string, label: string): SampleRow {
  return { employeeId, kind: 'off', label }
}

function sampleCommonRows(): SampleRow[] {
  return [
    sampleShift('sample-bunmi', '9:00 AM'),
    sampleShift('sample-chinenye', '9:00 AM'),
    sampleShift('sample-esther', '7:30 AM'),
    sampleShift('sample-elile', '9:00 AM'),
    sampleShift('sample-gerren', '10:00 AM'),
    sampleShift('sample-jonathan', '7:30 AM'),
    sampleShift('sample-obi', '9:00 AM'),
    sampleShift('sample-santana', '9:00 AM'),
    sampleShift('sample-jose', '9:00 AM'),
  ]
}

function sampleFridayRows(): SampleRow[] {
  return [
    sampleShift('sample-bunmi', '8:00 AM'),
    sampleShift('sample-chinenye', 'As needed'),
    sampleShift('sample-esther', 'As needed'),
    sampleShift('sample-elile', 'As needed'),
    sampleShift('sample-gerren', 'As needed'),
    sampleShift('sample-jonathan', 'As needed'),
    sampleShift('sample-obi', 'As needed'),
    sampleShift('sample-santana', 'As needed'),
    sampleShift('sample-jose', 'As needed'),
    sampleShift('sample-beena', '6:00 AM'),
    sampleShift('sample-chris', '2:00 PM'),
  ]
}

function sampleRowsWithOff(rows: SampleRow[], employeeId: string, label = 'OFF'): SampleRow[] {
  return rows.map((row) => row.employeeId === employeeId ? sampleOff(employeeId, label) : row)
}

function sampleDay(key: string, rows: SampleRow[], note = ''): DaySchedule {
  return {
    note,
    entries: rows.map((row, index) => ({
      id: `sample-${key}-${index}`,
      employeeId: row.employeeId,
      kind: row.kind,
      label: row.label,
    })),
  }
}

export function createSampleTemplate(): ScheduleTemplate {
  const employees: Employee[] = SAMPLE_EMPLOYEE_NAMES.map((name, index) => ({ id: SAMPLE_EMPLOYEE_IDS[index], name }))
  const weeklyTemplate: WeeklyTemplate = {
    0: createEmptyDay(),
    1: sampleDay('weekly-monday', sampleCommonRows()),
    2: sampleDay('weekly-tuesday', sampleCommonRows()),
    3: sampleDay('weekly-wednesday', sampleCommonRows()),
    4: sampleDay('weekly-thursday', sampleCommonRows()),
    5: sampleDay('weekly-friday', sampleFridayRows()),
    6: createEmptyDay(),
  }

  return {
    id: SAMPLE_TEMPLATE_ID,
    name: 'Pharmacists Schedule',
    builtIn: true,
    employees,
    weeklyTemplate,
    monthOverrides: {
      '2026-09-11': sampleDay('2026-09-11', sampleRowsWithOff(sampleFridayRows(), 'sample-esther')),
      '2026-09-17': sampleDay('2026-09-17', sampleRowsWithOff(sampleCommonRows(), 'sample-jonathan')),
      '2026-09-18': sampleDay('2026-09-18', sampleRowsWithOff(sampleFridayRows(), 'sample-jonathan')),
      '2027-09-17': sampleDay('2027-09-17', sampleRowsWithOff(sampleFridayRows(), 'sample-jonathan')),
    },
    monthDayOverrides: {},
  }
}

export function createId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createEmptyDay(): DaySchedule {
  return { entries: [], note: '' }
}

export function createDefaultTemplate(): WeeklyTemplate {
  return {
    0: createEmptyDay(),
    1: createEmptyDay(),
    2: createEmptyDay(),
    3: createEmptyDay(),
    4: createEmptyDay(),
    5: createEmptyDay(),
    6: createEmptyDay(),
  }
}

export function createDefaultState(): SchedulerState {
  const sample = createSampleTemplate()
  const today = new Date()
  return {
    version: 1,
    scheduleTitle: 'Pharmacists Schedule',
    employees: sample.employees.map((employee) => ({ ...employee })),
    weeklyTemplate: cloneWeeklyTemplate(sample.weeklyTemplate),
    templates: [sample],
    activeTemplateId: sample.id,
    selectedYear: today.getFullYear(),
    selectedMonth: today.getMonth(),
    currentMonthOverrides: getTemplateOverridesForMonth(sample, today.getFullYear(), today.getMonth()),
  }
}

export function cloneWeeklyTemplate(template: WeeklyTemplate): WeeklyTemplate {
  const copy = {} as WeeklyTemplate
  for (let day = 0; day < 7; day += 1) {
    const source = template[day as Weekday]
    copy[day as Weekday] = {
      note: source.note,
      entries: source.entries.map((entry) => ({ ...entry })),
    }
  }
  return copy
}

export function cloneMonthOverrides(overrides: Record<string, DaySchedule>): Record<string, DaySchedule> {
  return Object.fromEntries(
    Object.entries(overrides).map(([key, day]) => [key, {
      note: day.note,
      entries: day.entries.map((entry) => ({ ...entry })),
    }]),
  )
}

export function getTemplateOverridesForMonth(template: ScheduleTemplate, year: number, month: number): Record<string, DaySchedule> {
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`
  const reusableMonthOverrides = Object.entries(template.monthDayOverrides)
    .filter(([key]) => key.startsWith(`${String(month + 1).padStart(2, '0')}-`))
    .map(([key, day]) => [`${year}-${key}`, day] as const)
  const exactMonthOverrides = Object.entries(template.monthOverrides)
    .filter(([key]) => key.startsWith(monthPrefix))
  return cloneMonthOverrides(Object.fromEntries([...reusableMonthOverrides, ...exactMonthOverrides]))
}

export function cloneEntries(entries: ScheduleEntry[]): ScheduleEntry[] {
  return entries.map((entry) => ({ ...entry, id: createId('entry') }))
}

export function cloneDay(day: DaySchedule): DaySchedule {
  return { note: day.note, entries: cloneEntries(day.entries) }
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const count = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: count }, (_, index) => new Date(year, month, index + 1))
}

export function getCalendarCells(year: number, month: number): Array<Date | null> {
  const days = getDaysInMonth(year, month)
  const leadingBlanks = days[0]?.getDay() ?? 0
  const minimumCells = 35
  const cellCount = Math.max(minimumCells, Math.ceil((leadingBlanks + days.length) / 7) * 7)
  return Array.from({ length: cellCount }, (_, index) => {
    const dayNumber = index - leadingBlanks + 1
    return dayNumber >= 1 && dayNumber <= days.length ? new Date(year, month, dayNumber) : null
  })
}

export function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatMonthYear(year: number, month: number): string {
  return `${MONTHS[month]} ${year}`
}

export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(date)
}

export function getWeekdayName(day: number): string {
  return WEEKDAYS[day]?.long ?? ''
}

export function getDaySchedule(
  date: Date,
  template: WeeklyTemplate,
  overrides: Record<string, DaySchedule>,
): { day: DaySchedule; isOverride: boolean } {
  const key = dateKey(date)
  if (overrides[key]) return { day: overrides[key], isOverride: true }
  return { day: template[date.getDay() as Weekday], isOverride: false }
}

export function generateMonthOverrides(
  year: number,
  month: number,
  template: WeeklyTemplate,
): Record<string, DaySchedule> {
  // The generated month intentionally has no overrides. The calendar reads the
  // recurring template directly, while overrides are reserved for edited dates.
  void year
  void month
  void template
  return {}
}
