import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { TabBar } from '@/components/TabBar'
import { UpdateBanner } from '@/components/UpdateBanner'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <main className="p-4">This page does not exist.</main>,
})

function RootLayout() {
  // The session player is full screen (design §3.2).
  const playing = useRouterState({ select: (s) => s.location.pathname.startsWith('/play/') })
  return (
    <div className="min-h-dvh bg-background pt-[env(safe-area-inset-top)] text-text">
      <UpdateBanner />
      <Outlet />
      {!playing && <TabBar />}
    </div>
  )
}
