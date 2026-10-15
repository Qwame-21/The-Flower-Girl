import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStorefrontCustomizationSnapshot } from '../src/shared/customizationSync.js';

test('customization snapshots hide categories and options without losing their estimates', () => {
  const snapshot = buildStorefrontCustomizationSnapshot([
    {
      name: 'Add gifts',
      visible: true,
      options: [
        { name: 'Chocolate', price: 80, visible: true },
        { name: 'Gift bag', price: 30, visible: false }
      ]
    },
    {
      name: 'Personalize',
      visible: false,
      options: [{ name: 'Engraved name', price: 45, visible: true }]
    }
  ]);

  assert.deepEqual(snapshot.options, { 'Add gifts': ['Chocolate'] });
  assert.deepEqual(snapshot.estimates, {
    Chocolate: 80,
    'Gift bag': 30,
    'Engraved name': 45
  });
});
