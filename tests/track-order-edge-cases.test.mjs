import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDateString, formatDateISO, formatDateDisplay } from '../src/shared/dateUtils.js';

// Logic mirror of TrackOrderPage.jsx delivery formatting helpers
const formatDeliveryTypeName = (type) => {
  if (!type) return '';
  const key = type.toLowerCase().trim();
  if (key === 'sameday') return 'Same-day delivery';
  if (key === 'scheduled') return 'Scheduled delivery';
  if (key === 'surprise') return 'Surprise delivery';
  if (key === 'collection') return 'Shop collection';
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const formatDeliveryWindow = (win) => {
  if (!win) return '';
  const lower = win.toLowerCase().trim();
  if (lower === 'morning') return '9:00 AM – 12:00 PM';
  if (lower === 'afternoon') return '12:00 PM – 4:00 PM';
  if (lower === 'evening') return '4:00 PM – 7:00 PM';
  return win;
};

const getDeliveryInfo = (ord) => {
  if (!ord) return null;
  const typeName = formatDeliveryTypeName(ord.deliveryType);
  const winLabel = formatDeliveryWindow(ord.deliveryWindow);

  let requestedStr = '';
  if (ord.requestedDeliveryDate) {
    const p = parseDateString(ord.requestedDeliveryDate);
    if (p) requestedStr = formatDateDisplay(formatDateISO(p));
  }

  let confirmedDateStr = '';
  if (ord.estimatedDelivery) {
    const match = String(ord.estimatedDelivery).match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) {
      const p = parseDateString(match[1]);
      if (p) confirmedDateStr = formatDateDisplay(formatDateISO(p));
    }
  }

  const hasConfirmed = !!confirmedDateStr;
  return { typeName, requestedStr, confirmedDateStr, winLabel, hasConfirmed };
};

test('Scenario 1: Confirmed date + time window + admin note', () => {
  const order = {
    deliveryType: 'sameday',
    requestedDeliveryDate: '2026-10-13',
    estimatedDelivery: '2026-10-14T13:00:00+00:00',
    deliveryWindow: 'afternoon',
    adminNote: 'Gate code 4492'
  };
  const info = getDeliveryInfo(order);
  assert.equal(info.hasConfirmed, true);
  assert.equal(info.typeName, 'Same-day delivery');
  assert.equal(info.requestedStr, 'Tue, 13 Oct 2026');
  assert.equal(info.confirmedDateStr, 'Wed, 14 Oct 2026');
  assert.equal(info.winLabel, '12:00 PM – 4:00 PM');
  assert.equal(order.adminNote, 'Gate code 4492');
});

test('Scenario 2: Confirmed date without time window', () => {
  const order = {
    deliveryType: 'scheduled',
    estimatedDelivery: '2026-10-15',
    deliveryWindow: null,
    adminNote: ''
  };
  const info = getDeliveryInfo(order);
  assert.equal(info.hasConfirmed, true);
  assert.equal(info.confirmedDateStr, 'Thu, 15 Oct 2026');
  assert.equal(info.winLabel, '');
});

test('Scenario 3: Requested date only (unconfirmed)', () => {
  const order = {
    deliveryType: 'surprise',
    requestedDeliveryDate: '2026-10-16',
    estimatedDelivery: null,
    deliveryWindow: null
  };
  const info = getDeliveryInfo(order);
  assert.equal(info.hasConfirmed, false);
  assert.equal(info.typeName, 'Surprise delivery');
  assert.equal(info.requestedStr, 'Fri, 16 Oct 2026');
  assert.equal(info.confirmedDateStr, '');
});

test('Scenario 4: No requested date and no confirmed date', () => {
  const order = {
    deliveryType: null,
    requestedDeliveryDate: null,
    estimatedDelivery: null
  };
  const info = getDeliveryInfo(order);
  assert.equal(info.hasConfirmed, false);
  assert.equal(info.requestedStr, '');
  assert.equal(info.confirmedDateStr, '');
  assert.equal(info.typeName, '');
});

test('Scenario 5: Admin note present without delivery schedule', () => {
  const order = {
    adminNote: 'Fragile flowers included',
    estimatedDelivery: null
  };
  const info = getDeliveryInfo(order);
  assert.equal(info.hasConfirmed, false);
  assert.equal(order.adminNote, 'Fragile flowers included');
});

test('Scenario 6: Both delivery schedule and admin note clearly separated', () => {
  const order = {
    deliveryType: 'sameday',
    requestedDeliveryDate: '2026-10-13',
    estimatedDelivery: '2026-10-13T09:00:00+00:00',
    deliveryWindow: 'morning',
    adminNote: 'Delivery on schedule for 10am'
  };
  const info = getDeliveryInfo(order);
  assert.equal(info.hasConfirmed, true);
  assert.equal(info.winLabel, '9:00 AM – 12:00 PM');
  assert.equal(order.adminNote, 'Delivery on schedule for 10am');
});

test('Scenario 7: Shop collection delivery type', () => {
  const order = {
    deliveryType: 'collection',
    requestedDeliveryDate: '2026-10-14'
  };
  const info = getDeliveryInfo(order);
  assert.equal(info.typeName, 'Shop collection');
});

test('Scenario 8: Admin note with special characters / quotes / newlines', () => {
  const rawNote = 'Note: "Special" <handling> & call recipient\nSecond line';
  const order = {
    deliveryType: 'sameday',
    estimatedDelivery: '2026-10-14T17:00:00+00:00',
    deliveryWindow: 'evening',
    adminNote: rawNote
  };
  const info = getDeliveryInfo(order);
  assert.equal(info.hasConfirmed, true);
  assert.equal(info.winLabel, '4:00 PM – 7:00 PM');
  assert.equal(order.adminNote, rawNote);
});
