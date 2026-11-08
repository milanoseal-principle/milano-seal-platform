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

// Protect the canonical pricing engine against reintroducing provider-controlled
// per-signature charges or the retired `ron_cost` financial line. A signature
// count may remain as nonfinancial execution evidence; never make it money.
const engine = read('lib/pricing.ts');
if (/ron_cost\s*:|key\s*:\s*['"`]ron_cost['"`]/i.test(engine)) {
  findings.push('lib/pricing.ts: retired ron_cost financial field reintroduced');
}
if (/notarizedSigCount\s*\*\s*(?:COMPLEXITY\.[\w]+|\d+)|(?:COMPLEXITY\.[\w]+|\d+)\s*\*\s*notarizedSigCount/.test(engine)) {
  findings.push('lib/pricing.ts: notarized signature count used to calculate a financial charge');
}
// The historical lib/config/pricing.ts was deleted. Never read a removed
// pricing source, which would turn every clean checkout into a false failure.
// Canonical regression coverage must exist and prove signature counts/provider aliases cannot alter Milano financial truth.
if (!fs.existsSync(path.join(root, 'tests/providerFeeSeparation.test.ts'))) findings.push('tests/providerFeeSeparation.test.ts: missing canonical P6 regression coverage');

if (findings.length) {
  console.error('P6 provider fee separation findings:\n- ' + findings.join('\n- '));
  process.exit(1);
}
console.log('P6 provider fee separation validated: Milano financial truth contains Milano-controlled charges only.');
