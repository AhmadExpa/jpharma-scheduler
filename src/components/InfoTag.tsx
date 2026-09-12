import type { ReactNode } from 'react'
import Icon from './Icon'

interface InfoTagProps {
  children: ReactNode
  className?: string
}

export default function InfoTag({ children, className = '' }: InfoTagProps) {
  return (
    <span className={`info-tag ${className}`.trim()}>
      <Icon name="info" size={13} />
      <span>{children}</span>
    </span>
  )
}
