-- THE MILANO SEAL™ — ALLIANCE-03: OPERATOR ONBOARDING + TOOL BELT COMPLIANCE GATE
-- Run AFTER scripts 001–003 in Supabase SQL Editor
-- Adds: operator_profiles, operator_capabilities, operator_toolbelt_status,
--        operator_compliance_status, operator_availability_log,
--        operator_routing_eligibility, operator_assignments

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────────────────────
-- OPERATOR PROFILES
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS operator_profiles (
  id                          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name                   TEXT NOT NULL,
  email                       TEXT UNIQUE NOT NULL,
  phone                       TEXT,
  firm_name                   TEXT,
  region                      TEXT,
  state                       TEXT,
  city                        TEXT,
  coverage_radius_miles       INTEGER DEFAULT 50,
  onboarding_status           TEXT NOT NULL DEFAULT 'invited'
    CHECK (onboarding_status IN (
      'invited','profile_started','documents_pending','training_pending',
      'toolbelt_pending','compliance_review','approved','suspended','rejected'
    )),
  background_verified         BOOLEAN DEFAULT FALSE NOT NULL,
  identity_verified           BOOLEAN DEFAULT FALSE NOT NULL,
  ron_capable                 BOOLEAN DEFAULT FALSE NOT NULL,
  mobile_capable              BOOLEAN DEFAULT FALSE NOT NULL,
  apostille_runner_capable    BOOLEAN DEFAULT FALSE NOT NULL,
  courier_capable             BOOLEAN DEFAULT FALSE NOT NULL,
  admin_approved              BOOLEAN DEFAULT FALSE NOT NULL,
  approved_by                 TEXT,
  approved_at                 TIMESTAMPTZ,
  suspended_reason            TEXT,
  notes                       TEXT,
  created_at                  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at                  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ────────────────────────────────────────────────────────────────────────────
-- OPERATOR CAPABILITIES (document categories + jurisdictions)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS operator_capabilities (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  operator_id         UUID REFERENCES operator_profiles(id) ON DELETE CASCADE NOT NULL,
  capability_type     TEXT NOT NULL CHECK (capability_type IN ('document_category','jurisdiction')),
  capability_value    TEXT NOT NULL,
  verified            BOOLEAN DEFAULT FALSE NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (operator_id, capability_type, capability_value)
);

-- ────────────────────────────────────────────────────────────────────────────
-- TOOL BELT STATUS (per-tool completion tracking)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS operator_toolbelt_status (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  operator_id           UUID REFERENCES operator_profiles(id) ON DELETE CASCADE NOT NULL,
  tool_name             TEXT NOT NULL,
  tool_category         TEXT NOT NULL,
  required              BOOLEAN DEFAULT TRUE NOT NULL,
  compliance_gate       BOOLEAN DEFAULT FALSE NOT NULL,
  status                TEXT NOT NULL DEFAULT 'not_configured'
    CHECK (status IN ('verified','pending','not_configured')),
  completion_pct        INTEGER DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
  verified_at           TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (operator_id, tool_name)
);

-- ────────────────────────────────────────────────────────────────────────────
-- COMPLIANCE STATUS (readiness flags per operator)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS operator_compliance_status (
  id                            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  operator_id                   UUID REFERENCES operator_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  compliance_ready              BOOLEAN DEFAULT FALSE NOT NULL,
  e_o_insurance_verified        BOOLEAN DEFAULT FALSE NOT NULL,
  background_check_passed       BOOLEAN DEFAULT FALSE NOT NULL,
  notary_commission_verified    BOOLEAN DEFAULT FALSE NOT NULL,
  nna_certified                 BOOLEAN DEFAULT FALSE NOT NULL,
  state_license_verified        BOOLEAN DEFAULT FALSE NOT NULL,
  data_handling_agreement       BOOLEAN DEFAULT FALSE NOT NULL,
  brand_guidelines_accepted     BOOLEAN DEFAULT FALSE NOT NULL,
  reviewed_by                   TEXT,
  reviewed_at                   TIMESTAMPTZ,
  notes                         TEXT,
  updated_at                    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ────────────────────────────────────────────────────────────────────────────
-- AVAILABILITY LOG (state transitions with timestamps)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS operator_availability_log (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  operator_id       UUID REFERENCES operator_profiles(id) ON DELETE CASCADE NOT NULL,
  availability      TEXT NOT NULL CHECK (availability IN (
    'AVAILABLE','BUSY','OFFLINE','AFTER_HOURS','RUSH_ONLY','TRAVELING','PAUSED','LOCKED'
  )),
  set_by            TEXT NOT NULL DEFAULT 'operator',
  reason            TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Current availability view (latest record per operator)
CREATE OR REPLACE VIEW operator_current_availability AS
  SELECT DISTINCT ON (operator_id)
    operator_id,
    availability,
    set_by,
    reason,
    created_at
  FROM operator_availability_log
  ORDER BY operator_id, created_at DESC;

-- ────────────────────────────────────────────────────────────────────────────
-- ROUTING ELIGIBILITY (computed gate — written by eligibility check function)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS operator_routing_eligibility (
  id                      UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  operator_id             UUID REFERENCES operator_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  eligible                BOOLEAN DEFAULT FALSE NOT NULL,
  toolbelt_score          INTEGER DEFAULT 0,
  blockers                TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_evaluated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ────────────────────────────────────────────────────────────────────────────
-- OPERATOR ASSIGNMENTS (dispatch records linking operators to deals)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS operator_assignments (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  operator_id       UUID REFERENCES operator_profiles(id) ON DELETE RESTRICT NOT NULL,
  deal_id           UUID REFERENCES deals(id) ON DELETE RESTRICT NOT NULL,
  assigned_by       TEXT NOT NULL,
  assignment_status TEXT NOT NULL DEFAULT 'offered'
    CHECK (assignment_status IN (
      'offered','accepted','declined','in_progress','completed','reassigned','cancelled'
    )),
  dispatch_confirmed  BOOLEAN DEFAULT FALSE NOT NULL,
  idempotency_key     TEXT UNIQUE,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ────────────────────────────────────────────────────────────────────────────
-- TOOLBELT COMPLETION VIEW (aggregate per operator)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW operator_toolbelt_summary AS
  SELECT
    operator_id,
    COUNT(*) AS total_tools,
    COUNT(*) FILTER (WHERE status = 'verified') AS verified_tools,
    COUNT(*) FILTER (WHERE required = TRUE) AS required_tools,
    COUNT(*) FILTER (WHERE required = TRUE AND status = 'verified') AS required_verified,
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE status = 'verified')::NUMERIC / COUNT(*)) * 100)
    END AS completion_pct,
    CASE
      WHEN COUNT(*) FILTER (WHERE required = TRUE AND compliance_gate = TRUE AND status != 'verified') > 0
        THEN FALSE
      ELSE TRUE
    END AS compliance_gates_met
  FROM operator_toolbelt_status
  GROUP BY operator_id;

-- ────────────────────────────────────────────────────────────────────────────
-- SEED DEFAULT TOOL BELT ITEMS (inserted on new operator creation via function)
-- These are reference rows; per-operator rows created at onboarding start.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS toolbelt_item_definitions (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tool_name       TEXT UNIQUE NOT NULL,
  tool_category   TEXT NOT NULL,
  required        BOOLEAN DEFAULT TRUE NOT NULL,
  compliance_gate BOOLEAN DEFAULT FALSE NOT NULL,
  sort_order      INTEGER DEFAULT 0
);

INSERT INTO toolbelt_item_definitions (tool_name, tool_category, required, compliance_gate, sort_order) VALUES
  ('Remote Online Notarization (RON) Platform',     'Core Execution Tools',         TRUE,  TRUE,  10),
  ('Digital Signature Platform',                    'Core Execution Tools',         TRUE,  TRUE,  20),
  ('Identity Verification (KBA/ID Check)',           'Core Execution Tools',         TRUE,  TRUE,  30),
  ('Secure Document Storage & Delivery',            'Core Infrastructure Tools',    TRUE,  TRUE,  40),
  ('Payment Processing Integration',                'Core Infrastructure Tools',    TRUE,  TRUE,  50),
  ('International Courier API',                     'Core Infrastructure Tools',    FALSE, FALSE, 60),
  ('White-Label Client Intake Widget',              'Growth / Ops Tools',           FALSE, FALSE, 70),
  ('CRM / Client Management Integration',           'Growth / Ops Tools',           FALSE, FALSE, 80),
  ('Alliance Portal Access',                        'Milano Internal Systems',      TRUE,  TRUE,  90),
  ('Secure Messaging with Milano Seal',             'Milano Internal Systems',      TRUE,  TRUE,  100)
ON CONFLICT (tool_name) DO NOTHING;

-- ────────────────────────────────────────────────────────────────────────────
-- FUNCTION: provision_operator_toolbelt(operator_id)
-- Copies item definitions into per-operator rows when onboarding starts.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION provision_operator_toolbelt(p_operator_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO operator_toolbelt_status (operator_id, tool_name, tool_category, required, compliance_gate)
  SELECT p_operator_id, tool_name, tool_category, required, compliance_gate
  FROM toolbelt_item_definitions
  ON CONFLICT (operator_id, tool_name) DO NOTHING;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- FUNCTION: evaluate_operator_eligibility(operator_id)
-- Writes result into operator_routing_eligibility.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION evaluate_operator_eligibility(p_operator_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  v_profile         operator_profiles%ROWTYPE;
  v_compliance      operator_compliance_status%ROWTYPE;
  v_toolbelt_pct    INTEGER := 0;
  v_availability    TEXT := 'OFFLINE';
  v_blockers        TEXT[] := ARRAY[]::TEXT[];
  v_eligible        BOOLEAN;
BEGIN
  SELECT * INTO v_profile FROM operator_profiles WHERE id = p_operator_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Operator % not found', p_operator_id;
  END IF;

  SELECT * INTO v_compliance FROM operator_compliance_status WHERE operator_id = p_operator_id;

  SELECT completion_pct INTO v_toolbelt_pct
  FROM operator_toolbelt_summary WHERE operator_id = p_operator_id;

  SELECT availability INTO v_availability
  FROM operator_current_availability WHERE operator_id = p_operator_id;

  -- Gate checks (mirrors TypeScript evaluateRoutingEligibility)
  IF v_profile.onboarding_status != 'approved' THEN
    v_blockers := array_append(v_blockers, 'Onboarding not complete');
  END IF;
  IF NOT v_profile.identity_verified THEN
    v_blockers := array_append(v_blockers, 'Identity not verified');
  END IF;
  IF NOT COALESCE(v_compliance.compliance_ready, FALSE) THEN
    v_blockers := array_append(v_blockers, 'Compliance review incomplete');
  END IF;
  IF COALESCE(v_toolbelt_pct, 0) < 80 THEN
    v_blockers := array_append(v_blockers, format('Tool Belt at %s%% — 80%% required', COALESCE(v_toolbelt_pct, 0)));
  END IF;
  IF v_profile.state IS NULL OR TRIM(v_profile.state) = '' THEN
    v_blockers := array_append(v_blockers, 'Territory / state not defined');
  END IF;
  IF NOT v_profile.admin_approved THEN
    v_blockers := array_append(v_blockers, 'Admin approval pending');
  END IF;
  IF v_availability NOT IN ('AVAILABLE','AFTER_HOURS','RUSH_ONLY') THEN
    v_blockers := array_append(v_blockers, format('Availability state: %s', COALESCE(v_availability,'OFFLINE')));
  END IF;

  v_eligible := (array_length(v_blockers, 1) IS NULL OR array_length(v_blockers, 1) = 0);

  INSERT INTO operator_routing_eligibility (operator_id, eligible, toolbelt_score, blockers, last_evaluated_at, updated_at)
  VALUES (p_operator_id, v_eligible, COALESCE(v_toolbelt_pct, 0), v_blockers, NOW(), NOW())
  ON CONFLICT (operator_id) DO UPDATE
    SET eligible            = EXCLUDED.eligible,
        toolbelt_score      = EXCLUDED.toolbelt_score,
        blockers            = EXCLUDED.blockers,
        last_evaluated_at   = EXCLUDED.last_evaluated_at,
        updated_at          = EXCLUDED.updated_at;

  RETURN v_eligible;
END;
$$;

-- Update Mexico compliance rule to Hague Apostille (ALLIANCE-03 correctness fix)
UPDATE compliance_rules
SET
  apostille_required = TRUE,
  hague_member       = TRUE,
  restrictions       = ARRAY[
    'Apostille required for U.S. public documents used in Mexico',
    'Spanish translation may be required depending on receiving authority',
    'Manual review required for real estate, court, corporate, or consular-sensitive filings'
  ],
  notes              = 'Mexico is a Hague Apostille destination for U.S.-origin public documents. Apostille routing applies; translation or receiving-authority requirements may still apply.',
  execution_path     = ARRAY[
    'Notarization or certified public document issuance',
    'Apostille by issuing state or competent authority',
    'Certified Spanish translation if required',
    'Courier or digital delivery to recipient'
  ],
  updated_at         = NOW()
WHERE jurisdiction = 'mexico';
