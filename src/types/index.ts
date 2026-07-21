import type { CollaboratorRole, SyncStatus, AuditAction } from "@prisma/client";

// ─── User Types ────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
}

// ─── Document Types ────────────────────────────────

export interface DocumentSummary {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  role: CollaboratorRole;
  updatedAt: Date;
  createdAt: Date;
  lastSyncedAt: Date | null;
  collaboratorCount: number;
}

export interface DocumentDetail {
  id: string;
  title: string;
  content: Record<string, unknown> | null;
  yjsState: Uint8Array | null;
  ownerId: string;
  owner: UserProfile;
  isDeleted: boolean;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  collaborators: CollaboratorInfo[];
  userRole: CollaboratorRole;
}

// ─── Collaborator Types ────────────────────────────

export interface CollaboratorInfo {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  role: CollaboratorRole;
  invitedAt: Date;
  acceptedAt: Date | null;
}

// ─── Version Types ─────────────────────────────────

export interface DocumentVersionInfo {
  id: string;
  version: number;
  title: string;
  content: Record<string, unknown>;
  createdById: string;
  createdByName: string;
  createdAt: Date;
}

// ─── Sync Types ────────────────────────────────────

export type SyncOperationType = "CREATE" | "UPDATE" | "DELETE";

export interface SyncOperation {
  id: string;
  documentId: string;
  clientId: string;
  operationType: SyncOperationType;
  content: Record<string, unknown> | null;
  title: string | null;
  yjsUpdate: Uint8Array | null;
  timestamp: number;
  status: SyncStatus;
  retryCount: number;
}

export interface SyncPayload {
  documentId: string;
  clientId: string;
  operations: Array<{
    operationType: SyncOperationType;
    content?: Record<string, unknown> | null;
    title?: string | null;
    yjsUpdate?: number[] | null; // Uint8Array serialized as number[]
    timestamp: number;
  }>;
}

export interface SyncResponse {
  success: boolean;
  syncedAt: string;
  serverState?: {
    content: Record<string, unknown> | null;
    title: string;
    yjsState: number[] | null;
    updatedAt: string;
  };
  conflicts?: Array<{
    operationIndex: number;
    message: string;
  }>;
}

// ─── AI Types ──────────────────────────────────────

export type AIAction =
  | "summarize"
  | "improve"
  | "title"
  | "grammar"
  | "translate"
  | "rewrite";

export interface AIRequest {
  action: AIAction;
  content: string;
  language?: string; // For translate
}

export interface AIResponse {
  result: string;
  action: AIAction;
}

// ─── API Types ─────────────────────────────────────

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Audit Types ───────────────────────────────────

export interface AuditLogEntry {
  id: string;
  documentId: string | null;
  userId: string;
  userName: string;
  action: AuditAction;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
