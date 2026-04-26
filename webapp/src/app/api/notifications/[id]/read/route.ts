import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { withRLS } from "@/db/rls";
import {
  isAppApiAuthError,
  requireAppApiAuth,
} from "@/lib/resolve-app-api-auth.server";
import { notificationsRepo } from "@/db/repositories";

type RouteContext = { params: Promise<{ id: string }> };

const IdParam = v.object({
  id: v.pipe(v.string(), v.uuid()),
});

export async function POST(request: NextRequest, { params }: RouteContext) {
  const apiAuth = await requireAppApiAuth(request.headers);
  if (isAppApiAuthError(apiAuth)) {
    return apiAuth.error;
  }
  const { userId, membership } = apiAuth;

  const { id: rawId } = await params;
  const idParsed = v.safeParse(IdParam, { id: rawId });
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  const { id } = idParsed.output;

  const rows = await withRLS(
    { userId, orgId: membership.orgId },
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
