import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Employee } from '../types'
import Icon from './Icon'
import InfoTag from './InfoTag'

interface SimpleSetupCardProps {
  employees: Employee[]
  hasSchedule: boolean
  onAdd: (name: string) => boolean
  onRename: (id: string, name: string) => boolean
  onTimeChange: (id: string, time: string) => void
  onDelete: (id: string) => void
  onApply: () => void
}

export default function SimpleSetupCard({
  employees,
  hasSchedule,
  onAdd,
  onRename,
  onTimeChange,
  onDelete,
  onApply,
}: SimpleSetupCardProps) {
  const [name, setName] = useState('')
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const firstTimeRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setNameDrafts((current) => Object.fromEntries(
      employees.map((employee) => [employee.id, current[employee.id] ?? employee.name]),
    ))
  }, [employees])

  const ready = employees.length > 0 && employees.every((employee) => Boolean(employee.defaultTime))

  function submit(event: FormEvent) {
    event.preventDefault()
    const cleanName = name.trim()
    if (!onAdd(cleanName)) {
      setError('Please enter a new employee name.')
      return
    }
    setName('')
    setError('')
    window.setTimeout(() => firstTimeRef.current?.focus(), 0)
  }

  function saveName(employee: Employee) {
    const nextName = (nameDrafts[employee.id] ?? employee.name).trim()
    if (nextName === employee.name) return
    if (!onRename(employee.id, nextName)) {
      setNameDrafts((current) => ({ ...current, [employee.id]: employee.name }))
      setError('Employee names must be unique and cannot be empty.')
      return
    }
    setError('')
  }

  function apply() {
    if (!ready) {
      setError(employees.length === 0 ? 'Add at least one employee first.' : 'Add a time for every employee.')
      return
    }
    setError('')
    onApply()
  }

  return (
    <section className="simple-setup-card control-card no-print" aria-labelledby="simple-setup-title" data-demo-target="setup-card">
      <div className="simple-setup-heading">
        <div className="setup-number">1</div>
        <div>
          <p className="eyebrow">Start here</p>
          <h2 id="simple-setup-title">Add your employees</h2>
        </div>
        <span className="count-pill">{employees.length}</span>
      </div>
      <p className="simple-setup-copy">Add each person, choose their start time, then put the schedule on the calendar.</p>
      <InfoTag className="simple-setup-info">One time per person · repeats Monday–Friday</InfoTag>

      <form className="simple-add-row" onSubmit={submit}>
        <input
          value={name}
          onChange={(event) => { setName(event.target.value); setError('') }}
          placeholder="Employee name"
          aria-label="New employee name"
          data-demo-target="employee-name"
        />
        <button className="button primary" type="submit" data-demo-target="add-employee"><Icon name="plus" size={16} /> Add employee</button>
      </form>

      {employees.length > 0 ? (
        <div className="simple-employee-list">
          <div className="simple-list-labels" aria-hidden="true"><span>Employee</span><span>Start time</span><span /></div>
          {employees.map((employee, index) => (
            <div className="simple-employee-row" key={employee.id}>
              <input
                value={nameDrafts[employee.id] ?? employee.name}
                onChange={(event) => setNameDrafts((current) => ({ ...current, [employee.id]: event.target.value }))}
                onBlur={() => saveName(employee)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur()
                  if (event.key === 'Escape') setNameDrafts((current) => ({ ...current, [employee.id]: employee.name }))
                }}
                aria-label={`Employee ${index + 1} name`}
              />
              <input
                ref={index === employees.length - 1 ? firstTimeRef : undefined}
                className="simple-time-input"
                type="time"
                step="300"
                value={employee.defaultTime ?? ''}
                onChange={(event) => { onTimeChange(employee.id, event.target.value); setError('') }}
                aria-label={`Start time for ${employee.name}`}
                data-demo-target={index === 0 ? 'employee-time' : undefined}
              />
              <button className="small-action danger" type="button" onClick={() => onDelete(employee.id)} aria-label={`Remove ${employee.name}`} title={`Remove ${employee.name}`}>
                <Icon name="trash" size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="simple-empty-state"><Icon name="users" size={18} /><span>Your calendar is waiting for its first employee.</span></div>
      )}

      <div className="simple-setup-footer">
        <div>
          <strong>Repeats Monday–Friday</strong>
          <span>{ready ? 'Everything is ready to add to the calendar.' : 'Give everyone a time before adding the schedule.'}</span>
        </div>
        <button className="button primary setup-apply-button" type="button" onClick={apply} data-demo-target="apply-schedule">
          <Icon name="calendar" size={16} /> {hasSchedule ? 'Update calendar' : 'Add schedule to calendar'}
        </button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  )
}
