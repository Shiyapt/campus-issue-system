import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { getAuth, setAuth } from './api';
import Login from './pages/Login';
import ReportIssue from './pages/ReportIssue';
import Track from './pages/Track';
import AdminDashboard from './pages/AdminDashboard';
import ManagementDashboard from './pages/ManagementDashboard';

const REPORTERS = ['STUDENT', 'STAFF'];
function Guard({ roles, children }) {
  const a = getAuth();
  return a && roles.includes(a.role) ? children : <Navigate to="/" replace />;
}

export default function App() {
  const nav = useNavigate();
  const auth = getAuth();
  return (
    <>
      <header>
        <b>Campus Issue Portal</b>
        <nav>
          {auth && REPORTERS.includes(auth.role) && (<><Link to="/report">Report issue</Link><Link to="/track">Track issue</Link></>)}
          {auth?.role === 'ADMIN' && <Link to="/admin">Dashboard</Link>}
          {auth?.role === 'MANAGEMENT' && <Link to="/management">Dashboard</Link>}
          {auth ? <a href="#" onClick={(e) => { e.preventDefault(); setAuth(null); nav('/'); }}>Logout ({auth.name})</a> : <Link to="/">Login</Link>}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/report" element={<Guard roles={REPORTERS}><ReportIssue /></Guard>} />
          <Route path="/track" element={<Guard roles={REPORTERS}><Track /></Guard>} />
          <Route path="/admin" element={<Guard roles={['ADMIN']}><AdminDashboard /></Guard>} />
          <Route path="/management" element={<Guard roles={['MANAGEMENT']}><ManagementDashboard /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
