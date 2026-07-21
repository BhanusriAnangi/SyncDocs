import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyAccess } from "@/server/services/document.service";
import { createVersionSchema } from "@/server/validators/document.schema";
import type { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/documents/[id]/versions
 * List all saved snapshots for a document.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const access = await verifyAccess(id, session.user.id);
    if (!access) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    const versions = await prisma.documentVersion.findMany({
      where: { documentId: id },
      include: {
        createdBy: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { version: "desc" },
    });

    const data = versions.map((v) => ({
      id: v.id,
      version: v.version,
      title: v.title,
      content: v.content as Record<string, unknown>,
      createdById: v.createdById,
      createdByName: v.createdBy.name,
      createdAt: v.createdAt,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[GET /api/documents/[id]/versions]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/documents/[id]/versions
 * Save a new document snapshot. Only OWNER or EDITOR can create versions.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const access = await verifyAccess(id, session.user.id, ["OWNER", "EDITOR"]);
    if (!access) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createVersionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Get current document content
    const document = await prisma.document.findUnique({
      where: { id },
      select: { content: true, yjsState: true },
    });

    if (!document || !document.content) {
      return NextResponse.json(
        { success: false, error: "Cannot create snapshot of empty document" },
        { status: 400 }
      );
    }

    // Determine next version number
    const maxVersion = await prisma.documentVersion.aggregate({
      where: { documentId: id },
      _max: { version: true },
    });
    const nextVersionNumber = (maxVersion._max.version ?? 0) + 1;

    const version = await prisma.documentVersion.create({
      data: {
        documentId: id,
        version: nextVersionNumber,
        title: parsed.data.title,
        content: document.content as Prisma.InputJsonValue,
        yjsState: document.yjsState,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        documentId: id,
        userId: session.user.id,
        action: "VERSION_CREATED",
        metadata: { version: version.version, title: version.title },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: version.id,
          version: version.version,
          title: version.title,
          content: version.content,
          createdById: version.createdById,
          createdByName: version.createdBy.name,
          createdAt: version.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/documents/[id]/versions]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
