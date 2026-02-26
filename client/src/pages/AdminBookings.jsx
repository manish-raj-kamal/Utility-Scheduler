import { useEffect, useMemo, useState } from 'react';
import { adminOverrideBooking, getAllBookings } from '../services/api';

const formatRange = (startValue, endValue) => {
  const start = new Date(startValue);
  const end = new Date(endValue);
  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    return `${start.toLocaleDateString('en-IN', { dateStyle: 'medium' })} • ${start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return `${start.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} - ${end.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`;
};

export default function AdminBookings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchItems = () => {
    setLoading(true);
    getAllBookings()
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const overrideStatus = async (bookingId, newStatus) => {
    setBusyId(bookingId);
    try {
      await adminOverrideBooking({ bookingId, newStatus });
      fetchItems();
    } finally {
      setBusyId('');
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const statusMatch = statusFilter === 'all' || item.status === statusFilter;
      const searchMatch =
        !query ||
        `${item.userId?.name || ''} ${item.utilityId?.name || ''} ${item.paymentStatus || ''}`.toLowerCase().includes(query);
      return statusMatch && searchMatch;
    });
  }, [items, statusFilter, search]);

  const stats = useMemo(
    () => ({
      total: items.length,
      approved: items.filter((item) => item.status === 'approved').length,
      waitlist: items.filter((item) => item.status === 'waitlist').length,
      pendingPayment: items.filter((item) => item.paymentStatus === 'pending').length
    }),
    [items]
  );

  return (
    <div className="luxe-page admin-ops-page bookings-admin-page">
      <div className="luxe-ambient" aria-hidden="true">
        <span className="luxe-orb orb-one" />
        <span className="luxe-orb orb-two" />
        <span className="luxe-orb orb-three" />
        <span className="luxe-grid" />
      </div>

      <section className="luxe-hero glass-panel">
        <div className="luxe-hero-copy">
          <p className="luxe-eyebrow">Booking Oversight</p>
          <h1>All Bookings</h1>
          <p className="muted">Review booking outcomes, override status, and monitor fairness impact.</p>
        </div>
        <div className="luxe-hero-actions admin-ops-filters">
          <input
            className="search-input luxe-search"
            placeholder="Search user or utility"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="search-input luxe-search" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="approved">Approved</option>
            <option value="waitlist">Waitlist</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </section>

      <section className="luxe-stat-row admin-ops-stat-row">
        <article className="luxe-stat-tile">
          <span>Total Bookings</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Approved</span>
          <strong>{stats.approved}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Waitlist</span>
          <strong>{stats.waitlist}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Pending Payments</span>
          <strong>{stats.pendingPayment}</strong>
        </article>
      </section>

      <section className="admin-ops-board glass-panel">
        <div className="admin-ops-board-head">
          <h3>Booking Queue ({filtered.length})</h3>
        </div>

        {loading ? (
          <p className="muted center">Loading bookings...</p>
        ) : filtered.length === 0 ? (
          <p className="muted center">No bookings match the selected filter.</p>
        ) : (
          <div className="admin-entity-grid">
            {filtered.map((booking) => (
              <article className="admin-entity-card" key={booking._id}>
                <div className="admin-entity-head">
                  <strong>{booking.userId?.name || 'User'} → {booking.utilityId?.name || 'Utility'}</strong>
                  <span className={`pill ${booking.status}`}>{booking.status}</span>
                </div>

                <p className="admin-entity-sub">{formatRange(booking.startTime, booking.endTime)}</p>

                <div className="admin-entity-meta compact">
                  <span>Payment: <span className={`pill ${booking.paymentStatus}`}>{booking.paymentStatus}</span></span>
                  <span>Fairness Score: <strong>{booking.fairnessScore}</strong></span>
                </div>

                <div className="admin-entity-actions">
                  <button
                    className="btn primary"
                    onClick={() => overrideStatus(booking._id, 'approved')}
                    disabled={busyId === booking._id}
                  >
                    {busyId === booking._id ? 'Updating...' : 'Approve'}
                  </button>
                  <button
                    className="btn danger"
                    onClick={() => overrideStatus(booking._id, 'rejected')}
                    disabled={busyId === booking._id}
                  >
                    {busyId === booking._id ? 'Updating...' : 'Reject'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
