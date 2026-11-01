import { useEffect, useState } from 'react';
import { api } from '../api';
import IssueCard from './IssueCard';

const LABEL = { SENT_TO_MANAGEMENT: 'Mark verified', VERIFIED: 'Send request to staff', STAFF_REQUESTED: 'Mark resolved' };

export default function ManagementDashboard() {
  const [issues, setIssues] = useState([]);
  const [err, setErr] = useState('');
  const load = () => api('/management/issues').then(setIssues).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  function progress(i) {
    const body = {};
    if (i.status === 'VERIFIED') { body.staffName = prompt('Name of the staff member to assign?'); if (!body.staffName) return; }
    api(`/management/issues/${i.id}/progress`, { method: 'POST', body }).then(load).catch((e) => setErr(e.message));
  }

  return (
    <>
      <h2>Management portal</h2>
      <p>Pipeline: verify &rarr; send request to staff &rarr; resolve</p>
      {err && <p className="err">{err}</p>}
      {issues.length === 0 && <p>No jobs assigned by admin yet.</p>}
      {issues.map((i) => (
        <IssueCard key={i.id} i={i}>
          {LABEL[i.status] && <button className="primary" onClick={() => progress(i)}>{LABEL[i.status]}</button>}
        </IssueCard>
      ))}
    </>
  );
}
