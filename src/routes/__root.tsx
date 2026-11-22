import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TabBar } from '@/components/TabBar'
import { UpdateBanner } from '@/components/UpdateBanner'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <main className="p-4">This page does not exist.</main>,
})

function RootLayout() {
  return (
    <div className="min-h-dvh bg-background pt-[env(safe-area-inset-top)] text-text">
      <UpdateBanner />
      <Outlet />
      <TabBar />
    </div>
  )
}
