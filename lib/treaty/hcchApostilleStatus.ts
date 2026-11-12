// Canonical HCCH status of the Convention of 5 October 1961 Abolishing the Requirement of
// Legalisation for Foreign Public Documents (Apostille Convention, HCCH #12).
//
// Source: HCCH status table, https://www.hcch.net/en/instruments/conventions/status-table/?cid=41
// and the HCCH #12 print of 12 November 2026 (competent authorities). Rows below are transcribed
// verbatim in HCCH notation (day-ROMAN_MONTH-year) and parsed at load, so every value can be
// compared line by line with the official table. This file is public treaty data only.
//
// Every other country list in the platform derives its Hague fields from here. Bilateral
// applicability is never inferred from membership alone: see lib/treaty/apostilleRelationship.ts.

export const HCCH_APOSTILLE_SOURCE = {
  convention: "HCCH 1961 Apostille Convention (#12)",
  statusTableUrl: "https://www.hcch.net/en/instruments/conventions/status-table/?cid=41",
  objectionsUrl: "https://www.hcch.net/en/instruments/conventions/status-table/notifications/?csid=41&disp=type",
  declarationsUrl: "https://www.hcch.net/en/instruments/conventions/status-table/notifications/?csid=41&disp=resdn",
  verifiedAt: "2026-11-12",
  verification: "official_status_table",
} as const;

export type InstrumentType = "ratification" | "accession" | "succession";

export type HcchContractingParty = {
  name: string; // HCCH designation
  iso2: string; // ISO 3166-1 alpha-2 (XK for Kosovo, as used by the European Commission)
  signature: string | null; // ISO date
  instrument: string; // ISO date of ratification / accession / succession
  type: InstrumentType;
  entryIntoForce: string; // ISO date
  hasDeclarations: boolean; // Res/D/N column non-empty
};

