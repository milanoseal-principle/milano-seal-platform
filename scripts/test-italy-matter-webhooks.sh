#!/usr/bin/env bash
# Italy test matter — webhook simulation script
# Prerequisite: run scripts/007_italy_test_matter.sql in Supabase first.
#
# Usage:
#   BASE_URL=https://www.themilanoseal.com \
#   WISE_WEBHOOK_TEST_BYPASS=your_bypass_secret \
#   SHIPPO_WEBHOOK_SECRET=xxx \
#   BN_WEBHOOK_TOKEN=xxx \
#   bash scripts/test-italy-matter-webhooks.sh [--wise-only|--bluenotary-only|--shippo-only]
#
# IMPORTANT:
# - Wise self-signing is not supported. The bypass is non-production only.
# - Shippo uses the canonical /api/courier/webhook HMAC-SHA256 route.
# - Courier delivery never auto-authors final release or Matter completion.

set -euo pipefail

BASE_URL="${BASE_URL:-https://www.themilanoseal.com}"
WISE_BYPASS="${WISE_WEBHOOK_TEST_BYPASS:-}"
SHIPPO_SECRET="${SHIPPO_WEBHOOK_SECRET:-}"
BN_TOKEN="${BN_WEBHOOK_TOKEN:-}"

STEP="all"
for arg in "$@"; do
  case "$arg" in
    --wise-only) STEP="wise" ;;
    --bluenotary-only) STEP="bluenotary" ;;
    --shippo-only) STEP="shippo" ;;
  esac
done

MATTER_ID="f6000000-0000-0000-0000-000000000099"
WISE_REF="MS-ITALY-TEST-001"
BN_NOTARIZ_ID="BN-ITALY-TEST-001"
BN_SESSION_ID="BN-SID-ITALY-001"
TRACKING="MS-IT-DHL-000099"
CARRIER="dhl_express"

PASS=0
FAIL=0

check() {
  local label="$1" expected="$2" actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo "  ✓  $label"
    PASS=$((PASS+1))
  else
    echo "  ✗  $label"
    echo "     Expected : $expected"
    echo "     Got      : $(echo "$actual" | tr -d '\n' | head -c 200)"
    FAIL=$((FAIL+1))
  fi
}

check_code() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "  ✓  $label"
    PASS=$((PASS+1))
  else
    echo "  ✗  $label"
    echo "     Expected HTTP $expected — got $actual"
    FAIL=$((FAIL+1))
  fi
}

shippo_post() {
  local body="$1"
  local sig
  sig=$(printf '%s' "$body" | openssl dgst -sha256 -hmac "$SHIPPO_SECRET" | awk '{print $2}')
  curl -s -X POST "$BASE_URL/api/courier/webhook" \
    -H "Content-Type: application/json" \
    -H "X-Shippo-Signature-HMAC-SHA256-V2: $sig" \
    --data-raw "$body"
}

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  Milano Seal — Italy Test Matter Webhook Simulation"
echo "  Target : $BASE_URL"
echo "  Matter : $MATTER_ID"
echo "  Step   : $STEP"
echo "══════════════════════════════════════════════════════════"
echo ""

if [[ "$STEP" == "all" || "$STEP" == "wise" ]]; then
  echo "── Step 1: Wise transfers#state-change → outgoing_payment_sent ──────────"

  if [ -z "$WISE_BYPASS" ]; then
    echo "  ⚠  WISE_WEBHOOK_TEST_BYPASS is not set."
    echo "  Use Wise dashboard test delivery for production-signed evidence."
    FAIL=$((FAIL+1))
  else
    WISE_BODY='{
  "event_type": "transfers#state-change",
  "data": {
    "resource": {
      "id": 9900001,
      "type": "transfer",
      "currentState": "outgoing_payment_sent",
      "previousState": "processing",
      "reference": "'"$WISE_REF"'",
      "targetValue": 975.00,
      "targetCurrency": "USD",
      "sourceValue": 975.00,
      "sourceCurrency": "USD"
    },
    "occurred_at": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"
  }
}'

    R=$(curl -s -X POST "$BASE_URL/api/webhooks/wise" \
      -H "Content-Type: application/json" \
      -H "X-Delivery-Id: italy-test-wise-$(date +%s)" \
      -H "X-Test-Bypass: $WISE_BYPASS" \
      -d "$WISE_BODY")
    check "Wise event received" '"received":true' "$R"
    echo "  →  Financial truth must still be read from canonical Wise reconciliation."
  fi
  echo ""
