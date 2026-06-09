#!/usr/bin/env bash
# Italy test matter — webhook simulation script
# Prerequisite: run scripts/007_italy_test_matter.sql in Supabase first.
#
# Usage:
#   BASE_URL=https://www.themilanoseal.com \
#   WISE_WEBHOOK_SECRET=xxx \
#   SHIPPO_WEBHOOK_SECRET=xxx \
#   BN_WEBHOOK_TOKEN=xxx \
#   bash scripts/test-italy-matter-webhooks.sh
#
# Env vars:
#   BASE_URL              — target deployment (default: https://www.themilanoseal.com)
#   WISE_WEBHOOK_SECRET   — Wise webhook signing secret (HMAC-SHA256 key)
#   SHIPPO_WEBHOOK_SECRET — Shippo webhook secret query param
#   BN_WEBHOOK_TOKEN      — BlueNotary bearer token
#   STEP                  — run only one step: wise | bluenotary | shippo | all (default: all)
#
# Matter constants (must match 007_italy_test_matter.sql):
#   Matter ID       : f6000000-0000-0000-0000-000000000099
#   wise_reference  : MS-ITALY-TEST-001
#   notarization_id : BN-ITALY-TEST-001
#   bn_session_id   : BN-SID-ITALY-001
#   tracking_number : MS-IT-DHL-000099
#   carrier         : dhl_express

set -euo pipefail

BASE_URL="${BASE_URL:-https://www.themilanoseal.com}"
WISE_SECRET="${WISE_WEBHOOK_SECRET:-}"
SHIPPO_SECRET="${SHIPPO_WEBHOOK_SECRET:-}"
BN_TOKEN="${BN_WEBHOOK_TOKEN:-}"
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
  local label="$1"
  local expected="$2"
  local actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo "  ✓  $label"
    PASS=$((PASS+1))
  else
    echo "  ✗  $label"
    echo "     Expected : $expected"
    echo "     Got      : $(echo "$actual" | head -3)"
    FAIL=$((FAIL+1))
  fi
}

check_code() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "  ✓  $label"
    PASS=$((PASS+1))
  else
    echo "  ✗  $label"
    echo "     Expected HTTP $expected — got $actual"
    FAIL=$((FAIL+1))
  fi
}

sign_wise() {
  # Wise uses HMAC-SHA256 over the raw body with the webhook secret.
  local body="$1"
  echo -n "$body" | openssl dgst -sha256 -hmac "$WISE_SECRET" -binary | xxd -p | tr -d '\n'
}

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  Milano Seal — Italy Test Matter Webhook Simulation"
echo "  Target : $BASE_URL"
echo "  Matter : $MATTER_ID"
echo "══════════════════════════════════════════════════════════"
echo ""

# ── STEP 1: Wise payment confirmed ───────────────────────────────────────────

if [[ "$STEP" == "all" || "$STEP" == "wise" ]]; then
  echo "── Step 1: Wise transfers#state-change → outgoing_payment_sent ──────────"

  if [ -z "$WISE_SECRET" ]; then
    echo "  SKIP  WISE_WEBHOOK_SECRET not set — provide it to test Wise webhook"
  else
    WISE_BODY=$(cat <<EOF
{
  "event_type": "transfers#state-change",
  "data": {
    "resource": {
      "id": 9900001,
      "type": "transfer",
      "state": "outgoing_payment_sent",
      "reference": "$WISE_REF",
      "targetValue": 975.00,
      "targetCurrency": "USD",
      "sourceValue": 975.00,
      "sourceCurrency": "USD"
    }
  }
}
EOF
)
    SIG=$(sign_wise "$WISE_BODY")

    R=$(curl -s -X POST "$BASE_URL/api/webhooks/wise" \
      -H "Content-Type: application/json" \
      -H "X-Signature-SHA256: $SIG" \
      -d "$WISE_BODY")
    check "Wise payment_confirmed — received:true" '"received":true' "$R"

    echo "  →  Response: $(echo "$R" | head -1)"
    echo "  →  Expected deal status after: scheduled"
  fi
  echo ""
fi

# ── STEP 2: BlueNotary session_completed ─────────────────────────────────────

