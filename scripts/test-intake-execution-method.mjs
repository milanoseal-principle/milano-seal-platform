// Rendered local regression. Intake POST is intercepted: no real order/payment.
// Uses the repository's existing Playwright tooling convention.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.MILANO_RENDERED_BASE_URL || 'http://127.0.0.1:3000';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('This fixture test must run locally, never against production.');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const form = { description: 'One affidavit requiring notarization. No apostille or translation.', name: 'Controlled Browser Test', email: 'browser@example.invalid', phone: '', documentType: 'Affidavit', documentCount: 1, signerCount: 1, originState: 'Florida', signerLocation: 'Miami, Florida', destinationCountry: 'United States', executionType: '', mobileAddress: '', notarizationChoice: 'yes', apostilleChoice: 'no', translationChoice: 'no', deadline: '', courierRequired: false, timelineChoice: 'expedited', deliveryChoice: 'domestic_courier' };
const errors = [];
let cases = 0;
try {
  for (const width of [320, 360, 390, 430]) {
    for (const method of ['RON', 'InPerson', 'None', 'Unsure']) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce', isMobile: true, hasTouch: true });
      const page = await context.newPage();
      page.on('pageerror', (e) => errors.push(e.message));
      await page.route('**/api/intake/analytics', (route) => route.fulfill({ json: { success: true } }));
      let posted;
      await page.route('**/api/intake', async (route) => {
        posted = route.request().postDataJSON();
        await route.fulfill({ status: 200, json: { success: true, deal_id: 'MS-TEST-EXECUTION', quote_state: 'review_required', payment_confirmed: false, status: 'intake_received' } });
      });
      await page.goto(`${base}/intake`);
      // Seed only the pre-existing draft to reach the recorded blocker reliably.
      await page.waitForFunction(() => sessionStorage.getItem('ms_intake_draft_v1'));
      await page.evaluate((form) => {
        const { context } = JSON.parse(sessionStorage.getItem('ms_intake_draft_v1'));
        sessionStorage.setItem('ms_intake_draft_v1', JSON.stringify({ version: 1, context, savedAt: Date.now(), step: 3, form }));
      }, form);
      await page.reload();
      const selector = page.getByLabel('Execution method', { exact: true });
      await selector.waitFor();
      await page.getByText('Execution method (remote or in-person)', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Edit Remote Online Notarization', exact: true }).click();
      await page.waitForFunction(() => document.activeElement?.id === 'review-execution-method');
      if (width === 320 && method === 'RON') {
        await selector.evaluate((el) => { const option = document.createElement('option'); option.value = 'invalid_method'; option.textContent = 'Invalid fixture'; el.append(option); });
        await selector.selectOption('invalid_method');
        await page.getByRole('button', { name: 'Save execution method', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'Choose a supported execution method' }).waitFor();
        assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('ms_intake_draft_v1')).form.executionType), '');
      }
      await selector.selectOption(method);
      // Unsaved choices must not silently authorize a different request.
      await page.getByRole('button', { name: 'Submit for document review', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: 'Save your execution method' }).waitFor();
      assert.equal(posted, undefined);
      await page.getByRole('button', { name: 'Save execution method', exact: true }).click();
      await page.getByRole('status').filter({ hasText: 'Execution preference saved' }).waitFor();
      assert.equal(await page.getByText('Execution method (remote or in-person)', { exact: true }).count(), 0);
      await page.waitForFunction((method) => JSON.parse(sessionStorage.getItem('ms_intake_draft_v1')).form.executionType === method, method);
      await page.reload();
      assert.equal(await selector.inputValue(), method);
      assert.equal(await page.getByText('Execution method (remote or in-person)', { exact: true }).count(), 0);
      assert.equal(await page.locator('#review-consent').isChecked(), false);
      if (width === 320 && method === 'RON') {
        await page.locator('#review-apostille').selectOption('yes');
        await page.getByRole('button', { name: 'Edit Requested Service', exact: true }).click();
        await page.waitForFunction(() => document.activeElement?.id === 'review-apostille');
        await page.getByRole('button', { name: 'Edit Matter Type', exact: true }).click();
        await page.waitForFunction(() => document.activeElement?.id === 'review-apostille');
        await page.locator('#review-apostille').selectOption('no');
      }
      // Edit actions must open collapsed details and focus the actual field.
      await page.locator('details').evaluate((el) => { el.open = false; });
      await page.getByRole('button', { name: 'Edit Destination', exact: true }).click();
      await page.waitForFunction(() => document.activeElement?.id === 'review-destination' && document.activeElement.closest('details').open);
      await selector.focus();
      await page.keyboard.press('Tab');
      assert.equal(await page.getByRole('button', { name: 'Save execution method', exact: true }).evaluate((el) => el === document.activeElement), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), true, `overflow ${width} ${method}`);
      await page.locator('#save-execution-method').scrollIntoViewIfNeeded();
      const saveBox = await page.locator('#save-execution-method').boundingBox();
      assert.ok(saveBox.width >= 44 && saveBox.height >= 44);
      for (const control of [selector, page.locator('#save-execution-method'), page.getByRole('button', { name: 'Submit for document review', exact: true })]) {
        const box = await control.boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width + 1, `clipped control ${width} ${method}`);
      }
      assert.equal(await page.locator('#save-execution-method').evaluate((el) => { const b = el.getBoundingClientRect(); return document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)?.closest('#save-execution-method') === el; }), true, 'save control must not be covered');
      if (process.env.MILANO_TEST_ARTIFACT_DIR && method === 'RON') await page.screenshot({ path: `${process.env.MILANO_TEST_ARTIFACT_DIR}/execution-method-${width}.png`, fullPage: true });
      await page.locator('#review-consent').check();
      await page.getByRole('button', { name: 'Submit for document review', exact: true }).click();
      await page.waitForURL('**/intake/confirmation?id=MS-TEST-EXECUTION');
      assert.equal(posted.execution_method, method === 'RON' ? 'ron' : method === 'InPerson' ? 'in_person' : 'review_required');
      assert.equal(posted.notarization_requirement, method === 'None' ? 'not_required' : method === 'Unsure' ? 'review_required' : 'required');
      assert.equal(posted.notarial_act, 'review_required');
      assert.equal(posted.client_quoted_total, undefined);
      assert.equal(await page.evaluate(() => sessionStorage.getItem('ms_intake_draft_v1')), null);
      await context.close();
      cases++;
      console.log(`PASS ${width}px ${method}: missing → select → save → reload → review submission; canonical payload captured`);
    }
  }
  const response = await (await browser.newContext()).request.post(`${base}/api/intake`, { data: { execution_method: 'invalid_method' } });
  assert.equal(response.status(), 400);
  assert.equal((await response.json()).code, 'VALIDATION_FAILED');
  console.log('PASS server rejects invalid execution method before persistence');
  assert.deepEqual(errors, []);
  console.log(`PASS ${cases} rendered mobile flows + invalid-method server check. Intake writes mocked; no live order/provider evidence claimed.`);
} finally { await browser.close(); }
