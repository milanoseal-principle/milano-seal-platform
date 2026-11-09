import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from "pdf-lib";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLedger, verifyChain, LedgerRow } from "@/lib/custodyLedger";

const GOLD = rgb(0.776, 0.647, 0.353);
const DARK = rgb(0.04, 0.04, 0.04);
const MUTED = rgb(0.4, 0.4, 0.4);

interface DealRecord {
  id: string;
  client_name: string | null;
  email: string | null;
  document_type: string | null;
  destination_country: string | null;
  country: string | null;
  tracking_number: string | null;
  carrier: string | null;
  signed_by: string | null;
  delivery_status: string | null;
  delivery_timestamp: string | null;
  status: string | null;
  amount: number | null;
  created_at: string | null;
}

interface PageCursor {
  pdf: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  y: number;
  margin: number;
  pageWidth: number;
  pageHeight: number;
}

function newPage(c: PageCursor): PageCursor {
  const page = c.pdf.addPage([c.pageWidth, c.pageHeight]);
  return { ...c, page, y: c.pageHeight - c.margin };
}

function ensureSpace(c: PageCursor, needed: number): PageCursor {
  if (c.y - needed < c.margin) return newPage(c);
  return c;
}

function drawText(
  c: PageCursor,
  text: string,
  opts: {
    size?: number;
    color?: ReturnType<typeof rgb>;
    bold?: boolean;
    indent?: number;
  } = {},
): PageCursor {
  const size = opts.size ?? 10;
  const color = opts.color ?? DARK;
  const indent = opts.indent ?? 0;
  const font = opts.bold ? c.bold : c.font;

  const maxWidth = c.pageWidth - c.margin * 2 - indent;
  const words = text.split(" ");
  let line = "";

  let cursor = ensureSpace(c, size + 4);
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    const w = font.widthOfTextAtSize(test, size);
    if (w > maxWidth && line) {
      cursor.page.drawText(line, {
        x: cursor.margin + indent,
        y: cursor.y,
        size,
        font,
        color,
      });
      cursor = ensureSpace({ ...cursor, y: cursor.y - (size + 4) }, size + 4);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    cursor.page.drawText(line, {
      x: cursor.margin + indent,
      y: cursor.y,
      size,
      font,
      color,
    });
    cursor = { ...cursor, y: cursor.y - (size + 4) };
  }
  return cursor;
}

function drawHr(c: PageCursor): PageCursor {
  c.page.drawLine({
    start: { x: c.margin, y: c.y },
    end: { x: c.pageWidth - c.margin, y: c.y },
    thickness: 0.5,
    color: GOLD,
  });
  return { ...c, y: c.y - 12 };
}

function drawKv(c: PageCursor, key: string, value: string): PageCursor {
  let cursor = ensureSpace(c, 14);
  cursor.page.drawText(key, {
    x: cursor.margin,
    y: cursor.y,
    size: 9,
    font: cursor.bold,
    color: MUTED,
  });
  cursor.page.drawText(value || "—", {
    x: cursor.margin + 140,
    y: cursor.y,
    size: 10,
    font: cursor.font,
    color: DARK,
  });
  return { ...cursor, y: cursor.y - 16 };
}

