import { Link, useRouterState } from '@tanstack/react-router'
import { BookOpen, CalendarDays, House, Settings, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/cn'

const TABS = [
  { to: '/', label: 'Today', Icon: House },
  { to: '/week', label: 'Week', Icon: CalendarDays },
  { to: '/progress', label: 'Progress', Icon: TrendingUp },
  { to: '/library', label: 'Library', Icon: BookOpen },
  { to: '/settings', label: 'Settings', Icon: Settings },
] as const

/** The index of the tab the path belongs to, or -1 (a day, a test). */
export function activeTab(pathname: string): number {
  return TABS.findIndex(({ to }) => (to === '/' ? pathname === '/' : pathname.startsWith(to)))
}

/** The tab bar (D-048): a floating glass bar; a lighter pill glides to the open tab. */
export function TabBar() {
  const active = activeTab(useRouterState({ select: (s) => s.location.pathname }))
  return (
    <nav
      aria-label="Main"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-10 px-3 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)-0.5rem))]"
    >
      <div className="glass-strong pointer-events-auto relative mx-auto max-w-xl rounded-[1.75rem] border border-edge p-1">
        <span
          aria-hidden
          data-testid="tab-pill"
          className={cn(
            'tab-pill absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/5)] rounded-3xl',
            active < 0 && 'opacity-0',
          )}
          style={{ transform: `translateX(${Math.max(0, active) * 100}%)` }}
        />
        <ul className="relative flex">
          {TABS.map(({ to, label, Icon }) => (
            <li key={to} className="flex-1">
              <Link
                to={to}
                activeOptions={{ exact: to === '/' }}
                className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs transition-transform duration-150 active:scale-95"
                activeProps={{ className: 'font-semibold text-primary', 'aria-current': 'page' }}
                inactiveProps={{ className: 'text-text' }}
              >
                <Icon aria-hidden className="size-6" strokeWidth={2} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
