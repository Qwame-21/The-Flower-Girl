import { parseAdminOrderNotes } from './orderNotes.js';

function firstValue(...values) {
  return values.find(value => value !== null && value !== undefined && String(value).trim() !== '') ?? '';
}

function removeCustomerTextFromStaffNote(staffNote, customerText) {
  const staff = String(staffNote || '').trim();
  const customer = String(customerText || '').trim();
  if (!staff || !customer) return staff;
  if (staff === customer) return '';

  return staff.replace(customer, '').replace(/^[\s|·—–-]+|[\s|·—–-]+$/g, '').trim();
}

export function getOrderCustomerFields(order = {}) {
  const customerNote = firstValue(order.customerNote, order.customer_note);
  const cardMessage = firstValue(order.cardMessage, order.card_message);
  const cardStyle = firstValue(order.cardStyle, order.card_style);
  const adminNote = firstValue(order.staffNote, order.adminNote, order.admin_note);
  const hasCustomerText = Boolean(customerNote || cardMessage || cardStyle);
  const useLegacyAdminNote = !hasCustomerText && /(?:gift\s*card|card\s*style)\s*:/i.test(adminNote);
  const source = useLegacyAdminNote ? adminNote : customerNote;
  const blocks = parseAdminOrderNotes(source);
  const readBlock = id => blocks.find(block => block.id === id)?.content || '';
  const staffNote = removeCustomerTextFromStaffNote(adminNote, source);

  return {
    deliveryInstructions: readBlock('instructions'),
    giftMessage: firstValue(cardMessage, readBlock('gift-message')),
    cardStyle: firstValue(cardStyle, readBlock('card-style')),
    staffNote,
  };
}

export function getRequestCustomerFields(request = {}) {
  const rawNotes = firstValue(request.customerNotes, request.notes, request.customerNote, request.customer_note);
  const deliverySummaryStart = rawNotes.search(/(?:\n\s*\n|\n)?Delivery address:/i);

  return {
    notes: deliverySummaryStart >= 0 ? rawNotes.slice(0, deliverySummaryStart).trim() : rawNotes.trim(),
    deliveryInstructions: firstValue(request.deliveryInstructions, request.delivery_instructions),
    cardMessage: firstValue(request.cardMessage, request.card_message),
    cardStyle: firstValue(request.cardStyle, request.card_style),
  };
}

export function mapTrackedRecord(data) {
  if (!data) return null;

  if (data.kind === 'order') {
    const events = (data.events || []).map(event => ({
      stage: event.stage,
      createdAt: event.createdAt || event.created_at,
    }));
    const eventFields = Object.fromEntries(events.map(event => [`${event.stage}At`, event.createdAt]));

    return {
      kind: 'order',
      record: {
        tracking: data.trackingNumber || data.tracking,
        orderCode: data.orderCode || data.order_code,
        customer: data.customerName || data.customer,
        customerPhone: data.customerPhone || data.customer_phone,
        customerEmail: data.customerEmail || data.customer_email,
        recipient: data.recipientName || data.recipient_name || data.recipient,
        recipientPhone: data.recipientPhone || data.recipient_phone,
        deliveryAddress: data.deliveryAddress || data.delivery_address,
        landmark: data.landmark,
        locationLink: data.locationLink || data.location_link,
        status: data.status,
        paymentStatus: data.paymentStatus || data.payment_status,
        estimatedDelivery: data.estimatedDelivery || data.estimated_delivery,
        requestedDeliveryDate: data.requestedDeliveryDate || data.requested_delivery_date,
        deliveryType: data.deliveryType || data.delivery_type,
        deliveryFee: data.deliveryFee ?? data.delivery_fee,
        deliveryWindow: data.deliveryWindow || data.delivery_window,
        customerNote: data.customerNote || data.customer_note,
        cardMessage: data.cardMessage || data.card_message,
        cardStyle: data.cardStyle || data.card_style,
        customizationSelections: data.customizationSelections || data.customization_selections,
        items: data.items,
        staffNote: data.staffNote ?? data.adminNote ?? data.admin_note,
        createdAt: data.createdAt || data.created_at,
        events,
        ...eventFields,
      },
    };
  }

  if (data.kind === 'request') {
    return {
      kind: 'request',
      record: {
        reference: data.reference,
        shortCode: data.shortCode || data.short_code,
        name: data.customerName || data.customer_name || data.name,
        customerPhone: data.customerPhone || data.phone,
        customerEmail: data.customerEmail || data.email,
        requestType: data.requestType || data.request_type,
        service: data.service,
        occasion: data.occasion,
        status: data.status,
        preferredDate: data.preferredDate || data.preferred_date,
        quoteTotal: data.confirmedQuote ?? data.confirmed_quote,
        staffNote: data.staffNote ?? data.adminNote ?? data.admin_note,
        notes: data.notes || data.customerNotes,
        deliveryAddress: data.deliveryAddress || data.delivery_address,
        city: data.city,
        recipient: data.recipient,
        recipientPhone: data.recipientPhone || data.recipient_phone,
        landmark: data.landmark,
        locationLink: data.locationLink || data.location_link,
        deliveryInstructions: data.deliveryInstructions || data.delivery_instructions,
        fulfilment: data.fulfilment || data.fulfillment,
        deliveryType: data.deliveryType || data.delivery_type,
        deliveryFee: data.deliveryFee ?? data.delivery_fee,
        deliveryWindow: data.deliveryWindow || data.delivery_window,
        budget: data.budget,
        selections: data.selections,
        quantity: data.quantity,
        cardMessage: data.cardMessage || data.card_message,
        cardStyle: data.cardStyle || data.card_style,
        paymentStatus: data.paymentStatus || data.payment_status,
        createdAt: data.createdAt || data.created_at,
        receivedAt: data.receivedAt || data.received_at,
        quotedAt: data.quotedAt || data.quoted_at,
        approvedAt: data.approvedAt || data.approved_at,
        convertedAt: data.convertedAt || data.converted_at,
        closedAt: data.closedAt || data.closed_at,
        updatedAt: data.updatedAt || data.updated_at,
      },
    };
  }

  return null;
}

export function mergeTrackedResult(previous, incoming) {
  if (!incoming) return previous;
  if (!previous || previous.kind !== incoming.kind) return incoming;

  const record = { ...previous.record };
  for (const [key, value] of Object.entries(incoming.record || {})) {
    if (value !== null && value !== undefined) record[key] = value;
  }
  return { ...previous, ...incoming, record };
}

export function findTrackedRecord(records, current) {
  if (!current) return null;
  const record = current.record || {};
  const currentReference = current.kind === 'order'
    ? record.tracking || record.orderCode
    : record.shortCode || record.reference;
  return records.find(item => (
    (record.id && item.id === record.id) ||
    (current.kind === 'order' && [item.tracking, item.tracking_number, item.orderCode, item.order_code].includes(currentReference)) ||
    (current.kind === 'request' && [item.short_code, item.shortCode, item.reference].includes(currentReference))
  )) || null;
}
