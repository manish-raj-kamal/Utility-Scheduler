import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteMyAccount, updateMyProfile, uploadMyAvatar } from '../services/api';
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
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [name, setName] = useState(user?.name || '');
  const [orgName, setOrgName] = useState(user?.organizationName || '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const role = roleLabels[user?.role] || roleLabels.member;

  const initials = useMemo(() =>
    (user?.name || '')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2), [user?.name]
  );

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      await updateMyProfile({
        name,
        ...(user?.role === 'org_admin' ? { orgName } : {})
      });
      await refreshUser();
      flash('Profile updated');
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setBusy(true);
    try {
      await uploadMyAvatar(formData);
      await refreshUser();
      flash('Profile photo updated');
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to upload photo', 'error');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDeleteAccount = async () => {
    const ok = window.confirm('Delete your account permanently? This cannot be undone.');
    if (!ok) return;

    setBusy(true);
    try {
      await deleteMyAccount();
      logout();
      navigate('/login');
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to delete account', 'error');
      setBusy(false);
    }
  };

  return (
    <div className="profile-page">
      {msg.text && <p className={`error-banner ${msg.type === 'error' ? '' : 'success'}`}>{msg.text}</p>}

      <div className="profile-glass-card">
        <div className="profile-glass-bg" />

        <div className="profile-header">
          <div className="profile-avatar-ring">
            <div className="profile-avatar">
              {user?.avatar ? <img src={user.avatar} alt={user.name} /> : <span>{initials}</span>}
            </div>
          </div>

          <div className="profile-identity">
            <h1 className="profile-name">{user?.name}</h1>
            <p className="profile-email">{user?.email}</p>
            <span className="profile-role-badge" style={{ color: role.color, background: role.bg }}>
              {role.label}
            </span>
            {user?.role === 'org_admin' && (
              <p className="muted" style={{ marginTop: 8 }}>
                {user?.organizationName || 'Organization'} {user?.organizationCode ? `• ID ${user.organizationCode}` : ''}
              </p>
            )}
          </div>
        </div>

        <div className="profile-info-row">
          <div className="profile-chip">
            <W8Icon name="calendar" size={22} alt="joined" className="profile-chip-icon" />
            <div>
              <small>Joined</small>
              <strong>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</strong>
            </div>
          </div>
          {user?.role === 'org_admin' && (
            <div className="profile-chip">
              <W8Icon name="organizations" size={22} alt="org" className="profile-chip-icon" />
              <div>
                <small>Organization ID</small>
                <strong>{user?.organizationCode || '—'}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 12 }}>Edit Profile</h3>
        <div className="auth-row">
          <label className="auth-label">
            Admin name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          {user?.role === 'org_admin' && (
            <label className="auth-label">
              Organization name
              <input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </label>
          )}
        </div>

        <div className="actions-inline" style={{ marginTop: 12 }}>
          <button className="btn primary" disabled={busy} onClick={handleSave}>Save Changes</button>
          <button className="btn ghost" disabled={busy} onClick={() => fileRef.current?.click()}>Change Profile Photo</button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarUpload}
          />
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 8 }}>Danger Zone</h3>
        <p className="muted" style={{ marginBottom: 12 }}>
          Deleting account removes profile photo from Cloudinary and deletes your user account.
        </p>
        <button className="btn" style={{ background: '#fee2e2', color: '#b91c1c' }} onClick={handleDeleteAccount} disabled={busy}>
          Delete Account
        </button>
      </div>

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
