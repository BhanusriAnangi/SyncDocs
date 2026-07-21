import Dexie, { type Table } from "dexie";

/**
 * Local IndexedDB schema using Dexie.js
 *
 * Architecture decision: The browser's IndexedDB is the PRIMARY source of truth.
 * All edits are written here FIRST, then synced to the server in the background.
 * This ensures zero network requests block the UI (local-first requirement).
 *
 * Tables:
 * 1. localDocuments — cached document data for offline access
 * 2. syncQueue — pending operations waiting to be synced to the server
 * 3. syncMetadata — sync timestamps and state vectors
 */

export interface LocalDocument {
  id: string;                      // Same as server document ID
  title: string;
  content: Record<string, unknown> | null;
  yjsState?: Uint8Array;           // Binary Yjs state for CRDT merge
  ownerId: string;
  userRole: string;
  lastModified: number;            // Timestamp of last local modification
  lastSynced: number | null;       // Timestamp of last successful sync
  isNew: boolean;                  // Created offline, not yet synced
}

export interface SyncQueueEntry {
  id?: number;                     // Auto-increment
  documentId: string;
  operationType: "CREATE" | "UPDATE" | "DELETE";
  payload: {
    title?: string;
    content?: Record<string, unknown> | null;
    yjsUpdate?: number[];          // Serialized Uint8Array
  };
  status: "PENDING" | "SYNCING" | "FAILED";
  retryCount: number;
  createdAt: number;               // Timestamp
  errorMessage?: string;
}

export interface SyncMetadata {
  key: string;                     // documentId or "global"
  lastSyncTimestamp: number;
  lastServerVersion?: number;
}

class SyncDocsDatabase extends Dexie {
  localDocuments!: Table<LocalDocument, string>;
  syncQueue!: Table<SyncQueueEntry, number>;
  syncMetadata!: Table<SyncMetadata, string>;

  constructor() {
    super("SyncDocsDB");

    this.version(1).stores({
      localDocuments: "id, ownerId, lastModified, lastSynced",
      syncQueue: "++id, documentId, status, createdAt",
      syncMetadata: "key",
    });
  }
}

/**
 * Singleton database instance.
 * Only instantiated in browser context (Dexie requires IndexedDB API).
 */
let dbInstance: SyncDocsDatabase | null = null;

export function getLocalDb(): SyncDocsDatabase {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is not available on the server");
  }
  if (!dbInstance) {
    dbInstance = new SyncDocsDatabase();
  }
  return dbInstance;
}

export type { SyncDocsDatabase };
