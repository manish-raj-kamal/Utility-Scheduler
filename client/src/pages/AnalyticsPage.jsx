import { useEffect, useState } from 'react';
import { getBookingsPerWeek, getConflictRate, getMostUsedUtilities, getRevenueData } from '../services/api';

const rankColors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ec4899','#8b5cf6'];
const rowShades = ['#f0f7ff','#f0fff8','#fff8f0','#fdf4ff','#f0f9ff','#fff0f3'];

export default function AnalyticsPage() {
  const [mostUsed, setMostUsed] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [conflicts, setConflicts] = useState({});
  const [revenue, setRevenue] = useState([]);

  useEffect(() => {
    getMostUsedUtilities().then((r) => setMostUsed(r.data)).catch(() => {});
    getBookingsPerWeek().then((r) => setWeekly(r.data)).catch(() => {});
    getConflictRate().then((r) => setConflicts(r.data)).catch(() => {});
    getRevenueData().then((r) => setRevenue(r.data)).catch(() => {});
  }, []);

  const totalRevenue = revenue.reduce((s, r) => s + (r.revenue || 0), 0);
  const totalBookings = weekly.reduce((s, w) => s + (w.count || 0), 0);

  const statCards = [
    { label: 'Total Bookings', value: totalBookings, color: '#6366f1', bg: '#eef2ff', icon: '📅' },
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: '#10b981', bg: '#ecfdf5', icon: '💰' },
    { label: 'Conflict Rate', value: `${conflicts.conflictRate ?? 0}%`, color: '#f59e0b', bg: '#fffbeb', icon: '⚡' },
    { label: 'Top Utility', value: mostUsed[0]?.name || '—', color: '#8b5cf6', bg: '#f5f3ff', icon: '🏆' },
  ];

  return (
    <div>
      <div className="page-head" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Analytics</h1>
          <p className="muted" style={{ marginTop: 4 }}>Data summary and performance overview.</p>
        </div>
      </div>

      {/* Stat summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        {statCards.map((s) => (
          <div key={s.label} style={{ background: s.bg, border: `1.5px solid ${s.color}22`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 26, lineHeight: 1 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>

        {/* Most Used Utilities */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', flexShrink: 0, display: 'inline-block' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Most Used Utilities</h3>
          </div>
          {mostUsed.length === 0 ? (
            <p className="muted" style={{ padding: '20px', textAlign: 'center' }}>No data yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '8px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em' }}>#</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em' }}>UTILITY</th>
                  <th style={{ padding: '8px 20px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em' }}>BOOKINGS</th>
                </tr>
              </thead>
              <tbody>
                {mostUsed.map((u, i) => (
                  <tr key={i} style={{ background: rowShades[i % rowShades.length], borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 20px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: rankColors[i % rankColors.length], color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>{i + 1}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.92rem' }}>{u.name || u._id || 'Unknown'}</div>
                      {u.type && <div style={{ fontSize: '0.73rem', color: '#94a3b8', textTransform: 'capitalize', marginTop: 1 }}>{u.type.replace('_', ' ')}</div>}
                    </td>
                    <td style={{ padding: '10px 20px', textAlign: 'right' }}>
                      <span style={{ background: rankColors[i % rankColors.length] + '18', color: rankColors[i % rankColors.length], fontWeight: 700, fontSize: '0.9rem', padding: '2px 10px', borderRadius: 20 }}>{u.count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Bookings Per Week */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0ea5e9', flexShrink: 0, display: 'inline-block' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Bookings Per Week</h3>
          </div>
          {weekly.length === 0 ? (
            <p className="muted" style={{ padding: '20px', textAlign: 'center' }}>No data yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '8px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em' }}>WEEK</th>
                  <th style={{ padding: '8px 20px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em' }}>BOOKINGS</th>
                </tr>
              </thead>
              <tbody>
                {weekly.map((w, i) => {
                  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                  const label = typeof w._id === 'object'
                    ? `${months[(w._id.month || 1) - 1]} W${w._id.week}, ${w._id.year}`
                    : w._id;
                  const shade = i % 2 === 0 ? '#f0f9ff' : '#fff';
                  return (
                    <tr key={i} style={{ background: shade, borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 20px', fontWeight: 500, color: '#334155', fontSize: '0.88rem' }}>{label}</td>
                      <td style={{ padding: '10px 20px', textAlign: 'right' }}>
                        <span style={{ background: '#dbeafe', color: '#2563eb', fontWeight: 700, fontSize: '0.88rem', padding: '2px 10px', borderRadius: 20 }}>{w.count}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>

        {/* Conflict Rate */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0, display: 'inline-block' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Conflict Rate</h3>
          </div>
          <div style={{ padding: '18px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Total Requests', value: conflicts.total ?? 0, color: '#6366f1', bg: '#eef2ff' },
              { label: 'Waitlisted', value: conflicts.waitlisted ?? 0, color: '#f59e0b', bg: '#fffbeb' },
              { label: 'Rejected', value: conflicts.rejected ?? 0, color: '#ef4444', bg: '#fef2f2' },
              { label: 'Conflict Rate', value: `${conflicts.conflictRate ?? 0}%`, color: '#0ea5e9', bg: '#f0f9ff' },
            ].map((s) => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '12px 16px', border: `1px solid ${s.color}22` }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: s.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0, display: 'inline-block' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Revenue by Month</h3>
          </div>
          {revenue.length === 0 ? (
            <p className="muted" style={{ padding: '20px', textAlign: 'center' }}>No revenue data yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '8px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em' }}>MONTH</th>
                  <th style={{ padding: '8px 20px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em' }}>REVENUE</th>
                </tr>
              </thead>
              <tbody>
                {revenue.map((r, i) => {
                  const label = typeof r._id === 'object'
                    ? `${r._id.year}-${String(r._id.month).padStart(2, '0')}`
                    : (r._id || 'Unknown');
                  const shade = i % 2 === 0 ? '#f0fff8' : '#fff';
                  return (
                    <tr key={i} style={{ background: shade, borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 20px', fontWeight: 500, color: '#334155', fontSize: '0.88rem' }}>{label}</td>
                      <td style={{ padding: '10px 20px', textAlign: 'right' }}>
                        <span style={{ background: '#d1fae5', color: '#059669', fontWeight: 700, fontSize: '0.88rem', padding: '2px 10px', borderRadius: 20 }}>₹{r.revenue?.toLocaleString('en-IN')}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
