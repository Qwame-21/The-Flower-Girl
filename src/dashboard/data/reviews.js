import { supabase } from '../../config/supabase';

// List all reviews
export async function listReviews() {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return reviews;
}

// Create review
export async function createReview(reviewData) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      customer_name: reviewData.customerName,
      product_or_service: reviewData.productOrService,
      rating: reviewData.rating,
      review_text: reviewData.reviewText,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating review:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Update review status
export async function updateReviewStatus(id, status) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { data, error } = await supabase
    .from('reviews')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating review:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Delete review
export async function deleteReview(id) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting review:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
