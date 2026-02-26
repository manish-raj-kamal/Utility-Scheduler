import { useEffect, useState } from 'react';
import { deleteUser, getAllUsers, updateUser } from '../services/api';
import { useWindowWidth } from '../hooks/useWindowWidth';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState('');
  const [form, setForm] = useState({ role: 'member', trustScore: 100, penaltyCount: 0 });
  const isMobile = useWindowWidth() < 640;

  const fetchUsers = () => getAllUsers().then((r) => setUsers(r.data)).catch(() => {});
  useEffect(() => { fetchUsers(); }, []);

  const startEdit = (u) => {
    setEditing(u._id);
    setForm({ role: u.role, trustScore: u.trustScore, penaltyCount: u.penaltyCount });
  };

  return (
    <div>
      <div className="page-head"><h1>Manage Users</h1><p className="muted">Update roles, trust and penalties.</p></div>

      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {users.map((u) => (
            <div key={u._id} className="panel" style={{ padding: '14px 16px' }}>
              <div style={{ marginBottom: 10 }}>
                <strong style={{ fontSize: '1rem', color: '#1e293b' }}>{u.name}</strong>
                <div style={{ fontSize: '0.83rem', color: '#64748b', marginTop: 2 }}>
                  {u.email} · Flat {u.flatNumber}
                </div>
              </div>

              {editing === u._id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  <label className="auth-label" style={{ marginBottom: 0 }}>
                    Role
                    <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                      <option value="member">member</option>
                      <option value="org_admin">org_admin</option>
                      <option value="superadmin">superadmin</option>
                    </select>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <label className="auth-label" style={{ marginBottom: 0 }}>
                      Trust Score
                      <input type="number" value={form.trustScore} onChange={(e) => setForm((p) => ({ ...p, trustScore: Number(e.target.value) }))} />
                    </label>
                    <label className="auth-label" style={{ marginBottom: 0 }}>
                      Penalties
                      <input type="number" value={form.penaltyCount} onChange={(e) => setForm((p) => ({ ...p, penaltyCount: Number(e.target.value) }))} />
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: '0.85rem', flexWrap: 'wrap' }}>
                  <span style={{ color: '#475569' }}>Role: <strong>{u.role}</strong></span>
                  <span style={{ color: '#475569' }}>Trust: <strong>{u.trustScore}</strong></span>
                  <span style={{ color: '#475569' }}>Penalties: <strong>{u.penaltyCount}</strong></span>
                </div>
              )}

              <div className="actions-inline" style={{ paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                {editing === u._id ? (
                  <>
                    <button className="btn primary" onClick={async () => { await updateUser(u._id, form); setEditing(''); fetchUsers(); }}>Save</button>
                    <button className="btn ghost" onClick={() => setEditing('')}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="btn ghost" onClick={() => startEdit(u)}>Edit</button>
                    <button className="btn danger" onClick={async () => { await deleteUser(u._id); fetchUsers(); }}>Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel table-scroll">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Flat</th><th>Role</th><th>Trust</th><th>Penalties</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.flatNumber}</td>
                  <td>{editing === u._id ? (
                    <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                      <option value="member">member</option>
                      <option value="org_admin">org_admin</option>
                      <option value="superadmin">superadmin</option>
                    </select>
                  ) : u.role}</td>
                  <td>{editing === u._id ? (
                    <input type="number" value={form.trustScore} onChange={(e) => setForm((p) => ({ ...p, trustScore: Number(e.target.value) }))} />
                  ) : u.trustScore}</td>
                  <td>{editing === u._id ? (
                    <input type="number" value={form.penaltyCount} onChange={(e) => setForm((p) => ({ ...p, penaltyCount: Number(e.target.value) }))} />
                  ) : u.penaltyCount}</td>
                  <td className="actions-inline">
                    {editing === u._id ? (
                      <>
                        <button className="btn primary" onClick={async () => { await updateUser(u._id, form); setEditing(''); fetchUsers(); }}>Save</button>
                        <button className="btn ghost" onClick={() => setEditing('')}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="btn ghost" onClick={() => startEdit(u)}>Edit</button>
                        <button className="btn danger" onClick={async () => { await deleteUser(u._id); fetchUsers(); }}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

