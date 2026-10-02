import { supabase } from '../../config/supabase';

// List all careers
export async function listCareers() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const { data: careers, error } = await supabase
    .from('careers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching careers:', error);
    return [];
  }

  return careers;
}

// Create career posting
export async function createCareer(careerData) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { data, error } = await supabase
    .from('careers')
    .insert({
      title: careerData.title,
      location: careerData.location,
      employment_type: careerData.employmentType,
      description: careerData.description,
      status: careerData.status || 'draft'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating career:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Update career
export async function updateCareer(id, careerData) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { data, error } = await supabase
    .from('careers')
    .update({
      title: careerData.title,
      location: careerData.location,
      employment_type: careerData.employmentType,
      description: careerData.description,
      status: careerData.status
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating career:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Delete career
export async function deleteCareer(id) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { error } = await supabase
    .from('careers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting career:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// List career applications
export async function listApplications() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const { data: applications, error } = await supabase
    .from('career_applications')
    .select('*, careers(title)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    return [];
  }

  return applications;
}

// Update application status
export async function updateApplicationStatus(id, status) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { data, error } = await supabase
    .from('career_applications')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating application:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Delete application
export async function deleteApplication(id) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { error } = await supabase
    .from('career_applications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting application:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
