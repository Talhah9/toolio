import { createClient } from '@supabase/supabase-js';

// Service-role client — never exposed to the browser.
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env vars.
function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── Security headers ──────────────────────────────────────────────────────────
export function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
}

// ── Auth verification ─────────────────────────────────────────────────────────
// Returns the verified userId, or sends 401 and returns null.
export async function verifyAuth(req, res, claimedUserId) {
  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return null;
  }

  let verifiedId;
  try {
    const admin = getAdminClient();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user) throw error ?? new Error('No user');
    verifiedId = data.user.id;
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }

  if (verifiedId !== claimedUserId) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  return verifiedId;
}

// ── Credit check ──────────────────────────────────────────────────────────────
// Returns true if user has enough credits, or sends 402 and returns false.
export async function checkCredits(res, userId, cost) {
  if (cost === 0) return true;

  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from('credits')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (error || !data) throw error ?? new Error('No credits row');

    if (data.balance < cost) {
      res.status(402).json({ error: 'Insufficient credits' });
      return false;
    }
  } catch (err) {
    console.error('[security] credit check failed:', err.message);
    // Fail open only on DB error to avoid blocking legitimate users on infra issues.
    // Swap to `return false` here if you prefer fail-closed.
  }

  return true;
}

// ── Rate limiter ──────────────────────────────────────────────────────────────
// In-memory: resets on cold start. Good enough for basic abuse prevention.
const WINDOW_MS  = 60_000;  // 60 seconds
const MAX_CALLS  = 5;

const rateLimitStore = new Map(); // userId → [timestamp, ...]

export function rateLimit(res, userId) {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(userId) ?? []).filter(t => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_CALLS) {
    res.status(429).json({ error: 'Too many requests — try again in a minute' });
    return false;
  }

  timestamps.push(now);
  rateLimitStore.set(userId, timestamps);
  return true;
}