// name|iso2|signature|R/A/S date|type (R, A, Su)|EIF|Res/D/N/DC
const STATUS_ROWS = `
Albania|AL||3-IX-2003|A|9-V-2004|
Algeria|DZ||5-XI-2025|A|9-VII-2026|
Andorra|AD||15-IV-1996|A|31-XII-1996|
Antigua and Barbuda|AG||1-V-1985|Su|1-XI-1981|
Argentina|AR||8-V-1987|A|18-II-1988|D
Armenia|AM||19-XI-1993|A|14-VIII-1994|
Australia|AU||11-VII-1994|A|16-III-1995|D
Austria|AT|5-X-1961|14-XI-1967|R|13-I-1968|D
Azerbaijan|AZ||13-V-2004|A|2-III-2005|
Bahamas|BS||30-IV-1976|Su|10-VII-1973|
Bahrain|BH||10-IV-2013|A|31-XII-2013|D
Bangladesh|BD||29-VII-2024|A|30-III-2025|
Barbados|BB||11-VIII-1995|Su|30-XI-1966|
Belarus|BY||16-VI-1992|Su|31-V-1992|
Belgium|BE|10-III-1970|11-XII-1975|R|9-II-1976|
Belize|BZ||17-VII-1992|A|11-IV-1993|
Bolivia (Plurinational State of)|BO||6-IX-2017|A|7-V-2018|
Bosnia and Herzegovina|BA||23-VIII-1993|Su|6-III-1992|D
Botswana|BW||16-IX-1968|Su|30-IX-1966|
Brazil|BR||2-XII-2015|A|14-VIII-2016|D
Brunei Darussalam|BN||23-II-1987|A|3-XII-1987|
Bulgaria|BG||1-VIII-2000|A|29-IV-2001|
Burundi|BI||10-VI-2014|A|13-II-2015|
Cabo Verde|CV||7-V-2009|A|13-II-2010|
Canada|CA||12-V-2023|A|11-I-2024|
Chile|CL||16-XII-2015|A|30-VIII-2016|
China (the People's Republic of)|CN||8-III-2023|A|7-XI-2023|D
Colombia|CO||27-IV-2000|A|30-I-2001|D
Cook Islands|CK||13-VII-2004|A|30-IV-2005|
Costa Rica|CR||6-IV-2011|A|14-XII-2011|
Croatia|HR||23-IV-1993|Su|8-X-1991|
Cyprus|CY||26-VII-1972|A|30-IV-1973|
Czechia|CZ||23-VI-1998|A|16-III-1999|
Denmark|DK|20-X-2006|30-X-2006|R|29-XII-2006|D
Dominica|DM||22-X-2002|Su|3-XI-1978|
Dominican Republic|DO||12-XII-2008|A|30-VIII-2009|
Ecuador|EC||2-VII-2004|A|2-IV-2005|D
El Salvador|SV||14-IX-1995|A|31-V-1996|
Estonia|EE||11-XII-2000|A|30-IX-2001|D
Eswatini|SZ||3-VII-1978|Su|6-IX-1968|
Fiji|FJ||29-III-1971|Su|10-X-1970|
Finland|FI|13-III-1962|27-VI-1985|R|26-VIII-1985|D
France|FR|9-X-1961|25-XI-1964|R|24-I-1965|D
Georgia|GE||21-VIII-2006|A|14-V-2007|D
Germany|DE|5-X-1961|15-XII-1965|R|13-II-1966|D,N
Greece|GR|5-X-1961|19-III-1985|R|18-V-1985|
Grenada|GD||17-VII-2001|A|7-IV-2002|
Guatemala|GT||19-I-2017|A|18-IX-2017|D
Guyana|GY||30-VII-2018|A|18-IV-2019|
Honduras|HN||20-I-2004|A|30-IX-2004|
Hungary|HU||18-IV-1972|A|18-I-1973|D
Iceland|IS|7-IX-2004|28-IX-2004|R|27-XI-2004|
India|IN||26-X-2004|A|14-VII-2005|
Indonesia|ID||5-X-2021|A|4-VI-2022|D
Ireland|IE|29-X-1996|8-I-1999|R|9-III-1999|
Israel|IL||11-XI-1977|A|14-VIII-1978|
Italy|IT|15-XII-1961|13-XII-1977|R|11-II-1978|
Jamaica|JM||2-XI-2020|A|3-VII-2021|
Japan|JP|12-III-1970|28-V-1970|R|27-VII-1970|
Kazakhstan|KZ||5-IV-2000|A|30-I-2001|D
Kosovo|XK||6-XI-2015|A|14-VII-2016|D,DC
Kyrgyzstan|KG||15-XI-2010|A|31-VII-2011|
Latvia|LV||11-V-1995|A|30-I-1996|D
Lesotho|LS||24-IV-1972|Su|4-X-1966|
Liberia|LR||24-V-1995|A|8-II-1996|
Liechtenstein|LI|18-IV-1962|19-VII-1972|R|17-IX-1972|
Lithuania|LT||5-XI-1996|A|19-VII-1997|D
Luxembourg|LU|5-X-1961|4-IV-1979|R|3-VI-1979|
Malawi|MW||24-II-1967|A|2-XII-1967|
Malta|MT||12-VI-1967|A|3-III-1968|
Marshall Islands|MH||18-XI-1991|A|14-VIII-1992|
Mauritius|MU||20-XII-1968|Su|12-III-1968|
Mexico|MX||1-XII-1994|A|14-VIII-1995|
Monaco|MC||24-IV-2002|A|31-XII-2002|
Mongolia|MN||2-IV-2009|A|31-XII-2009|
Montenegro|ME||30-I-2007|Su|3-VI-2006|
Morocco|MA||27-XI-2015|A|14-VIII-2016|
Namibia|NA||25-IV-2000|A|30-I-2001|
Netherlands (Kingdom of the)|NL|30-XI-1962|9-VIII-1965|R|8-X-1965|D
New Zealand|NZ||7-II-2001|A|22-XI-2001|D
Nicaragua|NI||7-IX-2012|A|14-V-2013|
Niue|NU||10-VI-1998|A|2-III-1999|
North Macedonia|MK||20-IX-1993|Su|17-XI-1991|
Norway|NO|30-V-1983|30-V-1983|R|29-VII-1983|
Oman|OM||12-V-2011|A|30-I-2012|D
Pakistan|PK||8-VII-2022|A|9-III-2023|D,N
Palau|PW||17-X-2019|A|23-VI-2020|
Panama|PA||30-X-1990|A|4-VIII-1991|
Paraguay|PY||10-XII-2013|A|30-VIII-2014|
Peru|PE||13-I-2010|A|30-IX-2010|
Philippines|PH||12-IX-2018|A|14-V-2019|D
Poland|PL||19-XI-2004|A|14-VIII-2005|D
Portugal|PT|20-VIII-1965|6-XII-1968|R|4-II-1969|D
Republic of Korea|KR||25-X-2006|A|14-VII-2007|
Republic of Moldova|MD||19-VI-2006|A|16-III-2007|
Romania|RO||7-VI-2000|A|16-III-2001|D
Russian Federation|RU||4-IX-1991|Su|31-V-1992|D,N
Rwanda|RW||6-X-2023|A|5-VI-2024|D
Saint Kitts and Nevis|KN||26-II-1994|A|14-XII-1994|
Saint Lucia|LC||5-XII-2001|A|31-VII-2002|
Saint Vincent and the Grenadines|VC||2-V-2002|Su|27-X-1979|
Samoa|WS||18-I-1999|A|13-IX-1999|
San Marino|SM||26-V-1994|A|13-II-1995|
Sao Tome and Principe|ST||19-XII-2007|A|13-IX-2008|
Saudi Arabia|SA||8-IV-2022|A|7-XII-2022|
Senegal|SN||13-VII-2022|A|23-III-2023|
Serbia|RS||26-IV-2001|Su|27-IV-1992|D
Seychelles|SC||9-VI-1978|A|31-III-1979|
Singapore|SG||18-I-2021|A|16-IX-2021|
Slovakia|SK||6-VI-2001|A|18-II-2002|
Slovenia|SI||8-VI-1992|Su|25-VI-1991|
South Africa|ZA||3-VIII-1994|A|30-IV-1995|
Spain|ES|21-X-1976|27-VII-1978|R|25-IX-1978|D
Suriname|SR||29-X-1976|Su|25-XI-1975|
Sweden|SE|2-III-1999|2-III-1999|R|1-V-1999|
Switzerland|CH|5-X-1961|10-I-1973|R|11-III-1973|D
Tajikistan|TJ||20-II-2015|A|31-X-2015|
Thailand|TH||30-VI-2026|A|28-II-2027|
Tonga|TO||28-X-1971|Su|4-VI-1970|D
Trinidad and Tobago|TT||28-X-1999|A|14-VII-2000|
Tunisia|TN||10-VII-2017|A|30-III-2018|
Türkiye|TR|8-V-1962|31-VII-1985|R|29-IX-1985|
Ukraine|UA||2-IV-2003|A|22-XII-2003|D
United Kingdom of Great Britain and Northern Ireland|GB|19-X-1961|21-VIII-1964|R|24-I-1965|D
United States of America|US||24-XII-1980|A|15-X-1981|D
Uruguay|UY||9-II-2012|A|14-X-2012|
Uzbekistan|UZ||25-VII-2011|A|15-IV-2012|
Vanuatu|VU||1-VIII-2008|Su|30-VII-1980|
Venezuela (Bolivarian Republic of)|VE||1-VII-1998|A|16-III-1999|
Viet Nam|VN||31-XII-2025|A|11-IX-2026|
`;

