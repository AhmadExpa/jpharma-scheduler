import type { ScheduleTemplate } from '../types'
import Icon from './Icon'

interface SavedTemplatesBarProps {
  templates: ScheduleTemplate[]
  activeTemplateId: string | null
  onSelect: (id: string | null) => boolean
  onSave: () => void
  onUpdate: () => void
  onDelete: () => void
}

export default function SavedTemplatesBar({ templates, activeTemplateId, onSelect, onSave, onUpdate, onDelete }: SavedTemplatesBarProps) {
  const activeTemplate = templates.find((template) => template.id === activeTemplateId)
  const canManageActiveTemplate = Boolean(activeTemplate && !activeTemplate.builtIn)

  return (
    <div className="saved-templates-bar no-print">
      <div className="saved-templates-copy">
        <div className="saved-templates-icon"><Icon name="calendar" size={16} /></div>
        <div>
          <p className="eyebrow">Saved templates</p>
          <strong>Reuse employees and shift times</strong>
        </div>
      </div>
      <div className="saved-templates-actions">
        <select
          value={activeTemplateId ?? ''}
          onChange={(event) => {
            const accepted = onSelect(event.target.value || null)
            if (!accepted) event.currentTarget.value = activeTemplateId ?? ''
          }}
          aria-label="Choose a saved schedule template"
        >
          <option value="">Current schedule</option>
          {templates.map((template) => <option value={template.id} key={template.id}>{template.name}</option>)}
        </select>
        <button className="button secondary compact" type="button" onClick={onSave}><Icon name="plus" size={14} /> Save as template</button>
        {canManageActiveTemplate && <button className="button ghost compact" type="button" onClick={onUpdate}>Update</button>}
        {canManageActiveTemplate && <button className="template-delete-button" type="button" onClick={onDelete} aria-label="Delete selected template" title="Delete selected template"><Icon name="trash" size={14} /></button>}
      </div>
    </div>
  )
}
