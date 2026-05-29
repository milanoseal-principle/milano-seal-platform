# THE MILANO SEAL™ — DESTINATION INTELLIGENCE REGISTRY

**Status:** ARCHITECTURE NOTE  
**Execution State:** NOT LIVE CODE  
**Migration State:** NOT EXECUTED  
**Implementation Gate:** P1/P2 ONLY AFTER P0 REMOTE CLEARANCE

---

## Control Rule

This registry is a future backend intelligence layer.

It does not override:

- MS-RECON-MASTER-2026-V1
- MS-ENG-P0-FINAL-LOCK-2026-V1
- Remote P0 clearance docs
- Active repository reality
- Current intake behavior

Do not execute this registry until P0 remote clearance is complete.

---

## Why This Exists

The intake form must eventually support country-aware routing for international document use.

The system should not treat all destinations as U.S. states.

The system must support:

- Hague countries
- non-Hague countries
- destination localities
- Italian comuni
- Spanish municipalities
- Mexican states and municipalities
- Brazilian states and municipalities
- Portuguese municipalities and parishes
- UAE emirates and cities
- official languages
- translation needs
- apostille and legalization rules

---

## Source Authority

Use **HCCH** as the source of truth for Hague Apostille Convention status.

Current working assumption:

> **129 Hague Apostille Convention contracting states.**

Before production import, verify against the official HCCH Apostille Convention status table at hcch.net. Do not use Wikipedia, Wikipedia-derived counts, or any secondary source as the import reference.

---

## Recommended Tables

### `country_registry`

**Purpose:** Stores country-level routing intelligence.

| Field | Notes |
|---|---|
| `id` | UUID primary key |
| `country_name` | Full country name |
| `country_slug` | URL-safe identifier |
| `iso2` | ISO 3166-1 alpha-2 |
| `iso3` | ISO 3166-1 alpha-3 |
| `region` | Geographic region |
| `subregion` | Geographic subregion |
| `hague_status` | `member` / `non_member` |
| `hague_entry_date` | Date of Hague accession |
| `non_hague_legalization_required` | Boolean |
| `apostille_available` | Boolean |
| `embassy_legalization_required` | Boolean |
| `federal_apostille_supported` | Boolean |
| `state_apostille_supported` | Boolean |
| `official_languages` | Array |
| `common_translation_languages` | Array |
| `certified_translation_likely` | Boolean |
| `notarization_notes` | Operator notes |
| `apostille_notes` | Operator notes |
| `consular_notes` | Operator notes |
| `operator_notes` | Internal notes |
| `public_summary` | Client-safe guidance |
| `is_priority` | Boolean — priority corridor flag |
| `is_active` | Boolean |
| `source_url` | Reference URL (HCCH or authority) |
| `verified_at` | Last verified timestamp |
| `created_at` | |
| `updated_at` | |

---

### `destination_locality_registry`

**Purpose:** Stores country-specific destination localities.

| Field | Notes |
|---|---|
| `id` | UUID primary key |
| `country_slug` | FK → `country_registry` |
| `locality_name` | Display name |
| `locality_type` | See type list below |
| `region` | Region / state / province |
| `province_state` | Province or state |
| `municipality` | Municipality name |
| `parent_locality` | Parent locality reference |
| `postal_region` | Postal region identifier |
| `is_priority` | Boolean |
| `is_capital` | Boolean |
| `is_active` | Boolean |
| `common_document_use` | Document use notes |
| `operator_notes` | Internal notes |
| `source_url` | Reference URL |
| `verified_at` | Last verified timestamp |
| `created_at` | |
| `updated_at` | |

**Locality type values:**

```
comune
city
municipality
province
state
emirate
parish
civil_registry
court
consulate
embassy
national_authority
other
```

---

### `translation_language_registry`

**Purpose:** Stores translation and language intelligence per country.

| Field | Notes |
|---|---|
| `id` | UUID primary key |
| `country_slug` | FK → `country_registry` |
| `language_name` | Full language name |
| `language_code` | ISO 639-1 code |
| `is_official` | Boolean |
| `is_common_translation_target` | Boolean |
| `certified_translation_required_common` | Boolean |
| `sworn_translation_required_common` | Boolean |
| `apostille_translation_notes` | Operator notes |
| `operator_notes` | Internal notes |
| `source_url` | Reference URL |
| `verified_at` | Last verified timestamp |
| `created_at` | |
| `updated_at` | |

---

### `document_routing_rules`

**Purpose:** Stores routing logic by origin authority, destination country, and document type.

