import { useEffect, useState } from 'react';
import { getOrganizations, approveOrganization } from '../services/api';
import { useWindowWidth } from '../hooks/useWindowWidth';

export default function AdminOrganizations() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchOrgs = () => {
    getOrganizations()
      .then((r) => setOrgs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchOrgs, []);

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await approveOrganization(id);
      fetchOrgs();
    } catch { /* ignore */ }
    setActionId(null);
  };

  const levelLabel = (l) => ['Unverified', 'Email Verified', 'Docs Uploaded', 'Approved'][l] || `Level ${l}`;
  const levelPill = (l) => ['', 'pill approved', 'pill waitlist', 'pill approved'][l] || 'pill';
  const isMobile = useWindowWidth() < 640;

  return (
    <div>
      <div className="page-head">
        <h1>Organizations</h1>
        <p className="muted">Manage and approve organization verification.</p>
      </div>

      {loading ? (
        <p className="muted center">Loading…</p>
      ) : orgs.length === 0 ? (
        <p className="muted center">No organizations yet.</p>
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orgs.map((org) => (
            <div key={org._id} className="panel" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <strong style={{ fontSize: '1rem', color: '#1e293b' }}>{org.name}</strong>
                <span className={levelPill(org.verificationLevel)}>{levelLabel(org.verificationLevel)}</span>
              </div>
              <div style={{ fontSize: '0.83rem', color: '#64748b', textTransform: 'capitalize', marginBottom: 4 }}>{org.type}</div>
              {org.contactEmail && <div style={{ fontSize: '0.83rem', color: '#475569' }}>{org.contactEmail}</div>}
              {org.contactPhone && <div style={{ fontSize: '0.83rem', color: '#475569' }}>{org.contactPhone}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Level {org.verificationLevel}</span>
                {org.verificationLevel < 3 ? (
                  <button
                    className="btn primary"
                    onClick={() => handleApprove(org._id)}
                    disabled={actionId === org._id}
                    style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                  >
                    {actionId === org._id ? 'Approving…' : 'Approve'}
                  </button>
                ) : (
                  <span className="pill approved">✓ Approved</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Level</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org._id}>
                  <td><strong>{org.name}</strong></td>
                  <td style={{ textTransform: 'capitalize' }}>{org.type}</td>
                  <td>
                    {org.contactEmail && <span>{org.contactEmail}</span>}
                    {org.contactPhone && <><br />{org.contactPhone}</>}
                  </td>
                  <td>
                    <span className="verify-info-level" style={{ display: 'inline-grid' }}>
                      {org.verificationLevel}
                    </span>
                  </td>
                  <td><span className={levelPill(org.verificationLevel)}>{levelLabel(org.verificationLevel)}</span></td>
                  <td>
                    {org.verificationLevel < 3 ? (
                      <button
                        className="btn primary"
                        onClick={() => handleApprove(org._id)}
                        disabled={actionId === org._id}
                      >
                        {actionId === org._id ? 'Approving…' : 'Approve'}
                      </button>
                    ) : (
                      <span className="pill approved">✓ Approved</span>
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
