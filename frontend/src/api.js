export const BASE = 'http://localhost:8080/api';
export const getAuth = () => JSON.parse(localStorage.getItem('auth') || 'null');
export const setAuth = (a) => (a ? localStorage.setItem('auth', JSON.stringify(a)) : localStorage.removeItem('auth'));
export const fileUrl = (name) => `${BASE}/files/${name}?t=${getAuth()?.token}`;

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const auth = getAuth();
  if (auth) headers.Authorization = `Bearer ${auth.token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + path, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).message || msg; } catch {}
    throw new Error(msg || `Error ${res.status}`);
  }
  return res.json();
}
