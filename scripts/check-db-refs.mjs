#!/usr/bin/env node
/**
 * check-db-refs.mjs
 * Scans src/ for Supabase table, RPC, and storage bucket references
 * and cross-checks them against the known schema.
 *
 * Run: npm run check:db
 * Exit code 1 if any unknown references are found.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const SRC_DIR = join(process.cwd(), 'src');

// ── Known-good schema references ────────────────────────────────────────────

const KNOWN_TABLES = new Set([
  'products',
  'collections',
  'collection_products',
  'promotions',
  'gallery_items',
  'customer_requests',
  'orders',
  'order_items',
  'order_events',
  'checkout_attempts',
  'reviews',
  'careers',
  'career_applications',
  'site_content',
  'site_settings',
  'admin_notifications',
  'customer_profiles',
  'customization_options',
  'staff_profiles',
  // Tables added by FIX_orders_detail_and_status.sql
  'activity_log',
  'completed_orders_log',
  // Table added by MASTER_UPDATE.sql
  'signin_log',
]);

const KNOWN_RPCS = new Set([
  'track_record',
  'convert_request_to_order',
  'finalize_paid_checkout',
  'normalize_phone',
  'generate_short_code',
  // Called from LogPage.jsx; no SQL definition found in migrations — TODO: add to a SQL file
  'purge_expired_logs',
]);

const KNOWN_BUCKETS = new Set([
  'storefront-media',
  // Storage bucket for career application uploads (schema.sql storage.buckets insert)
  'career-files',
  // Storage bucket for custom request inspiration images
  'request-uploads',
]);

// ── File scanner ─────────────────────────────────────────────────────────────

function walk(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      // Skip node_modules, .git, dist
      if (['node_modules', '.git', 'dist', 'build'].includes(entry)) continue;
      files.push(...walk(full));
    } else if (['.js', '.jsx', '.ts', '.tsx'].includes(extname(entry))) {
      files.push(full);
    }
  }
  return files;
}

// ── Regex extractors ─────────────────────────────────────────────────────────

// .from('table_name') or .from("table_name")
const FROM_RE = /\.from\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
// .rpc('fn_name') or .rpc("fn_name")
const RPC_RE = /\.rpc\(\s*['"`]([^'"`]+)['"`]/g;
// supabase.storage.from('bucket')
const BUCKET_RE = /\.storage\.from\(\s*['"`]([^'"`]+)['"`]\s*\)/g;

// ── Main ─────────────────────────────────────────────────────────────────────

const files = walk(SRC_DIR);
const issues = [];

for (const file of files) {
  let src;
  try { src = readFileSync(file, 'utf-8'); } catch { continue; }

  const rel = file.replace(SRC_DIR + '/', 'src/');

  for (const m of src.matchAll(FROM_RE)) {
    const table = m[1];
    // Supabase storage calls also match .from() — skip those
    if (KNOWN_BUCKETS.has(table)) continue;
    if (!KNOWN_TABLES.has(table)) {
      issues.push(`  UNKNOWN TABLE  "${table}"  in ${rel}`);
    }
  }

  for (const m of src.matchAll(RPC_RE)) {
    const fn = m[1];
    if (!KNOWN_RPCS.has(fn)) {
      issues.push(`  UNKNOWN RPC    "${fn}"  in ${rel}`);
    }
  }

  // Skip bucket check for non-storage calls
  for (const m of src.matchAll(BUCKET_RE)) {
    const bucket = m[1];
    if (!KNOWN_BUCKETS.has(bucket)) {
      issues.push(`  UNKNOWN BUCKET "${bucket}"  in ${rel}`);
    }
  }
}

// ── Report ────────────────────────────────────────────────────────────────────

console.log(`\ncheck:db — scanned ${files.length} source files\n`);

if (issues.length === 0) {
  console.log('  All table, RPC, and bucket references look good.\n');
  process.exit(0);
} else {
  console.error(`  ${issues.length} unknown reference(s) found:\n`);
  for (const line of issues) console.error(line);
  console.error('\n  Fix these or add them to the KNOWN_* sets in scripts/check-db-refs.mjs\n');
  process.exit(1);
}
