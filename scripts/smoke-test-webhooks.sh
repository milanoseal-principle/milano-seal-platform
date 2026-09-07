#!/usr/bin/env bash
# Webhook smoke tests — run against production
# Usage: BASE_URL=https://themilanoseal.com SHIPPO_WEBHOOK_SECRET=xxx bash scripts/smoke-test-webhooks.sh
set -euo pipefail

BASE_URL="${BASE_URL:-https://themilanoseal.com}"
SHIPPO_SECRET="${SHIPPO_WEBHOOK_SECRET:-}"

echo ""
echo "══════════════════════════════════════════════"
echo "  Milano Seal Webhook Smoke Tests"
echo "  Target: $BASE_URL"
echo "══════════════════════════════════════════════"
echo ""

PASS=0
FAIL=0

check() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo "  ✓  $label"
    PASS=$((PASS+1))
  else
    echo "  ✗  $label"
    echo "     Expected: $expected"
    echo "     Got:      $actual"
    FAIL=$((FAIL+1))
  fi
}

# ── 1. Wise GET health ────────────────────────────────────────────────────────
echo "1. Wise webhook health"
R=$(curl -s "$BASE_URL/api/webhooks/wise")
check "GET /api/webhooks/wise → {ok:true}" '"ok":true' "$R"

# ── 2. Wise POST — missing signature → 401 ───────────────────────────────────
echo "2. Wise POST without signature → 401"
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"event_type":"transfers#state-change"}' \
  "$BASE_URL/api/webhooks/wise")
check "401 on missing Wise signature" "401" "$R"

# ── 3. Canonical Shippo POST — missing HMAC → 401 ─────────────────────────────
echo "3. Canonical Shippo POST without HMAC → 401"
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{}' \
  "$BASE_URL/api/courier/webhook")
check "401 on missing Shippo HMAC" "401" "$R"

# ── 4. Canonical Shippo POST — valid HMAC smoke ───────────────────────────────
if [ -n "$SHIPPO_SECRET" ]; then
  echo "4. Canonical Shippo POST with valid HMAC → received"
  BODY='{"event":"track_updated","data":{"tracking_number":"SMOKETEST000","carrier":"usps","tracking_status":{"status":"UNKNOWN","status_date":"2026-01-01T00:00:00Z"}}}'
  SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SHIPPO_SECRET" | awk '{print $2}')
  R=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "X-Shippo-Signature-HMAC-SHA256-V2: $SIG" \
    --data-raw "$BODY" \
    "$BASE_URL/api/courier/webhook")
  check "received:true on canonical Shippo HMAC payload" '"received":true' "$R"
else
  echo "4. Shippo secret not set — skipping signed live test (set SHIPPO_WEBHOOK_SECRET)"
fi

# ── 5. Retired duplicate Shippo endpoint must stay gone ───────────────────────
echo "5. Retired duplicate Shippo endpoint → 404"
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{}' \
  "$BASE_URL/api/webhooks/shippo")
check "404 on retired Shippo route" "404" "$R"

# ── 6. BlueNotary GET health ──────────────────────────────────────────────────
echo "6. BlueNotary webhook health"
R=$(curl -s "$BASE_URL/api/webhooks/bluenotary")
check "GET /api/webhooks/bluenotary → {ok:true}" '"ok":true' "$R"

# ── 7. BlueNotary POST — wrong token → 401 ───────────────────────────────────
echo "7. BlueNotary POST — wrong Bearer → 401"
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer WRONG_TOKEN" \
  -d '{"event":"session_completed","notarization_id":"smoke-test-001"}' \
  "$BASE_URL/api/webhooks/bluenotary")
check "401 on wrong BlueNotary token" "401" "$R"

# ── 8. Public route 200 check ─────────────────────────────────────────────────
echo "8. Public routes"
for path in "/" "/intake" "/map" "/founder" "/apostille/italy/power-of-attorney"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")
  check "GET $path → 200" "200" "$CODE"
done

# ── 9. Protected routes redirect (not 500) ────────────────────────────────────
echo "9. Protected routes — expect redirect (3xx) not 500"
for path in "/dashboard" "/va/dashboard"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")
  if [[ "$CODE" == 3* ]] || [[ "$CODE" == "200" ]]; then
    echo "  ✓  GET $path → $CODE (not 500)"
    PASS=$((PASS+1))
  else
    echo "  ✗  GET $path → $CODE (expected 3xx or 200)"
    FAIL=$((FAIL+1))
  fi
done

echo ""
echo "══════════════════════════════════════════════"
echo "  Results: $PASS passed · $FAIL failed"
echo "══════════════════════════════════════════════"
echo ""

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
