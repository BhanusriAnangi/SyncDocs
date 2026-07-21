import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getDocumentById,
  updateDocument,
  deleteDocument,
} from "@/server/services/document.service";
import { updateDocumentSchema } from "@/server/validators/document.schema";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/documents/[id]
 * Get a single document with full details.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const document = await getDocumentById(id, session.user.id);

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // Serialize yjsState as number array for JSON transport
    const serialized = {
      ...document,
      yjsState: document.yjsState
        ? Array.from(document.yjsState)
        : null,
    };

    return NextResponse.json({ success: true, data: serialized });
  } catch (error) {
    console.error("[GET /api/documents/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/documents/[id]
 * Update a document (title and/or content).
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Payload size check (5MB max)
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Payload too large" },
        { status: 413 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const document = await updateDocument(id, session.user.id, parsed.data);

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found or insufficient permissions" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: document });
  } catch (error) {
    console.error("[PATCH /api/documents/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/[id]
 * Soft-delete a document (OWNER only).
 */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const result = await deleteDocument(id, session.user.id);

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Document not found or insufficient permissions" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("[DELETE /api/documents/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
