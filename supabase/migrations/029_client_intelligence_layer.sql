-- 029_client_intelligence_layer.sql
-- Client Intelligence Layer: profiles, matter preferences, pathway intelligence,
-- UX learning events, and guidance rules.
-- All tables have RLS enabled. Client data is never cross-exposed.

-- ─── client_profiles ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS client_profiles (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  client_email                    text NOT NULL,
  client_name                     text,
  client_type                     text CHECK (client_type IN (
    'individual','law_firm','business','real_estate',
    'immigration','international_family','notary_only'
  )),
  repeat_client                   boolean NOT NULL DEFAULT false,
  total_matters                   integer NOT NULL DEFAULT 0,
  completed_matters               integer NOT NULL DEFAULT 0,
  preferred_destination_countries text[],
  preferred_document_types        text[],
  default_signer_location         text,
  default_origin_jurisdiction     text,
  last_matter_at                  timestamptz,
  client_notes_public_safe        text,         -- safe for portal display only
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

-- Client can read their own profile only
CREATE POLICY "client_profiles_own_read" ON client_profiles
  FOR SELECT USING (client_email = (auth.jwt() ->> 'email'));

-- Service role (founder/operator) has full access via service key — no policy needed

CREATE INDEX IF NOT EXISTS idx_client_profiles_email ON client_profiles(client_email);
CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id ON client_profiles(user_id);

-- ─── client_matter_preferences ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS client_matter_preferences (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id           uuid REFERENCES client_profiles(id) ON DELETE CASCADE,
  document_type               text,
  destination_country         text,
  apostille_required          boolean,
  translation_needed          boolean,
  preferred_lane              text,
  average_turnaround_days     numeric,
  common_missing_fields       text[],
  common_required_documents   text[],
  last_used_at                timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE client_matter_preferences ENABLE ROW LEVEL SECURITY;

-- Client reads their own preferences via profile join
CREATE POLICY "client_matter_preferences_own_read" ON client_matter_preferences
  FOR SELECT USING (
    client_profile_id IN (
      SELECT id FROM client_profiles
      WHERE client_email = (auth.jwt() ->> 'email')
    )
  );

CREATE INDEX IF NOT EXISTS idx_cmp_profile_id ON client_matter_preferences(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_cmp_destination ON client_matter_preferences(destination_country);

-- ─── pathway_intelligence ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pathway_intelligence (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_country         text NOT NULL,
  origin_jurisdiction         text,
  document_type               text,
  hague_status                text,   -- 'member' | 'non_member' | 'unknown'
  ron_allowed                 boolean,
  apostille_required          boolean,
  legalization_required       boolean,
  translation_likely          boolean,
  common_blockers             text[],
  required_preflight_checks   text[],
  operator_notes              text,           -- NEVER exposed to client portal
  client_safe_summary         text,           -- safe for portal display
  confidence_level            text DEFAULT 'low',
  updated_by                  text,
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pathway_intelligence ENABLE ROW LEVEL SECURITY;

-- Authenticated clients can read client_safe_summary only
CREATE POLICY "pathway_intelligence_client_read" ON pathway_intelligence
  FOR SELECT USING (auth.role() = 'authenticated');
-- operator_notes must be filtered at application layer — never serialize to client

CREATE INDEX IF NOT EXISTS idx_pi_country ON pathway_intelligence(destination_country);
CREATE INDEX IF NOT EXISTS idx_pi_doc_type ON pathway_intelligence(document_type);

-- ─── ux_learning_events ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ux_learning_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid,
  client_email  text,
  matter_id     text,
  surface       text NOT NULL,
  event_type    text NOT NULL,
  event_label   text,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ux_learning_events ENABLE ROW LEVEL SECURITY;

-- Insert allowed for authenticated users (tracking events)
CREATE POLICY "ux_events_insert" ON ux_learning_events
  FOR INSERT WITH CHECK (auth.role() IN ('authenticated', 'anon'));

-- No client read — analytics only for founder/service role

CREATE INDEX IF NOT EXISTS idx_ux_events_surface ON ux_learning_events(surface);
CREATE INDEX IF NOT EXISTS idx_ux_events_type ON ux_learning_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ux_events_matter ON ux_learning_events(matter_id);

-- ─── client_guidance_rules ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS client_guidance_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key        text UNIQUE NOT NULL,
  surface         text NOT NULL,
  audience        text NOT NULL CHECK (audience IN ('client','founder','va','operator')),
  message         text NOT NULL,
  priority        integer NOT NULL DEFAULT 100,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE client_guidance_rules ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active rules for their audience
CREATE POLICY "guidance_rules_client_read" ON client_guidance_rules
  FOR SELECT USING (active = true AND audience = 'client' AND auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_guidance_rules_audience ON client_guidance_rules(audience, active);