if [[ "$STEP" == "all" || "$STEP" == "bluenotary" ]]; then
  echo "── Step 2: BlueNotary session_completed ─────────────────────────────────"

  if [ -z "$BN_TOKEN" ]; then
    echo "  SKIP  BN_WEBHOOK_TOKEN not set — provide it to test BlueNotary webhook"
  else
    BN_BODY=$(cat <<EOF
{
  "event": "session_completed",
  "notarization_id": "$BN_NOTARIZ_ID",
  "bn_session_id": "$BN_SESSION_ID",
  "status": "COMPLETED",
  "completed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "signers": [
    {
      "email": "test+italy@test.milanoseal.local",
      "status": "COMPLETED",
      "identity_status": "PASSED",
      "kba_status": "PASSED"
    }
  ]
}
EOF
)
    R=$(curl -s -X POST "$BASE_URL/api/webhooks/bluenotary" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $BN_TOKEN" \
      -d "$BN_BODY")
    check "BlueNotary session_completed — received:true" '"received":true' "$R"

    echo "  →  Response: $(echo "$R" | head -1)"
    echo "  →  Expected deal status after: execution_complete or apostille_processing"
  fi
  echo ""
fi

# ── STEP 3: Shippo in_transit ─────────────────────────────────────────────────

if [[ "$STEP" == "all" || "$STEP" == "shippo" ]]; then
  echo "── Step 3: Shippo tracking_update — TRANSIT ─────────────────────────────"

  if [ -z "$SHIPPO_SECRET" ]; then
    echo "  SKIP  SHIPPO_WEBHOOK_SECRET not set — provide it to test Shippo webhook"
  else
    SHIPPO_BODY=$(cat <<EOF
{
  "event": "tracking_updated",
  "data": {
    "carrier": "$CARRIER",
    "tracking_number": "$TRACKING",
    "tracking_status": {
      "status": "TRANSIT",
      "sub_status": "package_in_transit",
      "status_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
      "status_details": "Package in transit — Frankfurt Gateway",
      "location": {
        "city": "Frankfurt",
        "country": "DE"
      }
    },
    "eta": "$(date -u -d '+3 days' +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v+3d +"%Y-%m-%dT%H:%M:%SZ")"
  }
}
EOF
)
    R=$(curl -s -X POST "$BASE_URL/api/webhooks/shippo?secret=$SHIPPO_SECRET" \
      -H "Content-Type: application/json" \
      -d "$SHIPPO_BODY")
    check "Shippo TRANSIT — received:true" '"received":true' "$R"

    echo "  →  Response: $(echo "$R" | head -1)"
    echo "  →  Expected deal status after: shipped"
  fi
  echo ""

  # ── STEP 3b: Shippo DELIVERED ─────────────────────────────────────────────
  echo "── Step 3b: Shippo tracking_update — DELIVERED ──────────────────────────"

  if [ -z "$SHIPPO_SECRET" ]; then
    echo "  SKIP  SHIPPO_WEBHOOK_SECRET not set"
  else
    SHIPPO_DELIVERED=$(cat <<EOF
{
  "event": "tracking_updated",
  "data": {
    "carrier": "$CARRIER",
    "tracking_number": "$TRACKING",
    "tracking_status": {
      "status": "DELIVERED",
      "sub_status": "delivered",
      "status_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
      "status_details": "Delivered — Milano, Italy. Signed by: STUDIO LEGALE TEST.",
      "location": {
        "city": "Milan",
        "country": "IT"
      }
    }
  }
}
EOF
)
    R=$(curl -s -X POST "$BASE_URL/api/webhooks/shippo?secret=$SHIPPO_SECRET" \
      -H "Content-Type: application/json" \
      -d "$SHIPPO_DELIVERED")
    check "Shippo DELIVERED — received:true" '"received":true' "$R"

    echo "  →  Response: $(echo "$R" | head -1)"
    echo "  →  Expected deal status after: delivered / completed"
  fi
  echo ""
fi

# ── STEP 4: Auth guards ───────────────────────────────────────────────────────

echo "── Step 4: Auth guard checks ────────────────────────────────────────────"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/webhooks/wise" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"transfers#state-change"}')
check_code "Wise POST without signature → 401" "401" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/webhooks/shippo?secret=WRONG" \
  -H "Content-Type: application/json" \
  -d '{"event":"tracking_updated"}')
check_code "Shippo POST with wrong secret → 401" "401" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/webhooks/bluenotary" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer WRONG_TOKEN" \
  -d '{"event":"session_completed","notarization_id":"smoke-test"}')
check_code "BlueNotary POST with wrong token → 401" "401" "$CODE"

echo ""

# ── SUMMARY ───────────────────────────────────────────────────────────────────

echo "══════════════════════════════════════════════════════════"
echo "  Results: $PASS passed · $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  echo "  Status : FAIL"
else
  echo "  Status : PASS"
fi
echo "══════════════════════════════════════════════════════════"
echo ""
echo "  Next: verify deal $MATTER_ID status in Supabase dashboard"
echo "  Expected final status: completed | is_paid_and_released: false"
echo "  (release requires operator action — not automated)"
echo ""

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
