import type { SVGProps } from 'react'

export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'calendar'
  | 'check'
  | 'chevron-down'
  | 'chevron-up'
  | 'edit'
  | 'grip'
  | 'plus'
  | 'printer'
  | 'refresh'
  | 'settings'
  | 'trash'
  | 'users'
  | 'x'

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

export default function Icon({ name, size = 18, ...props }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  }

  switch (name) {
    case 'arrow-left': return <svg {...common}><path d="m15 18-6-6 6-6" /></svg>
    case 'arrow-right': return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>
    case 'calendar': return <svg {...common}><rect x="3" y="4.5" width="18" height="17" rx="2" /><path d="M16 2.5v4M8 2.5v4M3 9h18" /></svg>
    case 'check': return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>
    case 'chevron-down': return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>
    case 'chevron-up': return <svg {...common}><path d="m18 15-6-6-6 6" /></svg>
    case 'edit': return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>
    case 'grip': return <svg {...common}><circle cx="9" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="9" cy="18" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="18" r="1" fill="currentColor" stroke="none" /></svg>
    case 'plus': return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>
    case 'printer': return <svg {...common}><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v7H6z" /><path d="M18 12h.01" /></svg>
    case 'refresh': return <svg {...common}><path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" /></svg>
    case 'settings': return <svg {...common}><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="m19.4 15 .1.1a2 2 0 0 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.2a2 2 0 0 1-4 0v-.2a2 2 0 0 0-3.4-1.4l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1A2 2 0 0 0 1.7 11H1.5a2 2 0 0 1 0-4h.2a2 2 0 0 0 1.4-3.4L3 3.5A2 2 0 0 1 5.8.7l.1.1A2 2 0 0 0 9.3-.6v-.2a2 2 0 0 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1A2 2 0 0 1 19.6 3l-.1.1A2 2 0 0 0 20.9 6h.2a2 2 0 0 1 0 4h-.2a2 2 0 0 0-1.5 5Z" transform="scale(.83) translate(2.45 2.45)" /></svg>
    case 'trash': return <svg {...common}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>
    case 'users': return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    case 'x': return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>
  }
}
