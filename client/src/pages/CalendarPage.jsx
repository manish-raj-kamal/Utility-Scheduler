import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [isErrorMsg, setIsErrorMsg] = useState(false);

  useEffect(() => {
    let mounted = true;
    getUtilities()
      .then((r) => {
        if (!mounted) return;
        setUtilities(r.data);
        setSelectedUtility((current) => current || r.data[0]?._id || '');
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const refresh = useCallback(() => {
    if (!selectedUtility) return;
    // Fetch bookings for the VIEW range (using startDate to endDate coverage)
    const rangeStart = new Date(`${startDate}T00:00:00`);
    const rangeEnd = new Date(`${endDate}T23:59:59`);
    
    // Fallback if end date is before start date (user just picking)
    if (rangeEnd < rangeStart) return;

    getCalendar({ utilityId: selectedUtility, start: rangeStart.toISOString(), end: rangeEnd.toISOString() })
      .then((r) => setItems(r.data))
      .catch(() => {});
  }, [selectedUtility, startDate, endDate]);

  useEffect(() => {
    if (startDate && endDate) refresh();
  }, [startDate, endDate, refresh]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);

    if (end <= start) {
      setIsErrorMsg(true);
      setMsg('End time must be after start time.');
      return;
    }

    try {
      const { data } = await requestBooking({ utilityId: selectedUtility, startTime: start.toISOString(), endTime: end.toISOString() });
      setIsErrorMsg(false);
      setMsg(data.status === 'approved' ? 'Booking approved.' : 'Added to waitlist.');
      refresh();
    } catch (err) {
      setIsErrorMsg(true);
      setMsg(err.response?.data?.message || 'Booking failed.');
    }
  };

  const selectedUtilityInfo = useMemo(
    () => utilities.find((item) => item._id === selectedUtility),
    [utilities, selectedUtility]
  );

  const requestedHours = useMemo(() => {
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);
    const hours = (end - start) / (1000 * 60 * 60);
    if (!Number.isFinite(hours) || hours <= 0) return 0;
    return Math.round(hours * 10) / 10;
  }, [startDate, startTime, endDate, endTime]);

  const estimatedCost = useMemo(() => {
    const rate = Number(selectedUtilityInfo?.pricePerHour) || 0;
    return Math.round(rate * requestedHours);
  }, [selectedUtilityInfo, requestedHours]);

  const approvedCount = useMemo(
    () => items.filter((item) => item.status === 'approved').length,
    [items]
  );

  const waitlistCount = useMemo(
    () => items.filter((item) => item.status === 'waitlist').length,
    [items]
  );

  return (
    <div className="luxe-page calendar-luxe">
      <div className="luxe-ambient" aria-hidden="true">
        <span className="luxe-orb orb-one" />
        <span className="luxe-orb orb-two" />
        <span className="luxe-orb orb-three" />
        <span className="luxe-grid" />
      </div>

      <section className="luxe-hero glass-panel">
        <div className="luxe-hero-copy">
          <p className="luxe-eyebrow">Smart Slot Planner</p>
          <h1>Book by Date & Time</h1>
          <p className="muted">Build your request, preview cost, and check current slot pressure.</p>
        </div>
        <div className="calendar-highlight-card">
          <span>Selected Utility</span>
          <strong>{selectedUtilityInfo?.name || 'Select utility'}</strong>
          <p>{selectedUtilityInfo ? `₹${selectedUtilityInfo.pricePerHour}/hr` : 'Choose a utility to view pricing'}</p>
        </div>
      </section>

      <section className="luxe-stat-row">
        <article className="luxe-stat-tile">
          <span>Visible Slots</span>
          <strong>{items.length}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Approved</span>
          <strong>{approvedCount}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Waitlist</span>
          <strong>{waitlistCount}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Estimated Cost</span>
          <strong>₹{estimatedCost.toLocaleString('en-IN')}</strong>
        </article>
      </section>

      <section className="calendar-layout">
        <article className="calendar-booking-panel glass-panel">
          <h3>Create Booking Request</h3>
          <form className="calendar-booking-form" onSubmit={submit}>
            <label className="calendar-field utility-select">Utility
              <select value={selectedUtility} onChange={(e) => setSelectedUtility(e.target.value)} required>
                {utilities.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </label>

            <label className="calendar-field">Start Date
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
                required
              />
            </label>
            <label className="calendar-field">Start Time
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </label>
            <label className="calendar-field">End Date
              <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} required />
            </label>
            <label className="calendar-field">End Time
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </label>

            <div className="calendar-summary-chip">
              <span>Requested Duration</span>
              <strong>{requestedHours > 0 ? `${requestedHours} hours` : 'Set valid time range'}</strong>
            </div>

            <button className="btn primary calendar-submit-btn" type="submit">Request Booking</button>
          </form>
          {msg && <p className={`calendar-flash ${isErrorMsg ? 'error' : 'success'}`}>{msg}</p>}
        </article>

        <article className="calendar-slot-panel glass-panel">
          <div className="calendar-slot-head">
            <h3>Booked Slots ({items.length})</h3>
            <p>From {startDate} to {endDate}</p>
          </div>

          <div className="calendar-slot-list">
            {items.length === 0 && <p className="muted">No bookings found for this range.</p>}
            {items.map((b) => {
              const start = new Date(b.startTime);
              const end = new Date(b.endTime);
              const sameDay = start.toDateString() === end.toDateString();
              const rangeLabel = sameDay
                ? `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • ${start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                : `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ${start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ${end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

              return (
                <div className="calendar-slot-item" key={b._id}>
                  <div>
                    <strong>{rangeLabel}</strong>
                    <p>{b.userId?.name || 'User'}</p>
                  </div>
                  <span className={`pill ${b.status}`}>{b.status}</span>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}
