import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { getSession } from "@/lib/session";
import { getMembership } from "@/lib/membership";
import { withRLS } from "@/db/rls";
import { notificationsRepo } from "@/db/repositories";

type RouteContext = { params: Promise<{ id: string }> };

const IdParam = v.object({
  id: v.pipe(v.string(), v.uuid()),
});

export async function POST(_request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getMembership(session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: rawId } = await params;
  const idParsed = v.safeParse(IdParam, { id: rawId });
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  const { id } = idParsed.output;

  const rows = await withRLS(
    { userId: session.user.id, orgId: membership.orgId },
    (tx) => notificationsRepo.markReadByIdForOrg(tx, id, membership.orgId),
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const readAt = rows[0]!.readAt;
  return NextResponse.json({
    ok: true,
    readAt: readAt == null ? null : readAt.toISOString(),
  });
}
