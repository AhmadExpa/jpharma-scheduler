import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Icon from './Icon'

interface DemoStep {
  target: string[]
  eyebrow: string
  title: string
  message: string
  nextLabel: string
}

const DEMO_STEPS: DemoStep[] = [
  {
    target: ['[data-demo-target="setup-card"]'],
    eyebrow: 'Welcome · 1 of 7',
    title: 'This is your starting point',
    message: 'You only need this box to build a normal schedule. We will walk through it one small step at a time.',
    nextLabel: 'Next: add a name',
  },
  {
    target: ['[data-demo-target="employee-name"]'],
    eyebrow: 'Step 1 · 2 of 7',
    title: 'Type an employee name',
    message: 'Write one person’s name here, then use the button beside it.',
    nextLabel: 'Next: add employee',
  },
  {
    target: ['[data-demo-target="add-employee"]'],
    eyebrow: 'Step 2 · 3 of 7',
    title: 'Add the person',
    message: 'Click Add employee. The person will appear in the list below with a Start time field.',
    nextLabel: 'Next: choose time',
  },
  {
    target: ['[data-demo-target="employee-time"]', '[data-demo-target="setup-card"]'],
    eyebrow: 'Step 3 · 4 of 7',
    title: 'Choose a start time',
    message: 'After a person is added, choose one start time. The same time repeats Monday through Friday.',
    nextLabel: 'Next: add to calendar',
  },
  {
    target: ['[data-demo-target="apply-schedule"]'],
    eyebrow: 'Step 4 · 5 of 7',
    title: 'Put everyone on the calendar',
    message: 'When every person has a time, click this one button. The month calendar fills automatically.',
    nextLabel: 'Next: view calendar',
  },
  {
    target: ['[data-demo-target="calendar-overview"]'],
    eyebrow: 'Step 5 · 6 of 7',
    title: 'This is your finished schedule',
    message: 'The calendar shows who works and when. Use the arrows or Today to choose another month.',
    nextLabel: 'Next: change one day',
  },
  {
    target: ['[data-demo-target="calendar-cell"]'],
    eyebrow: 'Step 6 · 7 of 8',
    title: 'Click a day when something changes',
    message: 'You can change one time, mark someone off, or add someone just for that day. That change will not alter the whole week.',
    nextLabel: 'Next: extra options',
  },
  {
    target: ['[data-demo-target="advanced-options"]'],
    eyebrow: 'Optional · 8 of 8',
    title: 'Extra tools live here',
    message: 'Saved schedules, printed titles, example data, and reset controls are tucked away here. Most people will not need them.',
    nextLabel: 'Finish demo',
  },
]

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

interface DemoTourProps {
  onClose: () => void
}

export default function DemoTour({ onClose }: DemoTourProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<Rect | null>(null)
  const [popoverPosition, setPopoverPosition] = useState({ top: 24, left: 24 })
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const step = DEMO_STEPS[stepIndex]

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  useLayoutEffect(() => {
    const target = step.target
      .map((selector) => document.querySelector(selector))
      .find((element): element is HTMLElement => element instanceof HTMLElement)

    if (!target) {
      setTargetRect(null)
      setPopoverPosition({ top: 24, left: 24 })
      return undefined
    }

    target.scrollIntoView({ block: 'center', inline: 'nearest' })
    const updatePosition = () => {
      const rect = target.getBoundingClientRect()
      const nextRect = { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
      setTargetRect(nextRect)
      const popover = popoverRef.current
      const popoverWidth = popover?.offsetWidth ?? 330
      const popoverHeight = popover?.offsetHeight ?? 190
      const gap = 16
      const viewportPadding = 16
      let left = rect.left + (rect.width / 2) - (popoverWidth / 2)
      let top = rect.bottom + gap
      if (rect.top >= popoverHeight + gap) top = rect.top - popoverHeight - gap
      left = Math.max(viewportPadding, Math.min(left, window.innerWidth - popoverWidth - viewportPadding))
      top = Math.max(viewportPadding, Math.min(top, window.innerHeight - popoverHeight - viewportPadding))
      setPopoverPosition({ top, left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [step])

  function next() {
    if (stepIndex === DEMO_STEPS.length - 1) {
      onClose()
      return
    }
    setStepIndex((current) => current + 1)
  }

  return (
    <div className={`demo-overlay ${targetRect ? '' : 'demo-overlay-no-target'}`} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      {targetRect && (
        <div
          className="demo-spotlight"
          style={{ top: targetRect.top - 7, left: targetRect.left - 7, width: targetRect.width + 14, height: targetRect.height + 14 }}
          aria-hidden="true"
        />
      )}
      <div
        className={`demo-popover ${targetRect ? '' : 'demo-popover-centered'}`}
        ref={popoverRef}
        style={targetRect ? { top: popoverPosition.top, left: popoverPosition.left } : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-tour-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="demo-popover-topline">
          <span className="demo-tour-icon"><Icon name="play" size={15} /></span>
          <span>{step.eyebrow}</span>
          <button className="demo-close" type="button" onClick={onClose} aria-label="Close demo" title="Close demo"><Icon name="x" size={15} /></button>
        </div>
        <h2 id="demo-tour-title">{step.title}</h2>
        <p>{step.message}</p>
        <div className="demo-progress" aria-hidden="true">
          {DEMO_STEPS.map((item, index) => <span className={index <= stepIndex ? 'active' : ''} key={item.title} />)}
        </div>
        <div className="demo-actions">
          <button className="button ghost" type="button" onClick={onClose}>Close demo</button>
          <div className="demo-next-actions">
            {stepIndex > 0 && <button className="button secondary" type="button" onClick={() => setStepIndex((current) => current - 1)}>Back</button>}
            <button className="button primary" type="button" onClick={next}>{step.nextLabel} <Icon name="arrow-right" size={15} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
