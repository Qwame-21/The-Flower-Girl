import { supabase } from '../../config/supabase';

// Get customization options grouped by category for storefront
export async function getCustomizationOptions() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return null;
  }

  const { data, error } = await supabase
    .from('customization_options')
    .select('*')
    .eq('visible', true)
    .order('category', { ascending: true })
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching customization options:', error);
    return null;
  }

  // Group by category and convert to expected format
  const grouped = {};
  const estimates = {};

  data.forEach(opt => {
    if (!grouped[opt.category]) {
      grouped[opt.category] = [];
    }
    grouped[opt.category].push(opt.option_name);
    estimates[opt.option_name] = opt.estimate;
  });

  return { options: grouped, estimates };
}
