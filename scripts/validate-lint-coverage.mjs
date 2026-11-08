import assert from 'node:assert/strict';
import { ESLint } from 'eslint';
const eslint = new ESLint();
const paths = ['app/api/webhooks/bluenotary/route.ts', 'app/dashboard/ron/[session_id]/page.tsx', 'components/ron/RONStatutoryEvidencePanel.tsx', 'lib/bluenotary/signedDocumentStorage.ts', 'middleware.ts'];
for (const filePath of paths) {
  assert.equal(await eslint.isPathIgnored(filePath),false,`${filePath} must be evaluated`);
  const config=await eslint.calculateConfigForFile(filePath);
  assert.equal(config.rules['no-debugger'][0],2,`${filePath} requires real rules`);
  const [probe]=await eslint.lintText('const sample: number = 1; debugger; export { sample };',{filePath});
  assert.ok(probe.messages.some(m=>m.ruleId==='no-debugger'),`${filePath} must parse TS and detect invalid source`);
  assert.equal(probe.fatalErrorCount,0,`${filePath} must use a TypeScript parser`);
}
console.log(`Lint coverage verified for ${paths.length} representative production surfaces.`);
