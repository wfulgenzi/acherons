import {
  ExtensionClinicRequestsResponseSchema,
  type ExtensionClinicRequestsResponse,
} from "@acherons/contracts";
import * as v from "valibot";
import { APP_BASE } from "../config";

export type FetchExtensionClinicRequestsOk = {
  ok: true;
  data: ExtensionClinicRequestsResponse;
};

export type FetchExtensionClinicRequestsErr =
  | { ok: false; reason: "http"; status: number }
  | { ok: false; reason: "parse" };

/** GET `/api/extension/clinic/requests` — Bearer extension access JWT. */
export async function fetchExtensionClinicRequests(
  accessToken: string,
): Promise<FetchExtensionClinicRequestsOk | FetchExtensionClinicRequestsErr> {
  let res: Response;
  try {
    res = await fetch(`${APP_BASE}/api/extension/clinic/requests`, {
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
  const parsed = v.safeParse(ExtensionClinicRequestsResponseSchema, json);
  if (!parsed.success) {
    return { ok: false, reason: "parse" };
  }

  return { ok: true, data: parsed.output };
}
