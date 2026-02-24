import { useEffect, useState } from 'react';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../services/api';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);

  const fetchItems = () => getNotifications().then((r) => setItems(r.data)).catch(() => {});
  useEffect(() => { fetchItems(); }, []);

  const unread = items.filter((i) => !i.isRead).length;

  return (
    <div>
      <div className="page-head split">
        <div>
          <h1>Notifications</h1>
          <p className="muted">{unread} unread updates.</p>
        </div>
        <button className="btn ghost" onClick={async () => { await markAllNotificationsRead(); fetchItems(); }}>
          Mark all read
        </button>
      </div>

      <div className="panel">
        <div className="list-stack">
          {items.length === 0 && <p className="muted">No notifications.</p>}
          {items.map((n) => (
            <button
              key={n._id}
              className={`list-item ${n.isRead ? 'read' : 'unread'}`}
              onClick={async () => { if (!n.isRead) { await markNotificationRead(n._id); fetchItems(); } }}
            >
              <div>
                <strong>{n.title}</strong>
                <p>{n.message}</p>
              </div>
              <span>{new Date(n.createdAt).toLocaleString('en-IN')}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
