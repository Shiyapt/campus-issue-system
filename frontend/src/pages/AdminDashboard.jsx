import { useEffect, useState } from 'react';
import { api } from '../api';
import IssueCard from './IssueCard';

export default function AdminDashboard() {
  const [issues, setIssues] = useState([]);
  const [notes, setNotes] = useState([]);
  const [err, setErr] = useState('');

  const load = () => Promise.all([api('/admin/issues'), api('/admin/notifications')])
    .then(([a, b]) => { setIssues(a); setNotes(b); }).catch((e) => setErr(e.message));
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const act = (id, path, body) => api(`/admin/issues/${id}/${path}`, { method: 'POST', body: body || {} }).then(load).catch((e) => setErr(e.message));
  const reject = (id) => { const reason = prompt('Reason for rejecting (fake request)?'); if (reason) act(id, 'reject', { reason }); };

  return (
    <>
      <h2>Admin dashboard</h2>
      {err && <p className="err">{err}</p>}
      <section className="card">
        <h3>Resolution notifications ({notes.length})</h3>
        {notes.length === 0 ? <p>No notifications yet.</p> : <ul>{notes.map((n) => <li key={n.id}>{n.message} - <small>{String(n.created_at).replace('T', ' ')}</small></li>)}</ul>}
      </section>
      <h3>All submitted issues</h3>
      {issues.map((i) => (
        <IssueCard key={i.id} i={i}>
          {['AI_VERIFIED', 'AI_FLAGGED'].includes(i.status) && (<>
            <button className="primary" onClick={() => act(i.id, 'forward')}>Send to management</button>
            <button className="danger" onClick={() => reject(i.id)}>Reject as fake</button>
          </>)}
        </IssueCard>
      ))}
    </>
  );
}
