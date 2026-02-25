import { useAuth } from '../context/AuthContext';
import W8Icon from '../components/W8Icon';

const roleLabels = {
  superadmin: { label: 'Super Admin', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  org_admin: { label: 'Org Admin', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  member: { label: 'Member', color: '#2f6fed', bg: 'rgba(47,111,237,0.12)' },
};

const statItems = [
  { key: 'trustScore', label: 'Trust Score', iconName: 'shield', suffix: '/100', color: '#22c55e' },
  { key: 'totalUsageHours', label: 'Usage Hours', iconName: 'clock', suffix: 'h', color: '#3b82f6' },
  { key: 'penaltyCount', label: 'Penalties', iconName: 'verification', suffix: '', color: '#ef4444' },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const role = roleLabels[user?.role] || roleLabels.member;
  const initials = (user?.name || '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="profile-page">
      {/* Glass hero card */}
      <div className="profile-glass-card">
        <div className="profile-glass-bg" />

        <div className="profile-header">
          <div className="profile-avatar-ring">
            <div className="profile-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          </div>

          <div className="profile-identity">
            <h1 className="profile-name">{user?.name}</h1>
            <p className="profile-email">{user?.email}</p>
            <span className="profile-role-badge" style={{ color: role.color, background: role.bg }}>
              {role.label}
            </span>
          </div>
        </div>

        {/* Info chips */}
        <div className="profile-info-row">
          {user?.flatNumber && (
            <div className="profile-chip">
              <W8Icon name="home" size={22} alt="flat" className="profile-chip-icon" />
              <div>
                <small>Flat / Unit</small>
                <strong>{user.flatNumber}</strong>
              </div>
            </div>
          )}
          {user?.phone && (
            <div className="profile-chip">
              <W8Icon name="phone" size={22} alt="phone" className="profile-chip-icon" />
              <div>
                <small>Phone</small>
                <strong>{user.phone}</strong>
              </div>
            </div>
          )}
          <div className="profile-chip">
            <W8Icon name="calendar" size={22} alt="joined" className="profile-chip-icon" />
            <div>
              <small>Joined</small>
              <strong>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="profile-stats-row">
        {statItems.map((s) => (
          <div className="profile-stat-card" key={s.key}>
            <div className="profile-stat-icon" style={{ background: `${s.color}18` }}>
              <W8Icon name={s.iconName} size={28} alt={s.label} />
            </div>
            <div className="profile-stat-info">
              <span className="profile-stat-label">{s.label}</span>
              <strong className="profile-stat-value" style={{ color: s.color }}>
                {user?.[s.key] ?? 0}{s.suffix}
              </strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
