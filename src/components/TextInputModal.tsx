import { useEffect, useState, type FormEvent } from 'react'
import Icon from './Icon'

interface TextInputModalProps {
  title: string
  description: string
  label: string
  initialValue?: string
  placeholder?: string
  submitLabel: string
  onClose: () => void
  onSubmit: (value: string) => string | null
}

export default function TextInputModal({
  title,
  description,
  label,
  initialValue = '',
  placeholder,
  submitLabel,
  onClose,
  onSubmit,
}: TextInputModalProps) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState('')

  useEffect(() => {
    setValue(initialValue)
    setError('')
  }, [initialValue])

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  function submit(event: FormEvent) {
    event.preventDefault()
    const nextError = onSubmit(value)
    if (nextError) {
      setError(nextError)
      return
    }
    onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="day-modal text-input-modal" role="dialog" aria-modal="true" aria-labelledby="text-input-modal-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Saved template</p>
            <h2 id="text-input-modal-title">{title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close template name dialog" title="Close"><Icon name="x" /></button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body text-input-modal-body">
            <p className="modal-description">{description}</p>
            <label className="field-label" htmlFor="template-name-input">{label}</label>
            <input
              id="template-name-input"
              className="modal-full-input"
              value={value}
              onChange={(event) => { setValue(event.target.value); setError('') }}
              placeholder={placeholder}
              maxLength={60}
              autoFocus
            />
            {error && <p className="form-error" role="alert">{error}</p>}
          </div>

          <div className="modal-footer">
            <span />
            <div className="footer-actions">
              <button className="button secondary" type="button" onClick={onClose}>Cancel</button>
              <button className="button primary" type="submit"><Icon name="check" size={16} /> {submitLabel}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
