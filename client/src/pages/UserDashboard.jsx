import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyBookings, getUserStats, getUtilities } from '../services/api';
import W8Icon from '../components/W8Icon';

const greetingByHour = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const statConfig = [
  { key: 'totalBookings', label: 'Total Bookings', iconName: 'bookings', color: '#2f6fed' },
  { key: 'activeBookings', label: 'Active Now', iconName: 'utilities', color: '#0ea95f' },
  { key: 'totalHours', label: 'Hours Used', iconName: 'clock', color: '#e67e22' },
  { key: 'totalSpent', label: 'Amount Spent', iconName: 'coins', color: '#8b5cf6', prefix: '₹' }
];

const formatBookingDate = (value) =>
  new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

const formatStatValue = (config, value) => {
  if (value === null || value === undefined) return '--';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '--';
  return `${config.prefix || ''}${numeric.toLocaleString('en-IN')}`;
};

export default function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [utilities, setUtilities] = useState([]);

  useEffect(() => {
    getUserStats().then((r) => setStats(r.data)).catch(() => {});
    getMyBookings().then((r) => setBookings(r.data.slice(0, 5))).catch(() => {});
    getUtilities().then((r) => setUtilities(r.data.slice(0, 4))).catch(() => {});
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'Member';
  const completionRate = useMemo(() => {
    if (!stats?.totalBookings) return 0;
    const completed = stats.totalBookings - (stats.cancelledBookings || 0);
    return Math.max(0, Math.round((completed / stats.totalBookings) * 100));
  }, [stats]);

  const activeShare = useMemo(() => {
    if (!stats?.totalBookings) return 0;
    return Math.round(((stats.activeBookings || 0) / stats.totalBookings) * 100);
  }, [stats]);

  const upcomingBooking = useMemo(() => {
    return bookings
      .filter((b) => b?.startTime && b.status !== 'cancelled')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
  }, [bookings]);

  return (
    <div className="dashboard-luxe user-dashboard-luxe">
      <div className="dashboard-ambient" aria-hidden="true">
        <span className="ambient-orb orb-one" />
        <span className="ambient-orb orb-two" />
        <span className="ambient-orb orb-three" />
        <span className="ambient-ring ring-one" />
        <span className="ambient-ring ring-two" />
        <span className="ambient-grid" />
      </div>

      <section className="dashboard-hero glass-panel">
        <div className="hero-copy">
          <p className="dashboard-eyebrow">Personal Command Center</p>
          <h1>{greetingByHour()}, {firstName}</h1>
          <p className="dashboard-subtitle">
            {upcomingBooking
              ? `Next booking: ${upcomingBooking?.utilityId?.name || 'Utility'} on ${formatBookingDate(upcomingBooking.startTime)}.`
              : "No upcoming booking yet. Reserve your next slot and keep things moving."}
          </p>
          <div className="hero-meta-row">
            <div className="hero-meta-chip">
              <span>Completion</span>
              <strong>{completionRate}%</strong>
            </div>
            <div className="hero-meta-chip">
              <span>Active Share</span>
              <strong>{activeShare}%</strong>
            </div>
            <div className="hero-meta-chip">
              <span>Utilities Live</span>
              <strong>{utilities.length}</strong>
            </div>
          </div>
        </div>
        <div className="hero-actions">
          <Link to="/utilities" className="btn primary dashboard-cta">New Booking</Link>
          <Link to="/calendar" className="btn ghost dashboard-cta secondary">Open Calendar</Link>
        </div>
      </section>

      <section className="dashboard-stat-grid">
        {statConfig.map((s) => (
          <article className="dashboard-stat-tile" key={s.key} style={{ '--accent': s.color }}>
            <div className="stat-icon-shell">
              <W8Icon name={s.iconName} size={30} alt={s.label} />
            </div>
            <div className="stat-text">
              <span>{s.label}</span>
              <strong>{formatStatValue(s, stats?.[s.key])}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-columns">
        <div className="dashboard-panel glass-panel">
          <div className="panel-head">
            <h3>Recent Bookings</h3>
            <Link to="/my-bookings" className="link-accent">View all</Link>
          </div>
          <div className="list-stack">
            {bookings.length === 0 && <p className="empty-state">No bookings yet — book your first utility!</p>}
            {bookings.map((b) => (
              <div className="dashboard-row-item" key={b._id}>
                <div className="dashboard-row-main">
                  <strong>{b.utilityId?.name || 'Utility'}</strong>
                  <p>{formatBookingDate(b.startTime)}</p>
                </div>
                <span className={`pill ${b.status}`}>{b.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-panel glass-panel">
          <div className="panel-head">
            <h3>Quick Book</h3>
            <Link to="/utilities" className="link-accent">See all</Link>
          </div>
          <div className="list-stack">
            {utilities.length === 0 && <p className="empty-state">No utilities available.</p>}
            {utilities.map((u) => (
              <Link className="dashboard-quick-item" key={u._id} to={`/calendar?utility=${u._id}`}>
                <div className="dashboard-row-main">
                  <strong>{u.name}</strong>
                  <p>₹{u.pricePerHour}/hr</p>
                </div>
                <span className="btn ghost sm">Book now</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
