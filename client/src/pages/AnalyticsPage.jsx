import { useEffect, useState } from 'react';
import { getBookingsPerWeek, getConflictRate, getMostUsedUtilities, getRevenueData } from '../services/api';

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

  return (
    <div>
      <div className="page-head">
        <h1>Analytics</h1>
        <p className="muted">Data summary in a compact tabular view.</p>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h3>Most Used Utilities</h3>
          <ul className="simple-list">
            {mostUsed.map((u, i) => <li key={i}>{u.name || u._id || 'Unknown'} <span className="muted" style={{fontSize:'0.82rem'}}>{u.type}</span> <strong>{u.count}</strong></li>)}
          </ul>
        </div>
        <div className="panel">
          <h3>Bookings Per Week</h3>
          <ul className="simple-list">
            {weekly.map((w, i) => {
              const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              const label = typeof w._id === 'object'
                ? `${months[(w._id.month || 1) - 1]} W${w._id.week}, ${w._id.year}`
                : w._id;
              return <li key={i}>{label} <strong>{w.count}</strong></li>;
            })}
          </ul>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h3>Conflict Rate</h3>
          <p>Total Requests: <strong>{conflicts.total ?? 0}</strong></p>
          <p>Waitlisted: <strong>{conflicts.waitlisted ?? 0}</strong></p>
          <p>Rejected: <strong>{conflicts.rejected ?? 0}</strong></p>
          <p>Conflict Rate: <strong>{conflicts.conflictRate ?? 0}%</strong></p>
        </div>
        <div className="panel">
          <h3>Revenue</h3>
          <ul className="simple-list">
            {revenue.map((r, i) => <li key={i}>{typeof r._id === 'object' ? `${r._id.year}-${String(r._id.month).padStart(2,'0')}` : (r._id || 'Unknown')} <strong>₹{r.revenue}</strong></li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
