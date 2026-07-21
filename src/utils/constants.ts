// ─── Application Constants ─────────────────────────

export const APP_NAME = "SyncDocs";
export const APP_DESCRIPTION =
  "A local-first collaborative document editor with offline synchronization, deterministic conflict resolution, and granular version control.";

// ─── Sync Engine Constants ─────────────────────────

/** Base delay for exponential backoff (ms) */
export const SYNC_BASE_DELAY = 1000;

/** Maximum delay cap for exponential backoff (ms) */
export const SYNC_MAX_DELAY = 30000;

/** Maximum number of retry attempts before marking as failed */
export const SYNC_MAX_RETRIES = 10;

/** How often to auto-save to IndexedDB (ms) */
export const AUTOSAVE_INTERVAL = 2000;

/** How often to attempt background sync (ms) */
export const SYNC_POLL_INTERVAL = 5000;

/** Maximum sync payload size in bytes (1MB) */
export const MAX_SYNC_PAYLOAD_SIZE = 1 * 1024 * 1024;

// ─── Document Constants ────────────────────────────

export const DEFAULT_DOCUMENT_TITLE = "Untitled Document";

export const MAX_TITLE_LENGTH = 255;

export const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB

// ─── Role Constants ────────────────────────────────

export const ROLES = {
  OWNER: "OWNER",
  EDITOR: "EDITOR",
  VIEWER: "VIEWER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// ─── Sync Status ───────────────────────────────────

export const SYNC_STATUS = {
  SYNCED: "SYNCED",
  PENDING: "PENDING",
  SYNCING: "SYNCING",
  FAILED: "FAILED",
  OFFLINE: "OFFLINE",
  CONFLICT: "CONFLICT",
} as const;

export type SyncStatusType = (typeof SYNC_STATUS)[keyof typeof SYNC_STATUS];

// ─── Routes ────────────────────────────────────────

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  DOCUMENT: (id: string) => `/documents/${id}`,
  API: {
    DOCUMENTS: "/api/documents",
    DOCUMENT: (id: string) => `/api/documents/${id}`,
    DOCUMENT_VERSIONS: (id: string) => `/api/documents/${id}/versions`,
    DOCUMENT_COLLABORATORS: (id: string) => `/api/documents/${id}/collaborators`,
    DOCUMENT_AI: (id: string) => `/api/documents/${id}/ai`,
    SYNC: "/api/sync",
  },
} as const;

// ─── Author Info ────────────────────────────────────
export const AUTHOR = {
  name: "Bhanu Sri",
  title: "Full Stack Developer | Shopify Developer",
  location: "Hyderabad",
  phone: "9390623903",
  email: "bhanuannagi1@gmail.com",
  portfolio: "https://personal-portfolio-latest-sooty.vercel.app/",
  github: "https://github.com/Bhanu-sri-12",
  linkedin: "https://www.linkedin.com/in/bhanu-sri-anangi-2963b3248",
} as const;
