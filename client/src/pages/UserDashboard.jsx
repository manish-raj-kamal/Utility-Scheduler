import { useEffect, useState } from 'react';
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

  return (
    <div>
      {/* Welcome banner */}
      <div className="welcome-banner">
        <div>
          <h1>{greetingByHour()}, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p className="muted">Here's what's happening with your bookings today.</p>
        </div>
        <Link to="/utilities" className="btn primary">+ New Booking</Link>
      </div>

      {/* Stat cards */}
      <section className="stats-grid">
        {statConfig.map((s) => (
          <article className="dash-stat-card" key={s.key} style={{ '--accent': s.color }}>
            <div className="dash-stat-icon"><W8Icon name={s.iconName} size={32} alt={s.label} /></div>
            <div className="dash-stat-info">
              <span>{s.label}</span>
              <strong>{s.prefix || ''}{stats?.[s.key] ?? '--'}</strong>
            </div>
          </article>
        ))}
      </section>

      {/* Content columns */}
      <section className="grid-2">
        {/* Recent Bookings */}
        <div className="panel">
          <div className="panel-head">
            <h3>Recent Bookings</h3>
            <Link to="/my-bookings" className="link-accent">View all →</Link>
          </div>
          <div className="list-stack">
            {bookings.length === 0 && <p className="empty-state">No bookings yet — book your first utility!</p>}
            {bookings.map((b) => (
              <div className="list-item" key={b._id}>
                <div>
                  <strong>{b.utilityId?.name}</strong>
                  <p>{new Date(b.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
                <span className={`pill ${b.status}`}>{b.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Book */}
        <div className="panel">
          <div className="panel-head">
            <h3>Quick Book</h3>
            <Link to="/utilities" className="link-accent">See all →</Link>
          </div>
          <div className="list-stack">
            {utilities.length === 0 && <p className="empty-state">No utilities available.</p>}
            {utilities.map((u) => (
              <Link className="quick-book-item" key={u._id} to={`/calendar?utility=${u._id}`}>
                <div>
                  <strong>{u.name}</strong>
                  <p>₹{u.pricePerHour}/hr</p>
                </div>
                <span className="btn ghost sm">Book →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
