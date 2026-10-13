/**
 * test-date-utils.mjs — Timezone resilience suite for dateUtils.js
 *
 * Runs assertions across 10 distinct timezones by spawning node with TZ=<timezone>.
 * Ensures parseDateString, formatDateDisplay, todayAccra, and timestampToAccraDate
 * never suffer from off-by-one shifts regardless of viewer geography.
 */
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const utilsPath = join(__dirname, '../src/shared/dateUtils.js');

const TIMEZONES = [
  'UTC',
  'Africa/Accra',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Europe/London',
  'Australia/Sydney',
  'Pacific/Honolulu',
  'Asia/Kolkata',
];

console.log('--- RUNNING DATE UTILS TIMEZONE TEST SUITE ---');
let totalPassed = 0;
let totalFailed = 0;

for (const tz of TIMEZONES) {
  const code = `
    import {
      parseDateString,
      formatDateDisplay,
      formatDateISO,
      todayAccra,
      timestampToAccraDate,
      getDeliverySubtitle,
      formatDeliveryWindowShort
    } from ${JSON.stringify(utilsPath)};
    import assert from 'node:assert/strict';

    // 1. parseDateString preserves day/month/year
    const d = parseDateString('2026-10-13');
    assert.equal(d.getDate(), 13, 'getDate() must be 13');
    assert.equal(d.getMonth(), 9, 'getMonth() must be 9 (October)');
    assert.equal(d.getFullYear(), 2026, 'getFullYear() must be 2026');

    // 2. formatDateDisplay produces exact strings with and without year
    assert.equal(formatDateDisplay('2026-10-13'), 'Tue, 13 Oct 2026');
    assert.equal(formatDateDisplay('2026-10-13', false), 'Tue, 13 Oct');
    assert.equal(formatDateDisplay('2026-10-14', false), 'Wed, 14 Oct');

    // 3. formatDateISO round-trips correctly
    assert.equal(formatDateISO(d), '2026-10-13');

    // 4. timestampToAccraDate respects Africa/Accra calendar day across UTC day boundaries
    assert.equal(timestampToAccraDate('2026-10-13T00:00:00Z'), '2026-10-13');
    assert.equal(timestampToAccraDate('2026-10-13T23:59:59Z'), '2026-10-13');
    assert.equal(timestampToAccraDate('2026-10-13T13:00:00+00:00'), '2026-10-13');

    // 5. getDeliverySubtitle produces clean formatted subtitle
    const mockOrder = {
      estimatedDelivery: '2026-10-14T13:00:00+00:00',
      deliveryWindow: 'afternoon'
    };
    assert.equal(getDeliverySubtitle(mockOrder), ' · Delivery Wed, 14 Oct · 12–4pm');

    const unconfirmedOrder = { estimatedDelivery: null };
    assert.equal(getDeliverySubtitle(unconfirmedOrder), ' · Delivery not confirmed');

    // 6. todayAccra returns valid YYYY-MM-DD
    const today = todayAccra();
    assert.match(today, /^\\d{4}-\\d{2}-\\d{2}$/);
  `;

  const res = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    env: { ...process.env, TZ: tz },
    encoding: 'utf8'
  });

  if (res.status === 0) {
    console.log(`  ✔ [${tz.padEnd(20)}] All assertions passed`);
    totalPassed++;
  } else {
    console.error(`  ✖ [${tz.padEnd(20)}] FAILED`);
    console.error(res.stderr || res.stdout);
    totalFailed++;
  }
}

console.log(`\nResults: ${totalPassed} passed, ${totalFailed} failed across ${TIMEZONES.length} timezones.\n`);
if (totalFailed > 0) process.exit(1);
