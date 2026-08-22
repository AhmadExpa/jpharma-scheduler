import { useEffect, useRef, useState } from 'react'

interface TimeParts {
  hour: string
  minute: string
  period: string
}

const EMPTY_TIME: TimeParts = { hour: '', minute: '', period: '' }
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'))

export function parseTimeLabel(value: string): TimeParts | null {
  const match = value.trim().toUpperCase().replace(/\s+/g, '').match(/^(\d{1,2})(?::([0-5]\d))?([AP]M)$/)
  if (!match) return null

  const hour = Number(match[1])
  if (hour < 1 || hour > 12) return null

  return {
    hour: String(hour),
    minute: match[2] ?? '00',
    period: match[3],
  }
}

function formatTime(parts: TimeParts): string {
  if (!parts.hour || !parts.minute || !parts.period) return ''
  return `${Number(parts.hour)}:${parts.minute} ${parts.period}`
}

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const [parts, setParts] = useState<TimeParts>(() => parseTimeLabel(value) ?? EMPTY_TIME)
  const lastEmittedValue = useRef(value)

  useEffect(() => {
    if (value !== lastEmittedValue.current) {
      setParts(parseTimeLabel(value) ?? EMPTY_TIME)
      lastEmittedValue.current = value
    }
  }, [value])

  function updatePart(part: keyof TimeParts, nextValue: string) {
    const nextParts = { ...parts, [part]: nextValue }
    const nextLabel = formatTime(nextParts)
    setParts(nextParts)
    lastEmittedValue.current = nextLabel
    onChange(nextLabel)
  }

  return (
    <div className="time-picker" title={value && !parseTimeLabel(value) ? `Current value: ${value}` : undefined}>
      <select value={parts.hour} onChange={(event) => updatePart('hour', event.target.value)} aria-label="Hour">
        <option value="">Hour</option>
        {Array.from({ length: 12 }, (_, index) => {
          const hour = String(index + 1)
          return <option value={hour} key={hour}>{hour}</option>
        })}
      </select>
      <select value={parts.minute} onChange={(event) => updatePart('minute', event.target.value)} aria-label="Minute">
        <option value="">Min</option>
        {MINUTES.map((minute) => <option value={minute} key={minute}>{minute}</option>)}
      </select>
      <select value={parts.period} onChange={(event) => updatePart('period', event.target.value)} aria-label="AM or PM">
        <option value="">AM/PM</option>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}
