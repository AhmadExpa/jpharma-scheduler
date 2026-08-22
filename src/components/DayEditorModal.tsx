import { useEffect, useState } from 'react'
import { createId, formatDateLong, getWeekdayName } from '../dateUtils'
import type { DaySchedule, Employee, ScheduleEntry } from '../types'
import Icon from './Icon'
import TimePicker from './TimePicker'

interface DayEditorModalProps {
  date: Date
  initialDay: DaySchedule
  isOverride: boolean
  employees: Employee[]
  onClose: () => void
  onSave: (day: DaySchedule) => void
  onReset: () => void
}

export default function DayEditorModal({ date, initialDay, isOverride, employees, onClose, onSave, onReset }: DayEditorModalProps) {
  const [draft, setDraft] = useState<DaySchedule>(initialDay)
  const [error, setError] = useState('')

  useEffect(() => {
    setDraft(initialDay)
    setError('')
  }, [initialDay, date])

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  function updateEntry(index: number, value: ScheduleEntry) {
    setDraft((current) => ({ ...current, entries: current.entries.map((entry, entryIndex) => entryIndex === index ? value : entry) }))
  }

  function addEntry() {
    if (employees.length === 0) return
    setDraft((current) => ({
      ...current,
      entries: [...current.entries, { id: createId('entry'), employeeId: employees[0].id, kind: 'shift', label: '' }],
    }))
  }

  function save() {
    if (draft.entries.some((entry) => !entry.employeeId || !entry.label.trim())) {
      setError('Complete or remove every schedule row before saving.')
      return
    }
    onSave({
      note: draft.note.trim(),
      entries: draft.entries.map((entry) => ({ ...entry, label: entry.label.trim() })),
    })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="day-modal" role="dialog" aria-modal="true" aria-labelledby="day-editor-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">{isOverride ? 'Custom date' : `${getWeekdayName(date.getDay())} pattern`}</p>
            <h2 id="day-editor-title">{formatDateLong(date)}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close date editor" title="Close"><Icon name="x" /></button>
        </div>

        <div className="modal-body">
          <div className="modal-callout">
            <Icon name="calendar" size={17} />
            <span>{isOverride ? 'This date has its own custom coverage.' : 'This date is using its recurring weekly pattern.'}</span>
          </div>

          {employees.length === 0 ? (
            <div className="empty-panel">Add team members before adding schedule rows.</div>
          ) : (
            <div className="modal-entries">
              {draft.entries.map((entry, index) => (
                <div className="modal-entry" key={entry.id}>
                  <select value={entry.employeeId} onChange={(event) => updateEntry(index, { ...entry, employeeId: event.target.value })} aria-label="Employee">
                    {employees.map((employee) => <option value={employee.id} key={employee.id}>{employee.name}</option>)}
                  </select>
                  <select className="kind-select" value={entry.kind} onChange={(event) => updateEntry(index, { ...entry, kind: event.target.value as ScheduleEntry['kind'] })} aria-label="Entry type">
                    <option value="shift">Shift</option>
                    <option value="off">Off</option>
                  </select>
                  {entry.kind === 'off' ? (
                    <input value={entry.label} onChange={(event) => updateEntry(index, { ...entry, label: event.target.value })} placeholder="OFF (reason)" aria-label="Off label" />
                  ) : (
                    <TimePicker value={entry.label} onChange={(label) => updateEntry(index, { ...entry, label })} />
                  )}
                  <button className="small-action danger" type="button" onClick={() => setDraft((current) => ({ ...current, entries: current.entries.filter((_, entryIndex) => entryIndex !== index) }))} aria-label="Remove schedule row" title="Remove"><Icon name="trash" size={15} /></button>
                </div>
              ))}
              <button className="button secondary add-modal-row" type="button" onClick={addEntry}><Icon name="plus" size={15} /> Add schedule row</button>
            </div>
          )}

          <label className="field-label" htmlFor="date-note">Date note <span>optional</span></label>
          <textarea id="date-note" className="note-input" rows={3} value={draft.note} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} placeholder="Add a note for this date" />
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>

        <div className="modal-footer">
          {isOverride ? <button className="button ghost danger-text" type="button" onClick={onReset}><Icon name="refresh" size={15} /> Reset to pattern</button> : <span />}
          <div className="footer-actions">
            <button className="button secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="button primary" type="button" onClick={save}><Icon name="check" size={16} /> Save date</button>
          </div>
        </div>
      </div>
    </div>
  )
}
