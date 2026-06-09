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
# Env vars:
#   BASE_URL                  — target deployment (default: https://www.themilanoseal.com)
#   WISE_WEBHOOK_TEST_BYPASS  — must match WISE_WEBHOOK_TEST_BYPASS in Vercel env (non-production only)
#   SHIPPO_WEBHOOK_SECRET     — Shippo webhook secret query param
#   BN_WEBHOOK_TOKEN          — BlueNotary bearer token
#
# IMPORTANT — Wise signatures:
#   Wise uses RSA-SHA256. Self-signed requests cannot pass Wise's real signature check.
#   In production, use the Wise dashboard "Send test notification" to fire a properly signed event.
#   For integration testing on non-production deployments, set WISE_WEBHOOK_TEST_BYPASS
#   in Vercel env (WISE_ENV must NOT be "production") to enable the bypass header path.
#
# Matter constants (match 007_italy_test_matter.sql):
#   Matter ID       : f6000000-0000-0000-0000-000000000099
#   wise_reference  : MS-ITALY-TEST-001
#   notarization_id : BN-ITALY-TEST-001
#   bn_session_id   : BN-SID-ITALY-001
#   tracking_number : MS-IT-DHL-000099
#   carrier         : dhl_express

set -euo pipefail

BASE_URL="${BASE_URL:-https://www.themilanoseal.com}"
WISE_BYPASS="${WISE_WEBHOOK_TEST_BYPASS:-}"
SHIPPO_SECRET="${SHIPPO_WEBHOOK_SECRET:-}"
BN_TOKEN="${BN_WEBHOOK_TOKEN:-}"

# Parse flag
STEP="all"
for arg in "$@"; do
  case "$arg" in
    --wise-only)        STEP="wise" ;;
    --bluenotary-only)  STEP="bluenotary" ;;
    --shippo-only)      STEP="shippo" ;;
  esac
done
# Also support STEP env var
STEP="${STEP:-all}"

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

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  Milano Seal — Italy Test Matter Webhook Simulation"
echo "  Target : $BASE_URL"
echo "  Matter : $MATTER_ID"
echo "  Step   : $STEP"
echo "══════════════════════════════════════════════════════════"
echo ""

# ── STEP 1: Wise payment confirmed ───────────────────────────────────────────

if [[ "$STEP" == "all" || "$STEP" == "wise" ]]; then
  echo "── Step 1: Wise transfers#state-change → outgoing_payment_sent ──────────"

  if [ -z "$WISE_BYPASS" ]; then
    echo ""
    echo "  ⚠  WISE_WEBHOOK_TEST_BYPASS is not set."
    echo ""
    echo "  Wise webhooks use RSA-SHA256 — they cannot be self-signed."
    echo "  To test via this script, add WISE_WEBHOOK_TEST_BYPASS=<secret>"
    echo "  to your Vercel environment (non-production only) and re-run."
    echo ""
    echo "  Alternative: use the Wise dashboard to send a test notification:"
    echo "    1. Log in to Wise → Settings → Webhook subscriptions"
    echo "    2. Select your subscription → Send test notification"
    echo "    3. Wise will sign and deliver the event to $BASE_URL/api/webhooks/wise"
    echo "    4. Set the reference in the test payload to: $WISE_REF"
    echo ""
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
    check "Wise payment_confirmed — received:true" '"received":true' "$R"
    echo "  →  Full response: $R"
    echo "  →  Expected deal status after: scheduled"
  fi
  echo ""
fi

# ── STEP 2: BlueNotary session_completed ─────────────────────────────────────

