import {
  ExtensionClinicBookingsResponseSchema,
  type ExtensionClinicBookingsResponse,
} from "@acherons/contracts";
import * as v from "valibot";
import { APP_BASE } from "../config";

export type FetchExtensionClinicBookingsOk = {
  ok: true;
  data: ExtensionClinicBookingsResponse;
};

export type FetchExtensionClinicBookingsErr =
  | { ok: false; reason: "http"; status: number }
  | { ok: false; reason: "parse" };

/** GET `/api/extension/clinic/bookings` — Bearer extension access JWT. */
export async function fetchExtensionClinicBookings(
  accessToken: string,
): Promise<FetchExtensionClinicBookingsOk | FetchExtensionClinicBookingsErr> {
  let res: Response;
  try {
    res = await fetch(`${APP_BASE}/api/extension/clinic/bookings`, {
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
  const parsed = v.safeParse(ExtensionClinicBookingsResponseSchema, json);
  if (!parsed.success) {
    return { ok: false, reason: "parse" };
  }

  return { ok: true, data: parsed.output };
}
