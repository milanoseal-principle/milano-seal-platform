const { readFileSync, existsSync } = await import('fs');

const canonicalRoute = 'app/api/courier/webhook/route.ts';
const retiredRoute = 'app/api/webhooks/shippo/route.ts';

if (!existsSync(canonicalRoute)) throw new Error('canonical Shippo webhook route missing');
if (existsSync(retiredRoute)) throw new Error('duplicate Shippo webhook authority must not exist');

const all = [
  'src/features/shipping/shippoService.ts',
  canonicalRoute,
  'lib/shippo/webhookAuth.ts',
].map((f) => readFileSync(f, 'utf8')).join('\n');

for (const k of ['LABEL_CREATED', 'CUSTOMS_HOLD', 'DELIVERED', 'tracking']) {
  if (!all.includes(k)) throw new Error('shipping missing ' + k);
}

for (const k of ['verifyShippoHmac', 'record_courier_delivery_transition']) {
  if (!all.includes(k)) throw new Error('canonical Shippo webhook missing ' + k);
}

console.log('validate:shipping-tracking passed');
