const DB_NAME = 'td_photos'
const STORE = 'photos'
let _db = null

function getDb() {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE)
    req.onsuccess = e => { _db = e.target.result; resolve(_db) }
    req.onerror = () => reject(req.error)
  })
}

export async function savePhoto(dataUrl) {
  const key = `idb:${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const db = await getDb()
  await new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(dataUrl, key)
    tx.oncomplete = res
    tx.onerror = () => rej(tx.error)
  })
  return key
}

export async function loadPhoto(key) {
  if (!key || !key.startsWith('idb:')) return key ?? null
  const db = await getDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

export function deletePhoto(key) {
  if (!key || !key.startsWith('idb:')) return
  getDb().then(db => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
  }).catch(() => {})
}
