import { supabase } from '../../config/supabase';
import { DASHBOARD_TO_DB_FULFILLMENT, DB_TO_DASHBOARD_FULFILLMENT, STEPPER_TO_EVENT_STAGE } from './statusMap';

// Generate tracking number and order code matching paystack-init format
function generateTrackingNumber() {
  const timestamp = Date.now();
  return `GF-${String(timestamp).slice(-6)}`;
}

function generateOrderCode() {
  const timestamp = Date.now();
  return `WEB-${String(timestamp).slice(-6)}`;
}

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
    deliveryType: order.delivery_type || (
      (Number(order.total) - Number(order.subtotal)) === 120 ? 'sameday' :
      (Number(order.total) - Number(order.subtotal)) === 90 ? 'scheduled' :
      (Number(order.total) - Number(order.subtotal)) === 140 ? 'surprise' :
      (Number(order.total) - Number(order.subtotal)) === 0 && Number(order.subtotal) > 0 ? 'collection' : null
    ),
    deliveryFee: (order.delivery_fee !== null && order.delivery_fee !== undefined && Number(order.delivery_fee) > 0)
      ? Number(order.delivery_fee)
      : (Number(order.total) > Number(order.subtotal) ? (Number(order.total) - Number(order.subtotal)) : Number(order.delivery_fee || 0)),
    deliveryWindow: order.delivery_window || null,
    paymentProvider: order.payment_provider || 'paystack',
    paymentReference: order.payment_reference || null,
    paymentDate: order.created_at,
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
      sku: item.product_id || item.sku || null,
      name: item.item_name,
      variant: '',
      qty: item.quantity,
      unitPrice: item.unit_price,
      category: item.metadata?.category || null, // Category stored in metadata by finalize_paid_checkout
      discountPercent: item.metadata?.discount_percent ?? item.metadata?.discountPercent ?? null,
      image: item.metadata?.image || item.metadata?.imageUrl || null,
      imageUrl: item.metadata?.image || item.metadata?.imageUrl || null,
      metadata: item.metadata || {}
    })),
    auditLog: (order.order_events || []).map(event => ({
      time: new Date(event.created_at).toLocaleTimeString('en-US', { timeZone: 'Africa/Accra', hour: '2-digit', minute: '2-digit', hour12: true }),
      note: event.customer_note || '',
      stage: event.stage
    }))
  }));
}

