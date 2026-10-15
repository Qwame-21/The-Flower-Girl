import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getProductDiscountPercent,
  calculateProductPrice,
  applyProductPricing,
  applyPromotionsToProducts,
  calculateCartTotals
} from '../src/shared/pricing.js';

test('getProductDiscountPercent: handles empty and invalid inputs', () => {
  assert.equal(getProductDiscountPercent(null, []), 0);
  assert.equal(getProductDiscountPercent('prod-1', null), 0);
  assert.equal(getProductDiscountPercent('prod-1', []), 0);
  assert.equal(getProductDiscountPercent({}, []), 0);
});

test('getProductDiscountPercent: matches both product_id and productId', () => {
  const promos = [
    { product_id: 'prod-snake', percent: 20, status: 'active' },
    { productId: 'prod-camel', percent: 15, status: 'active' }
  ];
  assert.equal(getProductDiscountPercent('prod-snake', promos), 20);
  assert.equal(getProductDiscountPercent('prod-camel', promos), 15);
  assert.equal(getProductDiscountPercent({ id: 'prod-snake' }, promos), 20);
  assert.equal(getProductDiscountPercent({ id: 'prod-camel' }, promos), 15);
});

test('getProductDiscountPercent: clamps discount to 0..90%', () => {
  const promos = [
    { product_id: 'excessive', percent: 99, status: 'active' },
    { product_id: 'negative', percent: -10, status: 'active' }
  ];
  assert.equal(getProductDiscountPercent('excessive', promos), 90);
  assert.equal(getProductDiscountPercent('negative', promos), 0);
});

test('getProductDiscountPercent: respects active status and date bounds', () => {
  const now = Date.now();
  const past = new Date(now - 100000).toISOString();
  const future = new Date(now + 100000).toISOString();

  const promos = [
    { product_id: 'inactive', percent: 25, status: 'draft' },
    { product_id: 'expired', percent: 30, status: 'active', ends_at: past },
    { product_id: 'not_started', percent: 30, status: 'active', starts_at: future },
    { product_id: 'valid_window', percent: 30, status: 'active', starts_at: past, ends_at: future }
  ];

  assert.equal(getProductDiscountPercent('inactive', promos), 0);
  assert.equal(getProductDiscountPercent('expired', promos), 0);
  assert.equal(getProductDiscountPercent('not_started', promos), 0);
  assert.equal(getProductDiscountPercent('valid_window', promos), 30);
});

test('calculateProductPrice: computes originalPrice, salePrice, and discountAmount', () => {
  const resNoDiscount = calculateProductPrice(1000, 0);
  assert.equal(resNoDiscount.hasDiscount, false);
  assert.equal(resNoDiscount.originalPrice, 1000);
  assert.equal(resNoDiscount.salePrice, 1000);
  assert.equal(resNoDiscount.discountAmount, 0);

  const resDiscount = calculateProductPrice(1000, 20);
  assert.equal(resDiscount.hasDiscount, true);
  assert.equal(resDiscount.originalPrice, 1000);
  assert.equal(resDiscount.salePrice, 800);
  assert.equal(resDiscount.discountAmount, 200);

  const resOddDiscount = calculateProductPrice(450, 15);
  // 450 * 0.85 = 382.5 -> rounds to 383
  assert.equal(resOddDiscount.salePrice, 383);
});

test('POS and storefront discounts retain the base price for products with and without a discount', () => {
  const products = [
    { id: 'roland-qwame', name: 'Roland Qwame', price: 2556 },
    { id: 'luxury-hamper', name: 'Luxury hamper', price: 3750 },
    { id: 'no-discount', name: 'Fresh bouquet', price: 450 }
  ];
  const promotions = [
    { product_id: 'roland-qwame', percent: 2, status: 'active' },
    { product_id: 'luxury-hamper', percent: 20, status: 'active' }
  ];

  const [roland, hamper, bouquet] = applyPromotionsToProducts(products, promotions);
  assert.deepEqual(
    [roland.originalPrice, roland.discountPercent, roland.price],
    [2556, 2, 2505]
  );
  assert.deepEqual(
    [hamper.originalPrice, hamper.discountPercent, hamper.price],
    [3750, 20, 3000]
  );
  assert.deepEqual(
    [bouquet.originalPrice, bouquet.discountPercent, bouquet.price],
    [450, 0, 450]
  );

  const [rolandAgain, hamperAgain] = applyPromotionsToProducts([roland, hamper], promotions);
  assert.deepEqual(
    [rolandAgain.originalPrice, rolandAgain.price, hamperAgain.originalPrice, hamperAgain.price],
    [2556, 2505, 3750, 3000]
  );

  const cartTotals = calculateCartTotals([
    { price: roland.price, originalPrice: roland.originalPrice, qty: 2 },
    { price: hamper.price, originalPrice: hamper.originalPrice, qty: 1 }
  ]);
  assert.equal(cartTotals.subtotal, 8010);
  assert.equal(cartTotals.originalSubtotal, 8862);
  assert.equal(cartTotals.total, 8010);
});

test('applyProductPricing & applyPromotionsToProducts: enrich product objects', () => {
  const products = [
    { id: 'p1', name: 'Luxury Hamper', price: 3750, priceLabel: 'GHS 3,750' },
    { id: 'p2', name: 'Flower Bouquet', price: 450, priceLabel: 'GHS 450' }
  ];
  const promos = [
    { product_id: 'p1', percent: 20, status: 'active' }
  ];

  const enriched = applyPromotionsToProducts(products, promos);
  assert.equal(enriched[0].discountPercent, 20);
  assert.equal(enriched[0].originalPrice, 3750);
  assert.equal(enriched[0].price, 3000);
  assert.equal(enriched[0].originalPriceLabel, 'GHS 3,750');
  assert.equal(enriched[0].priceLabel, 'GHS 3,000');

  assert.equal(enriched[1].discountPercent, 0);
  assert.equal(enriched[1].price, 450);
});

test('calculateCartTotals: computes cart totals, discount savings, and delivery fee', () => {
  const cart = [
    { id: 'p1', price: 800, originalPrice: 1000, qty: 2 },
    { id: 'p2', price: 500, originalPrice: 500, qty: 1 }
  ];

  const totals = calculateCartTotals(cart, { deliveryFee: 50 });
  assert.equal(totals.itemsCount, 3);
  assert.equal(totals.originalSubtotal, 2500); // 1000*2 + 500*1
  assert.equal(totals.subtotal, 2100); // 800*2 + 500*1
  assert.equal(totals.totalDiscount, 400); // 2500 - 2100
  assert.equal(totals.deliveryFee, 50);
  assert.equal(totals.total, 2150); // 2100 + 50
});
