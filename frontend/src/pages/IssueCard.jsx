import { useEffect, useState } from 'react';
import { api, fileUrl } from '../api';
import { formatDate, formatStatus } from '../utils';

/** Used by Admin and Management only (shows internal details). historyPath = API path for the full history. */
export default function IssueCard({ i, historyPath, children }) {
  const [open, setOpen] = useState(false);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) return;
    let live = true;
    setLoading(true); setErr('');
    api(historyPath)
      .then((d) => live && setUpdates(Array.isArray(d) ? d : []))
      .catch((e) => live && setErr(e.message))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [open, historyPath, i.status, i.updated_at]);

  return (
    <div className="card">
      <div className="row between">
        <h3 style={{ margin: 0 }}>{i.title || 'Untitled'} <small>({i.token_id})</small></h3>
        <span className={`badge ${i.status}`}>{formatStatus(i.status)}</span>
      </div>
      <p><b>{i.reporter_type}</b>: {i.reporter_name || 'Unknown'} ({i.reporter_id}) &middot; {i.category}</p>
      <p>{i.description}</p>
      {(i.ai_score != null) && <p>AI score: <b>{i.ai_score}</b> - {i.ai_remark}</p>}
      <div className="media">
        {i.selfie_path && <img src={fileUrl(i.selfie_path)} alt="Reporter selfie" />}
        {i.photo_path && <img src={fileUrl(i.photo_path)} alt="Issue evidence" />}
        {i.video_path && <video controls src={fileUrl(i.video_path)} />}
        {i.voice_path && <audio controls src={fileUrl(i.voice_path)} />}
      </div>
      <p className="muted">
        Responsible management: <b>{i.assigned_management || 'Not yet picked up'}</b>
        {' '}&middot; Assigned staff: <b>{i.assigned_to || 'Not assigned'}</b>
        {i.resolved_by_name && <> &middot; Resolved by: <b>{i.resolved_by_name}</b></>}
      </p>
      <div className="row wrap">
        {children}
        <button type="button" onClick={() => setOpen(!open)}>{open ? 'Hide progress history' : 'View progress history'}</button>
      </div>
      {open && (
        <ul className="timeline">
          {loading && <li>Loading history...</li>}
          {err && <li className="err">{err}</li>}
          {!loading && !err && updates.length === 0 && <li>No updates recorded.</li>}
          {updates.map((u) => (
            <li key={u.id}>
              <b>{formatStatus(u.status)}</b>{' '}
              <span className={`vis ${u.visibility}`}>{u.visibility === 'INTERNAL' ? 'Internal' : 'Public'}</span>
              {u.note && <div>{u.note}</div>}
              <small>{u.by_name && `By ${u.by_name} - `}{formatDate(u.created_at)}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
