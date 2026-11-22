import { createRootRoute, Outlet } from '@tanstack/react-router'
import { UpdateBanner } from '@/components/UpdateBanner'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="min-h-dvh bg-background pt-[env(safe-area-inset-top)] text-text">
      <UpdateBanner />
      <Outlet />
    </div>
  )
}
