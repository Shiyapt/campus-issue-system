import { useRef, useState } from 'react';
import { api } from '../api';

const CATEGORIES = ['Infrastructure', 'Hostel', 'Canteen', 'Academic', 'Electrical', 'Plumbing', 'Other'];

export default function ReportIssue() {
  const [f, setF] = useState({ title: '', category: CATEGORIES[0], description: '' });
  const [files, setFiles] = useState({});
  const [voice, setVoice] = useState(null);
  const [recording, setRecording] = useState(false);
  const [done, setDone] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const recRef = useRef();

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream); const chunks = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => { setVoice(new Blob(chunks, { type: 'audio/webm' })); stream.getTracks().forEach((t) => t.stop()); };
      mr.start(); recRef.current = mr; setRecording(true);
    } catch { setErr('Microphone permission denied'); }
  }
  const stopRec = () => { recRef.current?.stop(); setRecording(false); };

  async function submit(e) {
    e.preventDefault(); setErr('');
    if (!files.selfie || !files.video) return setErr('Selfie and video are required');
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.append(k, v));
    ['selfie', 'video', 'photo'].forEach((k) => files[k] && fd.append(k, files[k]));
    if (voice) fd.append('voice', voice, 'voice.webm');
    setBusy(true);
    try { setDone(await api('/issues', { method: 'POST', form: fd })); }
    catch (e2) { setErr(e2.message); }
    setBusy(false);
  }

  if (done) return (
    <div className="card narrow center">
      <h2>Issue submitted</h2>
      <p>Your tracking token:</p>
      <h1 className="token">{done.tokenId}</h1>
      <p>Save it and use the <b>Track issue</b> page to follow progress.</p>
    </div>
  );

  const pick = (k) => (e) => setFiles({ ...files, [k]: e.target.files[0] });
  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>Report an issue</h2>
      <label>Title<input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required /></label>
      <label>Category<select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label>Description<textarea rows="4" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} required /></label>
      <label>Selfie * <input type="file" accept="image/*" capture="user" onChange={pick('selfie')} /></label>
      <label>Video * <input type="file" accept="video/*" capture="environment" onChange={pick('video')} /></label>
      <label>Photo (optional)<input type="file" accept="image/*" onChange={pick('photo')} /></label>
      <div className="voice">
        <span>Voice note (optional)</span>
        {!recording ? <button type="button" onClick={startRec}>● Record</button> : <button type="button" className="danger" onClick={stopRec}>■ Stop</button>}
        {voice && !recording && <audio controls src={URL.createObjectURL(voice)} />}
      </div>
      {err && <p className="err">{err}</p>}
      <button className="primary" disabled={busy}>{busy ? 'Submitting...' : 'Submit issue'}</button>
    </form>
  );
}
