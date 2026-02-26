import { useEffect, useMemo, useState } from 'react';
import { getAuditLogs } from '../services/api';

const formatTime = (value) =>
  new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'medium'
  });

const pretty = (value) => {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch {
    return '{}';
  }
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all');
  const [role, setRole] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      getAuditLogs({
        q: search || undefined,
        severity: severity === 'all' ? undefined : severity,
        actorRole: role === 'all' ? undefined : role,
        limit: 300
      })
        .then((r) => setLogs(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 0);

    return () => clearTimeout(timer);
  }, [search, severity, role]);

  const stats = useMemo(
    () => ({
      total: logs.length,
      critical: logs.filter((log) => log.severity === 'critical').length,
      warnings: logs.filter((log) => log.severity === 'warning').length,
      uniqueActors: new Set(logs.map((log) => log.performedBy?._id || log.actorEmail || 'system')).size
    }),
    [logs]
  );

  return (
    <div className="audit-dev-page">
      <div className="audit-dev-bg" aria-hidden="true" />

      <section className="audit-dev-hero">
        <div>
          <p className="audit-dev-eyebrow">Developer Security Feed</p>
          <h1>Audit Logs</h1>
          <p>Deep visibility into privileged actions with request metadata and execution context.</p>
        </div>
        <div className="audit-dev-filters">
          <input
            className="search-input"
            value={search}
            placeholder="Search action, path, ip, actor"
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="search-input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="all">All severity</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <select className="search-input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="all">All roles</option>
            <option value="superadmin">Superadmin</option>
            <option value="org_admin">Org Admin</option>
            <option value="member">Member</option>
          </select>
        </div>
      </section>

      <section className="audit-dev-stats">
        <article><span>Total Events</span><strong>{stats.total}</strong></article>
        <article><span>Critical</span><strong>{stats.critical}</strong></article>
        <article><span>Warnings</span><strong>{stats.warnings}</strong></article>
        <article><span>Unique Actors</span><strong>{stats.uniqueActors}</strong></article>
      </section>

      <section className="audit-dev-board">
        {loading ? (
          <p className="muted center">Loading audit stream...</p>
        ) : logs.length === 0 ? (
          <p className="muted center">No logs found for the selected filter.</p>
        ) : (
          <div className="audit-log-list">
            {logs.map((log) => (
              <article className={`audit-log-card severity-${log.severity || 'info'}`} key={log._id}>
                <div className="audit-log-head">
                  <strong>{log.action}</strong>
                  <span>{formatTime(log.timestamp)}</span>
                </div>

                <div className="audit-log-meta">
                  <span>actor={log.performedBy?.email || log.actorEmail || 'system'}</span>
                  <span>role={log.performedBy?.role || log.actorRole || 'unknown'}</span>
                  <span>ip={log.ipAddress || '-'}</span>
                  <span>method={log.requestMethod || '-'}</span>
                  <span>status={log.responseStatus ?? '-'}</span>
                  <span>requestId={log.requestId || '-'}</span>
                </div>

                <div className="audit-log-path">{log.requestPath || '/'}</div>
                <pre className="audit-log-json">{pretty(log.details)}</pre>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
