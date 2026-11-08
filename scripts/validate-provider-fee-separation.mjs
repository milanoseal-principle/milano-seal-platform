import fs from 'node:fs';
import path from 'node:path';

// P6 — External provider fee separation audit.
// BlueNotary sets and collects its notarial fee outside Milano. Milano quote, invoice, Wise expected
// amount and revenue must contain only Milano-controlled charges. Exits non-zero on any finding.
const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(`${dir}/${e.name}`) : /\.(ts|tsx)$/.test(e.name) ? [`${dir}/${e.name}`] : []);

const financial = ['lib/pricing.ts', ...walk('lib/pricing'), 'lib/wise.ts', ...walk('lib/wise'), ...walk('lib/payments'),
  ...walk('lib/economics'), ...walk('lib/scheduling'), 'lib/safety/payment-integrity.ts'].filter((f) => fs.existsSync(path.join(root, f)));

const findings = [];
for (const file of financial) {
  const source = read(file);
  if (/EXTERNAL_PROVIDER_NOTARIAL_FEE|provider_fee_evidence/.test(source)) {
    findings.push(`${file}: provider fee evidence referenced by Milano financial truth`);
  }
  if (/bluenotary/i.test(source) && /amount|total|price/i.test(source)) {
    findings.push(`${file}: BlueNotary referenced in a Milano amount/total/price module`);
  }
}

// The controlling engine adds a per-notarized-signature charge into the Milano total and exposes it
// internally as `ron_cost`. Whether that is a Milano-controlled service charge or the provider's
// notarial fee folded into Milano's quote/Wise amount is an owner pricing decision.
const engine = read('lib/pricing.ts');
if (/ron_cost:\s*money\(notarizedSigCount \* COMPLEXITY\.notarized_signature\)/.test(engine)) {
  findings.push('lib/pricing.ts: `notarized_signatures` ($25 x count) is added to the Milano total and labelled internal `ron_cost` — OWNER DECISION REQUIRED: confirm Milano-controlled service charge (rename/classify) or remove as provider-controlled notarial fee');
}
const legacy = read('lib/config/pricing.ts');
if (/ronPerSignature:\s*25/.test(legacy)) {
  findings.push('lib/config/pricing.ts: deprecated config states the $25 RON notarial fee is "included in professional service rates" (only consumer: unused components/conversion/PricingLanes.tsx)');
}

if (findings.length) {
  console.error('P6 provider fee separation findings:\n- ' + findings.join('\n- '));
  process.exit(1);
}
console.log('P6 provider fee separation validated: Milano financial truth contains Milano-controlled charges only.');
