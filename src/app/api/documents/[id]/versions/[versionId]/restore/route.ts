import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyAccess } from "@/server/services/document.service";
import type { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string; versionId: string }> };

/**
 * POST /api/documents/[id]/versions/[versionId]/restore
 *
 * Restores an older version.
 * Architecture requirement: Restoring creates a NEW version snapshot
 * and updates the current document state instead of mutating or deleting history.
 * Only OWNER can restore versions.
 */
export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id, versionId } = await context.params;

    // Only OWNER can restore versions
    const access = await verifyAccess(id, session.user.id, ["OWNER"]);
    if (!access) {
      return NextResponse.json(
        { success: false, error: "Only document owner can restore versions" },
        { status: 403 }
      );
    }

    // Target version to restore
    const targetVersion = await prisma.documentVersion.findUnique({
      where: { id: versionId },
    });

    if (!targetVersion || targetVersion.documentId !== id) {
      return NextResponse.json({ success: false, error: "Version not found" }, { status: 404 });
    }

    // Determine next version number
    const maxVersion = await prisma.documentVersion.aggregate({
      where: { documentId: id },
      _max: { version: true },
    });
    const nextVersionNumber = (maxVersion._max.version ?? 0) + 1;

    // Execute in transaction: update document + record new version snapshot
    const result = await prisma.$transaction(async (tx) => {
      // Update active document content
      const updatedDoc = await tx.document.update({
        where: { id },
        data: {
          content: targetVersion.content as Prisma.InputJsonValue,
          yjsState: targetVersion.yjsState,
          lastSyncedAt: new Date(),
        },
      });

      // Create new version snapshot marking the restoration event
      const newVersion = await tx.documentVersion.create({
        data: {
          documentId: id,
          version: nextVersionNumber,
          title: `Restored from v${targetVersion.version}: ${targetVersion.title}`,
          content: targetVersion.content as Prisma.InputJsonValue,
          yjsState: targetVersion.yjsState,
          createdById: session.user.id,
        },
      });

      // Audit log entry
      await tx.auditLog.create({
        data: {
          documentId: id,
          userId: session.user.id,
          action: "VERSION_RESTORED",
          metadata: {
            restoredFromVersion: targetVersion.version,
            newVersion: newVersion.version,
          },
        },
      });

      return { updatedDoc, newVersion };
    });

    return NextResponse.json({
      success: true,
      data: {
        document: {
          id: result.updatedDoc.id,
          title: result.updatedDoc.title,
          content: result.updatedDoc.content,
          updatedAt: result.updatedDoc.updatedAt,
        },
        restoredVersion: {
          id: result.newVersion.id,
          version: result.newVersion.version,
          title: result.newVersion.title,
        },
      },
    });
  } catch (error) {
    console.error("[POST restore version]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
