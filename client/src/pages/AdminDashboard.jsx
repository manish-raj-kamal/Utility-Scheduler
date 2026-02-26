import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import W8Icon from '../components/W8Icon';
import { getDashboardStats } from '../services/api';

const adminStatConfig = [
  { key: 'totalBookings', label: 'Total Bookings', iconName: 'bookings', color: '#2f6fed' },
  { key: 'activeBookings', label: 'Active Sessions', iconName: 'utilities', color: '#0ea95f' },
  { key: 'waitlistedBookings', label: 'Waitlist Queue', iconName: 'calendar', color: '#f59f0b' },
  { key: 'totalUsers', label: 'Members', iconName: 'users', color: '#12b5cb' },
  { key: 'totalUtilities', label: 'Live Utilities', iconName: 'flat', color: '#6d5dfc' },
  { key: 'totalRevenue', label: 'Revenue', iconName: 'coins', color: '#ff6d5a', prefix: '₹' }
];

const formatMetric = (config, value) => {
  if (value === null || value === undefined) return '--';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '--';
  return `${config.prefix || ''}${numeric.toLocaleString('en-IN')}`;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getDashboardStats().then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const totalBookings = stats?.totalBookings || 0;
  const activeBookings = stats?.activeBookings || 0;
  const waitlistedBookings = stats?.waitlistedBookings || 0;
  const totalRevenue = stats?.totalRevenue || 0;

  const utilization = useMemo(() => {
    if (!totalBookings) return 0;
    return Math.round((activeBookings / totalBookings) * 100);
  }, [activeBookings, totalBookings]);

  const waitlistPressure = useMemo(() => {
    if (!totalBookings) return 0;
    return Math.round((waitlistedBookings / totalBookings) * 100);
  }, [totalBookings, waitlistedBookings]);

  const revenuePerBooking = useMemo(() => {
    if (!totalBookings) return 0;
    return Math.round(totalRevenue / totalBookings);
  }, [totalBookings, totalRevenue]);

  const insights = [
    {
      title: 'Utilization Rate',
      value: `${utilization}%`,
      note: 'Share of active bookings compared to total booking volume.',
      meter: utilization,
      color: '#0ea95f'
    },
    {
      title: 'Waitlist Pressure',
      value: `${waitlistPressure}%`,
      note: 'Current load in the queue that may need capacity balancing.',
      meter: waitlistPressure,
      color: '#f59f0b'
    },
    {
      title: 'Revenue Per Booking',
      value: `₹${revenuePerBooking.toLocaleString('en-IN')}`,
      note: 'Average paid amount generated from each booking request.',
      meter: totalRevenue ? Math.min(100, Math.round((revenuePerBooking / 1000) * 100)) : 0,
      color: '#ff6d5a'
    }
  ];

  return (
    <div className="dashboard-luxe admin-dashboard-luxe">
      <div className="dashboard-ambient" aria-hidden="true">
        <span className="ambient-orb orb-one" />
        <span className="ambient-orb orb-two" />
        <span className="ambient-orb orb-three" />
        <span className="ambient-ring ring-one" />
        <span className="ambient-ring ring-two" />
        <span className="ambient-grid" />
      </div>

      <section className="dashboard-hero glass-panel admin-hero">
        <div className="hero-copy">
          <p className="dashboard-eyebrow">Operations Control Center</p>
          <h1>Admin Dashboard</h1>
          <p className="dashboard-subtitle">Monitor demand, capacity, and revenue in one command view.</p>
          <div className="hero-meta-row">
            <div className="hero-meta-chip">
              <span>Utilization</span>
              <strong>{utilization}%</strong>
            </div>
            <div className="hero-meta-chip">
              <span>Waitlist Load</span>
              <strong>{waitlistPressure}%</strong>
            </div>
            <div className="hero-meta-chip">
              <span>Avg Revenue</span>
              <strong>₹{revenuePerBooking.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>
        <div className="hero-actions admin-hero-actions">
          <div className="admin-live-pill">
            <span className="live-dot" />
            Live metrics
          </div>
          <Link to="/admin/analytics" className="btn primary dashboard-cta">Open Analytics</Link>
          <Link to="/notifications" className="btn ghost dashboard-cta secondary">Check Alerts</Link>
        </div>
      </section>

      <section className="dashboard-stat-grid admin-stat-grid">
        {adminStatConfig.map((item) => (
          <article className="dashboard-stat-tile" key={item.key} style={{ '--accent': item.color }}>
            <div className="stat-icon-shell">
              <W8Icon name={item.iconName} size={30} alt={item.label} />
            </div>
            <div className="stat-text">
              <span>{item.label}</span>
              <strong>{formatMetric(item, stats?.[item.key])}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-insight-grid">
        {insights.map((item) => (
          <article className="admin-insight-card glass-panel" key={item.title}>
            <div className="admin-insight-head">
              <h3>{item.title}</h3>
              <strong>{item.value}</strong>
            </div>
            <p>{item.note}</p>
            <div className="admin-meter-track">
              <span style={{ width: `${Math.max(0, Math.min(100, item.meter))}%`, background: item.color }} />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
