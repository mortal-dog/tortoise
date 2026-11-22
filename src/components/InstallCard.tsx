import {
  AppWindow,
  Check,
  Copy,
  Download,
  EllipsisVertical,
  ExternalLink,
  type LucideIcon,
  MonitorDown,
  Share,
  SquarePlus,
} from 'lucide-react'
import { type ReactNode, useState } from 'react'
import {
  appPlace,
  canOpenFromTab,
  dataIsSeparate,
  type InstallView,
  type Platform,
  promptInstall,
} from '@/lib/install'
import { Button, buttonClass, Card } from './ui'

type Step = { icon: LucideIcon; text: string }

/** Written directions, for browsers with no install button (D-047). */
function steps(p: Platform): Step[] {
  const open: Step = { icon: AppWindow, text: `Open Tortoise from ${appPlace(p)}.` }
  switch (p) {
    case 'ios-safari':
      return [
        { icon: Share, text: 'In Safari, tap Share. No Share button? Tap ⋯ first.' },
        {
          icon: SquarePlus,
          text: 'Choose Add to Home Screen, then Add. If Open as Web App shows, leave it on.',
        },
        open,
      ]
    case 'ios-browser':
      return [
        { icon: Share, text: "Tap Share, in this browser's address bar, toolbar or menu." },
        {
          icon: SquarePlus,
          text: 'Choose Add to Home Screen, then Add (iOS 16.4 or later; before that, use Safari).',
        },
        open,
      ]
    case 'mac-safari':
      return [
        { icon: Share, text: 'In the menu bar, choose File, then Add to Dock.' },
        { icon: AppWindow, text: 'Click Add, then open Tortoise from the Dock.' },
      ]
    case 'android-chromium':
      return [
        { icon: EllipsisVertical, text: "Open the browser's menu (⋮)." },
        { icon: Download, text: 'Choose Install app or Add to Home screen, then Install.' },
        open,
      ]
    case 'android-firefox':
      return [
        { icon: EllipsisVertical, text: "Open Firefox's menu (⋮)." },
        { icon: SquarePlus, text: 'Choose Add to Home screen or Install.' },
        open,
      ]
    case 'desktop-chromium':
      return [
        { icon: MonitorDown, text: 'Click the install icon at the right end of the address bar.' },
        {
          icon: EllipsisVertical,
          text: "No icon? Find Install in the browser's menu (Chrome: Cast, save, and share; Edge: Apps).",
        },
        { icon: AppWindow, text: 'Tortoise then opens in its own window.' },
      ]
    case 'windows-firefox':
      return [
        {
          icon: MonitorDown,
          text: 'Click the web app button at the right end of the address bar (Firefox 143 or later).',
        },
        { icon: AppWindow, text: 'Tortoise opens in its own window and stays in the taskbar.' },
      ]
    default:
      return []
  }
}

function Steps({ list }: { list: Step[] }) {
  return (
    <ol className="mt-3 space-y-3">
      {list.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-start gap-3">
          <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-sky" />
          <span>{text}</span>
        </li>
      ))}
    </ol>
  )
}

/** Where the plan's data lives once installed: apart from the browser on Apple, shared on Chromium. */
function DataNote({ platform }: { platform: Platform }) {
  const separate = dataIsSeparate(platform)
  if (separate === null) return null
  const browser = platform === 'ios-browser' ? "this browser's" : "Safari's"
  return (
    <p className="mt-4 text-sm text-primary-strong">
      {separate
        ? `The installed app keeps its own data, apart from ${browser}, so start the plan there, not in this tab.`
        : 'The app and this browser share their data on this device, so a plan started in either shows in both.'}
    </p>
  )
}

/** Opens the installed app: desktop Chrome sends a link that opens a new page into the app (navigation capturing). */
function OpenApp() {
  return (
    <>
      <a href="/" target="_blank" rel="noopener" className={buttonClass('primary', 'mt-3 w-full')}>
        <ExternalLink aria-hidden className="size-4" />
        Open Tortoise
      </a>
      <p className="mt-2 text-sm">
        If it opens in a new tab instead, click the open-in-app icon at the right end of the address bar.
      </p>
    </>
  )
}

/** The address, with a copy button, for moving to a browser that can install. */
function Address() {
  const [copied, setCopied] = useState(false)
  const address = window.location.host
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2">
      <span className="font-semibold break-all select-all">{address}</span>
      {typeof navigator.clipboard?.writeText === 'function' && (
        <Button variant="quiet" className="shrink-0" onClick={() => void copy()}>
          {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      )}
    </div>
  )
}

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold text-primary">{children}</h2>
}

/** The install card of the first run: what this platform can do, from an install button to written directions. */
export function InstallCard({ platform, view }: { platform: Platform; view: InstallView }) {
  if (view === 'checking') {
    return (
      <Card>
        <Heading>Install it first</Heading>
        <p role="status" className="mt-2">
          Checking what this browser can do…
        </p>
      </Card>
    )
  }

  if (view === 'installed' || view === 'installed-now') {
    const fresh = view === 'installed-now'
    return (
      <Card>
        <Heading>{fresh ? 'Tortoise is installed' : 'Tortoise is installed on this device'}</Heading>
        {canOpenFromTab(platform) ? (
          <>
            {fresh && <p className="mt-2">It may already be open in its own window.</p>}
            <OpenApp />
          </>
        ) : (
          <p className="mt-2">Open it from {appPlace(platform)}.</p>
        )}
        <DataNote platform={platform} />
      </Card>
    )
  }

  if (view === 'prompt') {
    return (
      <Card>
        <Heading>Install it first</Heading>
        <p className="mt-2">Tortoise then opens on its own, like any app, and works offline.</p>
        <Button className="mt-3 w-full" onClick={() => void promptInstall()}>
          <Download aria-hidden className="size-4" />
          Install Tortoise
        </Button>
        <DataNote platform={platform} />
      </Card>
    )
  }

  if (platform === 'in-app') {
    return (
      <Card>
        <Heading>Open this page in your browser</Heading>
        <p className="mt-2">
          It is open inside another app, which cannot install apps. Use that app&apos;s menu to open the page
          in your browser, or copy the address.
        </p>
        <Address />
      </Card>
    )
  }

  if (platform === 'unsupported') {
    return (
      <Card>
        <Heading>This browser cannot install apps</Heading>
        <p className="mt-2">
          To install Tortoise, open this address in Chrome or Edge, or in Safari on an iPhone, iPad or Mac.
        </p>
        <Address />
      </Card>
    )
  }

  return (
    <Card>
      <Heading>Install it first</Heading>
      <Steps list={steps(platform)} />
      <p className="mt-4 text-sm">Already installed? Open Tortoise from {appPlace(platform)}.</p>
      <DataNote platform={platform} />
    </Card>
  )
}
