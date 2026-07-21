import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyAccess } from "@/server/services/document.service";
import { addCollaboratorSchema } from "@/server/validators/document.schema";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/documents/[id]/collaborators
 * List all collaborators for a document.
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
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const collaborators = await prisma.collaborator.findMany({
      where: { documentId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { invitedAt: "asc" },
    });

    const data = collaborators.map((c) => ({
      id: c.id,
      userId: c.userId,
      userName: c.user.name,
      userEmail: c.user.email,
      userAvatar: c.user.avatarUrl,
      role: c.role,
      invitedAt: c.invitedAt,
      acceptedAt: c.acceptedAt,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[GET /api/documents/[id]/collaborators]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/documents/[id]/collaborators
 * Add a collaborator by email. Only OWNER can invite.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Only OWNER can add collaborators
    const access = await verifyAccess(id, session.user.id, ["OWNER"]);
    if (!access) {
      return NextResponse.json(
        { success: false, error: "Only the document owner can add collaborators" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = addCollaboratorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, role } = parsed.data;

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found with this email" },
        { status: 404 }
      );
    }

    // Can't add yourself
    if (targetUser.id === session.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot add yourself as a collaborator" },
        { status: 400 }
      );
    }

    // Check if already a collaborator
    const existing = await prisma.collaborator.findUnique({
      where: { documentId_userId: { documentId: id, userId: targetUser.id } },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "User is already a collaborator" },
        { status: 409 }
      );
    }

    const collaborator = await prisma.collaborator.create({
      data: {
        documentId: id,
        userId: targetUser.id,
        role,
        acceptedAt: new Date(), // Auto-accept for now
      },
    });

    await prisma.auditLog.create({
      data: {
        documentId: id,
        userId: session.user.id,
        action: "COLLABORATOR_ADDED",
        metadata: { targetUserId: targetUser.id, role },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: collaborator.id,
          userId: targetUser.id,
          userName: targetUser.name,
          userEmail: targetUser.email,
          role: collaborator.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/documents/[id]/collaborators]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/documents/[id]/collaborators
 * Remove a collaborator. Only OWNER can remove.
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const access = await verifyAccess(id, session.user.id, ["OWNER"]);
    if (!access) {
      return NextResponse.json({ success: false, error: "Only the owner can remove collaborators" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const collaboratorId = searchParams.get("collaboratorId");

    if (!collaboratorId) {
      return NextResponse.json({ success: false, error: "collaboratorId is required" }, { status: 400 });
    }

    // Can't remove the owner
    const collab = await prisma.collaborator.findUnique({
      where: { id: collaboratorId },
    });

    if (!collab || collab.documentId !== id) {
      return NextResponse.json({ success: false, error: "Collaborator not found" }, { status: 404 });
    }

    if (collab.role === "OWNER") {
      return NextResponse.json({ success: false, error: "Cannot remove the document owner" }, { status: 400 });
    }

    await prisma.collaborator.delete({ where: { id: collaboratorId } });

    await prisma.auditLog.create({
      data: {
        documentId: id,
        userId: session.user.id,
        action: "COLLABORATOR_REMOVED",
        metadata: { removedUserId: collab.userId },
      },
    });

    return NextResponse.json({ success: true, data: { id: collaboratorId } });
  } catch (error) {
    console.error("[DELETE /api/documents/[id]/collaborators]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
