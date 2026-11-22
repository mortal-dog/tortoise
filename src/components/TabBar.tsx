import { Link } from '@tanstack/react-router'
import { BookOpen, CalendarDays, House, Settings, TrendingUp } from 'lucide-react'

const TABS = [
  { to: '/', label: 'Today', Icon: House },
  { to: '/week', label: 'Week', Icon: CalendarDays },
  { to: '/progress', label: 'Progress', Icon: TrendingUp },
  { to: '/library', label: 'Library', Icon: BookOpen },
  { to: '/settings', label: 'Settings', Icon: Settings },
] as const

export function TabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-xl">
        {TABS.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: to === '/' }}
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-text"
              activeProps={{ className: 'font-semibold text-primary', 'aria-current': 'page' }}
            >
              <Icon aria-hidden className="size-6" strokeWidth={2} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
