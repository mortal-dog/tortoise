// The first run's install card per platform (D-047): directions, the install button, the installed app, and the
// browser choice that is always there.
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { FirstRun } from '@/components/FirstRun'
import { ANSWER_WAIT_MS, listenForInstallPrompt, resetInstallPrompt } from '@/lib/install'
import { UA } from '../fixtures/user-agents'

function as(userAgent: string, maxTouchPoints = 0) {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent)
  // jsdom has no maxTouchPoints, so the test defines it on the instance and removes it afterwards.
  Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: maxTouchPoints })
}

function reportInstalled(apps: { platform: string }[]) {
  Object.defineProperty(navigator, 'getInstalledRelatedApps', {
    configurable: true,
    value: vi.fn(async () => apps),
  })
}

function offerPrompt(outcome: 'accepted' | 'dismissed') {
  const e = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn(async () => {}),
    userChoice: Promise.resolve({ outcome }),
  })
  act(() => {
    window.dispatchEvent(e)
  })
  return e
}

const browserChoice = () => screen.getByRole('button', { name: 'Start in this browser instead' })

beforeAll(() => listenForInstallPrompt(window))

afterEach(() => {
  resetInstallPrompt()
  Reflect.deleteProperty(navigator, 'getInstalledRelatedApps')
  Reflect.deleteProperty(navigator, 'maxTouchPoints')
  vi.useRealTimers()
})

describe('the install card', () => {
  it('gives Safari on an iPhone the Share directions, with no wait', () => {
    as(UA.iphoneSafari, 5)
    render(<FirstRun />)
    expect(screen.getByRole('heading', { name: 'Install it first' })).toBeInTheDocument()
    expect(screen.getByText('In Safari, tap Share. No Share button? Tap ⋯ first.')).toBeInTheDocument()
    expect(screen.getByText('Already installed? Open Tortoise from the Home Screen.')).toBeInTheDocument()
    expect(screen.getByText(/keeps its own data, apart from Safari's/)).toBeInTheDocument()
    expect(browserChoice()).toBeInTheDocument()
  })

  it('gives Chrome on an iPhone the same steps, naming this browser', () => {
    as(UA.iphoneChrome, 5)
    render(<FirstRun />)
    expect(screen.getByText(/Tap Share, in this browser's address bar/)).toBeInTheDocument()
    expect(screen.getByText(/apart from this browser's/)).toBeInTheDocument()
  })

  it('tells a Mac to add it to the Dock', () => {
    as(UA.ipadOrMacSafari, 0)
    render(<FirstRun />)
    expect(screen.getByText('In the menu bar, choose File, then Add to Dock.')).toBeInTheDocument()
  })

  it('waits briefly on desktop Chrome, then shows directions when no prompt comes', () => {
    vi.useFakeTimers()
    as(UA.windowsChrome)
    render(<FirstRun />)
    expect(screen.getByRole('status')).toHaveTextContent('Checking what this browser can do')
    act(() => {
      vi.advanceTimersByTime(ANSWER_WAIT_MS)
    })
    expect(
      screen.getByText('Click the install icon at the right end of the address bar.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/share their data on this device/)).toBeInTheDocument()
    expect(browserChoice()).toBeInTheDocument()
  })

  it('offers the install button when Chrome gives its prompt, and the app once installed', async () => {
    as(UA.windowsChrome)
    render(<FirstRun />)
    const e = offerPrompt('accepted')
    fireEvent.click(screen.getByRole('button', { name: 'Install Tortoise' }))
    expect(e.prompt).toHaveBeenCalledOnce()
    expect(await screen.findByRole('heading', { name: 'Tortoise is installed' })).toBeInTheDocument()
    const open = screen.getByRole('link', { name: 'Open Tortoise' })
    expect(open).toHaveAttribute('href', '/')
    expect(open).toHaveAttribute('target', '_blank')
    expect(browserChoice()).toBeInTheDocument()
  })

  it('falls back to directions when the prompt is dismissed', async () => {
    as(UA.androidChrome, 5)
    render(<FirstRun />)
    offerPrompt('dismissed')
    fireEvent.click(screen.getByRole('button', { name: 'Install Tortoise' }))
    expect(
      await screen.findByText('Choose Install app or Add to Home screen, then Install.'),
    ).toBeInTheDocument()
  })

  it('shows the event the browser fired before the first render', () => {
    as(UA.androidChrome, 5)
    offerPrompt('accepted')
    render(<FirstRun />)
    expect(screen.getByRole('button', { name: 'Install Tortoise' })).toBeInTheDocument()
  })

  it('opens the installed app from desktop Chrome', async () => {
    as(UA.macChrome)
    reportInstalled([{ platform: 'webapp' }])
    render(<FirstRun />)
    expect(
      await screen.findByRole('heading', { name: 'Tortoise is installed on this device' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Tortoise' })).toHaveAttribute('target', '_blank')
  })

  it('says where the installed app is on Android, which cannot open it from a tab', async () => {
    as(UA.androidChrome, 5)
    reportInstalled([{ platform: 'webapp' }])
    render(<FirstRun />)
    expect(await screen.findByText('Open it from the home screen or the app list.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Open Tortoise' })).toBeNull()
  })

  it('ignores a report of other apps', async () => {
    vi.useFakeTimers()
    as(UA.windowsChrome)
    reportInstalled([{ platform: 'play' }])
    render(<FirstRun />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ANSWER_WAIT_MS)
    })
    expect(screen.getByRole('heading', { name: 'Install it first' })).toBeInTheDocument()
    expect(screen.queryByText(/is installed/)).toBeNull()
  })

  it('sends a page inside another app to the browser, with the address', () => {
    as(UA.iphoneInstagram, 5)
    render(<FirstRun />)
    expect(screen.getByRole('heading', { name: 'Open this page in your browser' })).toBeInTheDocument()
    expect(screen.getByText(window.location.host)).toBeInTheDocument()
  })

  it('says when a browser cannot install, and names ones that can', () => {
    as(UA.linuxFirefox)
    render(<FirstRun />)
    expect(screen.getByRole('heading', { name: 'This browser cannot install apps' })).toBeInTheDocument()
    expect(screen.getByText(/open this address in Chrome or Edge/)).toBeInTheDocument()
    expect(browserChoice()).toBeInTheDocument()
  })
})
