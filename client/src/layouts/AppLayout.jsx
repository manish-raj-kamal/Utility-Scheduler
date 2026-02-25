import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import W8Icon from '../components/W8Icon';

/* ── Icon name map (maps nav label → W8Icon name key) ── */
const navIconNames = {
  Dashboard: 'home', 'Admin Home': 'admin', Utilities: 'utilities',
  Calendar: 'calendar', Bookings: 'bookings', 'All Bookings': 'bookings',
  Notifications: 'notifications', Profile: 'profile',
  Users: 'users', Organizations: 'organizations',
  Analytics: 'analytics', 'Audit Logs': 'audit',
  Verification: 'verification', Settings: 'settings',
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

/* Org Admin: manage utilities, bookings, members, org analytics */
const orgAdminMainLinks = [
  { path: '/admin', label: 'Admin Home' },
  { path: '/admin/utilities', label: 'Utilities' },
  { path: '/admin/bookings', label: 'All Bookings' },
  { path: '/admin/users', label: 'Users' },
];

const orgAdminExtraLinks = [
  { path: '/admin/analytics', label: 'Analytics' },
];

/* Superadmin: organisations, approve org, platform analytics, audit */
const superAdminMainLinks = [
  { path: '/admin', label: 'Admin Home' },
  { path: '/admin/organizations', label: 'Organizations' },
  { path: '/verification', label: 'Verification' },
];

const superAdminExtraLinks = [
  { path: '/admin/analytics', label: 'Analytics' },
  { path: '/admin/audit', label: 'Audit Logs' },
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
      <W8Icon name={navIconNames[link.label] || 'home'} size={22} alt={link.label} className="sb-link-icon" />
      {link.label}
    </NavLink>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const isSuperadmin = user?.role === 'superadmin';
  const isOrgAdmin = user?.role === 'org_admin';
  const isAdmin = isOrgAdmin || isSuperadmin;
  const mainLinks = isSuperadmin ? superAdminMainLinks : isOrgAdmin ? orgAdminMainLinks : userMainLinks;
  const extraLinks = isSuperadmin ? superAdminExtraLinks : orgAdminExtraLinks;
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
          <W8Icon name="utilities" size={26} alt="lightning" className="sb-brand-icon" />
          <span className="sb-brand-text">UtilityScheduler</span>
        </div>

        {/* Search (visual placeholder) */}
        <div className="sb-search">
          <W8Icon name="search" size={18} alt="search" className="sb-search-icon" />
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
                <W8Icon name="folder" size={22} alt="more" className="sb-link-icon" />
                More
                <span className="sb-chevron">{moreOpen ? '▾' : '▸'}</span>
              </button>
              <div className={`sb-collapse-body ${moreOpen ? 'expanded' : ''}`}>
                {extraLinks.map((l) => (
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
