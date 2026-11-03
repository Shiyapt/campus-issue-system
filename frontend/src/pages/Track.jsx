import { useState } from 'react';
import { api } from '../api';
import { formatDate, formatStatus } from '../utils';

export default function Track() {
  const [token, setToken] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function go(e) {
    e.preventDefault(); setErr(''); setData(null); setLoading(true);
    try { setData(await api(`/issues/track/${encodeURIComponent(token.trim().toUpperCase())}`)); }
    catch (e2) { setErr(e2.message || 'Unable to track this issue.'); }
    setLoading(false);
  }

  return (
    <div className="card narrow">
      <h2>Track your issue</h2>
      <p className="muted">Enter the tracking ID you received when you reported the issue.</p>
      <form onSubmit={go} className="row">
        <input placeholder="ISS-XXXXXXXX" value={token} onChange={(e) => setToken(e.target.value)} required />
        <button className="primary" disabled={loading}>{loading ? 'Tracking...' : 'Track'}</button>
      </form>
      {err && <p className="err">{err}</p>}
      {data && (
        <>
          <div className="row between" style={{ marginTop: 16 }}>
            <h3 style={{ margin: 0 }}>{data.title}</h3>
            <span className={`badge ${data.status}`}>{formatStatus(data.status)}</span>
          </div>
          <ul className="timeline">
            {data.history.length === 0 && <li>No updates yet.</li>}
            {data.history.map((h) => (
              <li key={h.id}>
                <b>{formatStatus(h.status)}</b>
                {h.note && <div>{h.note}</div>}
                <small>{formatDate(h.created_at)}</small>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