| Field | Notes |
|---|---|
| `id` | UUID primary key |
| `origin_authority_type` | `state` / `federal` / `court` / `agency` |
| `origin_authority_name` | e.g., "Florida Secretary of State" |
| `destination_country_slug` | FK → `country_registry` |
| `document_type` | e.g., "power_of_attorney" / "birth_certificate" |
| `requires_state_apostille` | Boolean |
| `requires_federal_apostille` | Boolean |
| `requires_embassy_legalization` | Boolean |
| `requires_certified_translation` | Boolean |
| `requires_sworn_translation` | Boolean |
| `requires_operator_review` | Boolean |
| `recommended_execution_lane` | `signature` / `priority` / `executive` |
| `public_guidance` | Client-safe routing summary |
| `operator_notes` | Internal notes |
| `is_active` | Boolean |
| `verified_at` | Last verified timestamp |
| `created_at` | |
| `updated_at` | |

---

## Priority Country Locality Examples

### Italy

**Locality label:** Destination Comune / City

**Priority list:**
- Rome
- Milan
- Naples
- Turin
- Palermo
- Genoa
- Bologna
- Florence
- Venice
- Verona
- Bari
- Catania
- Canzano
- Other / Not Sure

**Notes:** Italian matters may depend on the comune, consulate, court, or filing office requesting the document.

---

### Spain

**Locality label:** Destination Municipality / Province

**Priority list:**
- Madrid
- Barcelona
- Valencia
- Seville
- Zaragoza
- Málaga
- Murcia
- Palma
- Bilbao
- Alicante
- Granada
- Other / Not Sure

**Notes:** Spanish matters may depend on the province, municipality, notary office, or receiving authority.

---

### Mexico

**Locality label:** Destination State / Municipality

**Priority list:**
- Mexico City
- Jalisco
- Nuevo León
- Quintana Roo
- Yucatán
- Baja California
- Puebla
- Querétaro
- Guadalajara
- Monterrey
- Cancún
- Mérida
- Other / Not Sure

**Notes:** Mexican matters may depend on the state, municipality, notary office, or receiving authority.

---

### Brazil

**Locality label:** Destination State / Municipality

**Priority list:**
- São Paulo
- Rio de Janeiro
- Brasília
- Minas Gerais
- Bahia
- Paraná
- Santa Catarina
- Rio Grande do Sul
- Pernambuco
- Ceará
- Other / Not Sure

---

### Portugal

**Locality label:** Destination Municipality / Parish

**Priority list:**
- Lisbon
- Porto
- Braga
- Coimbra
- Faro
- Setúbal
- Aveiro
- Funchal
- Ponta Delgada
- Other / Not Sure

---

### UAE

**Locality label:** Destination Emirate / City

**Priority list:**
- Abu Dhabi
- Dubai
- Sharjah
- Ajman
- Ras Al Khaimah
- Fujairah
- Umm Al Quwain
- Other / Not Sure

---

## Intake Strategy

**Current intake must use:**

- Curated priority dropdowns
- Fallback locality options
- Other / Not Sure
- Optional custom locality text field

**Future intake will use:**

```
country_registry
→ destination_locality_registry
  → translation_language_registry
  → document_routing_rules
```

---

## Translation Strategy

The system should eventually determine:

- Destination official language
- Whether certified translation is likely
- Whether sworn translation may be needed
- Whether operator review is required
- Whether destination authority determines translation requirements

**Do not promise translation requirements automatically.**

Use operator-safe language:

> *Translation requirements may depend on the receiving authority, document type, and destination jurisdiction. The Milano Seal™ will review the routing path before confirming execution steps.*

---

## Do Not Overbuild Now

- Do not import every city/comune/municipality into frontend constants
- Do not hardcode the full Hague list into components
- Do not execute registry migrations before P0 remote clearance
- Do not let dropdown scope block intake submission
- Always allow: **Other / Not Sure**

---

## Future Migration Plan

P1/P2 migration order (do not execute before P0 remote clearance):

| Migration | Table | Gate |
|---|---|---|
| `013_country_registry.sql` | `country_registry` | P0 remote clearance signed |
| `014_destination_locality_registry.sql` | `destination_locality_registry` | After 013 applied |
| `015_translation_language_registry.sql` | `translation_language_registry` | After 014 applied |
| `016_document_routing_rules.sql` | `document_routing_rules` | After 015 applied |

**P1/P2 import order:**

1. `country_registry` — schema only
2. Hague status import from HCCH (129 contracting states, verify before import)
3. Priority country localities
4. `translation_language_registry`
5. `document_routing_rules`
6. Operator dashboard review tools
7. Intake dynamic registry reads
8. SEO country and locality expansion

---

## Final Rule

The dropdown is a client intake tool.

The registry is the backend intelligence layer.

Do not confuse them.
