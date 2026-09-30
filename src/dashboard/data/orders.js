import { supabase } from '../../config/supabase';
import { DASHBOARD_TO_DB_FULFILLMENT, DB_TO_DASHBOARD_FULFILLMENT, STEPPER_TO_EVENT_STAGE } from './statusMap';

// List all orders with items and events
export async function listOrders() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*),
      order_events (stage, customer_note, created_at, created_by)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  // Transform DB schema to dashboard format
  return orders.map(order => ({
    id: order.id,
    orderCode: order.order_code,
    trackingNumber: order.tracking_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    recipientName: order.recipient_name,
    deliveryAddress: order.delivery_address,
    landmark: order.landmark,
    locationLink: order.location_link,
    customerNote: order.customer_note,
    cardMessage: order.card_message,
    cardStyle: order.card_style,
    requestedDeliveryDate: order.requested_delivery_date,
    subtotal: order.subtotal,
    total: order.total,
    paymentStatus: order.payment_status,
    fulfillmentStatus: DB_TO_DASHBOARD_FULFILLMENT[order.fulfillment_status] || order.fulfillment_status,
    estimatedDelivery: order.estimated_delivery,
    adminNote: order.admin_note,
    staffOrder: order.staff_order,
    source: order.staff_order ? 'staff' : 'online',
    orderDate: order.created_at,
    deliveredAt: order.fulfillment_status === 'completed' ? order.updated_at : null,
    items: (order.order_items || []).map(item => ({
      id: item.id,
      productId: item.product_id,
      sku: null, // Would need to join with products table
      name: item.item_name,
      variant: '',
      qty: item.quantity,
      unitPrice: item.unit_price,
      category: null, // Would need to join with products table
      metadata: item.metadata
    })),
    auditLog: (order.order_events || []).map(event => ({
      time: new Date(event.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      note: event.customer_note || '',
      stage: event.stage
    }))
  }));
}

// Update order fulfillment status and add event
export async function updateOrderStatus(orderId, newStatus, customerNote = '', userId = null) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return null;
  }

  const dbStatus = DASHBOARD_TO_DB_FULFILLMENT[newStatus] || newStatus;
  const eventStage = STEPPER_TO_EVENT_STAGE[newStatus] || dbStatus;

  // Update order
  const { data: order, error: updateError } = await supabase
    .from('orders')
    .update({
      fulfillment_status: dbStatus,
      // If status is 'completed', set estimated_delivery to now
      ...(dbStatus === 'completed' ? { estimated_delivery: new Date().toISOString() } : {})
    })
    .eq('id', orderId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating order status:', updateError);
    return null;
  }

  // Insert order event
  const { error: eventError } = await supabase
    .from('order_events')
    .insert({
      order_id: orderId,
      stage: eventStage,
      customer_note: customerNote,
      created_by: userId
    });

  if (eventError) {
    console.error('Error inserting order event:', eventError);
  }

  return order;
}

// Create a staff order
export async function createStaffOrder(orderData) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return null;
  }

  // Use DB generator functions for tracking number and order code
  const { data: trackingData } = await supabase.rpc('generate_tracking_number');
  const { data: codeData } = await supabase.rpc('generate_order_code');
  const trackingNumber = trackingData || `GF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const orderCode = codeData || `GF-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  // Create order
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      tracking_number: trackingNumber,
      order_code: orderCode,
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail || null,
      customer_phone: orderData.customerPhone,
      recipient_name: orderData.recipientName || orderData.customerName,
      delivery_address: orderData.deliveryAddress,
      landmark: orderData.landmark || null,
      location_link: orderData.locationLink || null,
      customer_note: orderData.customerNote || null,
      card_message: orderData.cardMessage || null,
      card_style: orderData.cardStyle || null,
      requested_delivery_date: orderData.requestedDeliveryDate || null,
      subtotal: orderData.subtotal,
      total: orderData.total,
      payment_provider: 'staff',
      payment_reference: null,
      payment_status: 'paid', // Staff orders are considered paid
      fulfillment_status: 'packaging', // Start in packaging stage
      estimated_delivery: orderData.estimatedDelivery || null,
      admin_note: orderData.adminNote || null,
      staff_order: true
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating staff order:', error);
    return null;
  }

  // Insert order items
  if (orderData.items && orderData.items.length > 0) {
    const itemsToInsert = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.productId || null,
      item_name: item.name,
      quantity: item.qty,
      unit_price: item.unitPrice,
      metadata: item.metadata || {}
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Error inserting order items:', itemsError);
    }
  }

  // Insert initial order event
  await supabase
    .from('order_events')
    .insert({
      order_id: order.id,
      stage: 'packaging',
      customer_note: 'Staff order created',
      created_by: orderData.createdBy || null
    });

  return order;
}

// Get single order with items and events
export async function getOrder(orderId) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return null;
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*),
      order_events (stage, customer_note, created_at, created_by)
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }

  return order;
}

// Delete order (for bulk delete)
export async function deleteOrder(orderId) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return false;
  }

  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (error) {
    console.error('Error deleting order:', error);
    return false;
  }

  return true;
}

// Update order admin note
export async function updateOrderNote(orderId, adminNote) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return null;
  }

  const { data: order, error } = await supabase
    .from('orders')
    .update({ admin_note: adminNote })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating order note:', error);
    return null;
  }

  return order;
}
