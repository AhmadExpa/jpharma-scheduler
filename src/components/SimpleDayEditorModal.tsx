import { useEffect, useMemo, useState } from 'react'
import { createId, formatDateLong, formatTimeLabel, getWeekdayName, normalizeTimeValue, timeLabelToInput } from '../dateUtils'
import type { DaySchedule, Employee, EntryKind, ScheduleEntry } from '../types'
import Icon from './Icon'

interface SimpleDayEditorModalProps {
  date: Date
  initialDay: DaySchedule
  isOverride: boolean
  employees: Employee[]
  onClose: () => void
  onSave: (day: DaySchedule) => void
  onReset: () => void
  onOpenAdvanced: () => void
}

export default function SimpleDayEditorModal({ date, initialDay, isOverride, employees, onClose, onSave, onReset, onOpenAdvanced }: SimpleDayEditorModalProps) {
  const [draft, setDraft] = useState<DaySchedule>(initialDay)
  const [employeeToAdd, setEmployeeToAdd] = useState('')
  const [error, setError] = useState('')
  const [rememberedTimes, setRememberedTimes] = useState<Record<string, string>>({})

  useEffect(() => {
    setDraft(initialDay)
    setEmployeeToAdd('')
    setError('')
    setRememberedTimes(Object.fromEntries(initialDay.entries
      .filter((entry) => entry.kind === 'shift' && normalizeTimeValue(entry.label))
      .map((entry) => [entry.id, formatTimeLabel(entry.label)])))
  }, [initialDay, date])

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const availableEmployees = useMemo(() => {
    const scheduledIds = new Set(draft.entries.map((entry) => entry.employeeId))
    return employees.filter((employee) => !scheduledIds.has(employee.id))
  }, [draft.entries, employees])

  function updateEntry(index: number, value: Partial<ScheduleEntry>) {
    setDraft((current) => ({
      ...current,
      entries: current.entries.map((entry, entryIndex) => entryIndex === index ? { ...entry, ...value } : entry),
    }))
    setError('')
  }

  function setEntryKind(index: number, kind: EntryKind, employee?: Employee) {
    const entry = draft.entries[index]
    if (!entry) return
    if (entry.kind === 'shift' && normalizeTimeValue(entry.label)) {
      setRememberedTimes((current) => ({ ...current, [entry.id]: formatTimeLabel(entry.label) }))
    }
    updateEntry(index, {
      kind,
      label: kind === 'off' ? 'OFF'
        : kind === 'unknown' ? '?'
          : rememberedTimes[entry.id] || formatTimeLabel(employee?.defaultTime ?? ''),
    })
  }

  function addEmployee(employeeId: string) {
    if (!employeeId) return
    const employee = employees.find((item) => item.id === employeeId)
    if (!employee) return
    const time = formatTimeLabel(employee.defaultTime ?? '')
    setDraft((current) => ({
      ...current,
      entries: [...current.entries, {
        id: createId('entry'),
        employeeId,
        kind: time ? 'shift' : 'unknown',
        label: time || '?',
      }],
    }))
    setEmployeeToAdd('')
    setError('')
  }

  function save() {
    const employeeIds = draft.entries.map((entry) => entry.employeeId)
    if (new Set(employeeIds).size !== employeeIds.length) {
      setError('Each employee can appear only once on a day. Use the full editor for extra shifts.')
      return
    }
    if (draft.entries.some((entry) => entry.kind === 'shift' && !normalizeTimeValue(entry.label))) {
      setError('Choose a time, OFF, or ? for every employee.')
      return
    }
    onSave({
      note: draft.note.trim(),
      entries: draft.entries.map((entry) => ({
        ...entry,
        label: entry.kind === 'off' ? 'OFF' : entry.kind === 'unknown' ? '?' : formatTimeLabel(entry.label),
      })),
    })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="day-modal simple-day-modal" role="dialog" aria-modal="true" aria-labelledby="simple-day-editor-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Change this day</p>
            <h2 id="simple-day-editor-title">{formatDateLong(date)}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close day editor" title="Close"><Icon name="x" /></button>
        </div>

        <div className="modal-body">
          <div className="modal-callout">
            <Icon name="calendar" size={17} />
            <span>{isOverride ? 'This day has its own changes.' : `This day follows the ${getWeekdayName(date.getDay())} schedule.`} Choose Time, OFF, or ? when a time is not confirmed.</span>
          </div>

          {employees.length === 0 ? (
            <div className="empty-panel">Add employees above before changing a day.</div>
          ) : (
            <div className="simple-day-list">
              {draft.entries.length === 0 && <div className="modal-empty-state"><Icon name="calendar" size={19} /><strong>No one is scheduled</strong><span>Add an employee below if someone should work this day.</span></div>}
              {draft.entries.map((entry, index) => {
                const employee = employees.find((item) => item.id === entry.employeeId)
                return (
                  <div className="simple-day-row" key={entry.id}>
                    <strong>{employee?.name ?? 'Employee'}</strong>
                    <div className="day-kind-options" role="group" aria-label={`Status for ${employee?.name ?? 'employee'}`}>
                      <button className={entry.kind === 'shift' ? 'active' : ''} type="button" aria-pressed={entry.kind === 'shift'} onClick={() => setEntryKind(index, 'shift', employee)}>Time</button>
                      <button className={entry.kind === 'off' ? 'active off' : ''} type="button" aria-pressed={entry.kind === 'off'} onClick={() => setEntryKind(index, 'off', employee)}>OFF</button>
                      <button className={entry.kind === 'unknown' ? 'active unknown' : ''} type="button" aria-pressed={entry.kind === 'unknown'} onClick={() => setEntryKind(index, 'unknown', employee)} title="Time not confirmed">?</button>
                    </div>
                    {entry.kind === 'shift' ? (
                      <input
                        className="simple-time-input"
                        type="time"
                        step="300"
                        value={timeLabelToInput(entry.label)}
                        onChange={(event) => {
                          const time = event.target.value ? formatTimeLabel(event.target.value) : ''
                          updateEntry(index, { label: time })
                          if (time) setRememberedTimes((current) => ({ ...current, [entry.id]: time }))
                        }}
                        aria-label={`Time for ${employee?.name ?? 'employee'}`}
                      />
                    ) : (
                      <span className={`day-kind-value ${entry.kind}`}>{entry.kind === 'off' ? 'Off today' : 'Time to confirm'}</span>
                    )}
                    <button className="small-action danger" type="button" onClick={() => setDraft((current) => ({ ...current, entries: current.entries.filter((_, entryIndex) => entryIndex !== index) }))} aria-label={`Remove ${employee?.name ?? 'employee'} from this day`} title="Remove from this day"><Icon name="trash" size={15} /></button>
                  </div>
                )
              })}
              {availableEmployees.length > 0 && (
                <div className="simple-day-add">
                  <select value={employeeToAdd} onChange={(event) => addEmployee(event.target.value)} aria-label="Add employee to this day">
                    <option value="">Add an employee to this day</option>
                    {availableEmployees.map((employee) => <option value={employee.id} key={employee.id}>{employee.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          <details className="day-more-details">
            <summary>Add a note</summary>
            <textarea className="note-input" rows={3} value={draft.note} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} placeholder="Optional note for this day" />
          </details>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>

        <div className="modal-footer">
          <div className="modal-secondary-actions">
            {isOverride && <button className="button ghost danger-text" type="button" onClick={onReset}><Icon name="refresh" size={15} /> Reset day</button>}
            <button className="button ghost" type="button" onClick={onOpenAdvanced}>Full editor</button>
          </div>
          <div className="footer-actions">
            <button className="button secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="button primary" type="button" onClick={save}><Icon name="check" size={16} /> Save day</button>
          </div>
        </div>
      </div>
    </div>
  )
}
