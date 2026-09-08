export async function submitInquiry(kind, record, file, submissionId) {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) throw new Error('Submissions are temporarily unavailable. Please try again later.');
  const body = new FormData();
  body.set('kind', kind);
  body.set('record', JSON.stringify(record));
  body.set('submissionId', submissionId);
  if (file?.size) body.set('file', file);
  const response = await fetch(`${url}/functions/v1/submit-inquiry`, {
    method: 'POST',
    headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '' },
    body,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.id) throw new Error(result?.error || 'We could not submit your details. Please try again; your entries are still here.');
  return result;
}
