import { useEffect, useState } from 'react';
import { cancelBooking, createPaymentOrder, getMyBookings, getRazorpayKey, verifyPayment } from '../services/api';

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

  return (
    <div>
      <div className="page-head split">
        <div>
          <h1>My Bookings</h1>
          <p className="muted">Manage confirmed slots and waitlisted requests.</p>
        </div>
        <select className="search-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="approved">Approved</option>
          <option value="waitlist">Waitlist</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="panel">
        <div className="list-stack">
          {list.length === 0 && <p className="muted">No bookings found.</p>}
          {list.map((b) => (
            <div className="list-item" key={b._id}>
              <div>
                <strong>{b.utilityId?.name || 'Utility'}</strong>
                <p>{new Date(b.startTime).toLocaleString('en-IN')} → {new Date(b.endTime).toLocaleString('en-IN')}</p>
              </div>
              <div className="actions-inline">
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
