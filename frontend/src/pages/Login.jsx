import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setAuth } from '../api';

const TABS = {
  Student: {
    url: '/auth/student',
    fields: [
      ['usn', 'USN'],
      ['name', 'Full name'],
      ['dob', 'Date of birth', 'date'],
      ['qrCode', 'QR code value']
    ]
  },
  Staff: {
    url: '/auth/staff',
    fields: [
      ['empId', 'Employee ID'],
      ['name', 'Full name'],
      ['qrCode', 'QR code value']
    ]
  },
  Admin: {
    url: '/auth/login',
    fields: [
      ['username', 'Username'],
      ['password', 'Password', 'password']
    ]
  },
  Management: {
    url: '/auth/login',
    fields: [
      ['username', 'Username'],
      ['password', 'Password', 'password']
    ]
  }
};

const HOME = {
  STUDENT: '/report',
  STAFF: '/report',
  ADMIN: '/admin',
  MANAGEMENT: '/management'
};

export default function Login() {
  const [tab, setTab] = useState('Student');
  const [form, setForm] = useState({});
  const [err, setErr] = useState('');

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr('');

    try {
      const a = await api(TABS[tab].url, {
        method: 'POST',
        body: form
      });

      if (
        ['Admin', 'Management'].includes(tab) &&
        a.role !== tab.toUpperCase()
      ) {
        throw new Error('Wrong portal for this account');
      }

      setAuth(a);
      nav(HOME[a.role]);

    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function changePassword(e) {
    e.preventDefault();

    setPasswordError('');
    setPasswordMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must contain at least 8 characters.');
      return;
    }

    try {
      const result = await api('/auth/change-password', {
        method: 'POST',
        body: {
          username: passwordForm.username,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }
      });

      setPasswordMessage(result.message || 'Password changed successfully.');

      setPasswordForm({
        username: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error) {
      setPasswordError(error.message);
    }
  }

  const isAdminOrManagement = ['Admin', 'Management'].includes(tab);

  return (
    <div className="card narrow">

      <div className="tabs">
        {Object.keys(TABS).map((t) => (
          <button
            key={t}
            type="button"
            className={t === tab ? 'on' : ''}
            onClick={() => {
              setTab(t);
              setForm({});
              setErr('');
              setShowChangePassword(false);
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={submit}>

        {TABS[tab].fields.map(([k, label, type]) => (
          <label key={k}>
            {label}
            <input
              type={type || 'text'}
              value={form[k] || ''}
              onChange={(e) =>
                setForm({ ...form, [k]: e.target.value })
              }
              required
            />
          </label>
        ))}

        {err && <p className="err">{err}</p>}

        <div className="login-actions">
          <button className="primary" type="submit">
            Verify &amp; continue
          </button>

          {isAdminOrManagement && (
            <button
              type="button"
              className="change-password-btn"
              onClick={() => {
                setShowChangePassword(true);
                setPasswordError('');
                setPasswordMessage('');
                setPasswordForm({
                  ...passwordForm,
                  username: form.username || ''
                });
              }}
            >
              Change Password
            </button>
          )}
        </div>

      </form>

      {showChangePassword && (
        <div className="modal-overlay">
          <div className="password-modal">

            <button
              type="button"
              className="close-modal"
              onClick={() => setShowChangePassword(false)}
            >
              &times;
            </button>

            <h2>Change Password</h2>
            <p>Update your Admin or Management account password.</p>

            <form onSubmit={changePassword}>

              <label>
                Username
                <input
                  type="text"
                  value={passwordForm.username}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      username: e.target.value
                    })
                  }
                  required
                />
              </label>

              <label>
                Current Password
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value
                    })
                  }
                  required
                />
              </label>

              <label>
                New Password
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value
                    })
                  }
                  required
                />
              </label>

              <label>
                Confirm New Password
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value
                    })
                  }
                  required
                />
              </label>

              {passwordError && (
                <p className="err">{passwordError}</p>
              )}

              {passwordMessage && (
                <p className="success">{passwordMessage}</p>
              )}

              <button className="primary" type="submit">
                Update Password
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}