if [[ "$STEP" == "all" || "$STEP" == "bluenotary" ]]; then
  echo "── Step 2: BlueNotary session_completed ─────────────────────────────────"

  if [ -z "$BN_TOKEN" ]; then
    echo "  SKIP  BN_WEBHOOK_TOKEN not set — provide it to test BlueNotary webhook"
    FAIL=$((FAIL+1))
  else
    BN_BODY='{
  "event": "session_completed",
  "notarization_id": "'"$BN_NOTARIZ_ID"'",
  "bn_session_id": "'"$BN_SESSION_ID"'",
  "status": "COMPLETED",
  "completed_at": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
  "signers": [
    {
      "email": "test+italy@test.milanoseal.local",
      "status": "COMPLETED",
      "identity_status": "PASSED",
      "kba_status": "PASSED"
    }
  ]
}'
    R=$(curl -s -X POST "$BASE_URL/api/webhooks/bluenotary" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $BN_TOKEN" \
      -d "$BN_BODY")
    check "BlueNotary session_completed — received:true" '"received":true' "$R"
    echo "  →  Full response: $R"
    echo "  →  Expected deal status after: execution_complete"
  fi
  echo ""
fi

# ── STEP 3: Shippo TRANSIT ────────────────────────────────────────────────────

if [[ "$STEP" == "all" || "$STEP" == "shippo" ]]; then
  echo "── Step 3a: Shippo tracking_update — TRANSIT ────────────────────────────"

  if [ -z "$SHIPPO_SECRET" ]; then
    echo "  SKIP  SHIPPO_WEBHOOK_SECRET not set"
    FAIL=$((FAIL+1))
  else
    SHIPPO_TRANSIT='{
  "event": "tracking_updated",
  "data": {
    "carrier": "'"$CARRIER"'",
    "tracking_number": "'"$TRACKING"'",
    "tracking_status": {
      "status": "TRANSIT",
      "sub_status": "package_in_transit",
      "status_date": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
      "status_details": "Package in transit — Frankfurt Gateway",
      "location": { "city": "Frankfurt", "country": "DE" }
    }
  }
}'
    R=$(curl -s -X POST "$BASE_URL/api/webhooks/shippo?secret=$SHIPPO_SECRET" \
      -H "Content-Type: application/json" \
      -d "$SHIPPO_TRANSIT")
    check "Shippo TRANSIT — received:true" '"received":true' "$R"
    echo "  →  Full response: $R"
  fi
  echo ""

  echo "── Step 3b: Shippo tracking_update — DELIVERED ──────────────────────────"

  if [ -z "$SHIPPO_SECRET" ]; then
    echo "  SKIP  SHIPPO_WEBHOOK_SECRET not set"
  else
    ETA_DATE=$(date -u -d '+3 days' +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v+3d +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || echo "2026-06-13T12:00:00Z")
    SHIPPO_DELIVERED='{
  "event": "tracking_updated",
  "data": {
    "carrier": "'"$CARRIER"'",
    "tracking_number": "'"$TRACKING"'",
    "tracking_status": {
      "status": "DELIVERED",
      "sub_status": "delivered",
      "status_date": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
      "status_details": "Delivered — Milan, Italy. Signed by: STUDIO LEGALE TEST.",
      "location": { "city": "Milan", "country": "IT" }
    }
  }
}'
    R=$(curl -s -X POST "$BASE_URL/api/webhooks/shippo?secret=$SHIPPO_SECRET" \
      -H "Content-Type: application/json" \
      -d "$SHIPPO_DELIVERED")
    check "Shippo DELIVERED — received:true" '"received":true' "$R"
    echo "  →  Full response: $R"
    echo "  →  Expected deal status after: delivered / completed"
  fi
  echo ""
fi

# ── Auth guard checks ─────────────────────────────────────────────────────────

echo "── Auth guard checks ────────────────────────────────────────────────────"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/webhooks/wise" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"transfers#state-change"}')
check_code "Wise POST — no signature → 401" "401" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/webhooks/shippo?secret=WRONG" \
  -H "Content-Type: application/json" \
  -d '{"event":"tracking_updated"}')
check_code "Shippo POST — wrong secret → 401" "401" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/webhooks/bluenotary" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer WRONG_TOKEN" \
  -d '{"event":"session_completed","notarization_id":"smoke-guard"}')
check_code "BlueNotary POST — wrong token → 401" "401" "$CODE"

echo ""

# ── Summary ───────────────────────────────────────────────────────────────────

echo "══════════════════════════════════════════════════════════"
printf "  Results: %d passed · %d failed\n" "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then
  echo "  Status : FAIL"
else
  echo "  Status : PASS"
fi
echo "══════════════════════════════════════════════════════════"
echo ""
echo "  After running Wise step — verify in Supabase:"
echo "    SELECT id, status, payment_status, wise_reference"
echo "    FROM deals WHERE id = '$MATTER_ID';"
echo ""
echo "  After running all steps — verify custody ledger:"
echo "    SELECT event, notes, created_at FROM custody_ledger"
echo "    WHERE deal_id = '$MATTER_ID' ORDER BY created_at DESC LIMIT 20;"
echo ""

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
