/**
 * lib/intake/hagueMembers.ts
 *
 * Hague Apostille Convention (1961) member states. Used by the execution
 * path engine to choose between an apostille route (Hague members) and a
 * legalization chain (non-members).
 *
 * Source: HCCH (Hague Conference on Private International Law) signatory
 * list, current as of 2025. Update as new states accede.
 *
 * NOTE: this is intentionally a flat string list rather than a database
 * lookup so the compliance engine can evaluate jurisdiction synchronously
 * during smart-intake parsing. When the backend compliance engine comes
 * online, swap the export to call the engine and the rest of the code
 * is unaffected.
 */

const HAGUE_MEMBERS: ReadonlySet<string> = new Set([
  // Europe
  "Albania",
  "Andorra",
  "Armenia",
  "Austria",
  "Azerbaijan",
  "Belarus",
  "Belgium",
  "Bosnia and Herzegovina",
  "Bulgaria",
  "Croatia",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Georgia",
  "Germany",
  "Greece",
  "Hungary",
  "Iceland",
  "Ireland",
  "Italy",
  "Kosovo",
  "Latvia",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Moldova",
  "Monaco",
  "Montenegro",
  "Netherlands",
  "North Macedonia",
  "Norway",
  "Poland",
  "Portugal",
  "Romania",
  "Russia",
  "San Marino",
  "Serbia",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
  "Switzerland",
  "Turkey",
  "Ukraine",
  "United Kingdom",
  "Vatican City",

  // Americas
  "Antigua and Barbuda",
  "Argentina",
  "Bahamas",
  "Barbados",
  "Belize",
  "Bolivia",
  "Brazil",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "El Salvador",
  "Grenada",
  "Guatemala",
  "Guyana",
  "Honduras",
  "Jamaica",
  "Mexico",
  "Nicaragua",
  "Panama",
  "Paraguay",
  "Peru",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Suriname",
  "Trinidad and Tobago",
  "Uruguay",
  "Venezuela",
  "United States",

  // Asia & Pacific
  "Australia",
  "China",
  "Cook Islands",
  "Fiji",
  "Hong Kong",
  "India",
  "Indonesia",
  "Israel",
  "Japan",
  "Kazakhstan",
  "Kyrgyzstan",
  "Macau",
  "Marshall Islands",
  "Mongolia",
  "New Zealand",
  "Niue",
  "Oman",
  "Pakistan",
  "Palau",
  "Philippines",
  "Samoa",
  "Saudi Arabia",
  "Singapore",
  "South Korea",
  "Tajikistan",
  "Tonga",
  "Uzbekistan",
  "Vanuatu",

  // Africa
  "Botswana",
  "Burkina Faso",
  "Cape Verde",
  "Eswatini",
  "Lesotho",
  "Liberia",
  "Malawi",
  "Mauritius",
  "Morocco",
  "Namibia",
  "Rwanda",
  "São Tomé and Príncipe",
  "Senegal",
  "Seychelles",
  "South Africa",
  "Tunisia",
]);

/** Case-insensitive membership check. Returns false for empty/unknown input. */
export function isHagueMember(country: string): boolean {
  if (!country) return false;
  const normalized = country.trim();
  if (!normalized) return false;
  if (HAGUE_MEMBERS.has(normalized)) return true;
  const lower = normalized.toLowerCase();
  for (const m of HAGUE_MEMBERS) {
    if (m.toLowerCase() === lower) return true;
  }
  return false;
}
