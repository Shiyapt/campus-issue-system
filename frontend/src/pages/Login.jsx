import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setAuth } from '../api';

const TABS = {
  Student: { url: '/auth/student', fields: [['usn', 'USN'], ['name', 'Full name'], ['dob', 'Date of birth', 'date'], ['qrCode', 'QR code value']] },
  Staff: { url: '/auth/staff', fields: [['empId', 'Employee ID'], ['name', 'Full name'], ['qrCode', 'QR code value']] },
  Admin: { url: '/auth/login', fields: [['username', 'Username'], ['password', 'Password', 'password']] },
  Management: { url: '/auth/login', fields: [['username', 'Username'], ['password', 'Password', 'password']] },
};
const HOME = { STUDENT: '/report', STAFF: '/report', ADMIN: '/admin', MANAGEMENT: '/management' };

export default function Login() {
  const [tab, setTab] = useState('Student');
  const [form, setForm] = useState({});
  const [err, setErr] = useState('');
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault(); setErr('');
    try {
      const a = await api(TABS[tab].url, { method: 'POST', body: form });
      if (['Admin', 'Management'].includes(tab) && a.role !== tab.toUpperCase()) throw new Error('Wrong portal for this account');
      setAuth(a); nav(HOME[a.role]);
    } catch (e2) { setErr(e2.message); }
  }

  return (
    <div className="card narrow">
      <div className="tabs">{Object.keys(TABS).map((t) => <button key={t} className={t === tab ? 'on' : ''} onClick={() => { setTab(t); setForm({}); setErr(''); }}>{t}</button>)}</div>
      <form onSubmit={submit}>
        {TABS[tab].fields.map(([k, label, type]) => (
          <label key={k}>{label}<input type={type || 'text'} value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required /></label>
        ))}
        {/* For production, plug in a scanner (e.g. html5-qrcode) and set form.qrCode from the scan result */}
        {err && <p className="err">{err}</p>}
        <button className="primary">Verify &amp; continue</button>
      </form>
    </div>
  );
}
