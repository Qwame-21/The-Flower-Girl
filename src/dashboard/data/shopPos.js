import { supabase } from '../../config/supabase';
import { createStaffOrder } from './orders';
import { getImageUrl } from '../lib/imageUrlHelper';
import { applyPromotionsToProducts, calculateCartTotals } from '../../shared/pricing';

// Normalize phone to international format (+233xxxxxxxxx for Ghana)
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  
  // If starts with 0, treat as Ghana number
  if (digits.startsWith('0')) {
    return '+233' + digits.substring(1);
  }
  // If starts with 233 (no +), add +
  if (digits.startsWith('233')) {
    return '+' + digits;
  }
  // If starts with +, return as-is
  if (phone.startsWith('+')) {
    return '+' + digits;
  }
  // Otherwise assume Ghana and add +233
  return '+233' + digits;
}

import { PRODUCTS } from '../../data/products';

// Load products for POS (visible only, with promotions applied)
export async function loadPosProducts() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const [productsRes, promosRes] = await Promise.all([
    supabase.from('products').select('*').eq('visible', true).order('sort_order', { ascending: true }),
    supabase.from('promotions').select('*').eq('status', 'active')
  ]);

  const products = productsRes.data || [];
  const promotions = promosRes.data || [];

  const rawProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    category: p.category,
    image: getImageUrl(p.image_path),
    imageUrl: getImageUrl(p.image_path),
    tag: p.tag,
    description: p.description,
    code: p.id,
    discountPercent: p.discount_percent ?? p.discountPercent ?? 0
  }));

  return applyPromotionsToProducts(rawProducts, promotions);
}

// Place staff order
export async function placeStaffOrder(formData, cart, userId) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const totals = calculateCartTotals(cart);
  const totalAmount = totals.total;

  const orderData = {
    customer_name: formData.fullName,
    customer_email: formData.email || null,
    customer_phone: normalizePhone(formData.phone),
    recipient_name: formData.fullName,
    delivery_address: formData.address,
    landmark: formData.townCity,
    location_link: null,
    customer_note: formData.deliveryInstructions || null,
    card_message: null,
    card_style: null,
    requested_delivery_date: formData.deliveryDate || null,
    subtotal: totalAmount,
    total: totalAmount,
    payment_provider: 'staff',
    payment_reference: null,
    payment_status: formData.paymentStatus === 'Paid' ? 'paid' : 'pending',
    fulfillment_status: 'packaging',
    staff_order: true,
    estimated_delivery: formData.deliveryDate ? new Date(formData.deliveryDate).toISOString() : null,
    admin_note: formData.deliveryInstructions || null,
    items: cart.map(item => ({
      productId: item.id,
      name: item.name,
      qty: item.qty,
      unitPrice: item.price,
      metadata: {
        category: item.category,
        ...(item.discountPercent ? { discount_percent: item.discountPercent } : {}),
        ...(item.originalPrice ? { original_price: item.originalPrice } : {})
      }
    })),
    createdBy: userId
  };

  const order = await createStaffOrder(orderData);

  if (!order) {
    return { success: false, error: 'Failed to create order' };
  }

  return { success: true, order };
}
