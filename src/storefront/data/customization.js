import { supabase } from '../../config/supabase';

export async function fetchStorefrontCustomization() {
  if (!supabase) {
    throw new Error('Database connection unavailable');
  }

  const { data, error } = await supabase
    .from('customization_options')
    .select('category, option_name, estimate, display_order')
    .eq('visible', true)
    .order('category', { ascending: true })
    .order('display_order', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Failed to load customization options');
  }

  const optionsMap = {};
  const estimatesMap = {};

  (data || []).forEach(row => {
    const cat = row.category || 'General';
    if (!optionsMap[cat]) optionsMap[cat] = [];
    if (!optionsMap[cat].includes(row.option_name)) {
      optionsMap[cat].push(row.option_name);
    }
    estimatesMap[row.option_name] = Number(row.estimate || 0);
  });

  return { options: optionsMap, estimates: estimatesMap };
}

