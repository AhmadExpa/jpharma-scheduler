import { useState, type FormEvent } from 'react'
import type { Employee } from '../types'
import Icon from './Icon'

interface EmployeeManagerProps {
  employees: Employee[]
  onAdd: (name: string) => boolean
  onRename: (id: string, name: string) => boolean
  onDelete: (id: string) => void
  onMove: (id: string, direction: -1 | 1) => void
}

export default function EmployeeManager({ employees, onAdd, onRename, onDelete, onMove }: EmployeeManagerProps) {
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [error, setError] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    const didAdd = onAdd(name)
    if (!didAdd) {
      setError('Enter a unique employee name.')
      return
    }
    setName('')
    setError('')
  }

  function beginEdit(employee: Employee) {
    setEditingId(employee.id)
    setEditingName(employee.name)
    setError('')
  }

  function saveEdit() {
    if (!editingId) return
    if (!onRename(editingId, editingName)) {
      setError('Enter a unique employee name.')
      return
    }
    setEditingId(null)
    setEditingName('')
    setError('')
  }

  return (
    <section className="control-card" aria-labelledby="team-heading">
      <div className="card-heading">
        <div className="heading-icon mint"><Icon name="users" size={18} /></div>
        <div>
          <p className="eyebrow">Step 01</p>
          <h2 id="team-heading">Team members</h2>
        </div>
        <span className="count-pill">{employees.length}</span>
      </div>
      <p className="card-copy">Add the people who should appear in your monthly schedule.</p>

      <form className="add-row" onSubmit={submit}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Employee name"
          aria-label="Employee name"
        />
        <button className="icon-button filled" type="submit" aria-label="Add employee" title="Add employee">
          <Icon name="plus" size={19} />
        </button>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}

      {employees.length === 0 ? (
        <div className="empty-mini">
          <span className="empty-dot" />
          <span>Your team list is ready for its first member.</span>
        </div>
      ) : (
        <div className="employee-list">
          {employees.map((employee, index) => (
            <div className="employee-row" key={employee.id}>
              <span className="drag-handle" aria-hidden="true"><Icon name="grip" size={16} /></span>
              {editingId === employee.id ? (
                <input
                  className="inline-input"
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') saveEdit(); if (event.key === 'Escape') setEditingId(null) }}
                  autoFocus
                  aria-label={`Rename ${employee.name}`}
                />
              ) : (
                <span className="employee-name">{employee.name}</span>
              )}
              <div className="row-actions">
                {editingId === employee.id ? (
                  <button className="small-action accent" type="button" onClick={saveEdit} aria-label="Save employee name" title="Save">
                    <Icon name="check" size={15} />
                  </button>
                ) : (
                  <button className="small-action" type="button" onClick={() => beginEdit(employee)} aria-label={`Edit ${employee.name}`} title="Edit">
                    <Icon name="edit" size={15} />
                  </button>
                )}
                <button className="small-action" type="button" onClick={() => onMove(employee.id, -1)} disabled={index === 0} aria-label={`Move ${employee.name} up`} title="Move up">
                  <Icon name="chevron-up" size={15} />
                </button>
                <button className="small-action" type="button" onClick={() => onMove(employee.id, 1)} disabled={index === employees.length - 1} aria-label={`Move ${employee.name} down`} title="Move down">
                  <Icon name="chevron-down" size={15} />
                </button>
                <button className="small-action danger" type="button" onClick={() => onDelete(employee.id)} aria-label={`Delete ${employee.name}`} title="Delete">
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
