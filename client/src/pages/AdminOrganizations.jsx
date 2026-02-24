import { useEffect, useState } from 'react';
import { getOrganizations, approveOrganization } from '../services/api';

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
