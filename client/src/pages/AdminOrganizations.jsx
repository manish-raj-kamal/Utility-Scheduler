import { useEffect, useMemo, useState } from 'react';
import { approveOrganization, getOrganizations } from '../services/api';

const levelLabel = (level) =>
  ['Unverified', 'Email Verified', 'Docs Uploaded', 'Approved'][level] || `Level ${level}`;

const levelPillClass = (level) =>
  ({
    0: 'pill rejected',
    1: 'pill pending',
    2: 'pill waitlist',
    3: 'pill approved'
  }[level] || 'pill');

const formatType = (value = '') =>
  String(value).replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export default function AdminOrganizations() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const fetchOrgs = () => {
    setLoading(true);
    getOrganizations()
      .then((r) => setOrgs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchOrgs(), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await approveOrganization(id);
      fetchOrgs();
    } catch {}
    setActionId('');
  };

  const filtered = useMemo(() => {
    if (levelFilter === 'all') return orgs;
    return orgs.filter((org) => String(org.verificationLevel) === levelFilter);
  }, [orgs, levelFilter]);

  const stats = useMemo(
    () => ({
      total: orgs.length,
      pendingApproval: orgs.filter((org) => org.verificationLevel < 3).length,
      approved: orgs.filter((org) => org.verificationLevel === 3).length,
      withContact: orgs.filter((org) => org.contactEmail || org.contactPhone).length
    }),
    [orgs]
  );

  return (
    <div className="luxe-page admin-ops-page org-admin-page">
      <div className="luxe-ambient" aria-hidden="true">
        <span className="luxe-orb orb-one" />
        <span className="luxe-orb orb-two" />
        <span className="luxe-orb orb-three" />
        <span className="luxe-grid" />
      </div>

      <section className="luxe-hero glass-panel">
        <div className="luxe-hero-copy">
          <p className="luxe-eyebrow">Superadmin Console</p>
          <h1>Organizations</h1>
          <p className="muted">Review verification progress and approve organizations when ready.</p>
        </div>
        <div className="luxe-hero-actions">
          <select className="search-input luxe-search" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
            <option value="all">All levels</option>
            <option value="0">Level 0 - Unverified</option>
            <option value="1">Level 1 - Email Verified</option>
            <option value="2">Level 2 - Docs Uploaded</option>
            <option value="3">Level 3 - Approved</option>
          </select>
        </div>
      </section>

      <section className="luxe-stat-row admin-ops-stat-row">
        <article className="luxe-stat-tile">
          <span>Total Organizations</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Pending Approval</span>
          <strong>{stats.pendingApproval}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Approved</span>
          <strong>{stats.approved}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>With Contact Info</span>
          <strong>{stats.withContact}</strong>
        </article>
      </section>

      <section className="admin-ops-board glass-panel">
        <div className="admin-ops-board-head">
          <h3>Verification Queue ({filtered.length})</h3>
        </div>

        {loading ? (
          <p className="muted center">Loading organizations...</p>
        ) : filtered.length === 0 ? (
          <p className="muted center">No organizations match this filter.</p>
        ) : (
          <div className="admin-entity-grid">
            {filtered.map((org) => (
              <article className="admin-entity-card" key={org._id}>
                <div className="admin-entity-head">
                  <strong>{org.name}</strong>
                  <span className={levelPillClass(org.verificationLevel)}>{levelLabel(org.verificationLevel)}</span>
                </div>

                <p className="admin-entity-sub">{formatType(org.type)}</p>

                <div className="admin-entity-meta">
                  <span>{org.contactEmail || 'No email added'}</span>
                  <span>{org.contactPhone || 'No phone added'}</span>
                </div>

                <div className="admin-level-meter">
                  <span style={{ width: `${Math.max(0, Math.min(100, (org.verificationLevel / 3) * 100))}%` }} />
                </div>

                <div className="admin-entity-actions">
                  {org.verificationLevel < 3 ? (
                    <button
                      className="btn primary"
                      onClick={() => handleApprove(org._id)}
                      disabled={actionId === org._id}
                    >
                      {actionId === org._id ? 'Approving...' : 'Approve'}
                    </button>
                  ) : (
                    <span className="pill approved">Verified</span>
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
