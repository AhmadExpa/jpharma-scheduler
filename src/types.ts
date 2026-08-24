export type EntryKind = 'shift' | 'off'
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface Employee {
  id: string
  name: string
}

export interface ScheduleEntry {
  id: string
  employeeId: string
  kind: EntryKind
  label: string
}

export interface DaySchedule {
  entries: ScheduleEntry[]
  note: string
}

export type WeeklyTemplate = Record<Weekday, DaySchedule>

export interface SchedulerState {
  version: 1
  scheduleTitle: string
  employees: Employee[]
  weeklyTemplate: WeeklyTemplate
  selectedYear: number
  selectedMonth: number
  currentMonthOverrides: Record<string, DaySchedule>
}
