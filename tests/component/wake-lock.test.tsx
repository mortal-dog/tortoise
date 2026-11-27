import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isAppleMobile, useWakeLock } from '@/lib/wake-lock'

function stubLock(request: () => Promise<unknown>) {
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'wakeLock')
})

describe('the screen wake lock', () => {
  it('is held while the app is open and released when it closes', async () => {
    const release = vi.fn(async () => undefined)
    const request = vi.fn(async () => ({ release }))
    stubLock(request)
    const { result, unmount } = renderHook(() => useWakeLock(true))
    await waitFor(() => expect(result.current).toBe('on'))
    expect(request).toHaveBeenCalledWith('screen')
    unmount()
    expect(release).toHaveBeenCalled()
  })

  it('is asked for again when the app returns from the background', async () => {
    const sentinels: Array<{ released: boolean }> = []
    const request = vi.fn(async () => {
      const s = { released: false, release: async () => undefined }
      sentinels.push(s)
      return s
    })
    stubLock(request)
    const { result } = renderHook(() => useWakeLock(true))
    await waitFor(() => expect(result.current).toBe('on'))
    // Safari released it while the app was in the background.
    for (const s of sentinels) s.released = true
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('asks again on the next tap after Safari refused it outside a tap (D-072)', async () => {
    let allow = false
    const request = vi.fn(async () => {
      if (!allow) throw new Error('NotAllowedError')
      return { release: async () => undefined, released: false }
    })
    stubLock(request)
    const { result } = renderHook(() => useWakeLock(true))
    await waitFor(() => expect(result.current).toBe('refused'))
    allow = true
    await act(async () => {
      document.body.click()
    })
    await waitFor(() => expect(result.current).toBe('on'))
    expect(request).toHaveBeenCalledTimes(2)
    // Held: a later tap asks for nothing.
    await act(async () => {
      document.body.click()
    })
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('knows an iPhone and an iPad that reads as a Mac', () => {
    expect(isAppleMobile('Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X)', 5)).toBe(true)
    expect(isAppleMobile('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(true)
    expect(isAppleMobile('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe(false)
    expect(isAppleMobile('Mozilla/5.0 (Linux; Android 15)', 5)).toBe(false)
  })

  it('says so where the API is missing or refuses', async () => {
    const missing = renderHook(() => useWakeLock(true))
    await waitFor(() => expect(missing.result.current).toBe('unsupported'))
    stubLock(async () => {
      throw new Error('not allowed')
    })
    const refused = renderHook(() => useWakeLock(true))
    await waitFor(() => expect(refused.result.current).toBe('refused'))
  })
})