// Update order fulfillment status and add/delete event
export async function updateOrderStatus(orderId, action, customerNote = '', userId = null) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  // Fetch current order state from DB
  const { data: currentOrder, error: fetchError } = await supabase
    .from('orders')
    .select('id, fulfillment_status, payment_status, payment_provider, payment_reference, staff_order')
    .eq('id', orderId)
    .single();

  if (fetchError || !currentOrder) {
    return { success: false, error: fetchError?.message || 'Order not found' };
  }

  // Paystack-paid orders cannot be un-paid
  const isPaystackPaid = currentOrder.payment_provider === 'paystack' && 
                         currentOrder.payment_status === 'paid' && 
                         currentOrder.payment_reference;
  
  if (action === 'paid' && isPaystackPaid) {
    return { success: false, error: 'Paystack-paid orders cannot be modified' };
  }

  let isUndo = false;
  let targetDbStatus = currentOrder.fulfillment_status;
  let targetPaymentStatus = currentOrder.payment_status;
  let eventStageToInsert = null;
  let eventStagesToDelete = null;

  if (action === 'paid') {
    if (currentOrder.fulfillment_status === 'pending_payment' && currentOrder.payment_status === 'pending') {
      // Advance: Unpaid -> Paid/Processing
      targetDbStatus = 'packaging';
      targetPaymentStatus = 'paid';
      eventStageToInsert = 'paid';
    } else if (currentOrder.payment_status === 'paid') {
      // Undo Paid - database trigger will enforce Paystack protection
      isUndo = true;
      targetDbStatus = 'pending_payment';
      targetPaymentStatus = 'pending';
      eventStagesToDelete = ['paid', 'packaging'];
    } else {
      // Unpaid order at another status marking paid
      targetPaymentStatus = 'paid';
      eventStageToInsert = 'paid';
    }
  } else if (action === 'packed' || action === 'ready') {
    if (currentOrder.fulfillment_status === 'ready') {
      // Undo Packed -> return to packaging
      isUndo = true;
      targetDbStatus = 'packaging';
      eventStagesToDelete = ['ready', 'delivery', 'completed'];
    } else if (currentOrder.fulfillment_status === 'delivery' || currentOrder.fulfillment_status === 'completed') {
      // Rolling back from Dispatched or Delivered to Packed
      isUndo = true;
      targetDbStatus = 'ready';
      eventStagesToDelete = ['delivery', 'completed'];
    } else {
      // Advance Packed
      targetDbStatus = 'ready';
      targetPaymentStatus = 'paid';
      eventStageToInsert = 'ready';
    }
  } else if (action === 'dispatched' || action === 'delivery') {
    if (currentOrder.fulfillment_status === 'delivery') {
      // Undo Dispatched -> return to ready
      isUndo = true;
      targetDbStatus = 'ready';
      eventStagesToDelete = ['delivery', 'completed'];
    } else if (currentOrder.fulfillment_status === 'completed') {
      // Rolling back from Delivered to Dispatched
      isUndo = true;
      targetDbStatus = 'delivery';
      eventStagesToDelete = ['completed'];
    } else {
      // Advance Dispatched
      targetDbStatus = 'delivery';
      targetPaymentStatus = 'paid';
      eventStageToInsert = 'delivery';
    }
  } else if (action === 'delivered' || action === 'completed') {
    if (currentOrder.fulfillment_status === 'completed') {
      // Undo Delivered -> return to delivery
      isUndo = true;
      targetDbStatus = 'delivery';
      eventStagesToDelete = ['completed'];
    } else {
      // Advance Delivered
      targetDbStatus = 'completed';
      targetPaymentStatus = 'paid';
      eventStageToInsert = 'completed';
    }
  } else if (action === 'cancelled') {
    targetDbStatus = 'cancelled';
  } else {
    targetDbStatus = DASHBOARD_TO_DB_FULFILLMENT[action] || action;
  }

  // Update order in Supabase
  const updatePayload = {
    fulfillment_status: targetDbStatus,
    payment_status: targetPaymentStatus,
    ...(targetDbStatus === 'completed' ? { estimated_delivery: new Date().toISOString() } : {})
  };

  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId)
    .select()
    .single();

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Run event insert/delete in parallel with order update (independent operations)
  const eventPromises = [];
  if (isUndo && eventStagesToDelete) {
    eventPromises.push(
      supabase
        .from('order_events')
        .delete()
        .eq('order_id', orderId)
        .in('stage', eventStagesToDelete)
    );
  } else if (eventStageToInsert) {
    eventPromises.push(
      supabase
        .from('order_events')
        .insert({
          order_id: orderId,
          stage: eventStageToInsert,
          customer_note: customerNote || '',
          created_by: userId
        })
    );
  }

  // Await all event operations in parallel
  if (eventPromises.length > 0) {
    const results = await Promise.allSettled(eventPromises);
    results.forEach((result, idx) => {
      if (result.status === 'rejected' || (result.value && result.value.error)) {
        const error = result.status === 'rejected' ? result.reason : result.value.error;
        console.warn('Error in order_events operation:', error.message);
      }
    });
  }

  // Safely record to activity_log if table exists
  try {
    await supabase.from('activity_log').insert({
      event_type: 'order_status_change',
      description: `Order ${updatedOrder.order_code || updatedOrder.tracking_number || orderId} status changed to ${targetDbStatus}`,
      metadata: { order_id: orderId, old_status: currentOrder.fulfillment_status, new_status: targetDbStatus, action, note: customerNote },
      user_id: userId
    });
  } catch (logErr) {
    // Activity log write is non-blocking
  }

  return { success: true, data: updatedOrder };
}

