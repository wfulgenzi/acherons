/**
 * chrome.storage.local keys for Web Push onboarding.
 */

export const STORAGE_PUSH_REGISTERED = "acherons_push_registered_v1" as const;
export const STORAGE_PUSH_ONBOARDING_SNOOZE_UNTIL_MS =
  "acherons_push_onboarding_snooze_until_ms" as const;

export const PUSH_STATE_KEYS_CLEARED_ON_SIGN_OUT = [
  STORAGE_PUSH_REGISTERED,
  STORAGE_PUSH_ONBOARDING_SNOOZE_UNTIL_MS,
] as const;

export async function setPushRegisteredTrue(): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_PUSH_REGISTERED]: true });
}

export async function getPushOnboardingSnapshot(): Promise<{
  registered: boolean;
  snoozeUntilMs: number;
}> {
  const r = await chrome.storage.local.get([
    STORAGE_PUSH_REGISTERED,
    STORAGE_PUSH_ONBOARDING_SNOOZE_UNTIL_MS,
  ]);
  const rawSnooze = r[STORAGE_PUSH_ONBOARDING_SNOOZE_UNTIL_MS];
  return {
    registered: r[STORAGE_PUSH_REGISTERED] === true,
    snoozeUntilMs:
      typeof rawSnooze === "number" && Number.isFinite(rawSnooze)
        ? rawSnooze
        : 0,
  };
}

export async function snoozePushOnboarding(days = 7): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_PUSH_ONBOARDING_SNOOZE_UNTIL_MS]: Date.now() + days * 86_400_000,
  });
}
