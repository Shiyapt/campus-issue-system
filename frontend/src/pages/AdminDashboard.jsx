import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { formatDate, formatStatus } from '../utils';
import IssueCard from './IssueCard';

const CLOSED = ['RESOLVED', 'REJECTED'];

export default function AdminDashboard() {
  const [issues, setIssues] = useState([]);
  const [notes, setNotes] = useState([]);
  const [report, setReport] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setErr('');
      const [a, b, c] = await Promise.all([api('/admin/issues'), api('/admin/notifications'), api('/admin/report')]);
      setIssues(a); setNotes(b); setReport(c);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const stats = useMemo(() => ({
    total: issues.length,
    active: issues.filter((i) => !CLOSED.includes(i.status)).length,
    hold: issues.filter((i) => i.status === 'ON_HOLD').length,
    resolved: issues.filter((i) => i.status === 'RESOLVED').length,
    rejected: issues.filter((i) => i.status === 'REJECTED').length,
  }), [issues]);

  const statuses = [...new Set(issues.map((i) => i.status))];
  const shown = filter === 'ALL' ? issues : issues.filter((i) => i.status === filter);

  return (
    <>
      <div className="row between">
        <div><h2 style={{ margin: 0 }}>Admin dashboard</h2><p className="muted">College-wide monitoring (read-only).</p></div>
        <button onClick={load}>Refresh</button>
      </div>
      {err && <p className="err">{err}</p>}

      <div className="stats">
        {[['Total', stats.total], ['Active', stats.active], ['On hold', stats.hold], ['Resolved', stats.resolved], ['Rejected', stats.rejected]].map(([l, v]) => (
          <div className="stat" key={l}><small>{l}</small><strong>{v}</strong></div>
        ))}
      </div>

      {report && (
        <section className="card">
          <h3>Reports</h3>
          <div className="reports">
            <div><b>By category</b>{report.byCategory.map((r) => <div className="rrow" key={r.category}><span>{r.category}</span><b>{r.count}</b></div>)}</div>
            <div><b>By status</b>{report.byStatus.map((r) => <div className="rrow" key={r.status}><span>{formatStatus(r.status)}</span><b>{r.count}</b></div>)}</div>
            <div><b>By management</b>{report.byManagement.map((r) => <div className="rrow" key={r.name}><span>{r.name}</span><b>{r.count}</b></div>)}</div>
          </div>
        </section>
      )}

      <section className="card">
        <h3>Resolution notifications ({notes.length})</h3>
        {notes.length === 0 ? <p className="muted">None yet.</p> : <ul>{notes.map((n) => <li key={n.id}>{n.message} - <small>{formatDate(n.created_at)}</small></li>)}</ul>}
      </section>

      <div className="row between">
        <h3>All issues</h3>
        <select style={{ width: 'auto' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="ALL">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{formatStatus(s)}</option>)}
        </select>
      </div>
      {loading ? <p>Loading...</p> : shown.length === 0 ? <p className="muted">No issues in this category.</p>
        : shown.map((i) => <IssueCard key={i.id} i={i} historyPath={`/admin/issues/${i.id}/updates`} />)}
    </>
  );
}
