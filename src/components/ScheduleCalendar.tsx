import { dateKey, formatMonthYear, getCalendarCells, getDaySchedule, WEEKDAYS } from '../dateUtils'
import type { Employee, DaySchedule, Weekday, WeeklyTemplate } from '../types'
import Icon from './Icon'

interface ScheduleCalendarProps {
  year: number
  month: number
  scheduleTitle: string
  employees: Employee[]
  template: WeeklyTemplate
  overrides: Record<string, DaySchedule>
  onEditDate: (date: Date) => void
}

export default function ScheduleCalendar({ year, month, scheduleTitle, employees, template, overrides, onEditDate }: ScheduleCalendarProps) {
  const cells = getCalendarCells(year, month)
  const employeeNames = new Map(employees.map((employee) => [employee.id, employee.name]))
  const editedCount = Object.keys(overrides).length
  const hasSchedule = ([1, 2, 3, 4, 5] as Weekday[]).some((day) => template[day].entries.length > 0)

  function openDate(date: Date) {
    onEditDate(date)
  }

  return (
    <section className="calendar-card" aria-labelledby="calendar-title">
      <div className="calendar-toolbar no-print">
        <div>
          <p className="eyebrow">Your calendar</p>
          <h2 id="calendar-title">{formatMonthYear(year, month)}</h2>
          <p className="calendar-action-copy">Repeats Monday–Friday. Click any day to make a change.</p>
        </div>
        <div className="calendar-status">
          <span className="status-dot" />
          {editedCount > 0 ? `${editedCount} day${editedCount === 1 ? '' : 's'} changed` : hasSchedule ? 'Repeats Monday–Friday' : 'Waiting for setup'}
        </div>
      </div>

      {!hasSchedule && <div className="calendar-empty-message no-print"><Icon name="calendar" size={18} /><span>Add your employees and times above. Your calendar will appear here.</span></div>}

      <div className="print-heading print-only">
        <div>
          <p className="print-kicker">JPharma · {scheduleTitle || 'Staff Schedule'}</p>
          <h1 id="print-calendar-title">{formatMonthYear(year, month)}</h1>
        </div>
        <p className="print-generated">Prepared schedule</p>
      </div>

      <div className={`calendar-grid calendar-grid-weeks-${cells.length / 7}`}>
        {WEEKDAYS.map((day) => <div className="calendar-weekday" key={day.value}>{day.long}</div>)}
        {cells.map((date, index) => {
          if (!date) return <div className="calendar-cell blank-cell" key={`blank-${index}`} aria-hidden="true" />
          const key = dateKey(date)
          const { day, isOverride } = getDaySchedule(date, template, overrides)
          const weekday = date.getDay()
          return (
            <div
              className={`calendar-cell ${weekday === 0 || weekday === 6 ? 'weekend-cell' : ''} ${isOverride ? 'custom-cell' : ''}`}
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => openDate(date)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDate(date) } }}
              aria-label={`Edit ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
            >
              <div className="cell-topline">
                <span className="date-number">{date.getDate()}</span>
                {isOverride && <span className="edited-label"><Icon name="edit" size={11} /> Edited</span>}
              </div>
              <div className="cell-content">
                {day.entries.map((entry) => (
                  <div className={`calendar-entry ${entry.kind === 'off' ? 'off-entry' : ''}`} key={entry.id}>
                    <span className="calendar-employee">{employeeNames.get(entry.employeeId) ?? 'Employee'}</span>
                    <span className="calendar-value">{entry.label || '—'}</span>
                  </div>
                ))}
                {day.note && <div className="calendar-note">{day.note}</div>}
                {day.entries.length === 0 && !day.note && <span className="cell-placeholder no-print">+ Add employee</span>}
              </div>
              <span className="cell-edit-hint no-print"><Icon name="edit" size={12} /> Edit day</span>
            </div>
          )
        })}
      </div>

      <div className="calendar-footer no-print">
        <div className="legend"><span className="legend-swatch" /> Click a day to change it</div>
        <div className="legend"><span className="legend-dot" /> Repeats Monday–Friday</div>
      </div>
    </section>
  )
}
