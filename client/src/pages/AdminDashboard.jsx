import { useEffect, useState } from 'react';
import { getDashboardStats } from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getDashboardStats().then((r) => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-head">
        <h1>Admin Dashboard</h1>
        <p className="muted">Monitor bookings, users and revenue.</p>
      </div>

      <section className="stats-grid">
        <article className="stat-card"><span>Total Bookings</span><strong>{stats?.totalBookings ?? '--'}</strong></article>
        <article className="stat-card"><span>Active</span><strong>{stats?.activeBookings ?? '--'}</strong></article>
        <article className="stat-card"><span>Waitlist</span><strong>{stats?.waitlistedBookings ?? '--'}</strong></article>
        <article className="stat-card"><span>Users</span><strong>{stats?.totalUsers ?? '--'}</strong></article>
        <article className="stat-card"><span>Utilities</span><strong>{stats?.totalUtilities ?? '--'}</strong></article>
        <article className="stat-card"><span>Revenue</span><strong>₹{stats?.totalRevenue ?? '--'}</strong></article>
      </section>
    </div>
  );
}
