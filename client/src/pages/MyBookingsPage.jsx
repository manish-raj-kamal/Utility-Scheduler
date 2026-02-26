import { useEffect, useMemo, useState } from 'react';
import { cancelBooking, createPaymentOrder, getMyBookings, getRazorpayKey, verifyPayment } from '../services/api';

const formatRange = (startValue, endValue) => {
  const start = new Date(startValue);
  const end = new Date(endValue);
  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    return `${start.toLocaleDateString('en-IN', { dateStyle: 'medium' })} • ${start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return `${start.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} - ${end.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`;
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [payingId, setPayingId] = useState('');

  const fetchBookings = () => getMyBookings().then((r) => setBookings(r.data)).catch(() => {});

  useEffect(() => { fetchBookings(); }, []);

  const onCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    await cancelBooking(id);
    fetchBookings();
  };

  const onPay = async (booking) => {
    setPayingId(booking._id);
    try {
      const { data: keyData } = await getRazorpayKey();
      const { data: orderData } = await createPaymentOrder({ bookingId: booking._id });

      const options = {
        key: keyData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'Utility Scheduler',
        description: `Payment for ${booking.utilityId?.name || 'Booking'}`,
        handler: async (response) => {
          await verifyPayment(response);
          fetchBookings();
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      alert('Payment failed to start.');
    } finally {
      setPayingId('');
    }
  };

  const list = statusFilter === 'all' ? bookings : bookings.filter((b) => b.status === statusFilter);

  const stats = useMemo(
    () => ({
      total: bookings.length,
      approved: bookings.filter((b) => b.status === 'approved').length,
      waitlist: bookings.filter((b) => b.status === 'waitlist').length,
      unpaidApproved: bookings.filter((b) => b.status === 'approved' && b.paymentStatus !== 'paid').length
    }),
    [bookings]
  );

  return (
    <div className="luxe-page bookings-luxe">
      <div className="luxe-ambient" aria-hidden="true">
        <span className="luxe-orb orb-one" />
        <span className="luxe-orb orb-two" />
        <span className="luxe-orb orb-three" />
        <span className="luxe-grid" />
      </div>

      <section className="luxe-hero glass-panel">
        <div className="luxe-hero-copy">
          <p className="luxe-eyebrow">Booking Command</p>
          <h1>My Bookings</h1>
          <p className="muted">Track every slot, settle payments, and manage active requests.</p>
        </div>
        <div className="luxe-hero-actions">
          <select className="search-input luxe-search" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="approved">Approved</option>
            <option value="waitlist">Waitlist</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </section>

      <section className="luxe-stat-row">
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
          <strong>{stats.unpaidApproved}</strong>
        </article>
      </section>

      <section className="bookings-board glass-panel">
        <div className="bookings-board-head">
          <h3>Filtered Bookings ({list.length})</h3>
          <p>Showing {statusFilter === 'all' ? 'all statuses' : statusFilter}</p>
        </div>

        <div className="bookings-card-list">
          {list.length === 0 && <p className="muted">No bookings found.</p>}
          {list.map((b) => (
            <article className="booking-card-item" key={b._id}>
              <div className="booking-card-main">
                <strong>{b.utilityId?.name || 'Utility'}</strong>
                <p>{formatRange(b.startTime, b.endTime)}</p>
              </div>

              <div className="booking-card-actions">
                <span className={`pill ${b.status}`}>{b.status}</span>
                <span className={`pill ${b.paymentStatus}`}>{b.paymentStatus}</span>

                {b.status === 'approved' && b.paymentStatus !== 'paid' && (
                  <button className="btn primary" onClick={() => onPay(b)} disabled={payingId === b._id}>
                    {payingId === b._id ? 'Opening...' : 'Pay'}
                  </button>
                )}
                {(b.status === 'approved' || b.status === 'waitlist') && (
                  <button className="btn danger" onClick={() => onCancel(b._id)}>Cancel</button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
