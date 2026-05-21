import { verifyAdmin, fetchAdminStats } from './_admin-queries.js';

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const email = await verifyAdmin(req, res);
  if (!email) return;

  try {
    const stats = await fetchAdminStats();
    res.json(stats);
  } catch (err) {
    console.error('[admin-stats] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
