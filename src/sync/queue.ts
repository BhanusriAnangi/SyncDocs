import { getLocalDb, type SyncQueueEntry, type LocalDocument } from "./db";

/**
 * Sync Queue Manager
 *
 * Implements the "Outbox Pattern" for offline-first sync:
 * 1. User edits → local save (IndexedDB) + queue entry (PENDING)
 * 2. Background engine processes queue → API call → mark SYNCED or FAILED
 * 3. Failed operations are retried with exponential backoff
 *
 * Security: The queue only stores operation metadata and content diffs,
 * never authentication tokens or secrets.
 */

/**
 * Save a document locally and enqueue a sync operation.
 */
export async function saveDocumentLocally(
  document: LocalDocument,
  isNewDocument: boolean = false
): Promise<void> {
  const db = getLocalDb();

  // Save to local documents table
  await db.localDocuments.put({
    ...document,
    lastModified: Date.now(),
    isNew: isNewDocument,
  });

  // Enqueue sync operation
  await db.syncQueue.add({
    documentId: document.id,
    operationType: isNewDocument ? "CREATE" : "UPDATE",
    payload: {
      title: document.title,
      content: document.content,
    },
    status: "PENDING",
    retryCount: 0,
    createdAt: Date.now(),
  });
}

/**
 * Get all pending operations from the sync queue, ordered by creation time.
 */
export async function getPendingOperations(): Promise<SyncQueueEntry[]> {
  const db = getLocalDb();
  return db.syncQueue
    .where("status")
    .equals("PENDING")
    .sortBy("createdAt");
}

/**
 * Get failed operations eligible for retry.
 */
export async function getRetryableOperations(
  maxRetries: number = 10
): Promise<SyncQueueEntry[]> {
  const db = getLocalDb();
  return db.syncQueue
    .where("status")
    .equals("FAILED")
    .filter((op) => op.retryCount < maxRetries)
    .sortBy("createdAt");
}

/**
 * Get the count of pending + failed operations.
 */
export async function getPendingCount(): Promise<number> {
  const db = getLocalDb();
  const pending = await db.syncQueue
    .where("status")
    .anyOf(["PENDING", "FAILED", "SYNCING"])
    .count();
  return pending;
}

/**
 * Mark an operation as syncing (in-progress).
 */
export async function markSyncing(id: number): Promise<void> {
  const db = getLocalDb();
  await db.syncQueue.update(id, { status: "SYNCING" });
}

/**
 * Mark an operation as successfully synced and remove from queue.
 */
export async function markSynced(id: number, documentId: string): Promise<void> {
  const db = getLocalDb();

  // Remove the synced operation from the queue
  await db.syncQueue.delete(id);

  // Update the local document's lastSynced timestamp
  await db.localDocuments.update(documentId, {
    lastSynced: Date.now(),
    isNew: false,
  });

  // Update sync metadata
  await db.syncMetadata.put({
    key: documentId,
    lastSyncTimestamp: Date.now(),
  });
}

/**
 * Mark an operation as failed with error message.
 */
export async function markFailed(
  id: number,
  errorMessage: string
): Promise<void> {
  const db = getLocalDb();
  const entry = await db.syncQueue.get(id);
  if (entry) {
    await db.syncQueue.update(id, {
      status: "FAILED",
      retryCount: entry.retryCount + 1,
      errorMessage,
    });
  }
}

/**
 * Reset a failed operation back to PENDING for retry.
 */
export async function resetForRetry(id: number): Promise<void> {
  const db = getLocalDb();
  await db.syncQueue.update(id, { status: "PENDING" });
}

/**
 * Clear all synced operations (cleanup).
 */
export async function clearSyncedOperations(): Promise<void> {
  const db = getLocalDb();
  // In case any slip through, clean up operations that were marked as something else
  const synced = await db.syncQueue.where("status").equals("SYNCED").toArray();
  const ids = synced.map((op) => op.id).filter((id): id is number => id !== undefined);
  await db.syncQueue.bulkDelete(ids);
}

/**
 * Get a local document from IndexedDB.
 */
export async function getLocalDocument(
  documentId: string
): Promise<LocalDocument | undefined> {
  const db = getLocalDb();
  return db.localDocuments.get(documentId);
}

/**
 * Get all local documents.
 */
export async function getAllLocalDocuments(): Promise<LocalDocument[]> {
  const db = getLocalDb();
  return db.localDocuments.orderBy("lastModified").reverse().toArray();
}

/**
 * Remove a local document and all its pending operations.
 */
export async function removeLocalDocument(documentId: string): Promise<void> {
  const db = getLocalDb();
  await db.localDocuments.delete(documentId);
  await db.syncQueue.where("documentId").equals(documentId).delete();
  await db.syncMetadata.delete(documentId);
}
