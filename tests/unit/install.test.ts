// The first run's platform table (D-047): real user-agent strings to platforms, and the choice of install card.
import { describe, expect, it } from 'vitest'
import {
  appPlace,
  canOpenFromTab,
  chooseView,
  dataIsSeparate,
  detectPlatform,
  type Platform,
} from '@/lib/install'
import { UA } from '../fixtures/user-agents'

const cases: [keyof typeof UA, number, Platform][] = [
  ['iphoneSafari', 5, 'ios-safari'],
  ['ipadOrMacSafari', 5, 'ios-safari'],
  ['ipadOrMacSafari', 0, 'mac-safari'],
  ['oldMacSafari', 0, 'unsupported'],
  ['iphoneChrome', 5, 'ios-browser'],
  ['iphoneFirefox', 5, 'ios-browser'],
  ['iphoneEdge', 5, 'ios-browser'],
  ['iphoneInstagram', 5, 'in-app'],
  ['iphoneWebView', 5, 'in-app'],
  ['androidChrome', 5, 'android-chromium'],
  ['androidSamsung', 5, 'android-chromium'],
  ['androidFirefox', 5, 'android-firefox'],
  ['androidFacebook', 5, 'in-app'],
  ['androidWebView', 5, 'in-app'],
  ['windowsChrome', 0, 'desktop-chromium'],
  ['windowsChrome', 10, 'desktop-chromium'],
  ['windowsEdge', 0, 'desktop-chromium'],
  ['macChrome', 0, 'desktop-chromium'],
  ['chromeOS', 0, 'desktop-chromium'],
  ['linuxChrome', 0, 'desktop-chromium'],
  ['windowsFirefox', 0, 'windows-firefox'],
  ['macFirefox', 0, 'unsupported'],
  ['linuxFirefox', 0, 'unsupported'],
]

describe('detectPlatform', () => {
  it.each(cases)('%s with %i touch points is %s', (name, maxTouchPoints, platform) => {
    expect(detectPlatform({ userAgent: UA[name], maxTouchPoints })).toBe(platform)
  })
})

describe('what each platform can do', () => {
  it('keeps Apple data apart from the browser, shares it on Chromium, and says nothing elsewhere', () => {
    expect(dataIsSeparate('ios-safari')).toBe(true)
    expect(dataIsSeparate('ios-browser')).toBe(true)
    expect(dataIsSeparate('mac-safari')).toBe(true)
    expect(dataIsSeparate('android-chromium')).toBe(false)
    expect(dataIsSeparate('desktop-chromium')).toBe(false)
    expect(dataIsSeparate('windows-firefox')).toBeNull()
    expect(dataIsSeparate('android-firefox')).toBeNull()
  })

  it('opens the installed app from a tab on desktop Chromium only', () => {
    const all: Platform[] = [...new Set(cases.map((c) => c[2]))]
    expect(all.filter(canOpenFromTab)).toEqual(['desktop-chromium'])
  })

  it('names where the app is found', () => {
    expect(appPlace('ios-safari')).toBe('the Home Screen')
    expect(appPlace('mac-safari')).toBe('the Dock or Launchpad')
    expect(appPlace('android-chromium')).toBe('the home screen or the app list')
    expect(appPlace('windows-firefox')).toBe('the taskbar or the Start menu')
  })
})

describe('chooseView', () => {
  const base = { installedNow: false, detected: false, canPrompt: false, waited: false }
  it('waits, then falls back to directions', () => {
    expect(chooseView(base)).toBe('checking')
    expect(chooseView({ ...base, waited: true })).toBe('manual')
  })
  it('offers the prompt at once, even before the wait ends', () => {
    expect(chooseView({ ...base, canPrompt: true })).toBe('prompt')
  })
  it('puts an installed app before the prompt, and a fresh install before all', () => {
    expect(chooseView({ ...base, canPrompt: true, detected: true })).toBe('installed')
    expect(chooseView({ ...base, canPrompt: true, detected: true, installedNow: true })).toBe('installed-now')
  })
})
