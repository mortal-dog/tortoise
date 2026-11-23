import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { Backdrop } from '@/components/Backdrop'
import { TabBar } from '@/components/TabBar'
import { UpdateBanner } from '@/components/UpdateBanner'
import { useWakeLock, WakeLockContext } from '@/lib/wake-lock'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <main className="p-4">This page does not exist.</main>,
})

/** The calm screens get raindrops on the backdrop (D-048); screens for reading, typing or timing do not. */
export const RAIN_PATHS: ReadonlySet<string> = new Set(['/', '/week', '/progress'])

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  // The session player is full screen (design §3.2).
  const playing = pathname.startsWith('/play/')
  // The screen stays on whenever the app is open (D-050).
  const wake = useWakeLock(true)
  return (
    <WakeLockContext.Provider value={wake}>
      <div className="relative isolate min-h-dvh pt-[env(safe-area-inset-top)] text-text">
        <Backdrop rain={RAIN_PATHS.has(pathname)} />
        <UpdateBanner />
        <Outlet />
        {!playing && <TabBar />}
      </div>
    </WakeLockContext.Provider>
  )
}
