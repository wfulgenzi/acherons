import {
  ExtensionClinicDashboardResponseSchema,
  type ExtensionClinicDashboardResponse,
} from "@acherons/contracts";
import * as v from "valibot";
import { APP_BASE } from "../config";

export type FetchExtensionClinicDashboardOk = {
  ok: true;
  data: ExtensionClinicDashboardResponse;
};

export type FetchExtensionClinicDashboardErr =
  | { ok: false; reason: "http"; status: number }
  | { ok: false; reason: "parse" };

/** GET `/api/extension/clinic/dashboard` — Bearer extension access JWT. */
export async function fetchExtensionClinicDashboard(
  accessToken: string,
): Promise<FetchExtensionClinicDashboardOk | FetchExtensionClinicDashboardErr> {
  let res: Response;
  try {
    res = await fetch(`${APP_BASE}/api/extension/clinic/dashboard`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    return { ok: false, reason: "http", status: 0 };
  }

  if (!res.ok) {
    return { ok: false, reason: "http", status: res.status };
  }

  const json: unknown = await res.json();
  const parsed = v.safeParse(ExtensionClinicDashboardResponseSchema, json);
  if (!parsed.success) {
    return { ok: false, reason: "parse" };
  }

  return { ok: true, data: parsed.output };
}
