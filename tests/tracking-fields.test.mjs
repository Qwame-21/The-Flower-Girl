import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getOrderCustomerFields,
  getRequestCustomerFields,
  mapTrackedRecord,
  mergeTrackedResult,
} from '../src/shared/trackingFields.js';

test('legacy customer-authored text in the order admin note is shown only as customer text', () => {
  const fields = getOrderCustomerFields({
    customerNote: '',
    cardMessage: null,
    cardStyle: null,
    adminNote: 'Please leave with security.\nGift card: Happy birthday, Ama.\nCard style: Gold foil',
  });

  assert.deepEqual(fields, {
    deliveryInstructions: 'Please leave with security.',
    giftMessage: 'Happy birthday, Ama.',
    cardStyle: 'Gold foil',
    staffNote: '',
  });
});

test('admin note remains staff-only when customer text is already stored separately', () => {
  const fields = getOrderCustomerFields({
    customerNote: 'Call on arrival.',
    cardMessage: 'Happy birthday.',
    cardStyle: 'Calligraphy',
    adminNote: 'Team: confirm delivery with the rider.',
  });

  test('legacy customer text is removed from the team note when staff text is appended', () => {
    const customerText = 'Call first.\nGift card: Happy birthday.\nCard style: Gold foil';
    const fields = getOrderCustomerFields({
      customerNote: customerText,
      adminNote: `${customerText}\n\nTeam: confirm the delivery window.`,
    });

    assert.equal(fields.deliveryInstructions, 'Call first.');
    assert.equal(fields.giftMessage, 'Happy birthday.');
    assert.equal(fields.cardStyle, 'Gold foil');
    assert.equal(fields.staffNote, 'Team: confirm the delivery window.');
  });

  test('orders without a team note keep the staff note empty', () => {
    const fields = getOrderCustomerFields({
      customerNote: 'Delivery instructions: Call first.\nGift card: Happy birthday.',
      adminNote: '',
    });

    assert.equal(fields.staffNote, '');
  });

  assert.deepEqual(fields, {
    deliveryInstructions: 'Call on arrival.',
    giftMessage: 'Happy birthday.',
    cardStyle: 'Calligraphy',
    staffNote: 'Team: confirm delivery with the rider.',
  });
});

test('request note summary is separated from entered notes without changing its source', () => {
  const source = 'Please use soft colours.\n\nDelivery address: East Legon\nfulfilment: delivery';
  const fields = getRequestCustomerFields({
    notes: source,
    delivery_instructions: 'Call when nearby.',
    card_message: 'With love.',
    card_style: 'Handwritten',
  });

  assert.deepEqual(fields, {
    notes: 'Please use soft colours.',
    deliveryInstructions: 'Call when nearby.',
    cardMessage: 'With love.',
    cardStyle: 'Handwritten',
  });
  assert.equal(source.includes('Delivery address: East Legon'), true);
});

test('Track RPC order and request payloads expose only the customer display fields needed by Track', () => {
  const order = mapTrackedRecord({
    kind: 'order',
    trackingNumber: 'GF-087313',
    customerName: 'Ama Mensah',
    customerPhone: '0200000000',
    customerEmail: 'ama@example.com',
    recipientName: 'Kofi Mensah',
    deliveryAddress: 'East Legon, Accra',
    landmark: 'Near the school',
    locationLink: 'https://maps.example.test/pin',
    requestedDeliveryDate: '2026-10-18',
    estimatedDelivery: '2026-10-18T10:00:00Z',
    deliveryType: 'scheduled',
    deliveryFee: 90,
    deliveryWindow: 'morning',
    customerNote: 'Call before arriving.',
    cardMessage: 'A little something for you.',
    cardStyle: 'Gold foil',
    customizationSelections: ['Chocolate', 'Luxury box'],
    items: [{ name: 'Rose bouquet', quantity: 2 }],
    paymentStatus: 'paid',
    staffNote: 'Staff-only update',
  });

  assert.equal(order.record.customerPhone, '0200000000');
  assert.equal(order.record.customerEmail, 'ama@example.com');
  assert.equal(order.record.deliveryAddress, 'East Legon, Accra');
  assert.deepEqual(order.record.items, [{ name: 'Rose bouquet', quantity: 2 }]);
  assert.equal(order.record.staffNote, 'Staff-only update');

  const request = mapTrackedRecord({
    kind: 'request',
    reference: 'RQ-TG5A5W',
    customerName: 'Ama Mensah',
    customerPhone: '0200000000',
    customerEmail: 'ama@example.com',
    occasion: 'Birthday',
    service: 'Custom gift',
    preferredDate: '2026-10-18',
    selections: ['Fresh flowers', 'Luxury box'],
    quantity: 3,
    budget: 'GHS 900',
    fulfilment: 'delivery',
    recipient: 'Kofi Mensah',
    recipientPhone: '0201111111',
    deliveryAddress: 'East Legon, Accra',
    landmark: 'Near the school',
    locationLink: 'https://maps.example.test/pin',
    deliveryInstructions: 'Call before arriving.',
    notes: 'Use soft colours.',
    cardMessage: 'With love.',
    cardStyle: 'Handwritten',
    staffNote: 'Staff-only update',
  });

  assert.equal(request.record.occasion, 'Birthday');
  assert.deepEqual(request.record.selections, ['Fresh flowers', 'Luxury box']);
  assert.equal(request.record.quantity, 3);
  assert.equal(request.record.budget, 'GHS 900');
  assert.equal(request.record.deliveryInstructions, 'Call before arriving.');
  assert.equal(request.record.staffNote, 'Staff-only update');
});

test('partial Track refresh preserves prior customer fields', () => {
  const previous = {
    kind: 'order',
    record: { tracking: 'GF-087313', customer: 'Ama Mensah', cardMessage: 'Happy birthday', deliveryAddress: 'East Legon' },
  };
  const merged = mergeTrackedResult(previous, {
    kind: 'order',
    record: { tracking: 'GF-087313', customer: 'Ama Mensah', cardMessage: null, deliveryAddress: undefined, status: 'ready' },
  });

  assert.equal(merged.record.cardMessage, 'Happy birthday');
  assert.equal(merged.record.deliveryAddress, 'East Legon');
  assert.equal(merged.record.status, 'ready');
});
