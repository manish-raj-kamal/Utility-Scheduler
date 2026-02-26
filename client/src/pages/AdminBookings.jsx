import { useEffect, useState } from 'react';
import { adminOverrideBooking, getAllBookings } from '../services/api';
import { useWindowWidth } from '../hooks/useWindowWidth';

export default function AdminBookings() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const isMobile = useWindowWidth() < 640;

  const fetchItems = () => getAllBookings().then((r) => setItems(r.data)).catch(() => {});
  useEffect(() => { fetchItems(); }, []);

  const list = filter === 'all' ? items : items.filter((i) => i.status === filter);

  return (
    <div>
      <div className="page-head split">
        <div><h1>All Bookings</h1><p className="muted">Override and manage booking requests.</p></div>
        <select className="search-input" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="approved">Approved</option>
          <option value="waitlist">Waitlist</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.length === 0 ? (
            <p className="muted center">No bookings found.</p>
          ) : list.map((b) => (
            <div key={b._id} className="panel" style={{ padding: '14px 16px' }}>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: '#1e293b' }}>{b.userId?.name}</strong>
                <span style={{ color: '#94a3b8', margin: '0 6px' }}>→</span>
                <span style={{ color: '#475569' }}>{b.utilityId?.name}</span>
                <div style={{ fontSize: '0.83rem', color: '#64748b', marginTop: 4 }}>
                  {new Date(b.startTime).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                <span className={`pill ${b.status}`}>{b.status}</span>
                <span className={`pill ${b.paymentStatus}`}>{b.paymentStatus}</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: 'auto' }}>Score: {b.fairnessScore}</span>
              </div>
              <div className="actions-inline" style={{ paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                <button className="btn primary" onClick={async () => { await adminOverrideBooking({ bookingId: b._id, newStatus: 'approved' }); fetchItems(); }}>Approve</button>
                <button className="btn danger" onClick={async () => { await adminOverrideBooking({ bookingId: b._id, newStatus: 'rejected' }); fetchItems(); }}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel table-scroll">
          <table className="table">
            <thead><tr><th>User</th><th>Utility</th><th>Time</th><th>Status</th><th>Payment</th><th>Score</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map((b) => (
                <tr key={b._id}>
                  <td>{b.userId?.name}</td>
                  <td>{b.utilityId?.name}</td>
                  <td>{new Date(b.startTime).toLocaleString('en-IN')}</td>
                  <td><span className={`pill ${b.status}`}>{b.status}</span></td>
                  <td><span className={`pill ${b.paymentStatus}`}>{b.paymentStatus}</span></td>
                  <td>{b.fairnessScore}</td>
                  <td className="actions-inline">
                    <button className="btn primary" onClick={async () => { await adminOverrideBooking({ bookingId: b._id, newStatus: 'approved' }); fetchItems(); }}>Approve</button>
                    <button className="btn danger" onClick={async () => { await adminOverrideBooking({ bookingId: b._id, newStatus: 'rejected' }); fetchItems(); }}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

