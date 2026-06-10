import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';

const ADMIN_EMAIL = 'talhahally974@gmail.com';
const STRIPE_DASHBOARD = 'https://dashboard.stripe.com';

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card card-pad" style={{ flex: 1, minWidth: 140 }}>
      <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ margin: '0 0 2px', fontSize: 28, fontWeight: 800, color: accent ? 'var(--accent)' : 'var(--fg)', letterSpacing: '-0.5px' }} className="tabular">
        {value}
      </p>
      {sub && <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-4)' }}>{sub}</p>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-3)' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function TableWrap({ children }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        {children}
      </table>
    </div>
  );
}

const TH = ({ children, right }) => (
  <th style={{ padding: '10px 16px', textAlign: right ? 'right' : 'left', fontWeight: 600, fontSize: 11, color: 'var(--fg-3)', background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
    {children}
  </th>
);

const TD = ({ children, right, muted, bold }) => (
  <td style={{ padding: '10px 16px', textAlign: right ? 'right' : 'left', color: muted ? 'var(--fg-3)' : 'var(--fg)', fontWeight: bold ? 600 : 400, borderBottom: '1px solid var(--border)' }}>
    {children}
  </td>
);

function PlanBadge({ plan }) {
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: plan === 'pro' ? 'var(--accent-soft)' : 'var(--bg-soft)',
      color: plan === 'pro' ? 'var(--accent)' : 'var(--fg-3)',
    }}>
      {plan}
    </span>
  );
}

function MiniBar({ date, count, max }) {
  const heightPct = max > 0 ? Math.max(6, Math.round((count / max) * 100)) : 6;
  const label = new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: count > 0 ? 'var(--fg-2)' : 'var(--fg-4)' }}>{count}</span>
      <div style={{ width: '100%', height: 56, display: 'flex', alignItems: 'flex-end' }}>
        <div style={{ width: '100%', height: `${heightPct}%`, background: count > 0 ? 'var(--accent)' : 'var(--border)', borderRadius: '3px 3px 0 0', transition: 'height 0.4s ease', minHeight: 3 }} />
      </div>
      <span style={{ fontSize: 10, color: 'var(--fg-4)', textTransform: 'capitalize' }}>{label}</span>
    </div>
  );
}

function ToolBar({ tool_id, count, max }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ width: 160, fontSize: 13, color: 'var(--fg)', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {tool_id}
      </span>
      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
      <span className="tabular" style={{ width: 40, fontSize: 13, fontWeight: 600, color: 'var(--fg)', textAlign: 'right', flexShrink: 0 }}>
        {count}
      </span>
    </div>
  );
}

