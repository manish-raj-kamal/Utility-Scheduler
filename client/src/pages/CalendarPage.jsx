import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCalendar, getUtilities, requestBooking } from '../services/api';

export default function CalendarPage() {
  const [params] = useSearchParams();
  const [utilities, setUtilities] = useState([]);
  const [selectedUtility, setSelectedUtility] = useState(params.get('utility') || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
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
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);
    getCalendar({ utilityId: selectedUtility, start: start.toISOString(), end: end.toISOString() })
      .then((r) => setItems(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    refresh();
  }, [selectedUtility, date]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);
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
        <p className="muted">Simplified schedule flow with live availability.</p>
      </div>

      <div className="panel">
        <form className="form-grid" onSubmit={submit}>
          <label>Utility
            <select value={selectedUtility} onChange={(e) => setSelectedUtility(e.target.value)} required>
              {utilities.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </label>
          <label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
          <label>Start<input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required /></label>
          <label>End<input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required /></label>
          <button className="btn primary" type="submit">Request Booking</button>
        </form>
        {msg && <p className="info-banner">{msg}</p>}
      </div>

      <div className="panel">
        <h3>Booked Slots ({items.length})</h3>
        <div className="list-stack">
          {items.length === 0 && <p className="muted">No bookings for this date.</p>}
          {items.map((b) => (
            <div className="list-item" key={b._id}>
              <div>
                <strong>{new Date(b.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong>
                <p>{b.userId?.name || 'User'}</p>
              </div>
              <span className={`pill ${b.status}`}>{b.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
