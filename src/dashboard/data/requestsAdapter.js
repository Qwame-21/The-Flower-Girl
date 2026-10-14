// Adapter to make HOPESON RequestsPage work with Supabase
// Returns data in the exact shape HOPESON expects

import { listRequests, updateRequestStatus, updateRequestQuote, deleteRequest } from './requests';
import { supabase } from '../../config/supabase';

const REQUESTS_KEY = 'xa12_custom_requests';

function extractFromNotes(notes, key) {
  if (!notes || typeof notes !== 'string') return '';
  const regex = new RegExp(`^${key}:\\s*(.*)$`, 'im');
  const match = notes.match(regex);
  return match ? match[1].trim() : '';
}

function extractDeliveryAddress(notes) {
  if (!notes || typeof notes !== 'string') return '';
  const match = notes.match(/^Delivery address:\s*([^\n]+)/im);
  return match ? match[1].trim() : '';
}

function extractBlobField(notes, key) {
  if (!notes || typeof notes !== 'string') return '';
  const regex = new RegExp(`^${key}:\\s*(.*)$`, 'im');
  const match = notes.match(regex);
  if (!match) return '';
  const val = match[1].trim();
  if (val.toLowerCase() === key.toLowerCase()) return '';
  return val;
}

function cleanNotes(notes) {
  if (!notes || typeof notes !== 'string') return '';
  const splitIdx = notes.search(/(?:\n\s*\n|\n)?Delivery address:/i);
  if (splitIdx !== -1) {
    return notes.substring(0, splitIdx).trim();
  }
  return notes.trim();
}

function normalizeSelections(raw) {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
      if (parsed && typeof parsed === 'object') return Object.values(parsed).flat().filter(Boolean);
    } catch {}
    if (raw.trim()) {
      if (raw.includes(',')) return raw.split(',').map(s => s.trim()).filter(Boolean);
      return [raw.trim()];
    }
  }
  return [];
}

