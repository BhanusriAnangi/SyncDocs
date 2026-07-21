import {
  getPendingOperations,
  getRetryableOperations,
  markSyncing,
  markSynced,
  markFailed,
  resetForRetry,
  getPendingCount,
} from "./queue";
import { getBackoffDelay } from "@/lib/utils";
import { SYNC_MAX_RETRIES, SYNC_POLL_INTERVAL } from "@/utils/constants";
import { useSyncStore } from "@/store/sync-store";
import type { SyncQueueEntry } from "./db";

/**
 * Background Sync Engine
 *
 * Core responsibilities:
 * 1. Monitor online/offline status
 * 2. Process pending operations when online
 * 3. Retry failed operations with exponential backoff + jitter
 * 4. Update UI sync status indicators
 * 5. Never lose user data — operations persist until confirmed synced
 *
 * Design: The engine runs as a polling loop (not WebSocket-dependent)
 * because it must work independently of the real-time collaboration layer.
 * This ensures offline edits sync even if the WebSocket server is down.
 */

let syncInterval: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;

/**
 * Process a single sync operation — send to server.
 */
async function processOperation(operation: SyncQueueEntry): Promise<boolean> {
  if (!operation.id) return false;

  try {
    await markSyncing(operation.id);

    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId: operation.documentId,
        clientId: getClientId(),
        operations: [
          {
            operationType: operation.operationType,
            content: operation.payload.content,
            title: operation.payload.title,
            yjsUpdate: operation.payload.yjsUpdate,
            timestamp: operation.createdAt,
          },
        ],
      }),
    });

    if (response.ok) {
      await markSynced(operation.id, operation.documentId);
      return true;
    }

    // Handle specific error codes
    if (response.status === 401) {
      // Auth expired — don't retry
      await markFailed(operation.id, "Authentication expired");
      return false;
    }

    if (response.status === 413) {
      // Payload too large — don't retry
      await markFailed(operation.id, "Payload too large");
      return false;
    }

    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    await markFailed(operation.id, errorData.error || `HTTP ${response.status}`);
    return false;
  } catch (error) {
    if (operation.id) {
      await markFailed(
        operation.id,
        error instanceof Error ? error.message : "Network error"
      );
    }
    return false;
  }
}

/**
 * Run one sync cycle — process all pending and retryable operations.
 */
async function runSyncCycle(): Promise<void> {
  if (isSyncing || !navigator.onLine) return;

  isSyncing = true;
  const store = useSyncStore.getState();

  try {
    // Get pending operations
    const pending = await getPendingOperations();
    const retryable = await getRetryableOperations(SYNC_MAX_RETRIES);

    // Reset retryable operations to PENDING
    for (const op of retryable) {
      if (op.id) {
        // Check if enough time has elapsed for backoff
        const delay = getBackoffDelay(op.retryCount);
        const elapsed = Date.now() - op.createdAt;
        if (elapsed >= delay) {
          await resetForRetry(op.id);
        }
      }
    }

    const allOps = [...pending, ...retryable.filter((op) => {
      const delay = getBackoffDelay(op.retryCount);
      return (Date.now() - op.createdAt) >= delay;
    })];

    if (allOps.length === 0) {
      store.setStatus("SYNCED");
      const count = await getPendingCount();
      store.setPendingCount(count);
      isSyncing = false;
      return;
    }

    store.setStatus("SYNCING");

    // Process operations sequentially to maintain order
    for (const op of allOps) {
      if (!navigator.onLine) break;
      await processOperation(op);
    }

    // Update status
    const remainingCount = await getPendingCount();
    store.setPendingCount(remainingCount);

    if (remainingCount === 0) {
      store.setStatus("SYNCED");
      store.setLastSyncedAt(new Date());
    } else {
      store.setStatus("PENDING");
    }
  } catch (error) {
    console.error("[SyncEngine] Cycle error:", error);
    store.setStatus("FAILED");
    store.setError(error instanceof Error ? error.message : "Sync failed");
  } finally {
    isSyncing = false;
  }
}

/**
 * Start the background sync engine.
 */
export function startSyncEngine(): void {
  if (syncInterval) return; // Already running

  // Run immediately
  runSyncCycle();

  // Then poll at regular intervals
  syncInterval = setInterval(runSyncCycle, SYNC_POLL_INTERVAL);

  // Listen for online/offline events
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
}

/**
 * Stop the background sync engine.
 */
export function stopSyncEngine(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  window.removeEventListener("online", handleOnline);
  window.removeEventListener("offline", handleOffline);
}

/**
 * Force an immediate sync cycle.
 */
export function forceSync(): void {
  runSyncCycle();
}

/**
 * Handle coming online — trigger immediate sync.
 */
function handleOnline(): void {
  const store = useSyncStore.getState();
  store.setIsOnline(true);
  // Immediate sync when connection restores
  runSyncCycle();
}

/**
 * Handle going offline — update status.
 */
function handleOffline(): void {
  const store = useSyncStore.getState();
  store.setIsOnline(false);
  store.setStatus("OFFLINE");
}

/**
 * Get or create a persistent client ID for this browser tab.
 * Used to identify the source of sync operations.
 */
function getClientId(): string {
  const key = "syncdocs_client_id";
  let clientId = sessionStorage.getItem(key);
  if (!clientId) {
    clientId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(key, clientId);
  }
  return clientId;
}
