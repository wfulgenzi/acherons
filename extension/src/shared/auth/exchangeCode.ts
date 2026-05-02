import {
  ExtensionTokenResponseSchema,
  type ExtensionTokenResponse,
} from "@acherons/contracts";
import * as v from "valibot";
import { APP_BASE } from "../config";

/**
 * POST `/api/extension/exchange` — response validated with `@acherons/contracts`.
 */
export async function exchangeExtensionCode(
  code: string,
): Promise<
  | { ok: true; tokens: ExtensionTokenResponse }
  | { ok: false; detail: string }
> {
  let res: Response;
  try {
    res = await fetch(`${APP_BASE}/api/extension/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  } catch {
    return { ok: false, detail: "Network error during exchange." };
  }

  const text = await res.text();
  if (!res.ok) {
    return {
      ok: false,
      detail: text.slice(0, 400) || `Exchange failed (${res.status}).`,
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, detail: "Exchange returned invalid JSON." };
  }

  const parsed = v.safeParse(ExtensionTokenResponseSchema, json);
  if (!parsed.success) {
    return { ok: false, detail: "Exchange response did not match contract." };
  }

  return { ok: true, tokens: parsed.output };
}
