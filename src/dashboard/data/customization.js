import { supabase } from '../../config/supabase';

// List all customization options
export async function listCustomizationOptions() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const { data, error } = await supabase
    .from('customization_options')
    .select('*')
    .order('category', { ascending: true })
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching customization options:', error);
    return [];
  }

  return data;
}

// Create customization option
export async function createCustomizationOption(optionData) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { data, error } = await supabase
    .from('customization_options')
    .insert({
      category: optionData.category,
      option_name: optionData.option_name,
      estimate: optionData.estimate || 0,
      display_order: optionData.display_order || 0,
      visible: optionData.visible !== false
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating customization option:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Update customization option
export async function updateCustomizationOption(id, optionData) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { data, error } = await supabase
    .from('customization_options')
    .update({
      category: optionData.category,
      option_name: optionData.option_name,
      estimate: optionData.estimate,
      display_order: optionData.display_order,
      visible: optionData.visible
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating customization option:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Delete customization option
export async function deleteCustomizationOption(id) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { error } = await supabase
    .from('customization_options')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting customization option:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Group options by category for storefront
export async function getCustomizationOptionsGrouped() {
  const options = await listCustomizationOptions();
  const grouped = {};
  
  options.forEach(opt => {
    if (!grouped[opt.category]) {
      grouped[opt.category] = [];
    }
    grouped[opt.category].push({
      id: opt.id,
      name: opt.option_name,
      estimate: opt.estimate,
      displayOrder: opt.display_order,
      visible: opt.visible
    });
  });

  return grouped;
}
