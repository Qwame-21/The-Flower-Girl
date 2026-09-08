import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { validFutureDate } from '../src/storefront/utils/date.js';

test('calendar rejects rollover and past dates, accepts leap day and today', () => {
  const now = new Date(2026, 8, 7);
  assert.equal(validFutureDate(2026, 9, 7, now), true);
  assert.equal(validFutureDate(2026, 9, 6, now), false);
  assert.equal(validFutureDate(2027, 2, 29, now), false);
  assert.equal(validFutureDate(2028, 2, 29, now), true);
  assert.equal(validFutureDate(2027, 4, 31, now), false);
});

test('submission saves privately, retries once, and rejects invalid or incomplete input', async () => {
  const records = new Map(); const uploads = new Map();
  let handler;
  const db = {
    from: table => ({ select: () => ({ eq: (_, id) => ({ maybeSingle: async () => ({ data: records.get(table + id) }) }) }), insert: async record => { records.set(table + record.id, record); return {}; } }),
    storage: { from: bucket => ({ upload: async (path, file) => { uploads.set(bucket + path, file); return {}; }, remove: async () => ({}) }) },
  };
  const source = readFileSync(new URL('../supabase/functions/submit-inquiry/index.ts', import.meta.url), 'utf8').replace(/^import .*\n/, '');
  new Function('Deno', 'createClient', stripTypeScriptTypes(source))({ serve: fn => { handler = fn; }, env: { get: () => 'test' } }, () => db);
  const future = `${new Date().getUTCFullYear() + 1}-09-20`;
  const record = { name: 'Test Customer', email: 'test@example.com', phone: '+233201234567', date: future, service: 'Gift wrapping', quantity: 2, occasion: 'Birthday', note: 'Green wrapping', deliveryAddress: '12 Test St, Unit 4, Accra, Ghana', recipient: 'Recipient', deliveryInstructions: 'Call first' };
  async function submit(kind, data, id = crypto.randomUUID(), file) {
    const form = new FormData(); form.set('kind', kind); form.set('record', JSON.stringify(data)); form.set('submissionId', id); if(file) form.set('file', file);
    return handler(new Request('http://local', { method: 'POST', body: form }));
  }
  const id = crypto.randomUUID();
  let response = await submit('request', record, id); assert.equal(response.status, 200);
  assert.ok((await response.json()).reference.startsWith('RQ-'));
  assert.match(records.get('customer_requests' + id).notes, /Unit 4.*Accra/);
  await submit('request', record, id); assert.equal(records.size, 1);
  assert.equal((await submit('request', { ...record, date: '2027-02-30' })).status, 400);
  assert.equal((await submit('request', { ...record, deliveryAddress: '' })).status, 400);
  assert.equal((await submit('request', { ...record, quantity: -1 })).status, 400);
  const career = { ...record, location: 'Accra', portfolio: 'https://example.com', experience: 'Photography', motivation: 'Creative work' };
  assert.equal((await submit('career', career)).status, 400);
  const careerId = crypto.randomUUID();
  assert.equal((await submit('career', career, careerId, new File(['%PDF-1.4'], 'resume.pdf', { type: 'application/pdf' }))).status, 200);
  assert.ok(records.get('career_applications' + careerId).resume_path);
  assert.equal(uploads.size, 1);
});
