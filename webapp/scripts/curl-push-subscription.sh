#!/usr/bin/env bash
# Test POST /api/extension/push-subscription with an extension access JWT.
#
# This route does not accept a session cookie — only `Authorization: Bearer` and
# the same membership rules as other app APIs. Use a token from
# /api/extension/exchange or a refresh, or re-run the full
# `scripts/extension-auth-e2e.sh` (cookie is only for handoff there).
#
# Usage (from webapp/):
#   export EXT_AUTH_ACCESS_JWT="eyJhbGciOi..."
#   # optional: BASE_URL=https://...  PUSH_JSON='{"endpoint":"...","keys":{...}}'
#   ./scripts/curl-push-subscription.sh
#
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"
: "${EXT_AUTH_ACCESS_JWT:?Set EXT_AUTH_ACCESS_JWT to a valid extension access JWT.}"

# Default: fake-but-valid shape. Override to paste a real PushManager#toJSON().
_DEFAULT_PUSH='{"endpoint":"https://fcm.googleapis.com/fcm/send/acherons-manual-test","keys":{"p256dh":"manual-p256dh","auth":"manual-auth"}}'
PUSH_JSON="${PUSH_JSON:-$_DEFAULT_PUSH}"

echo "==> POST $BASE_URL/api/extension/push-subscription"
echo "$PUSH_JSON" | curl -sS -D /tmp/cps-hdr -o /tmp/cps-body \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EXT_AUTH_ACCESS_JWT" \
  -X POST --data-binary @- "$BASE_URL/api/extension/push-subscription"
STATUS=$(head -1 /tmp/cps-hdr | tr -d '\r')
body=$(cat /tmp/cps-body)
if ! [[ "$STATUS" = *" 200 "* || "$STATUS" = *" 200" ]]; then
  echo "Request failed: $STATUS"
  echo "$body"
  echo
  echo "If 401/403, generate a new token (handoff+exchange) or use a non-revoked client."
  echo "If 500, check server logs and that migration 0010 (RLS) is applied."
  exit 1
fi
echo "$body"
if command -v python3 >/dev/null 2>&1; then
  python3 -c "import json,sys; d=json.load(open('/tmp/cps-body')); assert d.get('ok') and d.get('id'), d; print('OK: registered id =', d['id'])"
else
  echo "OK (200)"
fi
