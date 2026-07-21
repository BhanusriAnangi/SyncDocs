import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncPayloadSchema } from "@/server/validators/sync.schema";
import { verifyAccess } from "@/server/services/document.service";
import { MAX_SYNC_PAYLOAD_SIZE } from "@/utils/constants";

/**
 * POST /api/sync
 *
 * Server-side sync endpoint that:
 * 1. Validates the payload (Zod + size check)
 * 2. Verifies auth + role (Viewers cannot sync)
 * 3. Merges operations into the document
 * 4. Returns the latest server state
 *
 * Security considerations:
 * - Content-length check prevents OOM from large payloads
 * - Zod validation prevents malformed data
 * - Role check ensures Viewers cannot push updates
 * - Operations are processed in a transaction for atomicity
 */
export async function POST(request: Request) {
  try {
    // ─── Auth Check ───
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ─── Payload Size Check (prevent OOM) ───
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_SYNC_PAYLOAD_SIZE) {
      return NextResponse.json(
        { success: false, error: "Sync payload too large. Maximum 1MB." },
        { status: 413 }
      );
    }

    // ─── Parse and Validate ───
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const parsed = syncPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Sync payload validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { documentId, operations } = parsed.data;

    // ─── Role Check (Viewers cannot sync) ───
    const role = await verifyAccess(documentId, session.user.id, ["OWNER", "EDITOR"]);
    if (!role) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions. Viewers cannot sync." },
        { status: 403 }
      );
    }

    // ─── Process Operations ───
    const result = await prisma.$transaction(async (tx) => {
      const document = await tx.document.findUnique({
        where: { id: documentId },
        select: { id: true, title: true, content: true, yjsState: true, updatedAt: true },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      // Apply operations in order
      let latestTitle = document.title;
      let latestContent: unknown = document.content;

      for (const op of operations) {
        if (op.operationType === "UPDATE") {
          if (op.title) latestTitle = op.title;
          if (op.content !== undefined && op.content !== null) {
            latestContent = op.content;
          }
        }
      }

      // Update the document
      const updated = await tx.document.update({
        where: { id: documentId },
        data: {
          title: latestTitle,
          content: (latestContent ?? undefined) as Prisma.InputJsonValue,
          lastSyncedAt: new Date(),
        },
        select: {
          id: true,
          title: true,
          content: true,
          updatedAt: true,
        },
      });

      // Log the sync
      await tx.auditLog.create({
        data: {
          documentId,
          userId: session.user.id,
          action: "SYNC_COMPLETED",
          metadata: {
            operationCount: operations.length,
            clientId: parsed.data.clientId,
          },
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      serverState: {
        content: result.content as Record<string, unknown> | null,
        title: result.title,
        yjsState: null, // Will be populated when Yjs is integrated
        updatedAt: result.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[POST /api/sync]", error);

    if (error instanceof Error && error.message === "Document not found") {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Sync failed" },
      { status: 500 }
    );
  }
}
