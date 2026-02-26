import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import W8Icon from '../components/W8Icon';
import Logo from '../components/Logo';
import { getNotifications } from '../services/api';

/* ── Icon name map (maps nav label → W8Icon name key) ── */
const navIconNames = {
  Dashboard: 'home', 'Admin Home': 'admin', Utilities: 'utilities',
  Calendar: 'calendar', Bookings: 'bookings', 'All Bookings': 'bookings',
  Notifications: 'notifications', Profile: 'profile',
  Users: 'users', Organizations: 'organizations',
  Analytics: 'analytics', 'Audit Logs': 'audit',
  'Join Organization': 'verification',
  Organization: 'verification', Settings: 'settings',
};

const userMainLinks = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/utilities', label: 'Utilities' },
  { path: '/calendar', label: 'Calendar' },
  { path: '/my-bookings', label: 'Bookings' },
  { path: '/verification', label: 'Organization' },
];

const userBottomLinks = [
  { path: '/notifications', label: 'Notifications' },
  { path: '/profile', label: 'Profile' },
];

const noOrgLinks = [
  { path: '/verification', label: 'Organization' },
];

/* Org Admin: manage utilities, bookings, members, org analytics */
const orgAdminMainLinks = [
  { path: '/admin', label: 'Admin Home' },
  { path: '/admin/utilities', label: 'Utilities' },
  { path: '/admin/bookings', label: 'All Bookings' },
  { path: '/admin/users', label: 'Users' },
];

const orgAdminExtraLinks = [
  { path: '/verification', label: 'Organization' },
  { path: '/admin/analytics', label: 'Analytics' },
];

/* Superadmin: organisations, approve org, platform analytics, audit */
const superAdminMainLinks = [
  { path: '/admin', label: 'Admin Home' },
  { path: '/admin/organizations', label: 'Organizations' },
];

const superAdminExtraLinks = [
  { path: '/admin/analytics', label: 'Analytics' },
  { path: '/admin/audit', label: 'Audit Logs' },
];

const adminBottomLinks = [
  { path: '/notifications', label: 'Notifications' },
  { path: '/profile', label: 'Profile' },
];

function SidebarLink({ link, onClick, showUnreadDot = false }) {
  return (
    <NavLink
      to={link.path}
      className={({ isActive }) => `sb-link ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <W8Icon name={navIconNames[link.label] || 'home'} size={22} alt={link.label} className="sb-link-icon" />
      <span className="sb-link-label">{link.label}</span>
      {showUnreadDot && <span className="sb-notify-dot" aria-label="Unread notifications" />}
    </NavLink>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const isSuperadmin = user?.role === 'superadmin';
  const isOrgAdmin = user?.role === 'org_admin';
  const isAdmin = isOrgAdmin || isSuperadmin;
  const hasOrganization = Boolean(user?.organizationId) || isSuperadmin;
  const mainLinks = !hasOrganization
    ? noOrgLinks
    : isSuperadmin
      ? superAdminMainLinks
      : isOrgAdmin
        ? orgAdminMainLinks
        : userMainLinks;
  const extraLinks = !hasOrganization
    ? []
    : isSuperadmin
      ? superAdminExtraLinks
      : orgAdminExtraLinks;
  const bottomLinks = isAdmin ? adminBottomLinks : userBottomLinks;

  const close = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSidebarSearch = (e) => {
    e.preventDefault();
    const query = sidebarSearch.trim();
    if (!query) return;
    navigate(`/verification?q=${encodeURIComponent(query)}`);
    close();
  };

  const initials = (user?.name || '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const refreshNotificationDot = useCallback(() => {
    if (!user) {
      setHasUnreadNotifications(false);
      return;
    }

    getNotifications()
      .then((r) => setHasUnreadNotifications(r.data.some((item) => !item.isRead)))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;

    const onNotificationsUpdated = () => refreshNotificationDot();
    window.addEventListener('notifications:updated', onNotificationsUpdated);
    const bootstrapTimer = setTimeout(() => refreshNotificationDot(), 0);
    const intervalId = setInterval(refreshNotificationDot, 30000);

    return () => {
      clearTimeout(bootstrapTimer);
      window.removeEventListener('notifications:updated', onNotificationsUpdated);
      clearInterval(intervalId);
    };
  }, [user, refreshNotificationDot, location.pathname]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sb-brand">
          <Logo size={28} />
          <span className="sb-brand-text" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>FairSlot</span>
        </div>

        {/* Search (visual placeholder) */}
        <form className="sb-search" onSubmit={handleSidebarSearch}>
          <W8Icon name="search" size={18} alt="search" className="sb-search-icon" />
          <input
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            placeholder="Search Org"
            aria-label="Search organization"
          />
        </form>

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
            <SidebarLink
              key={l.path}
              link={l}
              onClick={close}
              showUnreadDot={l.path === '/notifications' && hasUnreadNotifications}
            />
          ))}
        </nav>

        {/* User card */}
        <div className="sb-user-card">
          <div className="sb-user-avatar">
            {user?.avatar ? <img src={user.avatar} alt="" /> : <span>{initials}</span>}
          </div>
          <div className="sb-user-info">
            <strong>{user?.name}</strong>
            <span style={{ opacity: 0.8, fontSize: '0.8em' }}>{user?.role === 'org_admin' ? 'Organization Admin' : 'Member'}</span>

            {/* Always show Org Name + ID if available */}
            {(user?.organizationName || user?.organizationCode) && (
              <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.75em', opacity: 0.9 }}>
                {user.organizationName && <span style={{ fontWeight: 600 }}>{user.organizationName}</span>}
                {user.organizationCode && <span>ID: {user.organizationCode}</span>}
              </div>
            )}
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
          {user?.role === 'org_admin' && (user?.organizationName || user?.organizationCode) && (
            <p className="muted" style={{ marginLeft: 'auto' }}>
              {user.organizationName || 'Organization'} {user.organizationCode ? `• ID ${user.organizationCode}` : ''}
            </p>
          )}
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
