/**
 * Offline document editing for Phase 3.3.1 Mobile Experience
 * Uses IndexedDB to store documents locally for offline editing
 */

// IndexedDB configuration
const DB_NAME = 'vibe-university-offline'
const DB_VERSION = 1
const DOCS_STORE = 'documents'
const SYNC_QUEUE_STORE = 'sync-queue'

interface OfflineDocument {
  id: string
  type: 'doc' | 'sheet' | 'deck' | 'note'
  title: string
  content: any
  lastModified: number
  lastSynced?: number
  isDirty: boolean
}

interface SyncQueueItem {
  id: string
  documentId: string
  action: 'create' | 'update' | 'delete'
  timestamp: number
  data?: any
}

/**
 * Initialize IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create documents store
      if (!db.objectStoreNames.contains(DOCS_STORE)) {
        const docStore = db.createObjectStore(DOCS_STORE, { keyPath: 'id' })
        docStore.createIndex('type', 'type', { unique: false })
        docStore.createIndex('lastModified', 'lastModified', { unique: false })
        docStore.createIndex('isDirty', 'isDirty', { unique: false })
      }

      // Create sync queue store
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        const queueStore = db.createObjectStore(SYNC_QUEUE_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        })
        queueStore.createIndex('documentId', 'documentId', { unique: false })
        queueStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

/**
 * Save document offline
 */
export async function saveDocumentOffline(
  document: Omit<OfflineDocument, 'lastModified' | 'isDirty'>
): Promise<void> {
  const db = await initDB()

  const doc: OfflineDocument = {
    ...document,
    lastModified: Date.now(),
    isDirty: true,
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DOCS_STORE], 'readwrite')
    const store = transaction.objectStore(DOCS_STORE)
    const request = store.put(doc)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Get document from offline storage
 */
export async function getDocumentOffline(id: string): Promise<OfflineDocument | null> {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DOCS_STORE], 'readonly')
    const store = transaction.objectStore(DOCS_STORE)
    const request = store.get(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || null)
  })
}

/**
 * Get all offline documents
 */
export async function getAllDocumentsOffline(): Promise<OfflineDocument[]> {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DOCS_STORE], 'readonly')
    const store = transaction.objectStore(DOCS_STORE)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

/**
 * Delete document from offline storage
 */
export async function deleteDocumentOffline(id: string): Promise<void> {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DOCS_STORE], 'readwrite')
    const store = transaction.objectStore(DOCS_STORE)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Add to sync queue
 */
async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): Promise<void> {
  const db = await initDB()

  const queueItem: Omit<SyncQueueItem, 'id'> = {
    ...item,
    timestamp: Date.now(),
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite')
    const store = transaction.objectStore(SYNC_QUEUE_STORE)
    const request = store.add(queueItem)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Get sync queue
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SYNC_QUEUE_STORE], 'readonly')
    const store = transaction.objectStore(SYNC_QUEUE_STORE)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

/**
 * Clear sync queue
 */
export async function clearSyncQueue(): Promise<void> {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite')
    const store = transaction.objectStore(SYNC_QUEUE_STORE)
    const request = store.clear()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Sync offline changes to server
 */
export async function syncToServer(): Promise<{ synced: number; failed: number }> {
  if (!navigator.onLine) {
    return { synced: 0, failed: 0 }
  }

  const queue = await getSyncQueue()
  let synced = 0
  let failed = 0

  for (const item of queue) {
    try {
      // Make API call based on action
      let response: Response
      switch (item.action) {
        case 'create':
        case 'update':
          response = await fetch(`/api/files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
          })
          break
        case 'delete':
          response = await fetch(`/api/files?id=${item.documentId}`, {
            method: 'DELETE',
          })
          break
      }

      if (response.ok) {
        synced++
        // Mark document as clean by updating directly in DB
        const doc = await getDocumentOffline(item.documentId)
        if (doc) {
          const db = await initDB()
          const transaction = db.transaction([DOCS_STORE], 'readwrite')
          const store = transaction.objectStore(DOCS_STORE)
          store.put({
            ...doc,
            isDirty: false,
            lastSynced: Date.now(),
          })
        }
      } else {
        failed++
      }
    } catch (error) {
      console.error('Sync error:', error)
      failed++
    }
  }

  // Clear successfully synced items
  if (synced > 0) {
    await clearSyncQueue()
  }

  return { synced, failed }
}

/**
 * Check if offline mode is available
 */
export function isOfflineSupported(): boolean {
  return typeof indexedDB !== 'undefined'
}

/**
 * Get offline storage usage
 */
export async function getStorageUsage(): Promise<{
  usage: number
  quota: number
  percentage: number
} | null> {
  if (!navigator.storage || !navigator.storage.estimate) {
    return null
  }

  const estimate = await navigator.storage.estimate()
  const usage = estimate.usage || 0
  const quota = estimate.quota || 0
  const percentage = quota > 0 ? (usage / quota) * 100 : 0

  return { usage, quota, percentage }
}