// Load requests from localStorage cache (sync)
export function loadRequestsData() {
  try {
    const cached = localStorage.getItem(REQUESTS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

// Save requests to localStorage (cache only, writes go through Supabase)
export function saveRequestsData(list) {
  try {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(list));
  } catch {}
}

// Sync with Supabase (async)
export async function syncRequestsWithSupabase() {
  const requests = await listRequests();

  if (!requests || requests.length === 0) {
    // If Supabase returned empty, retain existing cached requests if available
    const existing = loadRequestsData();
    if (existing.length > 0) return existing;
    return [];
  }

  // Transform Supabase data to HOPESON shape
  const mapped = requests.map(r => {
    const rawNotes = r.notes || '';
    // Structured delivery columns take precedence; fall back to parsing the blob
    const deliveryAddress = r.delivery_address || extractDeliveryAddress(rawNotes);
    const rawFulfilment = r.fulfilment || extractBlobField(rawNotes, 'fulfilment');
    const fulfilment = ['delivery', 'collection'].includes(rawFulfilment)
      ? rawFulfilment
      : deliveryAddress.toLowerCase().includes('collection') ? 'collection' : 'delivery';
    // recipient: use structured col; if blob value === customer_name treat as blank recipient
    const blobRecipient = extractBlobField(rawNotes, 'recipient');
    const recipient = r.recipient || (blobRecipient !== r.customer_name ? blobRecipient : '') || r.customer_name;
    const blobRecipPhone = extractBlobField(rawNotes, 'recipientPhone');
    const recipientPhone = r.recipient_phone || (blobRecipPhone !== r.phone ? blobRecipPhone : '') || r.phone;
    const landmark = r.landmark || extractBlobField(rawNotes, 'landmark');
    const locationLink = r.location_link || extractBlobField(rawNotes, 'locationLink');
    const deliveryInstructions = r.delivery_instructions || extractBlobField(rawNotes, 'deliveryInstructions');
    const budgetVal = r.budget || extractBlobField(rawNotes, 'budget');
    const city = r.city || (deliveryAddress ? deliveryAddress.split(',')[0].trim() : '');
    const selections = normalizeSelections(r.selections);
    // notes shown in drawer: strip the delivery blob footer
    const displayNotes = cleanNotes(rawNotes);

    let formattedDate = '';
    if (r.created_at) {
      try {
        formattedDate = new Date(r.created_at).toLocaleDateString('en-GB', { timeZone: 'Africa/Accra', day: 'numeric', month: 'short', year: 'numeric' });
      } catch {
        formattedDate = String(r.created_at);
      }
    }

    // short_code: the friendly reference (RQ-XXXXXX) set by the DB/edge function
    // longReference: the older UUID-derived code — kept for search and permalink support
    const shortCode = r.short_code || null;
    const longReference = r.reference || r.id;
    // displayRef: prefer short code; fall back to long reference for old rows
    const displayRef = shortCode || longReference;

    return {
      id: r.id,
      short_code: shortCode,
      reference: displayRef,           // what cards/drawer header show
      long_reference: longReference,   // kept for search matching
      created_at: formattedDate,
      created_at_iso: r.created_at,
      status: r.status || 'new',
      customer_name: r.customer_name,
      phone: r.phone,
      email: r.email,
      request_type: r.request_type,
      service: r.service,
      occasion: r.occasion,
      quantity: r.quantity || 1,
      budget: budgetVal,
      preferred_date: r.preferred_date || extractBlobField(rawNotes, 'preferredDate') || '',
      fulfilment,
      city,
      recipient,
      recipient_phone: recipientPhone,
      landmark,
      location_link: locationLink,
      delivery_instructions: deliveryInstructions,
      delivery_address: deliveryAddress,
      selections,
      notes: displayNotes,
      inspiration_path: r.inspiration_path,
      card_message: r.card_message || extractBlobField(rawNotes, 'cardMessage'),
      card_style: r.card_style || extractBlobField(rawNotes, 'cardStyleNotes') || extractBlobField(rawNotes, 'cardStyle'),
      estimate_low: r.estimate_low,
      estimate_high: r.estimate_high,
      confirmed_quote: r.confirmed_quote,
      admin_note: r.admin_note,
      quote_date: r.quote_date || r.quoted_at || null,
      quoted_at: r.quoted_at || null,
      received_at: r.received_at || r.created_at || null,
      approved_at: r.approved_at,
      converted_at: r.converted_at,
      closed_at: r.closed_at || null,
      converted_order_id: r.converted_order_id
    };
  });

  localStorage.setItem(REQUESTS_KEY, JSON.stringify(mapped));
  return mapped;
}

// Update request status in Supabase and update cache
export async function updateRequestStatusSync(id, status, adminNote = null) {
  const result = await updateRequestStatus(id, status, adminNote);
  if (result.success) {
    await syncRequestsWithSupabase();
  }
  return result;
}

// Update request quote in Supabase and update cache
export async function updateRequestQuoteSync(id, confirmedQuote) {
  const result = await updateRequestQuote(id, confirmedQuote);
  if (result.success) {
    await syncRequestsWithSupabase();
  }
  return result;
}

// Delete request in Supabase and update cache
export async function deleteRequestSync(id) {
  const result = await deleteRequest(id);
  if (result.success) {
    await syncRequestsWithSupabase();
  }
  return result;
}

/**
 * Convert an approved request to an order via RPC
 * @param {string} requestId - The UUID of the request to convert
 * @param {Object} conversionData - { deliveryAddress, recipientName, landmark, requestedDeliveryDate, adminNote }
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function convertRequestToOrder(requestId, conversionData) {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  const { deliveryAddress, recipientName, landmark, requestedDeliveryDate, adminNote } = conversionData;

  if (!deliveryAddress || !deliveryAddress.trim()) {
    return { success: false, error: 'Delivery address is required' };
  }

  try {
    const { data, error } = await supabase.rpc('convert_request_to_order', {
      p_request_id: requestId,
      p_delivery_address: deliveryAddress.trim(),
      p_recipient_name: recipientName?.trim() || null,
      p_landmark: landmark?.trim() || null,
      p_requested_delivery_date: requestedDeliveryDate || null,
      p_admin_note: adminNote?.trim() || null,
    });

    if (error) {
      console.error('[convertRequestToOrder] RPC error:', error);
      return { success: false, error: error.message || 'Failed to convert request to order' };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[convertRequestToOrder] Unexpected error:', err);
    return { success: false, error: err.message || 'Unexpected error during conversion' };
  }
}
