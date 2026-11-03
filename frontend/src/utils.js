export const formatStatus = (s) => (s ? s.replaceAll('_', ' ') : 'Status unavailable');
export function formatDate(v) {
  if (!v) return 'Date unavailable';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v).replace('T', ' ') : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}
