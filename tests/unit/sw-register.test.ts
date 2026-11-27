import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetUpdaterForTests, setUpdateIdle, setWaitingForTests } from '@/lib/sw-register'

// D-075: a new version takes over by itself, but never while a session player is open.
function fakeWorker() {
  const postMessage = vi.fn()
  return { worker: { postMessage } as unknown as ServiceWorker, postMessage }
}

beforeEach(() => resetUpdaterForTests())

describe('the automatic update', () => {
  it('takes over at once when no session is open', () => {
    const { worker, postMessage } = fakeWorker()
    setWaitingForTests(worker)
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
  })

  it('waits while a session is open and takes over when it closes', () => {
    setUpdateIdle(false)
    const { worker, postMessage } = fakeWorker()
    setWaitingForTests(worker)
    expect(postMessage).not.toHaveBeenCalled()
    setUpdateIdle(false)
    expect(postMessage).not.toHaveBeenCalled()
    setUpdateIdle(true)
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
  })

  it('does nothing when no new version waits', () => {
    expect(() => setUpdateIdle(true)).not.toThrow()
  })
})
