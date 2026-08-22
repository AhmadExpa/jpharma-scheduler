import { useEffect, useState } from 'react'
import type { Employee, ScheduleEntry } from '../types'
import Icon from './Icon'
import TimePicker from './TimePicker'

interface TemplateEntryModalProps {
  entry: ScheduleEntry
  isNew: boolean
  weekdayName: string
  employees: Employee[]
  onClose: () => void
  onSave: (entry: ScheduleEntry) => void
  onDelete: () => void
}

export default function TemplateEntryModal({ entry, isNew, weekdayName, employees, onClose, onSave, onDelete }: TemplateEntryModalProps) {
  const [draft, setDraft] = useState(entry)
  const [error, setError] = useState('')

  useEffect(() => {
    setDraft(entry)
    setError('')
  }, [entry])

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  function save() {
    if (!draft.employeeId || !draft.label.trim()) {
      setError(draft.kind === 'off' ? 'Enter an off label before saving.' : 'Choose an hour, minute, and AM/PM before saving.')
      return
    }
    onSave({ ...draft, label: draft.label.trim() })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="day-modal template-entry-modal" role="dialog" aria-modal="true" aria-labelledby="template-entry-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">{isNew ? 'Add recurring row' : 'Edit recurring row'}</p>
            <h2 id="template-entry-title">{weekdayName} pattern</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close row editor" title="Close"><Icon name="x" /></button>
        </div>

        <div className="modal-body template-entry-modal-body">
          <div className="modal-callout">
            <Icon name="settings" size={17} />
            <span>This coverage row repeats every {weekdayName}.</span>
          </div>

          <div className="template-modal-fields">
            <div>
              <label className="field-label" htmlFor="template-entry-employee">Employee</label>
              <select id="template-entry-employee" className="modal-full-select" value={draft.employeeId} onChange={(event) => setDraft((current) => ({ ...current, employeeId: event.target.value }))}>
                {employees.map((employee) => <option value={employee.id} key={employee.id}>{employee.name}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="template-entry-kind">Entry type</label>
              <select id="template-entry-kind" className="modal-full-select" value={draft.kind} onChange={(event) => setDraft((current) => ({ ...current, kind: event.target.value as ScheduleEntry['kind'], label: event.target.value === 'off' ? '' : current.label }))}>
                <option value="shift">Shift</option>
                <option value="off">Off</option>
              </select>
            </div>
            <div>
              {draft.kind === 'off' ? (
                <>
                  <label className="field-label" htmlFor="template-entry-label">Off label</label>
                  <input id="template-entry-label" className="modal-full-input" value={draft.label} onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))} placeholder="OFF (reason)" />
                </>
              ) : (
                <>
                  <label className="field-label">Shift time</label>
                  <TimePicker value={draft.label} onChange={(label) => setDraft((current) => ({ ...current, label }))} />
                </>
              )}
            </div>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>

        <div className="modal-footer">
          {!isNew ? <button className="button ghost danger-text" type="button" onClick={onDelete}><Icon name="trash" size={15} /> Delete row</button> : <span />}
          <div className="footer-actions">
            <button className="button secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="button primary" type="button" onClick={save}><Icon name="check" size={16} /> Save row</button>
          </div>
        </div>
      </div>
    </div>
  )
}
