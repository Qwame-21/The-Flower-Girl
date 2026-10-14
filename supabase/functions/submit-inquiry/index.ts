import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });

/** Generate a short code like RQ-4A8KFJ (6 chars, no look-alikes). */
function genShortCode(prefix = 'RQ'): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  for (const byte of arr) code += alphabet[byte % alphabet.length];
  return `${prefix}-${code}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  if (Number(req.headers.get('content-length')) > 6 * 1024 * 1024)
    return reply({ error: 'File must be under 5 MB.' }, 413);

  try {
    const form = await req.formData();
    const kind = form.get('kind');
    if (kind !== 'request' && kind !== 'career')
      return reply({ error: 'Invalid submission type.' }, 400);

    const id = String(form.get('submissionId') || '');
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    )
      return reply({ error: 'Invalid submission ID.' }, 400);

    const raw = String(form.get('record') || '');
    if (raw.length > 30000) return reply({ error: 'Please shorten your submission.' }, 400);
    const data = JSON.parse(raw);

    const text = (key: string, required = false, max = 5000) => {
      const value = typeof data[key] === 'string' ? data[key].trim() : '';
      if ((required && !value) || value.length > max)
        throw new Error(`Please check ${key}.`);
      return value;
    };

    const email = text('email', true, 254);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error('Please enter a valid email address.');

    const name = text('name', true, 200);
    const phone = text('phone', true, 50);
    if (phone.replace(/\D/g, '').length < 7)
      throw new Error('Please enter a valid phone number.');

    const date = text('date', true, 10);
    const parsed = new Date(`${date}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date ||
      date < new Date().toISOString().slice(0, 10)
    )
      throw new Error('Choose a valid date today or later.');

    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ---------------------------------------------------------------------------
    // Idempotency check: if this submissionId was already saved, return it
    // ---------------------------------------------------------------------------
    const table = kind === 'career' ? 'career_applications' : 'customer_requests';
    const { data: existing, error: lookupError } = await db
      .from(table)
      .select('id, reference, short_code')
      .eq('id', id)
      .maybeSingle();
    if (lookupError)
      return reply({ error: 'Submissions are temporarily unavailable. Please try again.' }, 503);
    if (existing) {
      return reply({
        id,
        ...(kind === 'request'
          ? {
              reference: existing.short_code || existing.reference,
              shortCode: existing.short_code,
              longReference: existing.reference,
            }
          : {}),
      });
    }

    // ---------------------------------------------------------------------------
    // Build record
    // ---------------------------------------------------------------------------
    let record: Record<string, unknown>;

    if (kind === 'request') {
      const quantity = Number(data.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000)
        throw new Error('Quantity must be between 1 and 1000.');

      const deliveryAddress = text('deliveryAddress', true);
      const selections = data.selections || [];
      if (
        !Array.isArray(selections) ||
        selections.length > 100 ||
        selections.some((x: unknown) => typeof x !== 'string' || (x as string).length > 200)
      )
        throw new Error('Please check your selections.');

      const note = text('note', true);
      for (const key of ['estimateLow', 'estimateHigh']) {
        if (
          data[key] != null &&
          (!Number.isFinite(data[key]) || data[key] < 0 || data[key] > 10_000_000)
        )
          throw new Error('Please check the estimate.');
      }

      // Generate a unique short code (retry up to 5 times on collision)
      let shortCode = '';
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = genShortCode('RQ');
        const { data: clash } = await db
          .from('customer_requests')
          .select('id')
          .eq('short_code', candidate)
          .maybeSingle();
        if (!clash) {
          shortCode = candidate;
          break;
        }
      }
      // Fallback: use UUID-based long reference (very unlikely to need this)
      const longReference = `RQ-${id.replaceAll('-', '').slice(0, 16).toUpperCase()}`;

      // Readable summary for the `notes` field (used by older code / blob fallback)
      const deliverySummary = [
        `Delivery address: ${deliveryAddress}`,
        data.fulfilment     ? `fulfilment: ${data.fulfilment}`                 : null,
        data.recipient      ? `recipient: ${text('recipient')}`                : null,
        data.recipientPhone ? `recipientPhone: ${text('recipientPhone')}`      : null,
        data.landmark       ? `landmark: ${text('landmark')}`                  : null,
        data.locationLink   ? `locationLink: ${text('locationLink')}`          : null,
        data.deliveryInstructions
          ? `deliveryInstructions: ${text('deliveryInstructions')}`            : null,
        data.budget         ? `budget: ${text('budget')}`                      : null,
      ]
        .filter(Boolean)
        .join('\n');

      record = {
        id,
        // Both references stored; short_code is the one shown to customers
        reference: longReference,
        short_code: shortCode || null,
        request_type: data.service === 'Custom gift' ? 'bespoke_gift' : 'service',
        service: text('service', true, 200),
        customer_name: name,
        email,
        phone,
        occasion: text('occasion', true, 200),
        preferred_date: date,
        quantity,
        selections,
        estimate_low: data.estimateLow ?? null,
        estimate_high: data.estimateHigh ?? null,
        // Structured delivery fields (new columns from FIX_requests_flow.sql)
        fulfilment:            text('fulfilment')            || 'delivery',
        delivery_address:      deliveryAddress,
        recipient:             text('recipient'),
        recipient_phone:       text('recipientPhone'),
        landmark:              text('landmark'),
        location_link:         text('locationLink'),
        delivery_instructions: text('deliveryInstructions'),
        budget:                text('budget'),
        // Human-readable blob for backward compat with old drawer code
        notes: `${note}\n\n${deliverySummary}`,
        card_message:  text('cardMessage'),
        card_style:    text('cardStyleNotes'),
        status: 'new',
      };
    } else {
      // career
      const portfolio = text('portfolio', true, 2000);
      if (!/^https?:\/\//i.test(portfolio))
        throw new Error('Enter a valid portfolio URL.');
      record = {
        id,
        full_name: name,
        email,
        phone,
        location:            text('location', true, 500),
        portfolio_url:       portfolio,
        earliest_start_date: date,
        experience:          text('experience', true),
        motivation:          text('motivation', true),
        status: 'new',
      };
    }

    // ---------------------------------------------------------------------------
    // File upload
    // ---------------------------------------------------------------------------
    const file = form.get('file');
    let path = '';
    const bucket = kind === 'career' ? 'career-files' : 'request-uploads';
    if (kind === 'career' && (!(file instanceof File) || !file.size))
      throw new Error('Please attach your CV.');
    if (file instanceof File && file.size) {
      const allowed = kind === 'career' ? ['pdf', 'doc', 'docx'] : ['jpg', 'jpeg', 'png', 'webp'];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!allowed.includes(ext) || file.size > 5 * 1024 * 1024)
        throw new Error('Use a supported file under 5 MB.');
      path = `${id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await db.storage.from(bucket).upload(path, file, { upsert: false });
      if (error)
        return reply({ error: 'Your attachment could not be uploaded. Please try again.' }, 503);
      record[kind === 'career' ? 'resume_path' : 'inspiration_path'] = path;
    }

    // ---------------------------------------------------------------------------
    // Insert
    // ---------------------------------------------------------------------------
    const { error } = await db.from(table).insert(record);
    if (error) {
      if (path) await db.storage.from(bucket).remove([path]);
      const { data: saved } =
        error.code === '23505'
          ? await db.from(table).select('id, reference, short_code').eq('id', id).maybeSingle()
          : { data: null };
      if (!saved)
        return reply({ error: 'We could not save your submission. Please try again.' }, 503);
      // Duplicate submission — return existing short code
      const savedAny = saved as Record<string, string>;
      return reply({
        id,
        ...(kind === 'request'
          ? {
              reference: savedAny.short_code || savedAny.reference,
              shortCode: savedAny.short_code,
              longReference: savedAny.reference,
            }
          : {}),
      });
    }

    const shortCode = (record.short_code as string) || null;
    const longRef   = (record.reference as string) || '';

    return reply({
      id,
      ...(kind === 'request'
        ? {
            reference: shortCode || longRef,
            shortCode,
            longReference: longRef,
          }
        : {}),
    });
  } catch (error) {
    return reply(
      {
        error:
          error instanceof SyntaxError
            ? 'Invalid submission.'
            : error instanceof Error
              ? error.message
              : 'Please check your submission.',
      },
      400,
    );
  }
});
