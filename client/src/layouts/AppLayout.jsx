import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/* ── Icon map ── */
const icons = {
  Dashboard: '🏠', 'Admin Home': '🏠', Utilities: '⚡', Calendar: '📅',
  Bookings: '📦', 'All Bookings': '📦', Notifications: '🔔', Profile: '👤',
  Users: '👥', Organizations: '🏢', Analytics: '📊', 'Audit Logs': '📋',
  Verification: '🛡️', Settings: '⚙️',
};

const userMainLinks = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/utilities', label: 'Utilities' },
  { path: '/calendar', label: 'Calendar' },
  { path: '/my-bookings', label: 'Bookings' },
];

const userBottomLinks = [
  { path: '/notifications', label: 'Notifications' },
  { path: '/profile', label: 'Profile' },
];

const adminMainLinks = [
  { path: '/admin', label: 'Admin Home' },
  { path: '/admin/utilities', label: 'Utilities' },
  { path: '/admin/bookings', label: 'All Bookings' },
  { path: '/admin/users', label: 'Users' },
  { path: '/admin/organizations', label: 'Organizations' },
];

const adminExtraLinks = [
  { path: '/admin/analytics', label: 'Analytics' },
  { path: '/admin/audit', label: 'Audit Logs' },
  { path: '/verification', label: 'Verification' },
];

const adminBottomLinks = [
  { path: '/notifications', label: 'Notifications' },
  { path: '/profile', label: 'Profile' },
];

function SidebarLink({ link, onClick }) {
  return (
    <NavLink
      to={link.path}
      className={({ isActive }) => `sb-link ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <span className="sb-link-icon">{icons[link.label] || '📄'}</span>
      {link.label}
    </NavLink>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const isAdmin = user?.role === 'org_admin' || user?.role === 'superadmin';
  const mainLinks = isAdmin ? adminMainLinks : userMainLinks;
  const bottomLinks = isAdmin ? adminBottomLinks : userBottomLinks;

  const close = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (user?.name || '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sb-brand">
          <span className="sb-brand-icon">⚡</span>
          <span className="sb-brand-text">UtilityScheduler</span>
        </div>

        {/* Search (visual placeholder) */}
        <div className="sb-search">
          <span className="sb-search-icon">🔍</span>
          <span>Search</span>
        </div>

        {/* Main navigation */}
        <nav className="sb-nav sb-nav-main">
          {mainLinks.map((l) => (
            <SidebarLink key={l.path} link={l} onClick={close} />
          ))}

          {/* Admin: collapsible "More" section */}
          {isAdmin && (
            <>
              <button
                className={`sb-link sb-collapse-btn ${moreOpen ? 'open' : ''}`}
                onClick={() => setMoreOpen((v) => !v)}
              >
                <span className="sb-link-icon">📂</span>
                More
                <span className="sb-chevron">{moreOpen ? '▾' : '▸'}</span>
              </button>
              <div className={`sb-collapse-body ${moreOpen ? 'expanded' : ''}`}>
                {adminExtraLinks.map((l) => (
                  <SidebarLink key={l.path} link={l} onClick={close} />
                ))}
              </div>
            </>
          )}
        </nav>

        {/* Bottom links */}
        <nav className="sb-nav sb-nav-bottom">
          {bottomLinks.map((l) => (
            <SidebarLink key={l.path} link={l} onClick={close} />
          ))}
        </nav>

        {/* User card */}
        <div className="sb-user-card">
          <div className="sb-user-avatar">
            {user?.avatar ? <img src={user.avatar} alt="" /> : <span>{initials}</span>}
          </div>
          <div className="sb-user-info">
            <strong>{user?.name}</strong>
            <span>{user?.role?.replace('_', ' ')}</span>
          </div>
          <button className="sb-logout-btn" onClick={handleLogout} title="Logout">
            ↗
          </button>
        </div>
      </aside>

      {menuOpen && <button className="backdrop" onClick={() => setMenuOpen(false)} aria-label="Close menu" />}

      <div className="main-shell">
        <header className="topbar">
          <button className="btn ghost mobile-only" onClick={() => setMenuOpen((s) => !s)}>☰ Menu</button>
          <p className="muted">Smart booking for shared society resources</p>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
