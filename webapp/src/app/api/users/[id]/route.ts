import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { adminDb } from "@/db";
import { user } from "@/db/schema";
import { requireAdmin, isApiError } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// DELETE /api/users/:id — admin only
// Cascades to: sessions, accounts, memberships (all have onDelete: cascade)
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (isApiError(auth)) return auth.error;

  const { id } = await params;

  // Prevent self-deletion
  if (auth.session?.user.id === id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    );
  }

  const rows = await adminDb.select().from(user).where(eq(user.id, id)).limit(1);
  if (!rows[0]) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  await adminDb.delete(user).where(eq(user.id, id));

  return new NextResponse(null, { status: 204 });
}
