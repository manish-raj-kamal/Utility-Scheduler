import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const userLinks = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/utilities', label: 'Utilities' },
  { path: '/calendar', label: 'Calendar' },
  { path: '/my-bookings', label: 'Bookings' },
  { path: '/notifications', label: 'Notifications' },
  { path: '/profile', label: 'Profile' }
];

const adminLinks = [
  { path: '/admin', label: 'Admin Home' },
  { path: '/admin/utilities', label: 'Utilities' },
  { path: '/admin/bookings', label: 'All Bookings' },
  { path: '/admin/users', label: 'Users' },
  { path: '/admin/organizations', label: 'Organizations' },
  { path: '/admin/analytics', label: 'Analytics' },
  { path: '/admin/audit', label: 'Audit Logs' },
  { path: '/notifications', label: 'Notifications' },
  { path: '/verification', label: 'Verification' },
  { path: '/profile', label: 'Profile' }
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = user?.role === 'org_admin' || user?.role === 'superadmin' ? adminLinks : userLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">Utility Scheduler</div>
        <nav className="nav-list">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
          <button className="btn danger" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      {menuOpen && <button className="backdrop" onClick={() => setMenuOpen(false)} aria-label="Close menu" />}

      <div className="main-shell">
        <header className="topbar">
          <button className="btn ghost mobile-only" onClick={() => setMenuOpen((s) => !s)}>Menu</button>
          <p className="muted">Smart booking for shared society resources</p>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
