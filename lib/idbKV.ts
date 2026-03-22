/**
 * 앱 전역 키-값 저장소 (IndexedDB).
 * 기존 localStorage 데이터는 최초 접근 시 이 DB로 옮기고 localStorage 항목은 제거합니다.
 */

const DB_NAME = 'my-character-chat-v1'
const STORE = 'kv'
const DB_VERSION = 1

let dbPromise: Promise<IDBDatabase> | null = null
let migrationPromise: Promise<void> | null = null

function openDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB를 사용할 수 없습니다.'))
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onerror = () => {
        dbPromise = null
        reject(req.error)
      }
      req.onsuccess = () => resolve(req.result)
      req.onupgradeneeded = (ev) => {
        const db = (ev.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE)
        }
      }
    })
  }
  return dbPromise
}

async function kvGetRaw(db: IDBDatabase, key: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const r = tx.objectStore(STORE).get(key)
    r.onerror = () => reject(r.error)
    r.onsuccess = () => resolve((r.result as string | undefined) ?? null)
  })
}

/** 첫 실행 시 localStorage의 모든 키를 IndexedDB로 복사한 뒤 해당 키들을 localStorage에서 삭제 */
async function runMigrationOnce(): Promise<void> {
  const db = await openDb()
  const already = await kvGetRaw(db, '__migrated_ls_v1')
  if (already === '1') return

  const keys: string[] = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)
    if (k) keys.push(k)
  }

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const st = tx.objectStore(STORE)
    for (const k of keys) {
      const v = window.localStorage.getItem(k)
      if (v !== null) st.put(v, k)
    }
    st.put('1', '__migrated_ls_v1')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })

  keys.forEach((k) => window.localStorage.removeItem(k))
}

export async function ensureMigratedFromLocalStorage(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!migrationPromise) {
    migrationPromise = runMigrationOnce().catch((e) => {
      migrationPromise = null
      console.error('[idbKV] 마이그레이션 실패', e)
      throw e
    })
  }
  await migrationPromise
}

export async function kvGet(key: string): Promise<string | null> {
  if (typeof window === 'undefined') return null
  await ensureMigratedFromLocalStorage()
  const db = await openDb()
  return kvGetRaw(db, key)
}

export async function kvSet(key: string, value: string): Promise<void> {
  if (typeof window === 'undefined') return
  await ensureMigratedFromLocalStorage()
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function kvRemove(key: string): Promise<void> {
  if (typeof window === 'undefined') return
  await ensureMigratedFromLocalStorage()
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}
