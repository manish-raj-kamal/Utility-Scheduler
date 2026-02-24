import { useEffect, useState } from 'react';
import { getAuditLogs } from '../services/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    getAuditLogs().then((r) => setLogs(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-head"><h1>Audit Logs</h1><p className="muted">Immutable log of admin actions.</p></div>
      <div className="panel table-scroll">
        <table className="table">
          <thead><tr><th>Time</th><th>Action</th><th>By</th><th>Details</th></tr></thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td>{new Date(log.timestamp).toLocaleString('en-IN')}</td>
                <td>{log.action}</td>
                <td>{log.performedBy?.name || 'System'}</td>
                <td>{JSON.stringify(log.details)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
