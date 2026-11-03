import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatStatus } from '../utils';
import IssueCard from './IssueCard';

const LABELS = {
  UNDER_REVIEW: 'Start review', APPROVED: 'Approve', REJECTED: 'Reject', ON_HOLD: 'Put on hold',
  STAFF_ASSIGNED: 'Assign staff', IN_PROGRESS: 'Mark in progress', STAFF_COMPLETED: 'Staff completed work',
  UNDER_VERIFICATION: 'Request verification', RESOLVED: 'Resolve issue',
  'ON_HOLD>UNDER_REVIEW': 'Resume review', 'ON_HOLD>IN_PROGRESS': 'Resume work', 'UNDER_VERIFICATION>IN_PROGRESS': 'Reopen work',
};
const label = (from, to) => LABELS[`${from}>${to}`] || LABELS[to];

export default function ManagementDashboard() {
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // { issue, status|null, staffName, publicNote, internalNote }
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    try { setIssues(await api('/management/issues')); setErr(''); } catch (e) { setErr(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const open = (issue, status) => { setMsg(''); setErr(''); setForm({ issue, status, staffName: '', publicNote: '', internalNote: '' }); };

  async function save(e) {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      await api(`/management/issues/${form.issue.id}/progress`, {
        method: 'POST',
        body: { status: form.status, staffName: form.staffName, publicNote: form.publicNote, internalNote: form.internalNote },
      });
      setMsg(`Issue ${form.issue.token_id} updated.`); setForm(null); await load();
    } catch (e2) { setErr(e2.message); }
    setSaving(false);
  }

  const shown = filter === 'ALL' ? issues : issues.filter((i) => i.status === filter);
  const count = (f) => issues.filter(f).length;
  const closed = ['RESOLVED', 'REJECTED'];

  return (
    <>
      <div className="row between">
        <div><h2 style={{ margin: 0 }}>Management dashboard</h2><p className="muted">Issues reach you directly. Record staff work, update progress and resolve.</p></div>
        <button onClick={load} disabled={loading}>Refresh</button>
      </div>
      {msg && <p className="ok">{msg}</p>}
      {err && !form && <p className="err">{err}</p>}

      <div className="stats">
        {[['Total', issues.length], ['New', count((i) => i.status === 'SENT_TO_MANAGEMENT')], ['Active', count((i) => !closed.includes(i.status))],
          ['In progress', count((i) => i.status === 'IN_PROGRESS')], ['Resolved', count((i) => i.status === 'RESOLVED')]].map(([l, v]) => (
          <div className="stat" key={l}><small>{l}</small><strong>{v}</strong></div>
        ))}
      </div>

      <select style={{ width: 'auto', marginBottom: 12 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="ALL">All statuses</option>
        {[...new Set(issues.map((i) => i.status))].map((s) => <option key={s} value={s}>{formatStatus(s)}</option>)}
      </select>

      {loading ? <p>Loading...</p> : shown.length === 0 ? <p className="muted">No issues found.</p> : shown.map((i) => (
        <IssueCard key={i.id} i={i} historyPath={`/management/issues/${i.id}/updates`}>
          {i.next_statuses.map((s) => (
            <button key={s} className={s === 'REJECTED' ? 'danger' : 'primary'} onClick={() => open(i, s)}>{label(i.status, s)}</button>
          ))}
          <button onClick={() => open(i, null)}>Add remark</button>
        </IssueCard>
      ))}

      {form && (
        <div className="overlay">
          <form className="modal" onSubmit={save}>
            <div className="row between"><h3 style={{ margin: 0 }}>{form.status ? `Update: ${formatStatus(form.status)}` : 'Add remark'}</h3>
              <button type="button" onClick={() => !saving && setForm(null)}>x</button></div>
            <p className="muted">{form.issue.token_id} &middot; currently {formatStatus(form.issue.status)}</p>
            {form.status === 'STAFF_ASSIGNED' && (
              <label>Staff who will do the work *<input value={form.staffName} onChange={(e) => setForm({ ...form, staffName: e.target.value })} required /></label>
            )}
            <label>Public remark (the reporter will see this){form.status === 'REJECTED' ? ' *' : ''}
              <textarea rows="3" maxLength={1000} required={form.status === 'REJECTED'} value={form.publicNote} onChange={(e) => setForm({ ...form, publicNote: e.target.value })} /></label>
            <label>Internal remark (management and admin only)
              <textarea rows="3" maxLength={1000} placeholder="Staff activity, costs, instructions..." value={form.internalNote} onChange={(e) => setForm({ ...form, internalNote: e.target.value })} /></label>
            {err && <p className="err">{err}</p>}
            <div className="row"><button type="button" onClick={() => setForm(null)} disabled={saving}>Cancel</button><button className="primary" disabled={saving}>{saving ? 'Saving...' : 'Save update'}</button></div>
          </form>
        </div>
      )}
    </>
  );
}
