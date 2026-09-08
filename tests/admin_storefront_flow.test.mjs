import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import {
  mapDatabaseOrder,
  mapDatabaseRequest,
  mapDatabaseApplication,
  mapDatabaseCareer,
} from '../src/admin/utils/adminMappers.js';

test('storefront customization request reaches admin mapper correctly', async () => {
  const records = new Map();
  let handler;
  const db = {
    from: table => ({
      select: () => ({ eq: (_, id) => ({ maybeSingle: async () => ({ data: records.get(table + id) }) }) }),
      insert: async record => { records.set(table + record.id, record); return {}; },
    }),
    storage: {
      from: bucket => ({ upload: async () => ({}), remove: async () => ({}) }),
    },
  };

  const source = readFileSync(new URL('../supabase/functions/submit-inquiry/index.ts', import.meta.url), 'utf8').replace(/^import .*\n/, '');
  new Function('Deno', 'createClient', stripTypeScriptTypes(source))({ serve: fn => { handler = fn; }, env: { get: () => 'test' } }, () => db);

  const reqId = crypto.randomUUID();
  const future = `${new Date().getUTCFullYear() + 1}-11-15`;
  const record = {
    name: 'Akosua Darko',
    email: 'akosua@example.com',
    phone: '+233241112233',
    date: future,
    service: 'Custom gift',
    quantity: 3,
    occasion: 'Anniversary',
    note: 'Gold theme with custom ribbon',
    deliveryAddress: '15 Cantonments Rd, Accra',
    recipient: 'Kofi Darko',
    cardMessage: 'Happy 5th Anniversary!',
    cardStyleNotes: 'Calligraphy gold ink',
    estimateLow: 1200,
    estimateHigh: 1500,
    selections: ['Engraved wrist bag', 'Fresh flowers'],
  };

  const form = new FormData();
  form.set('kind', 'request');
  form.set('record', JSON.stringify(record));
  form.set('submissionId', reqId);

  const res = await handler(new Request('http://local', { method: 'POST', body: form }));
  assert.equal(res.status, 200);

  const dbRow = records.get('customer_requests' + reqId);
  assert.ok(dbRow);
  assert.equal(dbRow.customer_name, 'Akosua Darko');
  assert.equal(dbRow.request_type, 'bespoke_gift');

  // Verify mapping into Admin Dashboard state structure
  const adminRequest = mapDatabaseRequest(dbRow);
  assert.equal(adminRequest.id, reqId);
  assert.equal(adminRequest.name, 'Akosua Darko');
  assert.equal(adminRequest.estimateLow, 1200);
  assert.equal(adminRequest.estimateHigh, 1500);
  assert.deepEqual(adminRequest.selections, ['Engraved wrist bag', 'Fresh flowers']);
  assert.equal(adminRequest.status, 'new');
});

test('storefront career application reaches admin mapper with private resume path', async () => {
  const records = new Map();
  const uploads = new Map();
  let handler;
  const db = {
    from: table => ({
      select: () => ({ eq: (_, id) => ({ maybeSingle: async () => ({ data: records.get(table + id) }) }) }),
      insert: async record => { records.set(table + record.id, record); return {}; },
    }),
    storage: {
      from: bucket => ({
        upload: async (path, file) => { uploads.set(bucket + path, file); return {}; },
        remove: async () => ({}),
      }),
    },
  };

  const source = readFileSync(new URL('../supabase/functions/submit-inquiry/index.ts', import.meta.url), 'utf8').replace(/^import .*\n/, '');
  new Function('Deno', 'createClient', stripTypeScriptTypes(source))({ serve: fn => { handler = fn; }, env: { get: () => 'test' } }, () => db);

  const appId = crypto.randomUUID();
  const future = `${new Date().getUTCFullYear() + 1}-10-01`;
  const careerData = {
    name: 'Yaw Mensah',
    email: 'yaw.m@example.com',
    phone: '+233559876543',
    location: 'East Legon, Accra',
    portfolio: 'https://instagram.com/yaw_creatives',
    date: future,
    experience: '3 years digital marketing and social media management',
    motivation: 'Passionate about luxury gifting aesthetics and video content',
  };

  const form = new FormData();
  form.set('kind', 'career');
  form.set('record', JSON.stringify(careerData));
  form.set('submissionId', appId);
  form.set('file', new File(['%PDF-1.5 Content'], 'resume_yaw.pdf', { type: 'application/pdf' }));

  const res = await handler(new Request('http://local', { method: 'POST', body: form }));
  assert.equal(res.status, 200);

  const dbRow = records.get('career_applications' + appId);
  assert.ok(dbRow);
  assert.equal(dbRow.full_name, 'Yaw Mensah');
  assert.ok(dbRow.resume_path);
  assert.equal(uploads.size, 1);

  // Verify mapping into Admin Dashboard state structure
  const adminApp = mapDatabaseApplication(dbRow);
  assert.equal(adminApp.id, appId);
  assert.equal(adminApp.name, 'Yaw Mensah');
  assert.equal(adminApp.portfolio, 'https://instagram.com/yaw_creatives');
  assert.ok(adminApp.resumePath.startsWith(appId));
  assert.equal(adminApp.status, 'new');
});

test('storefront order and events map correctly for admin order fulfillment', () => {
  const dbOrder = {
    id: 'ord-uuid-1234',
    tracking_number: 'GF-1099',
    order_code: 'ORD-1099',
    customer_name: 'Esi Arthur',
    customer_email: 'esi@example.com',
    customer_phone: '+233200000000',
    recipient_name: 'Kojo Arthur',
    delivery_address: 'Tema Community 6',
    subtotal: 950.00,
    total: 950.00,
    payment_status: 'paid',
    fulfillment_status: 'packaging',
    staff_order: false,
    created_at: '2026-09-08T10:00:00Z',
    updated_at: '2026-09-08T10:05:00Z',
    order_items: [
      { product_id: 'fragrance-gift', item_name: 'Fragrance & treats gift', quantity: 1, unit_price: 950.00 },
    ],
    order_events: [
      { stage: 'paid', created_at: '2026-09-08T10:02:00Z' },
      { stage: 'packaging', created_at: '2026-09-08T10:05:00Z' },
    ],
  };

  const adminOrder = mapDatabaseOrder(dbOrder);
  assert.equal(adminOrder.id, 'ord-uuid-1234');
  assert.equal(adminOrder.tracking, 'GF-1099');
  assert.equal(adminOrder.customer, 'Esi Arthur');
  assert.equal(adminOrder.status, 'packaging');
  assert.equal(adminOrder.total, 950);
  assert.equal(adminOrder.items.length, 1);
  assert.equal(adminOrder.paidAt, '2026-09-08T10:02:00Z');
  assert.equal(adminOrder.packagingAt, '2026-09-08T10:05:00Z');
});

test('career roles map correctly to admin career management', () => {
  const dbCareer = {
    id: 'role-uuid-555',
    title: 'Content Creator & Social Media Manager',
    location: 'Accra, Ghana',
    employment_type: 'Full-time',
    description: 'Lead visual storytelling and social media campaigns for luxury hampers.',
    status: 'open',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  };

  const adminCareer = mapDatabaseCareer(dbCareer);
  assert.equal(adminCareer.id, 'role-uuid-555');
  assert.equal(adminCareer.title, 'Content Creator & Social Media Manager');
  assert.equal(adminCareer.status, 'open');
});
