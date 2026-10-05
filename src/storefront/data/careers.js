import { supabase } from '../../config/supabase';

const CACHE_KEY = 'flowergirl-careers-v1';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const DEFAULT_CAREER = {
  title: 'Content Creator & Social Media Manager',
  location: 'Accra',
  employment_type: 'Full-time',
  description: 'We are looking for a creative, passionate and trend-aware person to manage content and grow our online community.\n\nKey responsibilities:\n- Create engaging content for social platforms\n- Plan and manage the content calendar\n- Shoot and edit polished photos, videos and graphics\n- Monitor trends and suggest creative ideas\n- Engage followers and help grow the community\n- Review performance and provide monthly reports\n\nWhat we are looking for:\n- Experience in content creation or social media\n- Clear written and verbal communication\n- Confidence using content creation tools\n- Strong understanding of social trends and analytics\n- Independent, detail-oriented working style\n- Interest in branding, storytelling and engagement\n\nWhat we offer:\n- Competitive salary\n- Creative and supportive work environment\n- Opportunities for growth and development\n- A chance to shape a growing Ghanaian gifting brand',
};

/**
 * Fetch open careers from Supabase
 */
export async function fetchCareers() {
  if (!supabase) {
    console.log('Supabase not configured, using default career');
    return [DEFAULT_CAREER];
  }

  try {
    const { data: careers, error } = await supabase
      .from('careers')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching careers:', error);
      throw error;
    }

    if (!careers || careers.length === 0) {
      console.log('No open careers in database, using default');
      return [DEFAULT_CAREER];
    }

    // Update cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        careers,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.warn('Failed to cache careers:', e);
    }

    return careers;
  } catch (error) {
    console.error('Failed to fetch careers:', error);
    
    // Try to use cached careers
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { careers, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log('Using cached careers');
          return careers;
        }
      }
    } catch (e) {
      console.warn('Failed to read cache:', e);
    }

    // Final fallback to default
    console.log('Using default career as final fallback');
    return [DEFAULT_CAREER];
  }
}

/**
 * Get cached careers (sync)
 */
export function getCachedCareers() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { careers, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return careers;
      }
    }
  } catch (e) {
    console.warn('Failed to read cache:', e);
  }
  return null;
}
