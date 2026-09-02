import { useEffect } from 'react'
import type { IconName } from './Icon'
import Icon from './Icon'

interface ConfirmModalProps {
  eyebrow?: string
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  icon?: IconName
  onClose: () => void
  onConfirm: () => void
}

export default function ConfirmModal({
  eyebrow = 'Please confirm',
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  danger = false,
  icon = 'settings',
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="day-modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="confirm-modal-title">{title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close confirmation" title="Close"><Icon name="x" /></button>
        </div>

        <div className="modal-body">
          <div className="confirm-copy">
            <div className={`confirm-modal-icon ${danger ? 'danger' : ''}`}><Icon name={icon} size={19} /></div>
            <p>{message}</p>
          </div>
        </div>

        <div className="modal-footer">
          <span />
          <div className="footer-actions">
            <button className="button secondary" type="button" onClick={onClose}>{cancelLabel}</button>
            <button className={`button ${danger ? 'danger-button' : 'primary'}`} type="button" onClick={onConfirm}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
