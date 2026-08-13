import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_FILE = "Milano_Seal_Command_Center_OS_v3_BRANDED_Damiani_3rd_DAMIANI50_Prefill.xlsx";
const SOURCE_COMMIT = "7dc2aa37eacb5c8f23a9995c11025f3b7b127729";
const sourcePath = path.join(ROOT, SOURCE_FILE);
const outputPath = path.join(ROOT, "data/command-center/workbook-intelligence.generated.json");

function xmlEntry(entry) {
  return execFileSync("unzip", ["-p", sourcePath, entry], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
}

function decodeXml(value = "") {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function stripTags(value = "") {
  return decodeXml(value.replace(/<[^>]+>/g, ""));
}

function sharedStrings() {
  let xml = "";
  try { xml = xmlEntry("xl/sharedStrings.xml"); } catch { return []; }
  return [...xml.matchAll(/<(?:\w+:)?si[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/g)].map((match) =>
    [...match[1].matchAll(/<(?:\w+:)?t(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?t>/g)]
      .map((part) => decodeXml(part[1]))
      .join(""),
  );
}

function workbookSheetEntries() {
  const workbook = xmlEntry("xl/workbook.xml");
  const rels = xmlEntry("xl/_rels/workbook.xml.rels");
  const relationTargets = new Map();
  for (const m of rels.matchAll(/<Relationship\b([^>]*)\/?\s*>/g)) {
    const attrs = m[1];
    const id = attrs.match(/\bId="([^"]+)"/)?.[1];
    const target = attrs.match(/\bTarget="([^"]+)"/)?.[1];
    if (id && target) relationTargets.set(id, target);
  }
  const entries = new Map();
  for (const m of workbook.matchAll(/<(?:\w+:)?sheet\b([^>]*)\/?\s*>/g)) {
    const attrs = m[1];
    const name = attrs.match(/\bname="([^"]+)"/)?.[1];
    const relId = attrs.match(/\br:id="([^"]+)"/)?.[1];
    if (!name || !relId) continue;
    const target = relationTargets.get(relId);
    if (!target) continue;
    entries.set(decodeXml(name), target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`);
  }
  return entries;
}

function colIndex(ref) {
  const letters = String(ref).match(/^[A-Z]+/)?.[0] ?? "A";
  let n = 0;
  for (const char of letters) n = n * 26 + (char.charCodeAt(0) - 64);
  return n - 1;
}

function parseWorksheet(entry, shared) {
  const xml = xmlEntry(entry);
  const rows = [];
  for (const rowMatch of xml.matchAll(/<(?:\w+:)?row\b[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/(?:\w+:)?row>/g)) {
    const rowNumber = Number(rowMatch[1]);
    const cells = [];
    for (const cellMatch of rowMatch[2].matchAll(/<(?:\w+:)?c\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?c>/g)) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const ref = attrs.match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!ref) continue;
      const type = attrs.match(/\bt="([^"]+)"/)?.[1] ?? "n";
      let raw = body.match(/<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/)?.[1];
      if (raw == null && type === "inlineStr") raw = body.match(/<(?:\w+:)?is>([\s\S]*?)<\/(?:\w+:)?is>/)?.[1] ?? "";
      let value = null;
      if (type === "s" && raw != null) value = shared[Number(raw)] ?? null;
      else if (type === "inlineStr") value = stripTags(raw ?? "");
      else if (type === "str") value = decodeXml(raw ?? "");
      else if (type === "b") value = raw === "1";
      else if (raw != null && raw !== "") value = Number.isFinite(Number(raw)) ? Number(raw) : decodeXml(raw);
      cells[colIndex(ref)] = value;
    }
    rows[rowNumber] = cells;
  }
  return rows;
}

function headerMap(row) {
  const map = new Map();
  row.forEach((value, index) => { if (value != null && value !== "") map.set(String(value), index); });
  return map;
}

function cell(row, headers, name) {
  const index = headers.get(name);
  return index == null ? null : row[index] ?? null;
}

function money(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function cleanText(value) {
  const text = String(value ?? "").trim();
  return text && text !== "=" ? text : null;
}

function stableDealId(row, headers, rowNumber) {
  const id = cleanText(cell(row, headers, "Deal_ID"));
  if (id) return id;
  const name = cleanText(cell(row, headers, "Client_Name"));
  const known = {
    Abujhaisha: "MS-2026-005",
    Colombia_Apostille_Lead: "MS-LEAD-2026-006",
    Damiani_Irene_Third_Matter: "MS-DAMIANI-2026-003",
  };
  return known[name] ?? `WORKBOOK-COMMAND-CENTER-${rowNumber}`;
}

function canonicalClientName(raw) {
  const name = String(raw ?? "").trim();
  if (["Damiani_Irene", "Damiani_Irene_POA", "Damiani_Irene_Third_Matter"].includes(name)) return "Irene Damiani";
  if (name === "Loutzy_Matthew") return "Matthew Loutzy";
  if (name === "Ryan_Content_Trade") return "Ryan";
  if (name === "Colombia_Apostille_Lead") return "Colombia Apostille Lead";
  return name.replaceAll("_", " ");
}

function inferProtectedCode(notes) {
  return /DAMIANI50/i.test(notes ?? "") ? "DAMIANI50" : null;
}

function recordKind(status, amountPaid) {
  if (String(status).toLowerCase() === "lost") return "lost_opportunity";
  if (money(amountPaid) > 0) return "collected_payment";
  return "matter_opportunity";
}

const sourceBytes = readFileSync(sourcePath);
const sourceSha256 = createHash("sha256").update(sourceBytes).digest("hex");
const shared = sharedStrings();
const entries = workbookSheetEntries();
const ccRows = parseWorksheet(entries.get("COMMAND_CENTER"), shared);
const regRows = parseWorksheet(entries.get("CLIENT_REGISTRY"), shared);
const ccHeaders = headerMap(ccRows[2] ?? []);
const regHeaders = headerMap(regRows[2] ?? []);

const deals = [];
for (let rowNumber = 3; rowNumber < ccRows.length; rowNumber++) {
  const row = ccRows[rowNumber];
  if (!row) continue;
  const rawClient = cleanText(cell(row, ccHeaders, "Client_Name"));
  if (!rawClient) continue;
  const quotedValue = money(cell(row, ccHeaders, "Quoted_Price"));
  const finalValue = money(cell(row, ccHeaders, "Final_Price"));
  const amountPaid = money(cell(row, ccHeaders, "Amount_Paid"));
  const notes = cleanText(cell(row, ccHeaders, "Notes")) ?? "";
  const sourceLink = cleanText(cell(row, ccHeaders, "Folder_Link"));
  const phone = sourceLink?.startsWith("tel:") ? sourceLink.slice(4) : (notes.match(/\+1 \(\d{3}\) \d{3}-\d{4}/)?.[0]?.replace(/[^+\d]/g, "") ?? null);
  const referralSource = cleanText(cell(row, ccHeaders, "Referral_Source"));
  const status = cleanText(cell(row, ccHeaders, "Status")) ?? "Unknown";
  const closeStatus = cleanText(cell(row, ccHeaders, "Close_Status")) ?? (status === "Lost" ? "Lost" : "Open");
  const id = stableDealId(row, ccHeaders, rowNumber);
  deals.push({
    id,
    sourceRow: rowNumber,
    sourceRecordId: id,
    clientName: canonicalClientName(rawClient),
    sourceClientName: rawClient,
    clientType: cleanText(cell(row, ccHeaders, "Client_Type")) ?? "Unknown",
    country: cleanText(cell(row, ccHeaders, "Country")),
    referralSource,
    serviceType: cleanText(cell(row, ccHeaders, "Service_Type")),
    documentScope: cleanText(cell(row, ccHeaders, "Document_Type")),
    lane: cleanText(cell(row, ccHeaders, "Lane")),
    status,
    stage: cleanText(cell(row, ccHeaders, "Stage_Group")) ?? (status === "Lost" || status === "Completed" ? "Closed" : "Pre-Revenue"),
    closeStatus,
    quotedValue,
    finalValue,
    collectedRevenue: amountPaid,
    paymentStatus: amountPaid > 0 ? "Collected" : "None",
    protectedCode: inferProtectedCode(notes),
    phone,
    sourceUrl: sourceLink && !sourceLink.startsWith("tel:") ? sourceLink : null,
    externalOrderId: referralSource === "Snapdocs" ? (sourceLink?.match(/orders\/(\d+)/)?.[1] ?? notes.match(/Snapdocs order (\d+)/i)?.[1] ?? null) : null,
    recordKind: recordKind(status, amountPaid),
    notes: notes ? [notes] : [],
  });
}

const clientRegistryRows = [];
for (let rowNumber = 3; rowNumber < regRows.length; rowNumber++) {
  const row = regRows[rowNumber];
  if (!row) continue;
  const name = cleanText(cell(row, regHeaders, "Client_Name"));
  if (!name) continue;
  clientRegistryRows.push({
    sourceRow: rowNumber,
    clientId: cleanText(cell(row, regHeaders, "Client_ID")) ?? `WORKBOOK-CLIENT-${rowNumber}`,
    clientName: name,
    clientType: cleanText(cell(row, regHeaders, "Client_Type")) ?? "Unknown",
    organization: cleanText(cell(row, regHeaders, "Organization")),
    email: cleanText(cell(row, regHeaders, "Email")),
    phone: cleanText(cell(row, regHeaders, "Phone")),
    country: cleanText(cell(row, regHeaders, "Country")),
    referralSource: cleanText(cell(row, regHeaders, "Referral_Source")),
  });
}

const clientAliases = new Map([
  ["Irene Damiani", ["Irene Damiani"]],
  ["Matthew Loutzy", ["Matthew Loutzy"]],
  ["Ryan", ["Ryan"]],
  ["Abujhaisha", ["Abujhaisha"]],
]);

const clients = clientRegistryRows.map((client) => {
  const aliases = clientAliases.get(client.clientName) ?? [client.clientName];
  const related = deals.filter((deal) => aliases.includes(deal.clientName));
  return {
    ...client,
    totalHistoricalAndOpportunityRecords: related.length,
    lifetimeCollectedValue: Math.round(related.reduce((sum, deal) => sum + deal.collectedRevenue, 0) * 100) / 100,
    openOpportunities: related.filter((deal) => deal.closeStatus === "Open").length,
    lostOpportunities: related.filter((deal) => deal.closeStatus === "Lost").length,
    completedDeals: related.filter((deal) => deal.recordKind === "collected_payment").length,
  };
});

const output = {
  schemaVersion: 2,
  generatedAt: "deterministic-from-source",
  source: {
    file: SOURCE_FILE,
    commit: SOURCE_COMMIT,
    sha256: sourceSha256,
    authority: "evidence_only",
  },
  deals,
  clients,
  collectedRevenue: Math.round(deals.reduce((sum, deal) => sum + deal.collectedRevenue, 0) * 100) / 100,
  sourceAttribution: Object.fromEntries(deals.filter((deal) => deal.referralSource).map((deal) => [deal.id, deal.referralSource])),
};

const serialized = `${JSON.stringify(output, null, 2)}\n`;
if (process.argv.includes("--check")) {
  const current = readFileSync(outputPath, "utf8");
  if (current !== serialized) {
    console.error("Workbook intelligence projection is stale. Run npm run generate:command-center-workbook.");
    process.exit(1);
  }
  console.log(`Workbook projection verified: ${sourceSha256}`);
} else {
  writeFileSync(outputPath, serialized);
  console.log(`Generated ${path.relative(ROOT, outputPath)} from ${SOURCE_FILE}`);
  console.log(`Source SHA-256: ${sourceSha256}`);
}
