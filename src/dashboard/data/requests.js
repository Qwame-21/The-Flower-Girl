import { supabase } from '../../config/supabase';

// List all customer requests
export async function listRequests() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const { data: requests, error } = await supabase
    .from('customer_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching requests:', error);
    return [];
  }

  return requests;
}

// Get single request
export async function getRequest(id) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return null;
  }

  const { data: request, error } = await supabase
    .from('customer_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching request:', error);
    return null;
  }

  return request;
}

// Update request status
export async function updateRequestStatus(id, status, adminNote = null) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const updateData = { status };
  if (adminNote !== null) updateData.admin_note = adminNote;
  if (status === 'approved') updateData.approved_at = new Date().toISOString();
  if (status === 'converted') updateData.converted_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('customer_requests')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating request:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Update request quote
export async function updateRequestQuote(id, confirmedQuote) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { data, error } = await supabase
    .from('customer_requests')
    .update({ confirmed_quote: confirmedQuote })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating quote:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Delete request
export async function deleteRequest(id) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { error } = await supabase
    .from('customer_requests')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting request:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
