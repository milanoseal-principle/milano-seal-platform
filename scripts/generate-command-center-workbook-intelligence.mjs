import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_FILE =
  "Milano_Seal_Command_Center_OS_v3_BRANDED_Damiani_3rd_DAMIANI50_Prefill.xlsx";
const SOURCE_COMMIT = "7dc2aa37eacb5c8f23a9995c11025f3b7b127729";
const sourcePath = path.join(ROOT, SOURCE_FILE);
const outputPath = path.join(
  ROOT,
  "data/command-center/workbook-intelligence.generated.json",
);

function xmlEntry(entry) {
  if (!entry) throw new Error("Workbook sheet entry is missing.");

  const zip = readFileSync(sourcePath);
  const nameBytes = Buffer.from(entry);
  let offset = 0;

  while (offset + 30 <= zip.length) {
    const signature = zip.readUInt32LE(offset);
    if (signature !== 0x04034b50) break;

    const flags = zip.readUInt16LE(offset + 6);
    const method = zip.readUInt16LE(offset + 8);
    const compressedSize = zip.readUInt32LE(offset + 18);
    const fileNameLength = zip.readUInt16LE(offset + 26);
    const extraLength = zip.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const nameEnd = nameStart + fileNameLength;
    const dataStart = nameEnd + extraLength;
    const fileName = zip.subarray(nameStart, nameEnd);

    if ((flags & 0x08) !== 0) {
      throw new Error(
        `WORKBOOK_ZIP_UNSUPPORTED: data descriptor entry ${fileName.toString("utf8")}`,
      );
    }

    if (fileName.equals(nameBytes)) {
      const dataEnd = dataStart + compressedSize;
      const payload = zip.subarray(dataStart, dataEnd);
      if (method === 0) return payload.toString("utf8");
      if (method === 8) return inflateRawSync(payload).toString("utf8");
      throw new Error(
        `WORKBOOK_ZIP_UNSUPPORTED: compression method ${method} for ${entry}`,
      );
    }

    offset = dataStart + compressedSize;
  }

  throw new Error(`Workbook ZIP entry not found: ${entry}`);
}

function decodeXml(value = "") {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16)),
    );
}

function stripTags(value = "") {
  return decodeXml(value.replace(/<[^>]+>/g, ""));
}

function sharedStrings() {
  let xml = "";
  try {
    xml = xmlEntry("xl/sharedStrings.xml");
  } catch {
    return [];
  }

  // An XLSX shared string can contain multiple rich-text runs. Concatenate every
  // descendant <t> in order rather than assuming a single plain <t> node.
  return [
    ...xml.matchAll(
      /<(?:\w+:)?si[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/g,
    ),
  ].map((match) =>
    [
      ...match[1].matchAll(
        /<(?:\w+:)?t(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?t>/g,
      ),
    ]
      .map((part) => decodeXml(part[1]))
      .join(""),
  );
}

function workbookSheetEntries() {
  const workbook = xmlEntry("xl/workbook.xml");
  const rels = xmlEntry("xl/_rels/workbook.xml.rels");
  const relationTargets = new Map();

  for (const match of rels.matchAll(/<Relationship\b([^>]*)\/?\s*>/g)) {
    const attrs = match[1];
    const id = attrs.match(/\bId="([^"]+)"/)?.[1];
    const target = attrs.match(/\bTarget="([^"]+)"/)?.[1];
    if (id && target) relationTargets.set(id, target);
  }

  const entries = new Map();
  for (const match of workbook.matchAll(/<(?:\w+:)?sheet\b([^>]*)\/?\s*>/g)) {
    const attrs = match[1];
    const name = attrs.match(/\bname="([^"]+)"/)?.[1];
    const relId = attrs.match(/\br:id="([^"]+)"/)?.[1];
    if (!name || !relId) continue;
    const target = relationTargets.get(relId);
    if (!target) continue;
    entries.set(
      decodeXml(name),
      target.startsWith("/")
        ? target.slice(1)
        : `xl/${target.replace(/^\.\//, "")}`,
    );
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

  for (const rowMatch of xml.matchAll(
    /<(?:\w+:)?row\b[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/(?:\w+:)?row>/g,
  )) {
    const rowNumber = Number(rowMatch[1]);
    const cells = [];

    // Use the cell reference (A/B/C...) as the column position. This is critical
    // for sparse XLSX rows: missing cells must not shift later values left.
    for (const cellMatch of rowMatch[2].matchAll(
      /<(?:\w+:)?c\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?c>/g,
    )) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const ref = attrs.match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!ref) continue;

      const type = attrs.match(/\bt="([^"]+)"/)?.[1] ?? "n";
      let raw = body.match(
        /<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/,
      )?.[1];
      if (raw == null && type === "inlineStr") {
        raw =
          body.match(
            /<(?:\w+:)?is>([\s\S]*?)<\/(?:\w+:)?is>/,
          )?.[1] ?? "";
      }

      let value = null;
      if (type === "s" && raw != null) value = shared[Number(raw)] ?? null;
      else if (type === "inlineStr") value = stripTags(raw ?? "");
      else if (type === "str") value = decodeXml(raw ?? "");
      else if (type === "b") value = raw === "1";
      else if (raw != null && raw !== "") {
        value = Number.isFinite(Number(raw)) ? Number(raw) : decodeXml(raw);
      }

      cells[colIndex(ref)] = value;
    }
    rows[rowNumber] = cells;
  }
  return rows;
}

function headerKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function headerMap(row) {
  const map = new Map();
  row.forEach((value, index) => {
    if (value == null || value === "") return;
    map.set(headerKey(value), index);
  });
  return map;
}

function cell(row, headers, ...names) {
  for (const name of names) {
    const index = headers.get(headerKey(name));
    if (index != null) return row[index] ?? null;
  }
  return null;
}

function money(value) {
  if (typeof value === "string") {
    const normalized = value.replace(/[$,]/g, "").trim();
    const n = Number(normalized || 0);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
  }
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function cleanText(value) {
  const text = String(value ?? "").trim();
  return text && text !== "=" ? text : null;
}

function canonicalClientName(raw) {
  const name = String(raw ?? "").trim();
  if (
    [
      "Damiani_Irene",
      "Damiani_Irene_POA",
      "Damiani_Irene_Third_Matter",
    ].includes(name)
  ) {
    return "Irene Damiani";
  }
  if (name === "Loutzy_Matthew") return "Matthew Loutzy";
  if (name === "Ryan_Content_Trade") return "Ryan";
  if (name === "Colombia_Apostille_Lead") return "Colombia Apostille Lead";
  return name.replaceAll("_", " ");
}

function stableDealId(row, headers, rowNumber) {
  const id = cleanText(cell(row, headers, "Deal_ID", "Deal ID", "Matter_ID"));
  if (id) return id;
  const name = cleanText(cell(row, headers, "Client_Name", "Client Name"));
  const known = {
    Abujhaisha: "MS-2026-005",
    Colombia_Apostille_Lead: "MS-LEAD-2026-006",
    Damiani_Irene_Third_Matter: "MS-DAMIANI-2026-003",
  };
  return known[name] ?? `WORKBOOK-COMMAND-CENTER-${rowNumber}`;
}

function inferProtectedCode(notes) {
  return /DAMIANI50/i.test(notes ?? "") ? "DAMIANI50" : null;
}

function recordKind(status, amountPaid) {
  if (String(status).toLowerCase() === "lost") return "lost_opportunity";
  if (money(amountPaid) > 0) return "collected_payment";
  return "matter_opportunity";
}

function phoneFromRow(row, headers, notes, sourceLink) {
  const explicit = cleanText(
    cell(row, headers, "Phone", "Phone_Number", "Telephone"),
  );
  if (explicit) return explicit;
  if (sourceLink?.startsWith("tel:")) return sourceLink.slice(4);
  return notes.match(/\+1\s*\(\d{3}\)\s*\d{3}-\d{4}/)?.[0] ?? null;
}

function assertProjection(output) {
  const fail = (message) => {
    throw new Error(`WORKBOOK_PROJECTION_INVALID: ${message}`);
  };

  const clientNames = new Set(output.clients.map((client) => client.clientName));
  for (const required of [
    "Irene Damiani",
    "Matthew Loutzy",
    "Ryan",
    "Abujhaisha",
  ]) {
    if (!clientNames.has(required)) fail(`CLIENT_REGISTRY missing ${required}`);
  }

  const abujhaisha = output.deals.find(
    (deal) =>
      deal.clientName === "Abujhaisha" &&
      deal.recordKind === "collected_payment",
  );
  if (!abujhaisha) fail("Abujhaisha collected record missing");
  if (abujhaisha.collectedRevenue !== 120)
    fail("Abujhaisha collected revenue must be 120");
  if (abujhaisha.referralSource !== "Snapdocs")
    fail("Abujhaisha referral source must be Snapdocs");
  if (String(abujhaisha.externalOrderId ?? "") !== "10903839")
    fail("Abujhaisha Snapdocs order must be 10903839");

  const colombia = output.deals.find(
    (deal) => deal.clientName === "Colombia Apostille Lead",
  );
  if (!colombia) fail("Colombia lead missing");
  if (colombia.quotedValue !== 500)
    fail("Colombia lost quote must be 500");
  if (colombia.collectedRevenue !== 0)
    fail("Colombia lead must remain zero collected revenue");
  if (!/813[^0-9]*917[^0-9]*7190/.test(String(colombia.phone ?? "")))
    fail("Colombia phone did not normalize to the 813-917-7190 source record");

  const damianiLost = output.deals.find(
    (deal) =>
      deal.clientName === "Irene Damiani" &&
      deal.closeStatus === "Lost" &&
      deal.quotedValue === 1100,
  );
  if (!damianiLost) fail("Damiani rejected 1100 opportunity missing");
  if (damianiLost.collectedRevenue !== 0)
    fail("Damiani rejected scope must remain zero collected revenue");

  const damianiOpen = output.deals.find(
    (deal) => deal.id === "MS-DAMIANI-2026-003",
  );
  if (!damianiOpen) fail("Damiani third Matter missing");
  if (damianiOpen.protectedCode !== "DAMIANI50")
    fail("Damiani third Matter must preserve DAMIANI50 as protected code evidence");
  if (damianiOpen.collectedRevenue !== 0)
    fail("Damiani third Matter must remain pre-revenue in workbook evidence");
}

const sourceBytes = readFileSync(sourcePath);
const sourceSha256 = createHash("sha256").update(sourceBytes).digest("hex");
const shared = sharedStrings();
const entries = workbookSheetEntries();
const ccRows = parseWorksheet(entries.get("COMMAND_CENTER"), shared);
const regRows = parseWorksheet(entries.get("CLIENT_REGISTRY"), shared);
const ccHeaders = headerMap(ccRows[2] ?? []);
const regHeaders = headerMap(regRows[2] ?? []);

if (!ccHeaders.size) throw new Error("COMMAND_CENTER header row 2 is missing.");
if (!regHeaders.size) throw new Error("CLIENT_REGISTRY header row 2 is missing.");

const deals = [];
for (let rowNumber = 3; rowNumber < ccRows.length; rowNumber++) {
  const row = ccRows[rowNumber];
  if (!row) continue;
  const rawClient = cleanText(cell(row, ccHeaders, "Client_Name", "Client Name"));
  if (!rawClient) continue;

  const quotedValue = money(
    cell(row, ccHeaders, "Quoted_Price", "Quoted Price", "Quoted_Value", "Quote"),
  );
  const finalValue = money(
    cell(row, ccHeaders, "Final_Price", "Final Price", "Final_Value"),
  );
  const amountPaid = money(
    cell(row, ccHeaders, "Amount_Paid", "Amount Paid", "Collected"),
  );
  const notes = cleanText(cell(row, ccHeaders, "Notes", "Internal_Notes")) ?? "";
  const sourceLink = cleanText(
    cell(row, ccHeaders, "Folder_Link", "Source_URL", "Source_Link", "Folder Link"),
  );
  const referralSource = cleanText(
    cell(row, ccHeaders, "Referral_Source", "Referral Source", "Source"),
  );
  const status =
    cleanText(cell(row, ccHeaders, "Status", "Matter_Status")) ?? "Unknown";
  const closeStatus =
    cleanText(cell(row, ccHeaders, "Close_Status", "Close Status")) ??
    (status === "Lost" ? "Lost" : status === "Completed" ? "Closed" : "Open");
  const id = stableDealId(row, ccHeaders, rowNumber);
  const phone = phoneFromRow(row, ccHeaders, notes, sourceLink);

  deals.push({
    id,
    sourceRow: rowNumber,
    sourceRecordId: id,
    clientName: canonicalClientName(rawClient),
    sourceClientName: rawClient,
    clientType:
      cleanText(cell(row, ccHeaders, "Client_Type", "Client Type")) ?? "Unknown",
    country: cleanText(cell(row, ccHeaders, "Country", "Destination_Country")),
    referralSource,
    serviceType: cleanText(
      cell(row, ccHeaders, "Service_Type", "Service Type", "Service"),
    ),
    documentScope: cleanText(
      cell(
        row,
        ccHeaders,
        "Document_Type",
        "Document Type",
        "Document_Scope",
        "Document Scope",
      ),
    ),
    lane: cleanText(cell(row, ccHeaders, "Lane", "Service_Lane")),
    status,
    stage:
      cleanText(cell(row, ccHeaders, "Stage_Group", "Stage Group", "Stage")) ??
      (status === "Lost" || status === "Completed" ? "Closed" : "Pre-Revenue"),
    closeStatus,
    quotedValue,
    finalValue,
    collectedRevenue: amountPaid,
    paymentStatus: amountPaid > 0 ? "Collected" : "None",
    protectedCode: inferProtectedCode(notes),
    phone,
    sourceUrl: sourceLink && !sourceLink.startsWith("tel:") ? sourceLink : null,
    externalOrderId:
      referralSource === "Snapdocs"
        ? sourceLink?.match(/orders\/(\d+)/)?.[1] ??
          notes.match(/(?:Snapdocs\s+)?order\s*#?\s*(\d+)/i)?.[1] ??
          cleanText(cell(row, ccHeaders, "Order_ID", "Order ID", "External_Order_ID"))
        : null,
    recordKind: recordKind(status, amountPaid),
    notes: notes ? [notes] : [],
  });
}

const clientRegistryRows = [];
for (let rowNumber = 3; rowNumber < regRows.length; rowNumber++) {
  const row = regRows[rowNumber];
  if (!row) continue;
  const rawName = cleanText(cell(row, regHeaders, "Client_Name", "Client Name"));
  if (!rawName) continue;

  clientRegistryRows.push({
    sourceRow: rowNumber,
    clientId:
      cleanText(cell(row, regHeaders, "Client_ID", "Client ID")) ??
      `WORKBOOK-CLIENT-${rowNumber}`,
    clientName: canonicalClientName(rawName),
    clientType:
      cleanText(cell(row, regHeaders, "Client_Type", "Client Type")) ?? "Unknown",
    organization: cleanText(cell(row, regHeaders, "Organization", "Firm")),
    email: cleanText(cell(row, regHeaders, "Email", "Email_Address")),
    phone: cleanText(cell(row, regHeaders, "Phone", "Phone_Number", "Telephone")),
    country: cleanText(cell(row, regHeaders, "Country", "Destination_Country")),
    referralSource: cleanText(
      cell(row, regHeaders, "Referral_Source", "Referral Source", "Source"),
    ),
  });
}

const clients = clientRegistryRows.map((client) => {
  const related = deals.filter((deal) => deal.clientName === client.clientName);
  return {
    ...client,
    totalHistoricalAndOpportunityRecords: related.length,
    lifetimeCollectedValue:
      Math.round(
        related.reduce((sum, deal) => sum + deal.collectedRevenue, 0) * 100,
      ) / 100,
    openOpportunities: related.filter((deal) => deal.closeStatus === "Open").length,
    lostOpportunities: related.filter((deal) => deal.closeStatus === "Lost").length,
    completedDeals: related.filter(
      (deal) => deal.recordKind === "collected_payment",
    ).length,
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
  collectedRevenue:
    Math.round(
      deals.reduce((sum, deal) => sum + deal.collectedRevenue, 0) * 100,
    ) / 100,
  sourceAttribution: Object.fromEntries(
    deals
      .filter((deal) => deal.referralSource)
      .map((deal) => [deal.id, deal.referralSource]),
  ),
};

assertProjection(output);

const serialized = `${JSON.stringify(output, null, 2)}\n`;
if (process.argv.includes("--check")) {
  if (!existsSync(outputPath)) {
    console.error(
      "Workbook intelligence projection is missing. Run npm run generate:command-center-workbook.",
    );
    process.exit(1);
  }
  const current = readFileSync(outputPath, "utf8");
  if (current !== serialized) {
    console.error(
      "Workbook intelligence projection is stale. Run npm run generate:command-center-workbook.",
    );
    process.exit(1);
  }
  console.log(`Workbook projection verified: ${sourceSha256}`);
} else {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized);
  console.log(`Generated ${path.relative(ROOT, outputPath)} from ${SOURCE_FILE}`);
  console.log(`Source SHA-256: ${sourceSha256}`);
}
