import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getUserDocuments,
  createDocument,
} from "@/server/services/document.service";
import { createDocumentSchema } from "@/server/validators/document.schema";

/**
 * GET /api/documents
 * List all documents accessible by the authenticated user.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const documents = await getUserDocuments(session.user.id);

    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    console.error("[GET /api/documents]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents
 * Create a new document.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const document = await createDocument(
      session.user.id,
      parsed.data.title,
      parsed.data.content
    );

    return NextResponse.json(
      { success: true, data: document },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/documents]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