// Create a staff order
export async function createStaffOrder(orderData) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return null;
  }

  // Generate tracking number and order code with retry on unique violation
  let order = null;
  let lastError = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const trackingNumber = generateTrackingNumber();
    const orderCode = generateOrderCode();

    const { data: insertedOrder, error } = await supabase
      .from('orders')
      .insert({
        tracking_number: trackingNumber,
        order_code: orderCode,
        customer_name: orderData.customerName || orderData.customer_name,
        customer_email: orderData.customerEmail || orderData.customer_email || null,
        customer_phone: orderData.customerPhone || orderData.customer_phone,
        recipient_name: orderData.recipientName || orderData.recipient_name || orderData.customerName || orderData.customer_name,
        delivery_address: orderData.deliveryAddress || orderData.delivery_address,
        landmark: orderData.landmark || null,
        location_link: orderData.locationLink || orderData.location_link || null,
        customer_note: orderData.customerNote || orderData.customer_note || null,
        card_message: orderData.cardMessage || orderData.card_message || null,
        card_style: orderData.cardStyle || orderData.card_style || null,
        requested_delivery_date: orderData.requestedDeliveryDate || orderData.requested_delivery_date || null,
        delivery_type: orderData.deliveryType || orderData.delivery_type || 'standard',
        delivery_fee: orderData.deliveryFee ?? orderData.delivery_fee ?? 0,
        subtotal: orderData.subtotal,
        total: orderData.total,
        payment_provider: orderData.paymentProvider || orderData.payment_provider || 'staff',
        payment_reference: orderData.paymentReference || orderData.payment_reference || null,
        payment_status: orderData.paymentStatus || orderData.payment_status || 'paid',
        fulfillment_status: orderData.fulfillmentStatus || orderData.fulfillment_status || 'packaging',
        estimated_delivery: orderData.estimatedDelivery || orderData.estimated_delivery || null,
        admin_note: orderData.adminNote || orderData.admin_note || null,
        staff_order: true
      })
      .select()
      .single();

    if (!error) {
      order = insertedOrder;
      break;
    }

    lastError = error;
    // Check if it's a unique violation - if so, retry with new values
    if (error.code === '23505' || error.message?.includes('unique')) {
      console.warn(`Unique violation on attempt ${attempt + 1}, retrying...`);
      // Small delay to avoid timestamp collision
      await new Promise(resolve => setTimeout(resolve, 10));
      continue;
    }
    // If it's not a unique violation, don't retry
    break;
  }

  if (!order) {
    console.error('Error creating staff order after retries:', lastError);
    return null;
  }

  // Insert order items with category capture and stock decrement
  if (orderData.items && orderData.items.length > 0) {
    for (const item of orderData.items) {
      let itemCategory = null;
      if (item.productId) {
        const { data: product } = await supabase
          .from('products')
          .select('category')
          .eq('id', item.productId)
          .single();
        if (product) itemCategory = product.category;
      }

      const itemMetadata = {
        ...(item.metadata || {}),
        category: itemCategory || item.category || null,
        image: item.image || item.imageUrl || item.metadata?.image || null
      };

      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.productId || null,
          item_name: item.name,
          quantity: item.qty,
          unit_price: item.unitPrice,
          metadata: itemMetadata
        });

      if (itemError) {
        console.error('Error inserting order item:', itemError);
      }

      // Decrement stock for staff orders cleanly
      if (item.productId) {
        const { data: currentProd } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.productId)
          .single();
        if (currentProd && typeof currentProd.stock === 'number') {
          const newStock = Math.max(0, currentProd.stock - item.qty);
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.productId);
        }
      }
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

  // Explicit deletion sequence: order_events -> order_items -> orders
  await supabase.from('order_events').delete().eq('order_id', orderId);
  await supabase.from('order_items').delete().eq('order_id', orderId);

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

// Update order admin note and optionally estimated delivery and delivery window
export async function updateOrderNote(orderId, adminNote, estimatedDelivery = undefined, deliveryWindow = undefined) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return null;
  }

  const payload = {};
  if (adminNote !== undefined) payload.admin_note = adminNote;
  if (estimatedDelivery !== undefined) payload.estimated_delivery = estimatedDelivery;
  if (deliveryWindow !== undefined) payload.delivery_window = deliveryWindow;

  const { data: order, error } = await supabase
    .from('orders')
    .update(payload)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating order note/delivery:', error);
    return null;
  }

  return order;
}
