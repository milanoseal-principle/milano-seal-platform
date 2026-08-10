from pathlib import Path

path = Path("app/dashboard/deals/[id]/page.tsx")
text = path.read_text()

required = [
    'const [payAmt, setPayAmt] = useState("");',
    'const [payRef, setPayRef] = useState("");',
    'const [payBalAmt, setPayBalAmt] = useState("");',
    'const [payBalRef, setPayBalRef] = useState("");',
    "Confirm Payment",
    "Mark paid",
    "Confirm Balance Payment",
    "Mark balance paid",
    '<Package className="w-4 h-4 text-gold" /> Shipping',
    '<MessageSquare className="w-4 h-4 text-gold" /> Client Messages',
    "Document Release",
    "Operational Ledger",
]
missing = [item for item in required if item not in text]
if missing:
    raise SystemExit(f"Baseline markers missing; refusing broad edit: {missing}")

for line in [
    '  const [payAmt, setPayAmt] = useState("");\n',
    '  const [payRef, setPayRef] = useState("");\n',
    '  const [payBalAmt, setPayBalAmt] = useState("");\n',
    '  const [payBalRef, setPayBalRef] = useState("");\n',
]:
    if text.count(line) != 1:
        raise SystemExit(f"Expected exactly one payment state line: {line.strip()}")
    text = text.replace(line, "", 1)

old_header = '''          <Card className="bg-card border-gold">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-gold" /> Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">'''
new_header = '''          <Card className="bg-card border-gold">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-gold" /> Wise Payment
              </CardTitle>
              <CardDescription>
                Read-only settlement state. Wise reconciliation is authoritative.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">'''
if text.count(old_header) != 1:
    raise SystemExit("Payment card header marker changed; refusing edit")
text = text.replace(old_header, new_header, 1)

start_marker = '              {!isPaymentRequirementSatisfied && (\n                <Dialog>'
end_marker = '\n\n              {/* Balance payment section */}'
start = text.find(start_marker)
if start < 0:
    raise SystemExit("Initial manual payment dialog start not found")
end = text.find(end_marker, start)
if end < 0:
    raise SystemExit("Initial manual payment dialog end not found")

readonly_initial = '''              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={isPaid ? "bg-paid" : "bg-await"}
                >
                  {deal.payment_status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Amount due</span>
                <span>
                  {formatCurrencyDetailed(
                    Number(deal.amount_due ?? deal.invoice_retainer ?? 0),
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Amount paid</span>
                <span>
                  {formatCurrencyDetailed(Number(deal.amount_paid ?? 0))}
                </span>
              </div>
              {!isPaymentRequirementSatisfied && (
                <div className="rounded border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                  Awaiting canonical Wise reconciliation. Operators cannot manually
                  mark this Matter paid.
                </div>
              )}'''
text = text[:start] + readonly_initial + text[end:]

balance_section = text.find("              {/* Balance payment section */}")
if balance_section < 0:
    raise SystemExit("Balance section marker not found")
bal_start_marker = '                        {deal.balance_paid_at ? (\n'
bal_end_marker = '                        )}\n                      </>\n'
bal_start = text.find(bal_start_marker, balance_section)
if bal_start < 0:
    raise SystemExit("Balance manual payment block start not found")
bal_end = text.find(bal_end_marker, bal_start)
if bal_end < 0:
    raise SystemExit("Balance manual payment block end not found")

readonly_balance = '''                        {deal.balance_paid_at ? (
                          <p className="text-xs text-muted-foreground">
                            Received via Wise reconciliation
                            {deal.balance_amount_received
                              ? ` · $${deal.balance_amount_received.toLocaleString()}`
                              : ""}{" "}
                            ·{" "}
                            {new Date(
                              deal.balance_paid_at,
                            ).toLocaleDateString()}
                          </p>
                        ) : (
                          <div className="rounded border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                            Awaiting canonical Wise balance reconciliation. Operators
                            cannot manually mark the balance paid.
                          </div>
                        )}
'''
text = text[:bal_start] + readonly_balance + text[bal_end + len('                        )}\n'):]

forbidden = [
    "Confirm Payment",
    "Mark paid",
    "Confirm Balance Payment",
    "Mark balance paid",
    "setPayAmt",
    "setPayRef",
    "setPayBalAmt",
    "setPayBalRef",
    'payment_status: "paid"',
    'balance_payment_status: "paid"',
]
present = [item for item in forbidden if item in text]
if present:
    raise SystemExit(f"Manual settlement authority remains in operator UI: {present}")

preserved = [
    '<Package className="w-4 h-4 text-gold" /> Shipping',
    "Create Shipping Label",
    '<MessageSquare className="w-4 h-4 text-gold" /> Client Messages',
    "Operational Ledger",
    "Conversion score",
    "Document Release",
    "MilanoReleaseSeal",
    "ShippoCustodyPanel",
    "CertificatePanel",
    "MatterRiskBadge",
]
missing_preserved = [item for item in preserved if item not in text]
if missing_preserved:
    raise SystemExit(f"Collateral UI missing after surgery: {missing_preserved}")

path.write_text(text)
