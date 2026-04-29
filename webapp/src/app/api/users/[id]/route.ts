import { NextRequest, NextResponse } from "next/server";
import { adminDb, asAdminDb } from "@/db";
import { adminUsersRepo } from "@/db/repositories";
import { requireAdmin, isApiError } from "@/lib/api";

const adb = asAdminDb(adminDb);

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

  const u = await adminUsersRepo.findById(adb, id);
  if (!u) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  await adminUsersRepo.deleteById(adb, id);

  return new NextResponse(null, { status: 204 });
}
