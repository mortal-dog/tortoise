import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { listenForInstallPrompt } from './lib/install'
import { registerServiceWorker } from './lib/sw-register'
import { startAutoSync } from './lib/sync/sync'
import { routeTree } from './routeTree.gen'
import './styles.css'

const router = createRouter({ routeTree, defaultPreload: false, scrollRestoration: true })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Before the first render: the browser may offer its install prompt before React mounts (D-047).
listenForInstallPrompt()
if (import.meta.env.PROD) registerServiceWorker()
// The Google Drive backup uploads by itself while its sign-in lasts (D-054); it makes no request before sign-in.
startAutoSync()

const root = document.getElementById('root')
if (!root) throw new Error('#root missing')
createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
