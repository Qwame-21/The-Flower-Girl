import { supabase } from '../../config/supabase';

export function hasTrackingApi() {
  return Boolean(supabase);
}

export function trackRecord(reference, credential) {
  return supabase.rpc('track_record', {
    lookup_reference: reference.trim(),
    lookup_contact: credential.trim(),
  });
}
