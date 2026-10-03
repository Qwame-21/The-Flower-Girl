// Adapter to make HOPESON CareersPage work with Supabase
// Returns data in the exact shape HOPESON expects

import { listCareers, listApplications, updateApplicationStatus, deleteApplication } from './careers';

const CAREERS_KEY = 'xa12-careers-data-v1';

// Load careers from localStorage cache (sync)
export function loadCareersData() {
  try {
    const cached = localStorage.getItem(CAREERS_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}
  return { postings: [], applicants: [] };
}

// Save careers to localStorage
export function saveCareersData(data) {
  try {
    localStorage.setItem(CAREERS_KEY, JSON.stringify(data));
  } catch {}
}

// Sync with Supabase (async)
export async function syncCareersWithSupabase() {
  const [postings, applicants] = await Promise.all([listCareers(), listApplications()]);

  // Transform Supabase data to HOPESON shape
  const mappedPostings = postings.map(p => ({
    id: p.id,
    title: p.title,
    location: p.location,
    employment_type: p.employment_type,
    description: p.description,
    status: p.status
  }));

  const mappedApplicants = applicants.map(a => ({
    id: a.id,
    name: a.name,
    job: a.careers?.title || a.job_title || '',
    email: a.email,
    phone: a.phone,
    location: a.location,
    date: a.created_at ? new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    portfolio_url: a.portfolio_url,
    resume: a.resume,
    status: a.status,
    rating: a.rating
  }));

  const result = { postings: mappedPostings, applicants: mappedApplicants };
  localStorage.setItem(CAREERS_KEY, JSON.stringify(result));
  return result;
}
