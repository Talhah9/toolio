import { createClient } from '@supabase/supabase-js';

export const ADMIN_EMAIL = 'talhahally974@gmail.com';

function getAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

// Verify the JWT belongs to the admin email. Returns email on success, null on failure.
export async function verifyAdmin(req, res) {
  const token = (req.headers['authorization'] ?? '').replace('Bearer ', '').trim();
  if (!token) { res.status(401).json({ error: 'Missing token' }); return null; }
  try {
    const { data, error } = await getAdmin().auth.getUser(token);
    if (error || !data?.user) throw new Error('Invalid token');
    if (data.user.email !== ADMIN_EMAIL) {
      res.status(403).json({ error: 'Forbidden' });
      return null;
    }
    return data.user.email;
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
}

// Fetch all admin stats. Returns a stats object.
export async function fetchAdminStats() {
  const db = getAdmin();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartIso = monthStart.toISOString();

  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const [
    { count: totalUsers },
    { count: proUsers },
    { count: monthlyGens },
    { data: genRows },
    { data: recentProfiles },
    { data: lowCreditRows },
    { data: newThisWeek },
    { count: todayVisits },
    { data: weekViewRows },
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
    db.from('generations').select('*', { count: 'exact', head: true }).gte('created_at', monthStartIso),
    db.from('generations').select('tool_id').gte('created_at', monthStartIso),
    db.from('profiles').select('id, email, plan, created_at').order('created_at', { ascending: false }).limit(20),
    db.from('credits').select('user_id, balance').lt('balance', 20),
    db.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
    db.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', todayIso),
    db.from('page_views').select('path, referrer, created_at').gte('created_at', weekStart).limit(2000),
  ]);

  // Tool usage: group by tool_id client-side
  const toolCounts = {};
  (genRows ?? []).forEach(g => {
    toolCounts[g.tool_id] = (toolCounts[g.tool_id] ?? 0) + 1;
  });
  const toolUsage = Object.entries(toolCounts)
    .map(([tool_id, count]) => ({ tool_id, count }))
    .sort((a, b) => b.count - a.count);

  // Low credit users: resolve emails from profiles
  const lowCreditIds = (lowCreditRows ?? []).map(r => r.user_id);
  let lowCreditUsers = [];
  if (lowCreditIds.length > 0) {
    const { data: lcProfiles } = await db
      .from('profiles')
      .select('id, email, plan')
      .in('id', lowCreditIds);
    const balanceMap = Object.fromEntries((lowCreditRows ?? []).map(r => [r.user_id, r.balance]));
    lowCreditUsers = (lcProfiles ?? []).map(p => ({
      email: p.email,
      plan: p.plan,
      balance: balanceMap[p.id] ?? 0,
    })).sort((a, b) => a.balance - b.balance);
  }

  // Enrich recent profiles with credit balance
  const recentIds = (recentProfiles ?? []).map(p => p.id);
  let creditMap = {};
  if (recentIds.length > 0) {
    const { data: recentCredits } = await db
      .from('credits')
      .select('user_id, balance')
      .in('user_id', recentIds);
    creditMap = Object.fromEntries((recentCredits ?? []).map(r => [r.user_id, r.balance]));
  }
  const recentUsers = (recentProfiles ?? []).map(p => ({
    email: p.email,
    plan: p.plan ?? 'free',
    created_at: p.created_at,
    credits: creditMap[p.id] ?? 0,
  }));

  // Visits per day — last 7 days
  const dayMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    dayMap[d.toISOString().slice(0, 10)] = 0;
  }
  (weekViewRows ?? []).forEach(r => {
    const day = r.created_at.slice(0, 10);
    if (day in dayMap) dayMap[day]++;
  });
  const weekVisits = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

  // Top pages — last 7 days
  const pageCounts = {};
  (weekViewRows ?? []).forEach(r => {
    pageCounts[r.path] = (pageCounts[r.path] ?? 0) + 1;
  });
  const topPages = Object.entries(pageCounts)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top referrers — last 7 days (normalize to domain)
  const refCounts = {};
  (weekViewRows ?? []).forEach(r => {
    if (!r.referrer) return;
    let ref = r.referrer;
    try { ref = new URL(r.referrer).hostname.replace(/^www\./, ''); } catch {}
    refCounts[ref] = (refCounts[ref] ?? 0) + 1;
  });
  const topReferrers = Object.entries(refCounts)
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalUsers:   totalUsers ?? 0,
    proUsers:     proUsers   ?? 0,
    mrr:          (proUsers  ?? 0) * 49,
    monthlyGens:  monthlyGens ?? 0,
    newThisWeek:  newThisWeek ?? 0,
    toolUsage,
    recentUsers,
    lowCreditUsers,
    todayVisits:  todayVisits ?? 0,
    weekVisits,
    topPages,
    topReferrers,
  };
}
