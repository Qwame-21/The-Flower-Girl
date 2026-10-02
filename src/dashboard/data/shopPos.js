import { supabase } from '../../config/supabase';
import { createStaffOrder } from './orders';

// Load products for POS (visible only)
export async function loadPosProducts() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('visible', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error loading POS products:', error);
    return [];
  }

  return products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    category: p.category,
    image: p.image_path,
    tag: p.tag,
    description: p.description,
    code: p.id // Using product ID as code for now
  }));
}

// Place staff order
export async function placeStaffOrder(formData, cart, userId) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const orderData = {
    customer_name: formData.fullName,
    customer_email: formData.email || null,
    customer_phone: formData.phone,
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
      metadata: { category: item.category }
    })),
    createdBy: userId
  };

  const order = await createStaffOrder(orderData);

  if (!order) {
    return { success: false, error: 'Failed to create order' };
  }

  return { success: true, order };
}