export function Admin() {
  const { session, user } = useApp();
  const [stats, setStats]     = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [error, setError]      = useState('');
  const [digestSent, setDigestSent] = useState(false);
  const [digestBusy, setDigestBusy] = useState(false);

  const refreshStats = useCallback(async () => {
    if (!session?.access_token) return;
    const data = await fetch('/api/admin-stats', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).then(r => r.json()).catch(() => null);
    if (data && !data.error) setStats(data);
  }, [session?.access_token]);

  useEffect(() => {
    if (!session?.access_token) return;

    Promise.all([
      fetch('/api/admin-stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then(r => r.json()),
      fetch('/api/payment-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, userEmail: user?.email }),
      }).then(r => r.json()),
    ])
      .then(([statsData, payData]) => {
        if (statsData.error) throw new Error(statsData.error);
        setStats(statsData);
        setPayments((payData.payments ?? []).slice(0, 5));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));

    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, [session, refreshStats]);

  const sendDigest = async () => {
    setDigestBusy(true);
    try {
      const res = await fetch('/api/admin-digest', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDigestSent(true);
      setTimeout(() => setDigestSent(false), 4000);
    } catch (err) {
      alert('Digest failed: ' + err.message);
    } finally {
      setDigestBusy(false);
    }
  };

  const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="page-pad">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="card card-pad" style={{ flex: 1, height: 80, background: 'var(--bg-soft)', animation: 'pulse 1.2s infinite' }} />
            ))}
          </div>
          <div className="card card-pad" style={{ height: 200, background: 'var(--bg-soft)', animation: 'pulse 1.2s infinite' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-pad">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="card card-pad" style={{ textAlign: 'center', color: '#dc2626' }}>
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  const maxToolCount = stats.toolUsage[0]?.count ?? 1;

  return (
    <div className="page-pad">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 className="h1" style={{ marginBottom: 4 }}>Admin</h1>
            <p className="muted" style={{ fontSize: 13 }}>Savvly internal dashboard</p>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={sendDigest}
            disabled={digestBusy}
            style={{ color: digestSent ? '#16a34a' : 'var(--fg-3)' }}
          >
            {digestSent ? '✓ Digest sent' : digestBusy ? 'Sending…' : 'Send digest'}
          </button>
        </div>

        {/* Section 1 — Key metrics */}
        <Section title="Key metrics">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <StatCard label="Total users"    value={stats.totalUsers}  sub={`+${stats.newThisWeek} this week`} />
            <StatCard label="Pro subscribers" value={stats.proUsers}   sub={`${stats.totalUsers > 0 ? Math.round(stats.proUsers / stats.totalUsers * 100) : 0}% of users`} accent />
            <StatCard label="Est. MRR"        value={`€${stats.mrr}`}  sub="pro × €49/mo" />
            <StatCard label="Gens this month" value={stats.monthlyGens} sub="generations" />
          </div>
        </Section>

        {/* Section 2 — Traffic */}
        <Section title="Trafic">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <StatCard label="Visiteurs aujourd'hui" value={stats.todayVisits} sub="rafraîchi toutes les 30s" accent />
            <StatCard label="7 derniers jours" value={stats.weekVisits.reduce((s, d) => s + d.count, 0)} sub="pages vues" />
          </div>

          {/* Week bar chart */}
          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)' }}>
              Visites par jour
            </p>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
              {stats.weekVisits.map(d => (
                <MiniBar key={d.date} {...d} max={Math.max(...stats.weekVisits.map(x => x.count), 1)} />
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Top pages */}
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)' }}>
                Pages les plus visitées
              </p>
              {stats.topPages.length === 0 ? (
                <div className="card card-pad"><p className="muted">Aucune donnée.</p></div>
              ) : (
                <TableWrap>
                  <thead>
                    <tr><TH>Page</TH><TH right>Vues</TH></tr>
                  </thead>
                  <tbody>
                    {stats.topPages.map((p, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-soft)' }}>
                        <TD><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.path}</span></TD>
                        <TD right bold>{p.count}</TD>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              )}
            </div>

            {/* Top referrers */}
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-3)' }}>
                Sources de trafic
              </p>
              {stats.topReferrers.length === 0 ? (
                <div className="card card-pad"><p className="muted">Aucune donnée.</p></div>
              ) : (
                <TableWrap>
                  <thead>
                    <tr><TH>Source</TH><TH right>Visites</TH></tr>
                  </thead>
                  <tbody>
                    {stats.topReferrers.map((r, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-soft)' }}>
                        <TD>{r.referrer}</TD>
                        <TD right bold>{r.count}</TD>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              )}
            </div>
          </div>
        </Section>

        {/* Section 3 — Recent signups */}
        <Section title="Recent signups — last 20">
          {stats.recentUsers.length === 0 ? (
            <div className="card card-pad"><p className="muted">No users yet.</p></div>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <TH>Email</TH>
                  <TH>Signed up</TH>
                  <TH>Plan</TH>
                  <TH right>Credits</TH>
                </tr>
              </thead>
              <tbody>
                {stats.recentUsers.map((u, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-soft)' }}>
                    <TD>{u.email}</TD>
                    <TD muted>{fmtDate(u.created_at)}</TD>
                    <TD><PlanBadge plan={u.plan} /></TD>
                    <TD right bold>{u.credits}</TD>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Section>

        {/* Section 4 — Tool usage */}
        <Section title="Tool usage — this month">
          {stats.toolUsage.length === 0 ? (
            <div className="card card-pad"><p className="muted">No generations this month.</p></div>
          ) : (
            <div className="card card-pad">
              {stats.toolUsage.map(t => (
                <ToolBar key={t.tool_id} {...t} max={maxToolCount} />
              ))}
            </div>
          )}
        </Section>

        {/* Section 5 — Revenue */}
        <Section title="Revenue">
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <a
              href={STRIPE_DASHBOARD}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
              style={{ textDecoration: 'none' }}
            >
              Open Stripe Dashboard →
            </a>
          </div>
          {payments.length === 0 ? (
            <div className="card card-pad"><p className="muted">No payments found.</p></div>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <TH>Date</TH>
                  <TH>Description</TH>
                  <TH right>Amount</TH>
                  <TH>Status</TH>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-soft)' }}>
                    <TD muted>{p.date}</TD>
                    <TD>{p.description}</TD>
                    <TD right bold>{p.amount}</TD>
                    <TD><span style={{ color: '#16a34a', fontWeight: 600, fontSize: 12 }}>{p.status}</span></TD>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Section>

        {/* Section 6 — Low credit users */}
        <Section title={`Low credit users — <20 credits (${stats.lowCreditUsers.length})`}>
          {stats.lowCreditUsers.length === 0 ? (
            <div className="card card-pad"><p className="muted" style={{ color: '#16a34a' }}>All users have plenty of credits.</p></div>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <TH>Email</TH>
                  <TH>Plan</TH>
                  <TH right>Credits left</TH>
                </tr>
              </thead>
              <tbody>
                {stats.lowCreditUsers.map((u, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-soft)' }}>
                    <TD>{u.email}</TD>
                    <TD><PlanBadge plan={u.plan} /></TD>
                    <TD right>
                      <span style={{ color: u.balance <= 5 ? '#dc2626' : '#d97706', fontWeight: 700 }} className="tabular">
                        {u.balance}
                      </span>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Section>

      </div>
    </div>
  );
}
