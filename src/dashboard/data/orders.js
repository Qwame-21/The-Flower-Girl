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
      sku: null,
      name: item.item_name,
      variant: '',
      qty: item.quantity,
      unitPrice: item.unit_price,
      category: item.metadata?.category || null, // Category stored in metadata by finalize_paid_checkout
      metadata: item.metadata
    })),
    auditLog: (order.order_events || []).map(event => ({
      time: new Date(event.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
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
    .select('id, fulfillment_status, payment_status, payment_provider, staff_order')
    .eq('id', orderId)
    .single();

  if (fetchError || !currentOrder) {
    return { success: false, error: fetchError?.message || 'Order not found' };
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
      // Undo Packed
      isUndo = true;
      targetDbStatus = 'packaging';
      eventStagesToDelete = ['ready'];
    } else {
      // Advance Packed
      targetDbStatus = 'ready';
      targetPaymentStatus = 'paid';
      eventStageToInsert = 'ready';
    }
  } else if (action === 'dispatched' || action === 'delivery') {
    if (currentOrder.fulfillment_status === 'delivery') {
      // Undo Dispatched
      isUndo = true;
      targetDbStatus = 'ready';
      eventStagesToDelete = ['delivery'];
    } else {
      // Advance Dispatched
      targetDbStatus = 'delivery';
      targetPaymentStatus = 'paid';
      eventStageToInsert = 'delivery';
    }
  } else if (action === 'delivered' || action === 'completed') {
    if (currentOrder.fulfillment_status === 'completed') {
      // Undo Delivered
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

  if (isUndo && eventStagesToDelete) {
    const { error: deleteError } = await supabase
      .from('order_events')
      .delete()
      .eq('order_id', orderId)
      .in('stage', eventStagesToDelete);

    if (deleteError) {
      console.warn('Error deleting order_events on undo:', deleteError.message);
    }
  } else if (eventStageToInsert) {
    const { error: eventError } = await supabase
      .from('order_events')
      .insert({
        order_id: orderId,
        stage: eventStageToInsert,
        customer_note: customerNote || '',
        created_by: userId
      });

    if (eventError) {
      console.warn('Error inserting order_events on advance:', eventError.message);
    }
  }

  // Trigger customer notification for status changes (except undo operations)
  if (!isUndo && eventStageToInsert && updatedOrder.payment_status === 'paid') {
    try {
      // Fetch order items for the email
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('name, quantity')
        .eq('order_id', orderId);

      // Call notify-customer Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const serviceRole = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && serviceRole) {
        const notifyUrl = `${supabaseUrl}/functions/v1/notify-customer`;
        await fetch(notifyUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRole}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: orderId,
            event_type: 'status_change',
            tracking_number: updatedOrder.tracking_number,
            status: targetDbStatus,
            total_paid: updatedOrder.total,
            items: orderItems || [],
          }),
        });
        console.log('Customer notification triggered for status change:', orderId);
      }
    } catch (notifyError) {
      console.error('Failed to trigger customer notification:', notifyError);
      // Don't fail the status update if notification fails
    }
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

    if (!error) {
      order = insertedOrder;
      break;
    }

    lastError = error;
    // Check if it's a unique violation - if so, retry with new values
    if (error.code === '23505' || error.message.includes('unique')) {
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
        category: itemCategory
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

      // Decrement stock for staff orders too
      if (item.productId) {
        await supabase
          .from('products')
          .update({ stock: supabase.raw('stock - ' + item.qty) })
          .eq('id', item.productId);
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