fi

if [[ "$STEP" == "all" || "$STEP" == "bluenotary" ]]; then
  echo "── Step 2: BlueNotary session_completed ─────────────────────────────────"

  if [ -z "$BN_TOKEN" ]; then
    echo "  SKIP  BN_WEBHOOK_TOKEN not set"
    FAIL=$((FAIL+1))
  else
    BN_BODY='{
  "event": "session_completed",
  "notarization_id": "'"$BN_NOTARIZ_ID"'",
  "bn_session_id": "'"$BN_SESSION_ID"'",
  "status": "COMPLETED",
  "completed_at": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
  "signers": [{
    "email": "test+italy@test.milanoseal.local",
    "status": "COMPLETED",
    "identity_status": "PASSED",
    "kba_status": "PASSED"
  }]
}'
    R=$(curl -s -X POST "$BASE_URL/api/webhooks/bluenotary" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $BN_TOKEN" \
      -d "$BN_BODY")
    check "BlueNotary session_completed received" '"received":true' "$R"
  fi
  echo ""
fi

if [[ "$STEP" == "all" || "$STEP" == "shippo" ]]; then
  if [ -z "$SHIPPO_SECRET" ]; then
    echo "── Shippo steps skipped: SHIPPO_WEBHOOK_SECRET not set ─────────────────"
    FAIL=$((FAIL+1))
  else
    echo "── Step 3a: Shippo track_updated — TRANSIT ──────────────────────────────"
    SHIPPO_TRANSIT='{
  "event": "track_updated",
  "data": {
    "carrier": "'"$CARRIER"'",
    "tracking_number": "'"$TRACKING"'",
    "tracking_status": {
      "status": "TRANSIT",
      "status_date": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
      "status_details": "Package in transit — Frankfurt Gateway"
    }
  }
}'
    R=$(shippo_post "$SHIPPO_TRANSIT")
    check "Shippo TRANSIT received" '"received":true' "$R"

    echo "── Step 3b: Shippo track_updated — DELIVERED ────────────────────────────"
    SHIPPO_DELIVERED='{
  "event": "track_updated",
  "data": {
    "carrier": "'"$CARRIER"'",
    "tracking_number": "'"$TRACKING"'",
    "tracking_status": {
      "status": "DELIVERED",
      "status_date": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
      "status_details": "Delivered — Milan, Italy."
    }
  }
}'
    R=$(shippo_post "$SHIPPO_DELIVERED")
    check "Shippo DELIVERED received" '"received":true' "$R"
    echo "  →  Expected delivery_status: delivered"
    echo "  →  Matter release/completion must remain governed separately."
  fi
  echo ""
fi

echo "── Auth / retired-route guards ──────────────────────────────────────────"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/webhooks/wise" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"transfers#state-change"}')
check_code "Wise POST — no signature" "401" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/courier/webhook" \
  -H "Content-Type: application/json" \
  -d '{}')
check_code "Canonical Shippo POST — no HMAC" "401" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/webhooks/shippo" \
  -H "Content-Type: application/json" \
  -d '{}')
check_code "Retired duplicate Shippo route" "404" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/webhooks/bluenotary" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer WRONG_TOKEN" \
  -d '{"event":"session_completed","notarization_id":"smoke-guard"}')
check_code "BlueNotary POST — wrong token" "401" "$CODE"

echo ""
echo "══════════════════════════════════════════════════════════"
printf "  Results: %d passed · %d failed\n" "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then echo "  Status : FAIL"; else echo "  Status : PASS"; fi
echo "══════════════════════════════════════════════════════════"
echo ""
echo "  Verify current Matter truth in Supabase after the run."
echo "  Courier delivery is evidence only; final international release remains settlement-gated."
echo ""

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
