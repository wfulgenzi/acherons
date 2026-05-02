import {
  ExtensionClinicProposalsResponseSchema,
  type ExtensionClinicProposalsResponse,
} from "@acherons/contracts";
import * as v from "valibot";
import { APP_BASE } from "../config";

export type FetchExtensionClinicProposalsOk = {
  ok: true;
  data: ExtensionClinicProposalsResponse;
};

export type FetchExtensionClinicProposalsErr =
  | { ok: false; reason: "http"; status: number }
  | { ok: false; reason: "parse" };

/** GET `/api/extension/clinic/proposals` — Bearer extension access JWT. */
export async function fetchExtensionClinicProposals(
  accessToken: string,
): Promise<FetchExtensionClinicProposalsOk | FetchExtensionClinicProposalsErr> {
  let res: Response;
  try {
    res = await fetch(`${APP_BASE}/api/extension/clinic/proposals`, {
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
  const parsed = v.safeParse(ExtensionClinicProposalsResponseSchema, json);
  if (!parsed.success) {
    return { ok: false, reason: "parse" };
  }

  return { ok: true, data: parsed.output };
}