const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };

// "9-VII-2026" -> "2026-07-09". Throws on anything else so a mistyped row fails loudly.
export function hcchDate(value: string): string {
  const m = /^(\d{1,2})-([IVX]+)-(\d{4})$/.exec(value.trim());
  const month = m ? ROMAN[m[2]] : undefined;
  if (!m || !month || Number(m[1]) < 1 || Number(m[1]) > 31) throw Error(`Invalid HCCH date: ${value}`);
  return `${m[3]}-${String(month).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

const TYPES: Record<string, InstrumentType> = { R: "ratification", A: "accession", Su: "succession" };

export const HCCH_CONTRACTING_PARTIES: readonly HcchContractingParty[] = STATUS_ROWS.trim()
  .split("\n")
  .map((row) => {
    const [name, iso2, signature, instrument, type, eif, res] = row.split("|");
    if (!TYPES[type]) throw Error(`Invalid HCCH instrument type in row: ${row}`);
    return {
      name,
      iso2,
      signature: signature ? hcchDate(signature) : null,
      instrument: hcchDate(instrument),
      type: TYPES[type],
      entryIntoForce: hcchDate(eif),
      hasDeclarations: Boolean(res),
    };
  });

// Territorial units with their own entry into force, or excluded parts of a Contracting Party.
// appliesFrom null with applies=false: the Convention does not apply there.
export type HcchTerritory = {
  code: string; // ISO 3166-1 alpha-2 where one exists
  name: string;
  party: string; // iso2 of the State responsible
  applies: boolean;
  appliesFrom: string | null;
  note: string;
};

export const HCCH_TERRITORIES: readonly HcchTerritory[] = [
  { code: "HK", name: "Hong Kong SAR", party: "CN", applies: true, appliesFrom: "1965-04-25", note: "Continued to apply from 1 July 1997 (China notification). China's non-recognition declaration applies." },
  { code: "MO", name: "Macao SAR", party: "CN", applies: true, appliesFrom: "1969-02-04", note: "Continued to apply from 20 December 1999 (China notification). China's non-recognition declaration applies." },
  ...["AI|Anguilla", "BM|Bermuda", "VG|British Virgin Islands", "KY|Cayman Islands", "FK|Falkland Islands", "GI|Gibraltar", "MS|Montserrat", "SH|Saint Helena, Ascension and Tristan da Cunha", "TC|Turks and Caicos Islands"].map((t) => {
    const [code, name] = t.split("|");
    return { code, name, party: "GB", applies: true, appliesFrom: "1965-04-25", note: "United Kingdom extension of 24 February 1965." };
  }),
  { code: "AQ-BAT", name: "British Antarctic Territory", party: "GB", applies: true, appliesFrom: "1965-04-25", note: "United Kingdom extension of 24 February 1965; objected to by Argentina." },
  ...["GG|Guernsey", "IM|Isle of Man", "JE|Jersey"].map((t) => {
    const [code, name] = t.split("|");
    return { code, name, party: "GB", applies: true, appliesFrom: "1965-01-24", note: "United Kingdom extension of 21 August 1964." };
  }),
  ...["AW|Aruba", "CW|Curaçao", "SX|Sint Maarten", "BQ|Caribbean Netherlands (Bonaire, Sint Eustatius, Saba)"].map((t) => {
    const [code, name] = t.split("|");
    return { code, name, party: "NL", applies: true, appliesFrom: null, note: "Kingdom of the Netherlands (declaration of 18 October 2010); confirm the competent authority before release." };
  }),
  { code: "FO", name: "Faroe Islands", party: "DK", applies: true, appliesFrom: null, note: "Denmark withdrew its territorial exclusion on 14 October 2021; confirm the effective date before release." },
  { code: "GL", name: "Greenland", party: "DK", applies: false, appliesFrom: null, note: "Denmark declared on 30 October 2006 that the Convention does not yet apply to Greenland." },
  { code: "TK", name: "Tokelau", party: "NZ", applies: false, appliesFrom: null, note: "New Zealand's accession does not extend to Tokelau unless a declaration is lodged." },
  // Former extensions that ended at independence without succession: not Contracting Parties.
  ...["KI|Kiribati|1979-07-12", "SB|Solomon Islands|1978-07-07", "TV|Tuvalu|1978-10-01", "ZW|Zimbabwe|1980-04-18"].map((t) => {
    const [code, name, ended] = t.split("|");
    return { code, name, party: "GB", applies: false, appliesFrom: null, note: `United Kingdom extension terminated on ${ended} (independence); no succession or accession recorded.` };
  }),
];

// Article 12(2) objections to an accession, and their withdrawals. While an objection stands the
// Convention does not apply between the two States. withdrawnEffective is the date the Convention
// entered into force between them. late=true: received after the six-month period, no legal effect.
export type HcchObjection = {
  objector: string;
  acceding: string;
  raised: string | null;
  withdrawnEffective: string | null;
  late?: boolean;
  scope?: string; // e.g. China's objection to Kosovo covers Hong Kong and Macao
};

const o = (objector: string, acceding: string, raised: string | null, withdrawnEffective: string | null = null, extra: Partial<HcchObjection> = {}): HcchObjection => ({ objector, acceding, raised, withdrawnEffective, ...extra });

export const HCCH_OBJECTIONS: readonly HcchObjection[] = [
  // Albania (period expired 10 March 2004)
  o("BE", "AL", null, "2015-12-21"), o("DE", "AL", null, "2016-12-09"), o("GR", "AL", null, "2018-02-26"), o("IT", "AL", null, "2011-05-26"), o("ES", "AL", null, "2017-02-07"),
  // Algeria
  o("AT", "DZ", "2026-04-20"), o("GR", "DZ", "2026-05-07"), o("DE", "DZ", "2026-03-06"),
  // Azerbaijan
  o("BE", "AZ", "2005-01-21", null, { late: true }), o("HU", "AZ", "2004-12-31", "2005-03-10"), o("DE", "AZ", "2004-12-27", "2026-03-16"), o("NL", "AZ", "2004-12-24", "2010-08-10"),
  // Bangladesh
  ...["LT|2025-01-27", "AR|2025-01-24", "DK|2025-01-24", "FR|2025-01-23", "GR|2025-01-21", "EE|2025-01-16", "NL|2025-01-14", "BE|2025-01-13", "FI|2025-01-13", "AT|2024-12-23", "CZ|2024-12-12", "DE|2024-09-10"].map((x) => { const [c, d] = x.split("|"); return o(c, "BD", d); }),
  // Burundi
  o("AT", "BI", "2014-11-28"), o("DE", "BI", "2014-12-11"), o("CZ", "BI", "2014-12-12"), o("PL", "BI", "2014-12-15"),
  // China
  o("IN", "CN", "2023-09-08"),
  // Dominican Republic
  o("AT", "DO", "2009-06-24", "2023-01-30"), o("BE", "DO", "2009-06-24", "2019-03-08"), o("DE", "DO", "2009-06-11"), o("NL", "DO", "2009-06-26", "2017-11-03"),
  // Georgia
  o("DE", "GE", null, "2010-02-03"), o("GR", "GE", null, "2015-12-17"),
  // India (period expired 15 May 2005)
  o("BE", "IN", "2005-04-20", "2008-01-09"), o("DE", "IN", "2005-04-21"), o("FI", "IN", "2005-05-02", "2009-10-05"), o("NL", "IN", "2005-05-13", "2008-09-16"), o("ES", "IN", "2005-05-13", "2008-02-12"), o("PT", "IN", "2005-05-25", null, { late: true }),
  // Kosovo
  ...["AR|2016-05-03", "AM|2016-05-11", "AT|2016-05-13", "AZ|2016-02-22", "BY|2016-02-24", "CY|2016-01-26", "EC|2016-06-17", "GE|2016-01-15", "DE|2016-05-12", "GR|2016-05-12", "IN|2016-05-10", "MU|2016-03-31", "MX|2016-01-20", "MD|2016-02-24", "NA|2016-05-13", "NI|2016-04-19", "PY|2016-05-10", "PE|2016-05-13", "RO|2016-01-07", "RS|2015-12-23", "SK|2016-05-03", "UA|2016-04-18", "UZ|2016-05-10", "VE|2016-05-10"].map((x) => { const [c, d] = x.split("|"); return o(c, "XK", d); }),
  o("CN", "XK", "2016-01-29", null, { scope: "Includes the Hong Kong and Macao Special Administrative Regions." }),
  o("IL", "XK", "2016-05-11", "2024-11-20"), o("PL", "XK", "2016-05-13", "2024-03-01"),
  // Kyrgyzstan
  o("BE", "KG", "2011-04-27", "2025-06-11"), o("AT", "KG", "2011-05-19"), o("DE", "KG", "2011-05-23", "2024-10-07"), o("GR", "KG", "2011-05-24"),
  // Liberia (period expired 10 December 1995)
  o("BE", "LR", null), o("DE", "LR", null), o("US", "LR", null, "2015-05-20"),
  // Mongolia
  o("AT", "MN", "2009-09-18"), o("BE", "MN", "2009-10-21"), o("FI", "MN", "2009-10-28"), o("DE", "MN", "2009-10-22"), o("GR", "MN", "2009-10-30"),
  // Morocco
  o("DE", "MA", "2016-06-14"),
  // Pakistan
  ...["GR|2023-01-05", "DK|2023-01-02", "NL|2022-12-15", "FI|2022-12-12", "AT|2022-12-12", "PL|2022-11-30", "CZ|2022-11-23", "DE|2022-10-24"].map((x) => { const [c, d] = x.split("|"); return o(c, "PK", d); }),
  // Paraguay
  o("DE", "PY", "2014-06-10", "2022-01-06"),
  // Peru
  o("DE", "PE", "2010-07-15", "2014-01-01"), o("GR", "PE", "2010-07-28", "2024-07-26"),
  // Philippines
  o("DE", "PH", "2019-01-29"), o("FI", "PH", "2019-02-07", "2025-08-22"), o("AT", "PH", "2019-03-05", "2023-06-01"), o("GR", "PH", "2019-03-12", "2024-06-25"),
  // Republic of Moldova
  o("DE", "MD", "2007-01-05", "2026-07-17"),
  // Rwanda
  o("DE", "RW", "2024-03-28"),
  // Senegal
  o("DE", "SN", "2023-01-18"), o("NL", "SN", "2023-01-17", "2026-01-28"), o("AT", "SN", "2023-01-12"),
  // Tajikistan
  o("AT", "TJ", null), o("BE", "TJ", null), o("DE", "TJ", null),
  // Tunisia
  o("DE", "TN", "2017-12-01"), o("AT", "TN", "2018-01-12"), o("GR", "TN", "2018-01-25"), o("BE", "TN", "2018-01-26", "2025-06-11"),
  // Ukraine
  o("BE", "UA", "2003-10-03", "2004-07-05"), o("DE", "UA", "2003-10-20", "2010-07-22"),
  // Uzbekistan
  o("BE", "UZ", "2012-01-13", "2025-06-11"), o("DE", "UZ", "2012-02-01"), o("AT", "UZ", "2012-02-03"), o("GR", "UZ", "2012-02-08", "2026-10-30"),
  // Viet Nam
  o("CZ", "VN", "2026-07-02"), o("AT", "VN", "2026-06-19"), o("DE", "VN", "2026-05-20"),
];

// Declarations under which the Convention does not apply between two Parties (not Art. 12 objections).
export type HcchNonApplication = { party: string; counterpart: string; basis: string };

export const HCCH_DECLARED_NON_APPLICATION: readonly HcchNonApplication[] = [
  { party: "PK", counterpart: "IN", basis: "Pakistan declaration of 8 July 2022: the Convention shall not apply to India." },
  // Kosovo: the depositary lists these States, which made declarations rather than Art. 12 objections,
  // among those with which the Convention will not enter into force for Kosovo.
  ...["BR", "CL", "RU", "ES"].map((c) => ({ party: c, counterpart: "XK", basis: "Listed by the depositary among the States with which the Convention does not enter into force for Kosovo (declarations)." })),
];

// Parties whose declarations exclude States they do not recognise; the relationship with a
// counterpart that is not universally recognised needs official review.
export const HCCH_RECOGNITION_RESERVATIONS: readonly string[] = ["CN", "PH", "PK", "GT"];

// Declarations limiting the documents or uses covered. These never block on their own; they
// require official review for the affected document categories.
export type HcchDocumentLimitation = { party: string; category: string; note: string };

export const HCCH_DOCUMENT_LIMITATIONS: readonly HcchDocumentLimitation[] = [
  { party: "RW", category: "power_of_attorney_property", note: "Rwanda excludes powers of attorney for property from certification under the Convention (declaration of 6 October 2023)." },
  { party: "ID", category: "prosecutor_document", note: "Indonesia excludes documents issued by its prosecutor office (declaration of 5 October 2021; objected to as a reservation by Germany, France and the Netherlands)." },
  { party: "OM", category: "commercial_or_customs_document", note: "Oman considers the Convention inapplicable to commercial and customs documents of any kind (declaration of 23 March 2021)." },
  { party: "US", category: "extradition_document", note: "United States: an apostille does not satisfy 18 U.S.C. 3190 for extradition documents." },
  { party: "PH", category: "extradition_document", note: "Philippines: an apostille does not satisfy the Philippine Extradition Law." },
];

// Regions whose de facto authorities' documents are not accepted (declarations of Ukraine, Georgia
// and of many Parties regarding Crimea). Origin documents from these regions require review.
export const HCCH_UNCONTROLLED_TERRITORY_NOTES: Readonly<Record<string, string>> = {
  UA: "Documents issued by de facto authorities in the Autonomous Republic of Crimea, Sevastopol and other territories not under Ukraine's control are not accepted (Ukraine declarations of 2015, 2022 and 2023).",
  GE: "The Convention does not apply to documents issued by de facto authorities in Abkhazia and the former Autonomous District of South Ossetia (Georgia declaration).",
};

export function hcchParty(iso2: string): HcchContractingParty | undefined {
  const code = iso2.trim().toUpperCase();
  return HCCH_CONTRACTING_PARTIES.find((p) => p.iso2 === code);
}

export function hcchTerritory(code: string): HcchTerritory | undefined {
  const c = code.trim().toUpperCase();
  return HCCH_TERRITORIES.find((t) => t.code === c);
}