export async function generateEvidencePacket(
  deal_id: string,
): Promise<Uint8Array> {
  const supabase = createAdminClient();

  const { data: deal, error: dealErr } = await supabase
    .from("deals")
    .select("*")
    .eq("id", deal_id)
    .single();

  if (dealErr || !deal) {
    throw new Error(
      `Deal not found: ${deal_id} (${dealErr?.message ?? "no row"})`,
    );
  }

  const ledger: LedgerRow[] = await getLedger(deal_id);
  const verdict = verifyChain(ledger);

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 48;

  const firstPage = pdf.addPage([pageWidth, pageHeight]);
  let cursor: PageCursor = {
    pdf,
    page: firstPage,
    font,
    bold,
    y: pageHeight - margin,
    margin,
    pageWidth,
    pageHeight,
  };

  cursor.page.drawRectangle({
    x: 0,
    y: cursor.y - 8,
    width: pageWidth,
    height: 4,
    color: GOLD,
  });
  cursor = drawText(cursor, "THE MILANO SEAL™", {
    size: 16,
    bold: true,
    color: GOLD,
  });
  cursor = drawText(cursor, "Evidence Packet — Chain of Custody", {
    size: 10,
    color: MUTED,
  });
  cursor = drawText(cursor, `Generated ${new Date().toUTCString()}`, {
    size: 8,
    color: MUTED,
  });
  cursor = { ...cursor, y: cursor.y - 8 };
  cursor = drawHr(cursor);

  cursor = drawText(cursor, "MATTER", { size: 11, bold: true, color: GOLD });
  cursor = { ...cursor, y: cursor.y - 4 };

  const d = deal as DealRecord;
  cursor = drawKv(cursor, "Deal ID", d.id);
  cursor = drawKv(cursor, "Client", d.client_name ?? "");
  cursor = drawKv(cursor, "Email", d.email ?? "");
  cursor = drawKv(cursor, "Document Type", d.document_type ?? "");
  cursor = drawKv(
    cursor,
    "Destination",
    d.destination_country ?? d.country ?? "",
  );
  cursor = drawKv(cursor, "Status", d.status ?? "");
  cursor = drawKv(
    cursor,
    "Amount",
    d.amount != null ? `$${Number(d.amount).toFixed(2)}` : "",
  );
  cursor = drawKv(
    cursor,
    "Created",
    d.created_at ? new Date(d.created_at).toUTCString() : "",
  );

  cursor = { ...cursor, y: cursor.y - 4 };
  cursor = drawHr(cursor);

  cursor = drawText(cursor, "SHIPMENT", {
    size: 11,
    bold: true,
    color: GOLD,
  });
  cursor = { ...cursor, y: cursor.y - 4 };
  cursor = drawKv(cursor, "Carrier", d.carrier ?? "");
  cursor = drawKv(cursor, "Tracking #", d.tracking_number ?? "");
  cursor = drawKv(cursor, "Delivery Status", d.delivery_status ?? "");
  cursor = drawKv(cursor, "Signed By", d.signed_by ?? "");
  cursor = drawKv(
    cursor,
    "Delivered At",
    d.delivery_timestamp ? new Date(d.delivery_timestamp).toUTCString() : "",
  );

  cursor = { ...cursor, y: cursor.y - 4 };
  cursor = drawHr(cursor);

  cursor = drawText(cursor, "CHAIN OF CUSTODY", {
    size: 11,
    bold: true,
    color: GOLD,
  });
  cursor = { ...cursor, y: cursor.y - 4 };

  if (ledger.length === 0) {
    cursor = drawText(cursor, "No custody events recorded.", {
      size: 10,
      color: MUTED,
    });
  } else {
    ledger.forEach((row, idx) => {
      cursor = ensureSpace(cursor, 60);
      cursor = drawText(cursor, `${idx + 1}.  ${row.event}`, {
        size: 10,
        bold: true,
      });
      const meta = [
        row.location ? `Location: ${row.location}` : null,
        row.actor_type
          ? `Actor: ${row.actor_type}${row.actor_id ? ` (${row.actor_id})` : ""}`
          : null,
        row.method ? `Method: ${row.method}` : null,
        row.status ? `Status: ${row.status}` : null,
      ]
        .filter(Boolean)
        .join("  •  ");
      if (meta) {
        cursor = drawText(cursor, meta, {
          size: 9,
          color: MUTED,
          indent: 12,
        });
      }
      cursor = drawText(cursor, new Date(row.created_at).toISOString(), {
        size: 8,
        color: MUTED,
        indent: 12,
      });
      cursor = drawText(cursor, `hash: ${row.hash}`, {
        size: 7,
        color: MUTED,
        indent: 12,
      });
      cursor = { ...cursor, y: cursor.y - 4 };
    });
  }

  cursor = ensureSpace(cursor, 40);
  cursor = drawHr(cursor);
  cursor = drawText(cursor, "CHAIN INTEGRITY", {
    size: 11,
    bold: true,
    color: GOLD,
  });
  cursor = { ...cursor, y: cursor.y - 4 };
  cursor = drawText(
    cursor,
    verdict.valid&&verdict.assurance==='CONTENT_AND_LINKS'
      ? `VERIFIED — ${verdict.total} immutable entries, hash chain intact.`
      : verdict.valid ? `LEGACY LINKS ONLY — ${verdict.total} entries; historical content hashes cannot be independently recomputed.` : `BROKEN at row ${verdict.brokenAt} — ${verdict.reason}`,
    { size: 10, color: verdict.valid ? GOLD : rgb(0.75, 0.31, 0.31) },
  );

  cursor = ensureSpace(cursor, 24);
  cursor = { ...cursor, y: cursor.y - 12 };
  cursor = drawText(
    cursor,
    "This packet was generated by The Milano Seal™ platform from immutable, hash-chained records. " +
      "Each event in the chain references the SHA-256 hash of the prior event for the same matter, " +
      "providing tamper-evident integrity.",
    { size: 7, color: MUTED },
  );

  return await pdf.save();
}
