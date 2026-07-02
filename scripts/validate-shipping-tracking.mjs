const { readFileSync }=await import('fs');
const all=['src/features/shipping/shippoService.ts','app/api/webhooks/shippo/route.ts'].map(f=>readFileSync(f,'utf8')).join('\n');
for (const k of ['LABEL_CREATED','CUSTOMS_HOLD','DELIVERED','tracking']) if(!all.includes(k)) throw new Error('shipping missing '+k);
console.log('validate:shipping-tracking passed');
