import { useState } from 'react'
import { createId, WEEKDAYS } from '../dateUtils'
import type { DaySchedule, Employee, ScheduleEntry, Weekday, WeeklyTemplate } from '../types'
import Icon from './Icon'
import TemplateEntryModal from './TemplateEntryModal'

interface TemplateEditorProps {
  employees: Employee[]
  template: WeeklyTemplate
  onUpdateDay: (day: Weekday, value: DaySchedule) => void
}

export default function TemplateEditor({ employees, template, onUpdateDay }: TemplateEditorProps) {
  const [activeDay, setActiveDay] = useState<Weekday>(1)
  const [editingEntry, setEditingEntry] = useState<{ entry: ScheduleEntry; isNew: boolean } | null>(null)
  const current = template[activeDay]
  const dayInfo = WEEKDAYS[activeDay]

  function updateCurrent(next: Partial<DaySchedule>) {
    onUpdateDay(activeDay, { ...current, ...next })
  }

  function removeEntry(index: number) {
    updateCurrent({ entries: current.entries.filter((_, entryIndex) => entryIndex !== index) })
  }

  function moveEntry(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= current.entries.length) return
    const entries = [...current.entries]
    const [moved] = entries.splice(index, 1)
    entries.splice(nextIndex, 0, moved)
    updateCurrent({ entries })
  }

  function addEntry() {
    if (employees.length === 0) return
    setEditingEntry({
      isNew: true,
      entry: { id: createId('entry'), employeeId: employees[0].id, kind: 'shift', label: '' },
    })
  }

  function saveEntry(entry: ScheduleEntry) {
    const exists = current.entries.some((currentEntry) => currentEntry.id === entry.id)
    updateCurrent({ entries: exists ? current.entries.map((currentEntry) => currentEntry.id === entry.id ? entry : currentEntry) : [...current.entries, entry] })
    setEditingEntry(null)
  }

  function deleteEditingEntry() {
    if (!editingEntry) return
    updateCurrent({ entries: current.entries.filter((entry) => entry.id !== editingEntry.entry.id) })
    setEditingEntry(null)
  }

  return (
    <>
    <section className="control-card template-card" aria-labelledby="template-heading">
      <div className="card-heading">
        <div className="heading-icon lavender"><Icon name="settings" size={18} /></div>
        <div>
          <p className="eyebrow">Step 02</p>
          <h2 id="template-heading">Weekly pattern</h2>
        </div>
      </div>
      <p className="card-copy">Set the recurring rows once, then use the calendar for one-off changes.</p>

      <div className="weekday-tabs" role="tablist" aria-label="Weekly pattern days">
        {WEEKDAYS.map((day) => {
          const count = template[day.value].entries.length
          return (
            <button
              key={day.value}
              className={`weekday-tab ${activeDay === day.value ? 'active' : ''}`}
              type="button"
              role="tab"
              aria-selected={activeDay === day.value}
              onClick={() => { setActiveDay(day.value); setEditingEntry(null) }}
            >
              <span>{day.short}</span>
              {count > 0 && <b>{count}</b>}
            </button>
          )
        })}
      </div>

      <div className="template-day-head">
        <div>
          <h3>{dayInfo.long}</h3>
          <p>{current.entries.length === 0 ? 'No recurring entries yet' : `${current.entries.length} recurring ${current.entries.length === 1 ? 'row' : 'rows'}`}</p>
        </div>
        <button className="button secondary compact" type="button" onClick={addEntry} disabled={employees.length === 0}>
          <Icon name="plus" size={15} /> Add row
        </button>
      </div>

      {employees.length === 0 ? (
        <div className="empty-panel">Add at least one team member above to start building the weekly pattern.</div>
      ) : current.entries.length === 0 ? (
        <div className="empty-panel">This weekday is clear. Add a row if the team works on {dayInfo.long}.</div>
      ) : (
        <div className="template-entries">
          {current.entries.map((entry, index) => (
            <div className="template-entry summary-entry" key={entry.id}>
              <div className="entry-summary">
                <strong>{employees.find((employee) => employee.id === entry.employeeId)?.name ?? 'Employee'}</strong>
                <span className={`entry-kind ${entry.kind === 'off' ? 'off-kind' : ''}`}>{entry.kind === 'off' ? 'Off' : 'Shift'}</span>
                <span className="entry-label">{entry.label || 'Time not set'}</span>
              </div>
              <div className="entry-actions">
                <button className="small-action" type="button" onClick={() => setEditingEntry({ entry, isNew: false })} aria-label="Edit schedule row" title="Edit"><Icon name="edit" size={14} /></button>
                <button className="small-action" type="button" onClick={() => moveEntry(index, -1)} disabled={index === 0} aria-label="Move row up" title="Move up"><Icon name="chevron-up" size={14} /></button>
                <button className="small-action" type="button" onClick={() => moveEntry(index, 1)} disabled={index === current.entries.length - 1} aria-label="Move row down" title="Move down"><Icon name="chevron-down" size={14} /></button>
                <button className="small-action danger" type="button" onClick={() => removeEntry(index)} aria-label="Remove schedule row" title="Remove"><Icon name="x" size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className="field-label" htmlFor="weekday-note">Day note <span>optional</span></label>
      <textarea
        id="weekday-note"
        className="note-input"
        value={current.note}
        onChange={(event) => updateCurrent({ note: event.target.value })}
        placeholder="e.g. Friday schedule as needed"
        rows={2}
      />
    </section>
    {editingEntry && (
      <TemplateEntryModal
        entry={editingEntry.entry}
        isNew={editingEntry.isNew}
        weekdayName={dayInfo.long}
        employees={employees}
        onClose={() => setEditingEntry(null)}
        onSave={saveEntry}
        onDelete={deleteEditingEntry}
      />
    )}
    </>
  )
}
