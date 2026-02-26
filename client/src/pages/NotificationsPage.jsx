import { useEffect, useMemo, useState } from 'react';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../services/api';

const labelByType = {
  booking: 'Booking',
  payment: 'Payment',
  waitlist: 'Waitlist',
  cancellation: 'Cancellation',
  system: 'System'
};

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);

  const fetchItems = () =>
    getNotifications()
      .then((r) => {
        setItems(r.data);
        window.dispatchEvent(new Event('notifications:updated'));
      })
      .catch(() => {});
  useEffect(() => { fetchItems(); }, []);

  const unread = useMemo(() => items.filter((i) => !i.isRead).length, [items]);
  const todayCount = useMemo(
    () =>
      items.filter((item) => {
        const created = new Date(item.createdAt);
        const now = new Date();
        return created.toDateString() === now.toDateString();
      }).length,
    [items]
  );

  const handleMarkAllRead = async () => {
    setBusy(true);
    try {
      await markAllNotificationsRead();
      await fetchItems();
    } finally {
      setBusy(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (notification.isRead) return;

    setItems((prev) => prev.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item)));
    window.dispatchEvent(new Event('notifications:updated'));

    try {
      await markNotificationRead(notification._id);
      fetchItems();
    } catch {
      fetchItems();
    }
  };

  return (
    <div className="luxe-page notifications-luxe">
      <div className="luxe-ambient" aria-hidden="true">
        <span className="luxe-orb orb-one" />
        <span className="luxe-orb orb-two" />
        <span className="luxe-orb orb-three" />
        <span className="luxe-grid" />
      </div>

      <section className="luxe-hero glass-panel">
        <div className="luxe-hero-copy">
          <p className="luxe-eyebrow">Inbox Center</p>
          <h1>Notifications</h1>
          <p className="muted">Stay updated on bookings, payments, and system activity.</p>
        </div>
        <button className="btn ghost notify-markall-btn" onClick={handleMarkAllRead} disabled={busy || unread === 0}>
          Mark all read
        </button>
      </section>

      <section className="luxe-stat-row">
        <article className="luxe-stat-tile">
          <span>Total</span>
          <strong>{items.length}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Unread</span>
          <strong>{unread}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Today</span>
          <strong>{todayCount}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Action Needed</span>
          <strong>{items.filter((item) => !item.isRead && item.type !== 'system').length}</strong>
        </article>
      </section>

      <section className="notifications-board glass-panel">
        <div className="list-stack">
          {items.length === 0 && <p className="muted">No notifications.</p>}
          {items.map((n) => (
            <button
              key={n._id}
              className={`notification-card ${n.isRead ? 'read' : 'unread'}`}
              onClick={() => handleNotificationClick(n)}
            >
              <div className="notification-card-main">
                <div className="notification-card-head">
                  <strong>{n.title}</strong>
                  <span className="notification-type">{labelByType[n.type] || 'System'}</span>
                </div>
                <p>{n.message}</p>
              </div>
              <div className="notification-side">
                {!n.isRead && <span className="notification-dot" aria-hidden="true" />}
                <span>{new Date(n.createdAt).toLocaleString('en-IN')}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
