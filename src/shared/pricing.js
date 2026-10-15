/**
 * Shared Pricing Helper
 * Calculates product prices, discounts, and formatted labels consistently
 * across Products, Shop/POS cards, POS cart lines, POS totals, POS order creation, and storefront.
 */

/**
 * Extracts and clamps the active discount percentage for a product.
 * Supports:
 * - Direct product property (discount_percent, discountPercent)
 * - Promotions list with snake_case (product_id) or camelCase (productId)
 * - Clamps between 0 and 90%
 */
export function getProductDiscountPercent(product, promotions = []) {
  if (!product) return 0;

  // Accept a plain string product ID as well as a product object
  const isIdString = typeof product === 'string' || typeof product === 'number';
  const productId = isIdString ? product : product.id;

  // 1. Direct product discount property (only on objects)
  if (!isIdString) {
    const directPct = Number(product.discount_percent ?? product.discountPercent ?? 0);
    if (directPct > 0) {
      return Math.min(90, Math.max(0, Math.round(directPct)));
    }
  }

  // 2. Promotions list
  if (Array.isArray(promotions) && promotions.length > 0) {
    const promo = promotions.find(pr => {
      const pId = pr.product_id || pr.productId;
      if (pId !== productId) return false;
      const status = pr.status || 'active';
      if (status !== 'active') return false;

      // Check date validity if starts_at / ends_at are set
      const now = new Date();
      if (pr.starts_at && new Date(pr.starts_at) > now) return false;
      if (pr.ends_at && new Date(pr.ends_at) < now) return false;

      return Number(pr.percent) > 0;
    });

    if (promo) {
      return Math.min(90, Math.max(0, Math.round(Number(promo.percent))));
    }
  }

  return 0;
}

/**
 * Calculates pricing details for a product given optional promotions.
 * Returns:
 * {
 *   originalPrice: number,
 *   discountPercent: number,
 *   hasDiscount: boolean,
 *   price: number, // final unit price to charge (sale price if discounted)
 *   discountedPrice: number,
 *   originalPriceFormatted: string,
 *   priceFormatted: string
 * }
 */
export function calculateProductPrice(product, promotions = []) {
  // Accept a plain number (price) as first arg, with discount% as second
  if (typeof product === 'number') {
    const originalPrice = Math.round(product);
    const discountPercent = Math.min(90, Math.max(0, Number(promotions) || 0));
    const hasDiscount = discountPercent > 0;
    const salePrice = hasDiscount
      ? Math.round(originalPrice * (100 - discountPercent) / 100)
      : originalPrice;
    return {
      originalPrice,
      discountPercent,
      hasDiscount,
      price: salePrice,
      salePrice,
      discountedPrice: salePrice,
      discountAmount: originalPrice - salePrice,
      originalPriceFormatted: `GHS ${originalPrice.toLocaleString('en-US')}`,
      priceFormatted: `GHS ${salePrice.toLocaleString('en-US')}`
    };
  }

  if (!product) {
    return {
      originalPrice: 0,
      discountPercent: 0,
      hasDiscount: false,
      price: 0,
      salePrice: 0,
      discountedPrice: 0,
      discountAmount: 0,
      originalPriceFormatted: 'GHS 0',
      priceFormatted: 'GHS 0'
    };
  }

  const originalPrice = Math.round(Number(
    product.originalPrice ?? product.original_price ?? product.price ?? product.unitPrice ?? 0
  ));
  const discountPercent = getProductDiscountPercent(product, promotions);
  const hasDiscount = discountPercent > 0;

  const salePrice = hasDiscount
    ? Math.round(originalPrice * (100 - discountPercent) / 100)
    : originalPrice;

  return {
    originalPrice,
    discountPercent,
    hasDiscount,
    price: salePrice,
    salePrice,
    discountedPrice: salePrice,
    discountAmount: originalPrice - salePrice,
    originalPriceFormatted: `GHS ${originalPrice.toLocaleString('en-US')}`,
    priceFormatted: `GHS ${salePrice.toLocaleString('en-US')}`
  };
}

/**
 * Decorates a product with its computed pricing fields.
 */
export function applyProductPricing(product, promotions = []) {
  const pricing = calculateProductPrice(product, promotions);
  return {
    ...product,
    originalPrice: pricing.originalPrice,
    discountPercent: pricing.discountPercent,
    discountedPrice: pricing.discountedPrice,
    price: pricing.price, // final unit price
    priceLabel: pricing.priceFormatted,
    originalPriceLabel: pricing.originalPriceFormatted
  };
}

/**
 * Applies promotions / discounts to an array of products.
 */
export function applyPromotionsToProducts(products = [], promotions = []) {
  return products.map(p => applyProductPricing(p, promotions));
}

/**
 * Calculates cart totals including subtotal, original total, and discount savings.
 */
export function calculateCartTotals(cartItems = [], options = {}) {
  const deliveryFee = Number(options.deliveryFee || 0);
  let subtotal = 0;
  let originalSubtotal = 0;
  let itemsCount = 0;

  cartItems.forEach(item => {
    const qty = Number(item.qty || 1);
    const unitPrice = Number(item.price || 0);
    const origPrice = Number(item.originalPrice || unitPrice);

    subtotal += unitPrice * qty;
    originalSubtotal += origPrice * qty;
    itemsCount += qty;
  });

  const totalDiscount = Math.max(0, originalSubtotal - subtotal);

  return {
    itemsCount,
    subtotal: Math.round(subtotal),
    originalSubtotal: Math.round(originalSubtotal),
    totalDiscount: Math.round(totalDiscount),
    deliveryFee: Math.round(deliveryFee),
    total: Math.round(subtotal + deliveryFee)
  };
}
