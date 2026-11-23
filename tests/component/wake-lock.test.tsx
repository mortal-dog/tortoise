import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useWakeLock } from '@/lib/wake-lock'

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
    const request = vi.fn(async () => ({ release: async () => undefined }))
    stubLock(request)
    const { result } = renderHook(() => useWakeLock(true))
    await waitFor(() => expect(result.current).toBe('on'))
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(request).toHaveBeenCalledTimes(2)
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
