#!/usr/bin/env bash
# E2E smoke: handoff (session) → exchange → refresh → bearer API → Web Push register.
#
# 1) Log in via the web app, then in DevTools → Application → Cookies for your
#    app origin, copy the full cookie *value* for the session, or the whole
#    "Cookie" header. User must have completed org onboarding (handoff 403s
#    without a membership).
#
# The /api/extension/push-subscription route does **not** use the session cookie; it
# only accepts `Authorization: Bearer` + the extension access JWT. This script
# uses your cookie only for the handoff step, then exercises push with the same
# access token you would use from the real extension. To retest push alone with
# a token you already have, use `scripts/curl-push-subscription.sh`.
#
# Usage (from webapp/):
#   export EXT_AUTH_COOKIE="better-auth.session_token=...;"   # or full header string
#   # optional: BASE_URL=https://yoursite.com
#   ./scripts/extension-auth-e2e.sh
#
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"
: "${EXT_AUTH_COOKIE:?Set EXT_AUTH_COOKIE to your Better Auth session cookie (see script header).}"

# First response line: "HTTP/1.1 200 OK" (reason phrase is not always present)
is_http_200() {
  [[ "$1" = *" 200 "* ]] || [[ "$1" = *" 200" ]]  # 200/200<end>
}

# Accept either "name=value" or a full Header: value line
COOKIE_H="$EXT_AUTH_COOKIE"
if [[ "$EXT_AUTH_COOKIE" == Cookie:* ]]; then
  COOKIE_H="${EXT_AUTH_COOKIE#Cookie: }"
fi

echo "==> POST $BASE_URL/api/extension/handoff (session)"
curl -sS -D /tmp/ea-handoff-hdr -o /tmp/ea-handoff-body \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE_H" \
  -X POST "$BASE_URL/api/extension/handoff" >/dev/null
STATUS=$(head -1 /tmp/ea-handoff-hdr | tr -d '\r')
if ! is_http_200 "$STATUS"; then
  echo "Handoff failed: $STATUS"
  cat /tmp/ea-handoff-body
  echo
  echo "If 403, ensure the user has an active organisation (complete onboarding)."
  echo "If 401, the cookie is missing or session expired — log in again and refresh EXT_AUTH_COOKIE."
  exit 1
fi
CODE=$(python3 -c "import json,sys; d=json.load(open('/tmp/ea-handoff-body')); print(d.get('code',''))")
if [ -z "$CODE" ]; then
  echo "No code in handoff body:"
  cat /tmp/ea-handoff-body
  exit 1
fi
echo "    got code (prefix): ${CODE:0:8}..."

echo "==> POST $BASE_URL/api/extension/exchange (no session)"
export __EA_CODE="$CODE"
EX_JSON=$(python3 -c "import json,os; print(json.dumps({'code':os.environ['__EA_CODE']}))")
curl -sS -D /tmp/ea-ex-hdr -o /tmp/ea-ex-body \
  -H "Content-Type: application/json" \
  -d "$EX_JSON" \
  -X POST "$BASE_URL/api/extension/exchange" >/dev/null
EX_STATUS=$(head -1 /tmp/ea-ex-hdr | tr -d '\r')
if ! is_http_200 "$EX_STATUS"; then
  echo "Exchange failed: $EX_STATUS"
  cat /tmp/ea-ex-body
  exit 1
fi
ACCESS=$(python3 -c "import json,sys; d=json.load(open('/tmp/ea-ex-body')); print(d['accessToken'])")
REFR=$(python3 -c "import json,sys; d=json.load(open('/tmp/ea-ex-body')); print(d['refreshToken'])")
echo "    accessToken (prefix): ${ACCESS:0:20}..."

echo "==> POST $BASE_URL/api/extension/refresh (refresh only)"
export __EA_REFRESH="$REFR"
RF_JSON=$(python3 -c "import json,os; print(json.dumps({'refreshToken':os.environ['__EA_REFRESH']}))")
curl -sS -D /tmp/ea-rf-hdr -o /tmp/ea-rf-body \
  -H "Content-Type: application/json" \
  -d "$RF_JSON" \
  -X POST "$BASE_URL/api/extension/refresh" >/dev/null
RE_STATUS=$(head -1 /tmp/ea-rf-hdr | tr -d '\r')
if ! is_http_200 "$RE_STATUS"; then
  echo "Refresh failed: $RE_STATUS"
  cat /tmp/ea-rf-body
  exit 1
fi
ACCESS2=$(python3 -c "import json,sys; d=json.load(open('/tmp/ea-rf-body')); print(d['accessToken'])")
REFR2=$(python3 -c "import json,sys; d=json.load(open('/tmp/ea-rf-body')); print(d['refreshToken'])")
echo "    new accessToken (prefix): ${ACCESS2:0:20}..."

echo "==> POST $BASE_URL/api/notifications/read-all (Authorization: Bearer)"
N=$(curl -sS -D /tmp/ea-bearer-hdr -o /tmp/ea-bearer-body \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS2" \
  -X POST "$BASE_URL/api/notifications/read-all")
B_STATUS=$(head -1 /tmp/ea-bearer-hdr | tr -d '\r')
if ! is_http_200 "$B_STATUS"; then
  echo "Bearer API failed: $B_STATUS"
  cat /tmp/ea-bearer-body
  exit 1
fi
echo "    $N"

# Same JWT as a real extension would use for API calls; server checks RLS on
# web_push_subscription + extension_client.
echo "==> POST $BASE_URL/api/extension/push-subscription (Authorization: Bearer)"
# Placeholder Web Push material — not a real PushManager subscription; only
# validates route + valibot + RLS. Replace with a real toJSON() payload when
# testing from a browser or MV3.
PUSH_JSON='{"endpoint":"https://fcm.googleapis.com/fcm/send/acherons-e2e-placeholder","keys":{"p256dh":"e2e-p256dh-placeholder","auth":"e2e-auth-placeholder"}}'
curl -sS -D /tmp/ea-push-hdr -o /tmp/ea-push-body \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS2" \
  -d "$PUSH_JSON" \
  -X POST "$BASE_URL/api/extension/push-subscription" >/dev/null
PUSH_STATUS=$(head -1 /tmp/ea-push-hdr | tr -d '\r')
if ! is_http_200 "$PUSH_STATUS"; then
  echo "push-subscription failed: $PUSH_STATUS"
  cat /tmp/ea-push-body
  echo
  echo "If 403, ensure you are using a fresh handoff+exchange (client must exist and not be revoked)."
  echo "If 403 on extension token, session-only auth is not accepted for this route (by design)."
  exit 1
fi
python3 -c "import json; d=json.load(open('/tmp/ea-push-body')); assert d.get('ok') and d.get('id'), d"
echo "    push id: $(python3 -c "import json; print(json.load(open('/tmp/ea-push-body'))['id'])")"

echo "==> OK — extension auth + push registration round-trip succeeded."
