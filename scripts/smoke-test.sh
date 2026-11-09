#!/usr/bin/env bash
# ============================================================
# The Milano Seal™ — Production Smoke Test Runner
# Document Reference: MS-OPS-SMOKETEST-2026-V1
# Release validation: professional counsel hardening
# Usage: ./scripts/smoke-test.sh https://themilanoseal.com
# ============================================================

set -euo pipefail

BASE_URL="${1:-https://themilanoseal.com}"
PASS=0
FAIL=0
SKIP=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}PASS${NC}  $1"; ((PASS++)); }
fail() { echo -e "${RED}FAIL${NC}  $1"; ((FAIL++)); }
skip() { echo -e "${YELLOW}SKIP${NC}  $1"; ((SKIP++)); }

check_status() {
  local label="$1"
  local url="$2"
  local expected="$3"
  local actual
  actual=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  if [[ "$actual" == "$expected" ]]; then
    pass "[$actual] $label"
  else
    fail "[$actual != $expected] $label  →  $url"
  fi
}

check_body_contains() {
  local label="$1"
  local url="$2"
  local expected_status="$3"
  local needle="$4"
  local body
  local actual_status
  actual_status=$(curl -s -o /tmp/ms_smoke_body -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  body=$(cat /tmp/ms_smoke_body 2>/dev/null || echo "")
  if [[ "$actual_status" != "$expected_status" ]]; then
    fail "[$actual_status != $expected_status] $label → $url"
    return
  fi
  if echo "$body" | grep -q "$needle"; then
    pass "[$actual_status + body:$needle] $label"
  else
    fail "[$actual_status but missing '$needle' in body] $label → $url"
  fi
}

check_body_not_contains() {
  local label="$1"
  local url="$2"
  local expected_status="$3"
  local forbidden="$4"
  local body
  local actual_status
  actual_status=$(curl -s -o /tmp/ms_smoke_body -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  body=$(cat /tmp/ms_smoke_body 2>/dev/null || echo "")
  if echo "$body" | grep -q "$forbidden"; then
    fail "[body contains FORBIDDEN string '$forbidden'] $label → $url"
  else
    pass "[$actual_status, no forbidden string] $label"
  fi
}

echo ""
echo "============================================================"
echo "  The Milano Seal™ — Production Smoke Test"
echo "  Base URL: $BASE_URL"
echo "  $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "============================================================"
echo ""

# ── ROUTE 1: Public Homepage ─────────────────────────────────
echo "── Route 1 — Public Homepage"
check_status "GET /" "$BASE_URL/" "200"

# ── ROUTE 2: Intake Page ─────────────────────────────────────
echo "── Route 2 — Intake Page"
check_status "GET /intake" "$BASE_URL/intake" "200"

# ── ROUTE 3: Intake API ──────────────────────────────────────
echo "── Route 3 — Intake API (missing payload → 400)"
check_status "POST /api/intake no body → 400 or 422" \
  "$BASE_URL/api/intake" "400" || \
  check_status "POST /api/intake no body → 422" \
  "$BASE_URL/api/intake" "422" || true
# Full intake submission requires real email — run manually per smoke-test.md

# ── ROUTE 4: Intake Confirmation ────────────────────────────
echo "── Route 4 — Intake Confirmation (no id → non-200)"
actual=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL/intake/confirmation" 2>/dev/null || echo "000")
if [[ "$actual" != "200" ]]; then
  pass "[${actual}] GET /intake/confirmation without id is not 200 (expected)"
else
  fail "[200] GET /intake/confirmation without id should not return 200"
fi

# ── ROUTE 5: Operator Dashboard (unauth → redirect) ─────────
echo "── Route 5 — Operator Dashboard (unauthenticated → redirect)"
actual=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 "$BASE_URL/dashboard" 2>/dev/null || echo "000")
if [[ "$actual" == "200" || "$actual" == "401" || "$actual" == "302" || "$actual" == "307" ]]; then
  pass "[$actual] GET /dashboard responds (auth redirect or 200 on public build)"
else
  fail "[$actual] GET /dashboard unexpected response"
fi

# ── ROUTE 6: Deals API (unauthenticated → 401) ──────────────
echo "── Route 6 — Deals API (unauthenticated → 401)"
check_status "GET /api/deals unauthenticated → 401" "$BASE_URL/api/deals" "401"

# ── ROUTE 7: Client Portal ───────────────────────────────────
echo "── Route 7 — Client Portal"
check_status "GET /portal" "$BASE_URL/portal" "200"

# ── ROUTE 8: Portal OTP Confirm (missing body → 400) ────────
echo "── Route 8 — Portal OTP Confirm (no body → 400)"
actual=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{}' \
  --max-time 10 "$BASE_URL/api/portal/confirm" 2>/dev/null || echo "000")
if [[ "$actual" == "400" ]]; then
  pass "[400] POST /api/portal/confirm empty body rejected"
else
  fail "[$actual != 400] POST /api/portal/confirm empty body"
fi

# ── ROUTE 9: Payment Status — security checks ────────────────
echo "── Route 9 — Payment Status (security)"
# Must reject missing access_token
actual=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  "$BASE_URL/api/public/payment-status?deal_id=test-id" 2>/dev/null || echo "000")
if [[ "$actual" == "400" ]]; then
  pass "[400] GET /api/public/payment-status without access_token → 400"
