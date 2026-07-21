import { prisma } from "@/lib/prisma";
import type { Prisma, CollaboratorRole } from "@prisma/client";
import type { DocumentSummary, DocumentDetail } from "@/types";

/**
 * Server-side document service.
 * 
 * All queries are scoped to the authenticated user via:
 * 1. ownerId filter — user owns the document
 * 2. collaborators filter — user has a collaboration record
 * This prevents unauthorized access (tenant isolation via ORM scoping).
 */

/**
 * Get all documents accessible by a user (owned + collaborated).
 */
export async function getUserDocuments(userId: string): Promise<DocumentSummary[]> {
  const documents = await prisma.document.findMany({
    where: {
      isDeleted: false,
      OR: [
        { ownerId: userId },
        { collaborators: { some: { userId } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true } },
      collaborators: {
        where: { userId },
        select: { role: true },
      },
      _count: { select: { collaborators: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    ownerId: doc.ownerId,
    ownerName: doc.owner.name,
    role: doc.ownerId === userId
      ? "OWNER" as CollaboratorRole
      : doc.collaborators[0]?.role ?? ("VIEWER" as CollaboratorRole),
    updatedAt: doc.updatedAt,
    createdAt: doc.createdAt,
    lastSyncedAt: doc.lastSyncedAt,
    collaboratorCount: doc._count.collaborators,
  }));
}

/**
 * Get a single document with full details (content, collaborators).
 * Enforces access control — returns null if user has no access.
 */
export async function getDocumentById(
  documentId: string,
  userId: string
): Promise<DocumentDetail | null> {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      isDeleted: false,
      OR: [
        { ownerId: userId },
        { collaborators: { some: { userId } } },
      ],
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
      },
      collaborators: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      },
    },
  });

  if (!document) return null;

  const userRole: CollaboratorRole =
    document.ownerId === userId
      ? "OWNER"
      : document.collaborators.find((c) => c.userId === userId)?.role ?? "VIEWER";

  return {
    id: document.id,
    title: document.title,
    content: document.content as Record<string, unknown> | null,
    yjsState: document.yjsState ? new Uint8Array(document.yjsState) : null,
    ownerId: document.ownerId,
    owner: {
      id: document.owner.id,
      name: document.owner.name,
      email: document.owner.email,
      avatarUrl: document.owner.avatarUrl,
      createdAt: document.owner.createdAt,
    },
    isDeleted: document.isDeleted,
    lastSyncedAt: document.lastSyncedAt,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    collaborators: document.collaborators.map((c) => ({
      id: c.id,
      userId: c.userId,
      userName: c.user.name,
      userEmail: c.user.email,
      userAvatar: c.user.avatarUrl,
      role: c.role,
      invitedAt: c.invitedAt,
      acceptedAt: c.acceptedAt,
    })),
    userRole,
  };
}

/**
 * Create a new document.
 */
export async function createDocument(
  userId: string,
  title: string = "Untitled Document",
  content: Record<string, unknown> | null = null
) {
  const document = await prisma.document.create({
    data: {
      title,
      content: (content ?? undefined) as Prisma.InputJsonValue,
      ownerId: userId,
      // Also add owner as a collaborator with OWNER role
      collaborators: {
        create: {
          userId,
          role: "OWNER",
          acceptedAt: new Date(),
        },
      },
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      documentId: document.id,
      userId,
      action: "DOCUMENT_CREATED",
    },
  });

  return document;
}

/**
 * Update a document (title and/or content).
 * Enforces role: only OWNER or EDITOR can update.
 */
export async function updateDocument(
  documentId: string,
  userId: string,
  data: { title?: string; content?: Record<string, unknown> | null }
) {
  // Verify access with proper role
  const access = await verifyAccess(documentId, userId, ["OWNER", "EDITOR"]);
  if (!access) return null;

  const document = await prisma.document.update({
    where: { id: documentId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: (data.content ?? undefined) as Prisma.InputJsonValue }),
      lastSyncedAt: new Date(),
    },
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      documentId,
      userId,
      action: "DOCUMENT_UPDATED",
      metadata: { fields: Object.keys(data) },
    },
  });

  return document;
}

/**
 * Soft delete a document. Only OWNER can delete.
 */
export async function deleteDocument(documentId: string, userId: string) {
  const access = await verifyAccess(documentId, userId, ["OWNER"]);
  if (!access) return null;

  const document = await prisma.document.update({
    where: { id: documentId },
    data: { isDeleted: true },
  });

  await prisma.auditLog.create({
    data: {
      documentId,
      userId,
      action: "DOCUMENT_DELETED",
    },
  });

  return document;
}

/**
 * Check user's role for a document.
 * Returns the role if authorized, null otherwise.
 */
export async function verifyAccess(
  documentId: string,
  userId: string,
  allowedRoles: CollaboratorRole[] = ["OWNER", "EDITOR", "VIEWER"]
): Promise<CollaboratorRole | null> {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      isDeleted: false,
    },
    include: {
      collaborators: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  if (!document) return null;

  let role: CollaboratorRole;
  if (document.ownerId === userId) {
    role = "OWNER";
  } else if (document.collaborators.length > 0) {
    role = document.collaborators[0].role;
  } else {
    return null;
  }

  return allowedRoles.includes(role) ? role : null;
}
