import { useState } from 'react';
import { api } from '../api';

export default function Track() {
  const [token, setToken] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  async function go(e) {
    e.preventDefault(); setErr(''); setData(null);
    try { setData(await api(`/issues/track/${token.trim().toUpperCase()}`)); } catch (e2) { setErr(e2.message); }
  }
  return (
    <div className="card narrow">
      <h2>Track your issue</h2>
      <form onSubmit={go} className="row"><input placeholder="ISS-XXXXXXXX" value={token} onChange={(e) => setToken(e.target.value)} required /><button className="primary">Track</button></form>
      {err && <p className="err">{err}</p>}
      {data && (<>
        <h3>{data.title} <span className={`badge ${data.status}`}>{data.status}</span></h3>
        <ul className="timeline">{data.history.map((h, i) => <li key={i}><b>{h.status}</b> {h.note && `- ${h.note}`}<br /><small>{String(h.created_at).replace('T', ' ')}</small></li>)}</ul>
      </>)}
    </div>
  );
}
