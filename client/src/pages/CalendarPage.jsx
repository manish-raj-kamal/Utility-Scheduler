import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCalendar, getUtilities, requestBooking } from '../services/api';

export default function CalendarPage() {
  const [params] = useSearchParams();
  const [utilities, setUtilities] = useState([]);
  const [selectedUtility, setSelectedUtility] = useState(params.get('utility') || '');
  
  // Date/Time state
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [endTime, setEndTime] = useState('10:00');

  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getUtilities().then((r) => {
      setUtilities(r.data);
      if (!selectedUtility && r.data.length) setSelectedUtility(r.data[0]._id);
    }).catch(() => {});
  }, []);

  const refresh = () => {
    if (!selectedUtility) return;
    // Fetch bookings for the VIEW range (using startDate to endDate coverage)
    const rangeStart = new Date(`${startDate}T00:00:00`);
    const rangeEnd = new Date(`${endDate}T23:59:59`);
    
    // Fallback if end date is before start date (user just picking)
    if (rangeEnd < rangeStart) return;

    getCalendar({ utilityId: selectedUtility, start: rangeStart.toISOString(), end: rangeEnd.toISOString() })
      .then((r) => setItems(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    if (startDate && endDate) refresh();
  }, [selectedUtility, startDate, endDate]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);

    if (end <= start) {
      setMsg('End time must be after start time.');
      return;
    }

    try {
      const { data } = await requestBooking({ utilityId: selectedUtility, startTime: start.toISOString(), endTime: end.toISOString() });
      setMsg(data.status === 'approved' ? 'Booking approved.' : 'Added to waitlist.');
      refresh();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Booking failed.');
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>Book by Date & Time</h1>
        <p className="muted">Check availability and book utilities.</p>
      </div>

      <div className="panel">
        <form className="form-grid" onSubmit={submit} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          <label style={{ gridColumn: '1/-1' }}>Utility
            <select value={selectedUtility} onChange={(e) => setSelectedUtility(e.target.value)} required>
              {utilities.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </label>
          
          <label>Start Date
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); if(endDate < e.target.value) setEndDate(e.target.value); }} required />
          </label>
          <label>Start Time
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </label>
          
          <label>End Date
            <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} required />
          </label>
          <label>End Time
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </label>

          <button className="btn primary" type="submit" style={{ gridColumn: '1/-1', marginTop: 8 }}>Request Booking</button>
        </form>
        {msg && <p className={`info-banner ${msg.includes('failed') || msg.includes('after') ? 'error' : ''}`}>{msg}</p>}
      </div>

      <div className="panel">
        <h3>Booked Slots ({items.length})</h3>
        <p className="muted" style={{ fontSize: '0.85em', marginBottom: 12 }}>Showing bookings from {startDate} to {endDate}</p>
        <div className="list-stack">
          {items.length === 0 && <p className="muted">No bookings found for this range.</p>}
          {items.map((b) => {
            const s = new Date(b.startTime);
            const e = new Date(b.endTime);
            const sDate = s.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            const sTime = s.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const eDate = e.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            const eTime = e.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            
            const isSameDay = s.toDateString() === e.toDateString();

            return (
              <div className="list-item" key={b._id}>
                <div>
                  <strong>{isSameDay ? `${sDate} • ${sTime} - ${eTime}` : `${sDate} ${sTime} — ${eDate} ${eTime}`}</strong>
                  <p>{b.userId?.name || 'User'}</p>
                </div>
                <span className={`pill ${b.status}`}>{b.status}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
