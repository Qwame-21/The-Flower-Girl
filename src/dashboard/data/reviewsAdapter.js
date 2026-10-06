// Adapter to make HOPESON ReviewsPage work with Supabase
// Returns data in the exact shape HOPESON expects

import { listReviews, createReview, updateReviewStatus, deleteReview } from './reviews';

const REVIEWS_KEY = 'xa12-reviews-data-v1';
const INSTAGRAM_KEY = 'xa12-instagram-url-v1';

// Load reviews from Supabase and shape them like HOPESON expects
export function loadReviews() {
  // This is async in Supabase, but HOPESON expects sync.
  // We'll use localStorage as cache and sync with Supabase on load
  try {
    const cached = localStorage.getItem(REVIEWS_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}
  return [];
}

// Save reviews - will be called by HOPESON page (cache only, writes go through Supabase)
export function saveReviews(data) {
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(data));
  } catch {}
}

// Sync with Supabase (async - call from useEffect)
export async function syncReviewsWithSupabase() {
  const supabaseReviews = await listReviews();

  // Transform Supabase data to HOPESON shape
  const mapped = supabaseReviews.map(r => ({
    id: r.id,
    customerName: r.customer_name,
    reviewText: r.review_text,
    rating: r.rating,
    status: r.status || 'pending',
    date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    isFlagged: r.is_flagged || false,
    replyText: r.reply_text || '',
    replyDate: r.reply_date || ''
  }));

  // Update cache
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(mapped));
  return mapped;
}

// Create review in Supabase and update cache
export async function createReviewSync(reviewData) {
  const result = await createReview(reviewData);
  if (result.success) {
    // Refresh cache after successful create
    await syncReviewsWithSupabase();
  }
  return result;
}

// Update review status in Supabase and update cache
export async function updateReviewStatusSync(id, status) {
  const result = await updateReviewStatus(id, status);
  if (result.success) {
    // Refresh cache after successful update
    await syncReviewsWithSupabase();
  }
  return result;
}

// Delete review in Supabase and update cache
export async function deleteReviewSync(id) {
  const result = await deleteReview(id);
  if (result.success) {
    // Refresh cache after successful delete
    await syncReviewsWithSupabase();
  }
  return result;
}

// Instagram URL persistence
export function loadInstagramUrl() {
  try {
    return localStorage.getItem(INSTAGRAM_KEY) || '';
  } catch { return ''; }
}

export function saveInstagramUrl(url) {
  try {
    localStorage.setItem(INSTAGRAM_KEY, url);
  } catch {}
}
