import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Backdrop } from '@/components/Backdrop'
import { SyncConflictDialog } from '@/components/SyncConflictDialog'
import { TabBar } from '@/components/TabBar'
import { setUpdateIdle } from '@/lib/sw-register'
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
  // A new version reloads the app by itself, never during a session (D-075).
  useEffect(() => setUpdateIdle(!playing), [playing])
  return (
    <div className="relative isolate min-h-dvh pt-[env(safe-area-inset-top)] text-text">
      <Backdrop />
      <Outlet />
      {!playing && <TabBar />}
      {/* The Drive sync's question when this device and Drive hold different plans (D-071). */}
      <SyncConflictDialog />
    </div>
  )
}
