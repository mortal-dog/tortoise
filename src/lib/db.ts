// A small first-party IndexedDB wrapper (implementation §1): open with numbered migrations, typed get / put / query,
// and transactions. The stores are those of design §6.
import type { StoreName, Stores } from './records'

export const DB_NAME = 'tortoise'

export interface Migration {
  /** The database version this migration brings the database to. */
  version: number
  upgrade(db: IDBDatabase, tx: IDBTransaction): void
}

/** Version 1: the stores of design §6. Later schema changes append a migration and a fixture test. */
export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    upgrade(db) {
      db.createObjectStore('settings', { keyPath: 'key' })
      db.createObjectStore('days', { keyPath: 'date' })
      const logs = db.createObjectStore('logs', { keyPath: 'id' })
      logs.createIndex('date', 'date')
      logs.createIndex('ladderId', 'ladderId')
      db.createObjectStore('levels', { keyPath: 'ladderId' })
      db.createObjectStore('tests', { keyPath: 'date' })
      db.createObjectStore('overrides', { keyPath: 'monday' })
      db.createObjectStore('milestones', { keyPath: 'id' })
      db.createObjectStore('meta', { keyPath: 'key' })
    },
  },
]

export const SCHEMA_VERSION = MIGRATIONS.at(-1)?.version ?? 1

function promised<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onabort = () => reject(tx.error ?? new Error('transaction aborted'))
    tx.onerror = () => reject(tx.error)
  })
}

export interface OpenOptions {
  name?: string
  migrations?: readonly Migration[]
}

export class Db {
  constructor(readonly raw: IDBDatabase) {}

  get version(): number {
    return this.raw.version
  }

  async get<S extends StoreName>(store: S, key: IDBValidKey): Promise<Stores[S] | undefined> {
    const tx = this.raw.transaction(store, 'readonly')
    return (await promised(tx.objectStore(store).get(key))) as Stores[S] | undefined
  }

  async getAll<S extends StoreName>(store: S, range?: IDBKeyRange): Promise<Stores[S][]> {
    const tx = this.raw.transaction(store, 'readonly')
    return (await promised(tx.objectStore(store).getAll(range))) as Stores[S][]
  }

  async getAllByIndex<S extends StoreName>(
    store: S,
    index: string,
    range?: IDBKeyRange | IDBValidKey,
  ): Promise<Stores[S][]> {
    const tx = this.raw.transaction(store, 'readonly')
    return (await promised(tx.objectStore(store).index(index).getAll(range))) as Stores[S][]
  }

  async count(store: StoreName): Promise<number> {
    const tx = this.raw.transaction(store, 'readonly')
    return promised(tx.objectStore(store).count())
  }

  async put<S extends StoreName>(store: S, value: Stores[S]): Promise<void> {
    const tx = this.raw.transaction(store, 'readwrite')
    tx.objectStore(store).put(value)
    await done(tx)
  }

  async delete(store: StoreName, key: IDBValidKey): Promise<void> {
    const tx = this.raw.transaction(store, 'readwrite')
    tx.objectStore(store).delete(key)
    await done(tx)
  }

  /**
   * Runs fn inside one transaction over the given stores; it commits when fn's requests finish, or rolls back
   * everything if fn throws or a request fails.
   */
  async transaction<T>(
    stores: StoreName[],
    mode: IDBTransactionMode,
    fn: (tx: IDBTransaction) => T | Promise<T>,
  ): Promise<T> {
    const tx = this.raw.transaction(stores, mode)
    const finished = done(tx)
    try {
      const result = await fn(tx)
      await finished
      return result
    } catch (e) {
      try {
        tx.abort()
      } catch {
        // already finished
      }
      await finished.catch(() => undefined)
      throw e
    }
  }

  close(): void {
    this.raw.close()
  }
}

/** Opens (and if needed upgrades) the database, running each migration above the stored version in order. */
export function openDb(options: OpenOptions = {}): Promise<Db> {
  const name = options.name ?? DB_NAME
  const migrations = [...(options.migrations ?? MIGRATIONS)].sort((a, b) => a.version - b.version)
  const target = migrations.at(-1)?.version ?? 1
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, target)
    req.onupgradeneeded = (event) => {
      const db = req.result
      const tx = req.transaction
      if (!tx) return
      for (const m of migrations) {
        if (m.version > event.oldVersion && m.version <= target) m.upgrade(db, tx)
      }
    }
    req.onsuccess = () => {
      const db = req.result
      // Another tab opening a newer version asks this one to let go.
      db.onversionchange = () => db.close()
      resolve(new Db(db))
    }
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error('The database is open in another tab with an older version.'))
  })
}

/** Asks the browser to keep the data under storage pressure (design §2). Null when the API is missing. */
export async function requestPersistentStorage(): Promise<boolean | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return null
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}

export async function isStoragePersistent(): Promise<boolean | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persisted) return null
  return navigator.storage.persisted()
}

/** A promise for one request inside a transaction passed to Db.transaction. */
export const request = promised
