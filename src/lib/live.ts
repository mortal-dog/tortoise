// A tiny change bus: writes call notifyChange(), and every useLive() query runs again. Enough for one user on one
// phone; no state library needed.
import { useEffect, useState } from 'react'

const listeners = new Set<(fromSync: boolean) => void>()
let version = 0

/**
 * Tells every screen to read again. `fromSync`: the write came from Google Drive (D-071), so it is not a change for
 * the sync to upload.
 */
export function notifyChange(fromSync = false): void {
  version++
  for (const l of listeners) l(fromSync)
}

/** Calls `listener` after every write; returns the unsubscribe. The Drive sync uses it (D-054, D-071). */
export function onChange(listener: (fromSync: boolean) => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useLive<T>(query: () => Promise<T>, deps: readonly unknown[]): T | undefined {
  const [state, setState] = useState<{ value: T } | undefined>(undefined)
  const [tick, setTick] = useState(version)
  useEffect(() => {
    const l = () => setTick(version)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  // biome-ignore lint/correctness/useExhaustiveDependencies: the caller lists the query's inputs in deps
  useEffect(() => {
    let alive = true
    query().then(
      (value) => {
        if (alive) setState({ value })
      },
      (error: unknown) => {
        console.error(error)
      },
    )
    return () => {
      alive = false
    }
  }, [tick, ...deps])
  return state?.value
}