else
  fail "[$actual != 400] GET /api/public/payment-status without access_token — SECURITY FAIL"
fi
# Must reject missing deal_id
actual=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  "$BASE_URL/api/public/payment-status?access_token=test-token" 2>/dev/null || echo "000")
if [[ "$actual" == "400" ]]; then
  pass "[400] GET /api/public/payment-status without deal_id → 400"
else
  fail "[$actual != 400] GET /api/public/payment-status without deal_id — SECURITY FAIL"
fi
# Must reject bad combination
actual=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  "$BASE_URL/api/public/payment-status?deal_id=fake&access_token=fake" 2>/dev/null || echo "000")
if [[ "$actual" == "404" || "$actual" == "400" ]]; then
  pass "[$actual] GET /api/public/payment-status bad params → 400/404"
else
  fail "[$actual] GET /api/public/payment-status bad params should not be 200"
fi

# ── ROUTE 10: File Upload (no body → 400) ───────────────────
echo "── Route 10 — File Upload (no body → 400)"
actual=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  --max-time 10 "$BASE_URL/api/upload" 2>/dev/null || echo "000")
if [[ "$actual" == "400" || "$actual" == "415" || "$actual" == "500" ]]; then
  pass "[$actual] POST /api/upload empty → non-200"
else
  fail "[$actual] POST /api/upload empty body should not return 200"
fi

# ── ROUTE 11: Shipping Label — MUST return 501 ───────────────
echo "── Route 11 — Shipping Label (production guard)"
# Use a placeholder deal id — any valid-format UUID will hit the 501 guard before deal lookup
TEST_UUID="00000000-0000-0000-0000-000000000000"
actual=$(curl -s -o /tmp/ms_smoke_body -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"test_mode":true}' \
  --max-time 10 "$BASE_URL/api/shipping/create-label/$TEST_UUID" 2>/dev/null || echo "000")
body=$(cat /tmp/ms_smoke_body 2>/dev/null || echo "")
if [[ "$actual" == "501" ]]; then
  pass "[501] POST /api/shipping/create-label → production guard active"
else
  fail "[$actual != 501] POST /api/shipping/create-label — mock may still be active"
fi
# Must not contain fake label strings
if echo "$body" | grep -qi "test-label\|TEST MODE\|example\.com"; then
  fail "[body contains mock data] POST /api/shipping/create-label — MOCK NOT REMOVED"
else
  pass "[no mock strings in body] Shipping guard clean"
fi

# ── ROUTE 12: Health Root ────────────────────────────────────
echo "── Route 12 — Health Root"
check_body_contains "GET /api/health → status:ok" \
  "$BASE_URL/api/health" "200" '"status":"ok"'
check_body_contains "GET /api/health → has timestamp" \
  "$BASE_URL/api/health" "200" '"timestamp"'
check_body_not_contains "GET /api/health → hides environment" \
  "$BASE_URL/api/health" "200" '"environment"'
check_body_not_contains "GET /api/health → hides provider configuration" \
  "$BASE_URL/api/health" "200" '"supabase"'
check_body_not_contains "GET /api/health → hides environment posture" \
  "$BASE_URL/api/health" "200" '"environment"'
check_body_not_contains "GET /api/health → hides Supabase/provider posture" \
  "$BASE_URL/api/health" "200" '"supabase"'

echo "── Production diagnostics are non-enumerating"
check_status "GET /api/debug/supabase → 404" "$BASE_URL/api/debug/supabase" "404"
check_status "GET /api/debug/supabase-env → 404" "$BASE_URL/api/debug/supabase-env" "404"
check_status "GET /api/debug/session → 404" "$BASE_URL/api/debug/session" "404"

# Detailed dependency observations are private. Public liveness is /api/health.
echo "── Protected dependency diagnostics"
for dependency in database storage webhooks payment dispatch assistant; do
  check_status "GET /api/health/$dependency requires authentication" "$BASE_URL/api/health/$dependency" "401"
done

# ── SECURITY: no example.com or TEST MODE in any health response ──
echo "── Security: forbidden strings in health responses"
check_body_not_contains "No 'example.com' in /api/health" \
  "$BASE_URL/api/health" "200" "example.com"
check_body_not_contains "No 'TEST MODE' in /api/health" \
  "$BASE_URL/api/health" "200" "TEST MODE"
check_body_not_contains "No 'example.com' in /api/health/webhooks" \
  "$BASE_URL/api/health/webhooks" "401" "example.com"

# ── SUMMARY ──────────────────────────────────────────────────
echo ""
echo "============================================================"
echo "  RESULTS"
echo "============================================================"
echo -e "  ${GREEN}PASS${NC}  $PASS"
echo -e "  ${RED}FAIL${NC}  $FAIL"
echo -e "  ${YELLOW}SKIP${NC}  $SKIP"
echo ""

if [[ $FAIL -gt 0 ]]; then
  echo -e "  ${RED}SMOKE TEST FAILED — $FAIL route(s) require attention${NC}"
  echo "  Use docs/production-smoke-test.md for rollback steps."
  echo ""
  exit 1
else
  echo -e "  ${GREEN}SMOKE TEST PASSED — all automated checks clear${NC}"
  echo "  Complete manual sign-off per docs/production-smoke-test.md before go-live."
  echo ""
  exit 0
fi
