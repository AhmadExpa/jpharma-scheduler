import { useState } from 'react'
import { WEEKDAYS } from '../dateUtils'
import type { Employee, WeeklyTemplate } from '../types'
import Icon from './Icon'
import QuickSetupModal from './QuickSetupModal'

interface TemplateEditorProps {
  employees: Employee[]
  template: WeeklyTemplate
  onUpdateDays: (updates: Partial<WeeklyTemplate>) => void
}

export default function TemplateEditor({ employees, template, onUpdateDays }: TemplateEditorProps) {
  const [quickSetupOpen, setQuickSetupOpen] = useState(false)
  const configuredDays = WEEKDAYS.filter((day) => template[day.value].entries.length > 0)
  const recurringEmployeeIds = new Set(
    WEEKDAYS.flatMap((day) => template[day.value].entries.map((entry) => entry.employeeId)),
  )
  const recurringEmployeeCount = recurringEmployeeIds.size

  return (
    <>
      <section className="control-card template-card" aria-labelledby="template-heading">
        <div className="card-heading">
          <div className="heading-icon lavender"><Icon name="settings" size={18} /></div>
          <div>
            <p className="eyebrow">Step 02</p>
            <h2 id="template-heading">Recurring pattern <span className="optional-heading">optional</span></h2>
          </div>
        </div>

        <p className="card-copy">Set the repeating weekdays, team members, and shift times together in one quick setup.</p>

        <button className="quick-setup-button" type="button" onClick={() => setQuickSetupOpen(true)} disabled={employees.length === 0}>
          <span className="quick-setup-icon"><Icon name="settings" size={14} /></span>
          <span><strong>Quick setup for the team</strong><small>Choose weekdays, employees, and times</small></span>
          <Icon name="arrow-right" size={15} />
        </button>

        <div className="recurring-summary" aria-live="polite">
          <div>
            <strong>{configuredDays.length > 0 ? `${configuredDays.length} recurring ${configuredDays.length === 1 ? 'weekday' : 'weekdays'} configured` : 'No recurring weekdays yet'}</strong>
            <span>
              {recurringEmployeeCount > 0
                ? `${recurringEmployeeCount} ${recurringEmployeeCount === 1 ? 'team member' : 'team members'} in the pattern`
                : employees.length === 0 ? 'Add a team member to begin' : 'Use Quick setup to create the pattern'}
            </span>
          </div>
          <span className="count-pill">{configuredDays.length}</span>
        </div>

        <p className="recurring-help">For one-off changes, click a date on the calendar.</p>
      </section>

      {quickSetupOpen && (
        <QuickSetupModal
          employees={employees}
          template={template}
          onClose={() => setQuickSetupOpen(false)}
          onSave={(updates) => { onUpdateDays(updates); setQuickSetupOpen(false) }}
        />
      )}
    </>
  )
}
