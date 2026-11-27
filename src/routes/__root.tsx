import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { Backdrop } from '@/components/Backdrop'
import { SyncConflictDialog } from '@/components/SyncConflictDialog'
import { TabBar } from '@/components/TabBar'
import { UpdateBanner } from '@/components/UpdateBanner'
import { useWakeLock } from '@/lib/wake-lock'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <main className="p-4">This page does not exist.</main>,
})

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  // The session player is full screen (design §3.2).
  const playing = pathname.startsWith('/play/')
  // The screen stays on whenever the app is open (D-050, D-072).
  useWakeLock(true)
  return (
    <div className="relative isolate min-h-dvh pt-[env(safe-area-inset-top)] text-text">
      <Backdrop />
      <UpdateBanner />
      <Outlet />
      {!playing && <TabBar />}
      {/* The Drive sync's question when this device and Drive hold different plans (D-071). */}
      <SyncConflictDialog />
    </div>
  )
}
