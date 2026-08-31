import { useEffect, useState } from 'react'
import { WEEKDAYS } from '../dateUtils'
import type { DaySchedule, Employee, ScheduleEntry, Weekday } from '../types'
import Icon from './Icon'
import TimePicker from './TimePicker'

interface QuickSetupModalProps {
  employees: Employee[]
  template: Record<Weekday, DaySchedule>
  onClose: () => void
  onSave: (updates: Partial<Record<Weekday, DaySchedule>>) => void
}

function getExistingTime(employeeId: string, template: Record<Weekday, DaySchedule>): string {
  for (const day of [1, 2, 3, 4, 5, 0, 6] as Weekday[]) {
    const entry = template[day].entries.find((item) => item.employeeId === employeeId && item.kind === 'shift' && item.label)
    if (entry) return entry.label
  }
  return ''
}

export default function QuickSetupModal({ employees, template, onClose, onSave }: QuickSetupModalProps) {
  const [selectedDays, setSelectedDays] = useState<Weekday[]>([1, 2, 3, 4])
  const [times, setTimes] = useState<Record<string, string>>(() => Object.fromEntries(employees.map((employee) => [employee.id, getExistingTime(employee.id, template)])))
  const [error, setError] = useState('')

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  function toggleDay(day: Weekday) {
    setSelectedDays((current) => current.includes(day) ? current.filter((value) => value !== day) : [...current, day])
    setError('')
  }

  function save() {
    if (selectedDays.length === 0) {
      setError('Select at least one recurring weekday.')
      return
    }
    if (employees.some((employee) => !times[employee.id])) {
      setError('Choose a time for every team member before creating the pattern.')
      return
    }

    const updates: Partial<Record<Weekday, DaySchedule>> = {}
    for (const day of selectedDays) {
      const entries: ScheduleEntry[] = employees.map((employee) => ({
        id: `${employee.id}-${day}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        employeeId: employee.id,
        kind: 'shift',
        label: times[employee.id],
      }))
      updates[day] = { entries, note: template[day].note }
    }
    onSave(updates)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="day-modal quick-setup-modal" role="dialog" aria-modal="true" aria-labelledby="quick-setup-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Quick setup</p>
            <h2 id="quick-setup-title">Create the repeating schedule</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close quick setup" title="Close"><Icon name="x" /></button>
        </div>

        <div className="modal-body">
          <div className="modal-callout">
            <Icon name="refresh" size={17} />
            <span>Set each person once. The pattern will appear automatically in every month you select.</span>
          </div>

          <div className="quick-setup-section">
            <div className="quick-section-heading">
              <div><h3>Repeating weekdays</h3><p>Monday–Thursday are selected for the standard work week.</p></div>
              <span>{selectedDays.length} selected</span>
            </div>
            <div className="quick-days" role="group" aria-label="Repeating weekdays">
              {WEEKDAYS.map((day) => (
                <button className={`quick-day-toggle ${selectedDays.includes(day.value) ? 'selected' : ''}`} type="button" key={day.value} onClick={() => toggleDay(day.value)} aria-pressed={selectedDays.includes(day.value)}>
                  <span>{selectedDays.includes(day.value) ? '✓' : ''}</span>{day.long}
                </button>
              ))}
            </div>
          </div>

          <div className="quick-setup-section">
            <div className="quick-section-heading">
              <div><h3>Team times</h3><p>These times repeat on each selected weekday.</p></div>
            </div>
            <div className="quick-team-list">
              {employees.map((employee) => (
                <div className="quick-team-row" key={employee.id}>
                  <strong>{employee.name}</strong>
                  <TimePicker value={times[employee.id] ?? ''} onChange={(label) => setTimes((current) => ({ ...current, [employee.id]: label }))} />
                </div>
              ))}
            </div>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>

        <div className="modal-footer">
          <span className="quick-footer-note">Friday and weekend exceptions can be edited separately.</span>
          <div className="footer-actions">
            <button className="button secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="button primary" type="button" onClick={save}><Icon name="check" size={16} /> Create pattern</button>
          </div>
        </div>
      </div>
    </div>
  )
}
