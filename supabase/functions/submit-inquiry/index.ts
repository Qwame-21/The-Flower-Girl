import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  if (Number(req.headers.get('content-length')) > 6 * 1024 * 1024) return reply({ error: 'File must be under 5 MB.' }, 413);
  try {
    const form = await req.formData();
    const kind = form.get('kind');
    if (kind !== 'request' && kind !== 'career') return reply({ error: 'Invalid submission type.' }, 400);
    const id = String(form.get('submissionId') || '');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return reply({ error: 'Invalid submission ID.' }, 400);
    const raw = String(form.get('record') || '');
    if (raw.length > 30000) return reply({ error: 'Please shorten your submission.' }, 400);
    const data = JSON.parse(raw);
    const text = (key: string, required = false, max = 5000) => {
      const value = typeof data[key] === 'string' ? data[key].trim() : '';
      if ((required && !value) || value.length > max) throw new Error(`Please check ${key}.`);
      return value;
    };
    const email = text('email', true, 254);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email address.');
    const name = text('name', true, 200), phone = text('phone', true, 50);
    if (phone.replace(/\D/g, '').length < 7) throw new Error('Please enter a valid phone number.');
    const date = text('date', true, 10);
    const parsed = new Date(`${date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date < new Date().toISOString().slice(0, 10)) throw new Error('Choose a valid date today or later.');
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const table = kind === 'career' ? 'career_applications' : 'customer_requests';
    const reference = `RQ-${id.replaceAll('-', '').slice(0, 16).toUpperCase()}`;
    // A client-generated UUID is a retry token, not access to the stored record.
    const { data: existing, error: lookupError } = await db.from(table).select('id').eq('id', id).maybeSingle();
    if (lookupError) return reply({ error: 'Submissions are temporarily unavailable. Please try again.' }, 503);
    if (existing) return reply({ id, ...(kind === 'request' ? { reference } : {}) });
    let record: Record<string, unknown>;
    if (kind === 'request') {
      const quantity = Number(data.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) throw new Error('Quantity must be between 1 and 1000.');
      const delivery = text('deliveryAddress', true);
      const selections = data.selections || [];
      if (!Array.isArray(selections) || selections.length > 100 || selections.some(x => typeof x !== 'string' || x.length > 200)) throw new Error('Please check your selections.');
      const note = text('note', true);
      for (const key of ['estimateLow', 'estimateHigh']) { if (data[key] != null && (!Number.isFinite(data[key]) || data[key] < 0 || data[key] > 10000000)) throw new Error('Please check the estimate.'); }
      const deliveryNotes = ['fulfilment', 'recipient', 'recipientPhone', 'landmark', 'locationLink', 'deliveryInstructions', 'budget'].map(key => `${key}: ${text(key)}`).join('\n');
      record = { id, reference, request_type: data.service === 'Custom gift' ? 'bespoke_gift' : 'service', service: text('service', true, 200), customer_name: name, email, phone, occasion: text('occasion', true, 200), preferred_date: date, quantity, selections, estimate_low: data.estimateLow ?? null, estimate_high: data.estimateHigh ?? null, notes: `${note}\n\nDelivery address: ${delivery}\n${deliveryNotes}`, card_message: text('cardMessage'), card_style: text('cardStyleNotes'), status: 'new' };
    } else {
      const portfolio = text('portfolio', true, 2000);
      if (!/^https?:\/\//i.test(portfolio)) throw new Error('Enter a valid portfolio URL.');
      record = { id, full_name: name, email, phone, location: text('location', true, 500), portfolio_url: portfolio, earliest_start_date: date, experience: text('experience', true), motivation: text('motivation', true), status: 'new' };
    }
    const file = form.get('file');
    let path = '';
    const bucket = kind === 'career' ? 'career-files' : 'request-uploads';
    if (kind === 'career' && (!(file instanceof File) || !file.size)) throw new Error('Please attach your CV.');
    if (file instanceof File && file.size) {
      const allowed = kind === 'career' ? ['pdf', 'doc', 'docx'] : ['jpg', 'jpeg', 'png', 'webp'];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!allowed.includes(ext) || file.size > 5 * 1024 * 1024) throw new Error('Use a supported file under 5 MB.');
      path = `${id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await db.storage.from(bucket).upload(path, file, { upsert: false });
      if (error) return reply({ error: 'Your attachment could not be uploaded. Please try again.' }, 503);
      record[kind === 'career' ? 'resume_path' : 'inspiration_path'] = path;
    }
    const { error } = await db.from(table).insert(record);
    if (error) {
      if (path) await db.storage.from(bucket).remove([path]);
      const { data: saved } = error.code === '23505' ? await db.from(table).select('id').eq('id', id).maybeSingle() : { data: null };
      if (!saved) return reply({ error: 'We could not save your submission. Please try again.' }, 503);
    }
    return reply({ id, ...(kind === 'request' ? { reference } : {}) });
  } catch (error) {
    return reply({ error: error instanceof SyntaxError ? 'Invalid submission.' : error instanceof Error ? error.message : 'Please check your submission.' }, 400);
  }
});
