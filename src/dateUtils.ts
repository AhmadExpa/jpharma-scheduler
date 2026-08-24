import type { DaySchedule, ScheduleEntry, SchedulerState, Weekday, WeeklyTemplate } from './types'

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
  const today = new Date()
  return {
    version: 1,
    scheduleTitle: 'Staff Schedule',
    employees: [],
    weeklyTemplate: createDefaultTemplate(),
    selectedYear: today.getFullYear(),
    selectedMonth: today.getMonth(),
    currentMonthOverrides: {},
  }
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
