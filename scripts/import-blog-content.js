#!/usr/bin/env node
/**
 * import-blog-content.js
 * Reads all .md files from app/content/blog/, strips frontmatter,
 * and updates the content column in blog_posts for each matching slug.
 *
 * Usage:
 *   node scripts/import-blog-content.js
 *
 * On Windows (SSL cert issue with Node):
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/import-blog-content.js
 *
 * Requires an UPDATE RLS policy on blog_posts, OR set:
 *   SUPABASE_SERVICE_ROLE_KEY=<key>   — bypasses RLS entirely (preferred)
 *
 * Falls back to VITE_SUPABASE_ANON_KEY if service role key is absent
 * (only works when a public UPDATE policy is active).
 *
 * Env vars loaded from app/.env automatically.
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = join(__dirname, '..', 'app', 'content', 'blog');

// Load env from app/.env if not already set
function loadEnv() {
  try {
    const env = readFileSync(join(__dirname, '..', 'app', '.env'), 'utf8');
    for (const line of env.split('\n')) {
      const [key, ...rest] = line.split('=');
      if (key && rest.length && !process.env[key.trim()]) {
        process.env[key.trim()] = rest.join('=').trim();
      }
    }
  } catch {}
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) are required.');
  process.exit(1);
}

/** Strip YAML frontmatter (--- ... ---) from markdown content */
function stripFrontmatter(raw) {
  const match = raw.match(/^---\s*\n[\s\S]*?\n---\s*\n([\s\S]*)$/);
  return match ? match[1].trim() : raw.trim();
}

/** Extract slug from frontmatter or fall back to filename */
function extractSlug(raw, filename) {
  const match = raw.match(/^---\s*\nslug:\s*(.+)/m);
  return match ? match[1].trim() : filename.replace('.md', '');
}

async function updatePost(slug, content) {
  const url = `${SUPABASE_URL}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update ${slug}: ${res.status} ${err}`);
  }
}

async function main() {
  const files = readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} .md files in ${BLOG_DIR}\n`);

  let ok = 0, failed = 0;
  for (const file of files) {
    const raw = readFileSync(join(BLOG_DIR, file), 'utf8');
    const slug = extractSlug(raw, file);
    const content = stripFrontmatter(raw);
    try {
      await updatePost(slug, content);
      console.log(`✓ ${slug}`);
      ok++;
    } catch (err) {
      console.error(`✗ ${slug}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${ok} updated, ${failed} failed`);
}

main().catch(err => { console.error(err); process.exit(1); });
