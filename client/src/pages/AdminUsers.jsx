import { useEffect, useMemo, useState } from 'react';
import { deleteUser, getAllUsers, updateUser } from '../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState('');
  const [busyId, setBusyId] = useState('');
  const [form, setForm] = useState({ role: 'member', trustScore: 100, penaltyCount: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = () => {
    setLoading(true);
    getAllUsers()
      .then((r) => setUsers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const startEdit = (user) => {
    setEditingId(user._id);
    setForm({
      role: user.role,
      trustScore: user.trustScore,
      penaltyCount: user.penaltyCount
    });
  };

  const cancelEdit = () => {
    setEditingId('');
    setForm({ role: 'member', trustScore: 100, penaltyCount: 0 });
  };

  const saveEdit = async (id) => {
    setBusyId(id);
    try {
      await updateUser(id, form);
      cancelEdit();
      fetchUsers();
    } finally {
      setBusyId('');
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    setBusyId(id);
    try {
      await deleteUser(id);
      fetchUsers();
    } finally {
      setBusyId('');
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const roleMatch = roleFilter === 'all' || user.role === roleFilter;
      const searchMatch = !query || `${user.name} ${user.email} ${user.flatNumber}`.toLowerCase().includes(query);
      return roleMatch && searchMatch;
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((user) => user.role === 'org_admin' || user.role === 'superadmin').length,
      members: users.filter((user) => user.role === 'member').length,
      flagged: users.filter((user) => Number(user.penaltyCount) > 0).length
    }),
    [users]
  );

  return (
    <div className="luxe-page admin-ops-page users-admin-page">
      <div className="luxe-ambient" aria-hidden="true">
        <span className="luxe-orb orb-one" />
        <span className="luxe-orb orb-two" />
        <span className="luxe-orb orb-three" />
        <span className="luxe-grid" />
      </div>

      <section className="luxe-hero glass-panel">
        <div className="luxe-hero-copy">
          <p className="luxe-eyebrow">Access Control</p>
          <h1>Manage Users</h1>
          <p className="muted">Update role, trust score, and penalties with full administrative control.</p>
        </div>
        <div className="luxe-hero-actions admin-ops-filters">
          <input
            className="search-input luxe-search"
            placeholder="Search by name, email, flat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="search-input luxe-search" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All roles</option>
            <option value="member">Member</option>
            <option value="org_admin">Org admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>
      </section>

      <section className="luxe-stat-row admin-ops-stat-row">
        <article className="luxe-stat-tile">
          <span>Total Users</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Admins</span>
          <strong>{stats.admins}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Members</span>
          <strong>{stats.members}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Flagged Accounts</span>
          <strong>{stats.flagged}</strong>
        </article>
      </section>

      <section className="admin-ops-board glass-panel">
        <div className="admin-ops-board-head">
          <h3>User Directory ({filtered.length})</h3>
        </div>

        {loading ? (
          <p className="muted center">Loading users...</p>
        ) : filtered.length === 0 ? (
          <p className="muted center">No users match this filter.</p>
        ) : (
          <div className="admin-entity-grid">
            {filtered.map((user) => (
              <article className="admin-entity-card" key={user._id}>
                <div className="admin-entity-head">
                  <strong>{user.name}</strong>
                  <span className="pill">{user.role}</span>
                </div>

                <div className="admin-entity-meta">
                  <span>{user.email}</span>
                  <span>Flat {user.flatNumber || '-'}</span>
                </div>

                {editingId === user._id ? (
                  <div className="admin-inline-form">
                    <label>Role
                      <select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}>
                        <option value="member">member</option>
                        <option value="org_admin">org_admin</option>
                        <option value="superadmin">superadmin</option>
                      </select>
                    </label>
                    <label>Trust Score
                      <input
                        type="number"
                        value={form.trustScore}
                        onChange={(e) => setForm((prev) => ({ ...prev, trustScore: Number(e.target.value) }))}
                      />
                    </label>
                    <label>Penalties
                      <input
                        type="number"
                        value={form.penaltyCount}
                        onChange={(e) => setForm((prev) => ({ ...prev, penaltyCount: Number(e.target.value) }))}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="admin-entity-meta compact">
                    <span>Trust: <strong>{user.trustScore}</strong></span>
                    <span>Penalties: <strong>{user.penaltyCount}</strong></span>
                  </div>
                )}

                <div className="admin-entity-actions">
                  {editingId === user._id ? (
                    <>
                      <button className="btn primary" onClick={() => saveEdit(user._id)} disabled={busyId === user._id}>
                        {busyId === user._id ? 'Saving...' : 'Save'}
                      </button>
                      <button className="btn ghost" onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn ghost" onClick={() => startEdit(user)}>Edit</button>
                      <button className="btn danger" onClick={() => onDelete(user._id)} disabled={busyId === user._id}>
                        {busyId === user._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
