import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isApiError } from "@/lib/api";
import { adminDeleteUserById } from "@/server/admin/queries/admin-users-queries";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// DELETE /api/users/:id — admin only
// Cascades to: sessions, accounts, memberships (all have onDelete: cascade)
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (isApiError(auth)) {
    return auth.error;
  }

  const { id } = await params;

  // Prevent self-deletion
  if (auth.session?.user.id === id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 },
    );
  }

  const outcome = await adminDeleteUserById(id);
  if (!outcome.ok) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
