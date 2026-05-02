import type { ExtensionWebPushRegisterResponse } from "@/shared/messages";
import { getBearerAccessToken } from "@/shared/session";
import { urlBase64ToUint8Array } from "./helpers";

export async function parsePushPayload(event: PushEvent): Promise<{
  title: string;
  body: string;
}> {
  const fallbackTitle = "Acherons";
  const fallbackBody = "You have a new notification.";
  if (!event.data) {
    return { title: fallbackTitle, body: fallbackBody };
  }
  try {
    const raw = await event.data.text();
    if (!raw || typeof raw !== "string") {
      return { title: fallbackTitle, body: fallbackBody };
    }
    try {
      const j = JSON.parse(raw) as unknown;
      if (j && typeof j === "object" && j !== null) {
        const o = j as Record<string, unknown>;
        let title = fallbackTitle;
        let body = fallbackBody;
        if (typeof o.title === "string" && o.title) title = o.title;
        if (typeof o.body === "string" && o.body) body = o.body;
        else if (typeof o.message === "string" && o.message)
          body = o.message;
        return { title, body };
      }
    } catch {
      /* not JSON */
    }
    return { title: fallbackTitle, body: raw.slice(0, 240) };
  } catch {
    return { title: fallbackTitle, body: fallbackBody };
  }
}

export async function handleWebPushRegister(
  registration: ServiceWorkerRegistration,
  baseUrl: string,
): Promise<ExtensionWebPushRegisterResponse> {
  const auth = await getBearerAccessToken();
  if (!auth.ok) {
    return { ok: false, error: auth.detail };
  }

  const vapidRes = await fetch(`${baseUrl}/api/extension/push-vapid`);
  if (!vapidRes.ok) {
    const t = await vapidRes.text();
    return {
      ok: false,
      error: `push-vapid ${vapidRes.status}: ${t.slice(0, 240)}`,
    };
  }
  const vapid = (await vapidRes.json()) as { publicKey: string };
  const applicationServerKey = urlBase64ToUint8Array(vapid.publicKey);

  const sub = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey as BufferSource,
  });

  const j = sub.toJSON();
  const body = JSON.stringify({
    endpoint: j.endpoint,
    keys: j.keys,
  });

  const post = await fetch(`${baseUrl}/api/extension/push-subscription`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body,
  });
  const text = await post.text();
  if (!post.ok) {
    return {
      ok: false,
      error: `push-subscription ${post.status}: ${text.slice(0, 320)}`,
    };
  }
  const data = JSON.parse(text) as { id: string };
  return { ok: true, id: data.id };
}
