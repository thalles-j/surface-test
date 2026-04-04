export function resolveImageUrl(url) {
  if (!url) return '';
  const apiBase = import.meta.env.VITE_API_BASE || '';
  const backendBase = apiBase.replace(/\/api\/?$/i, '');

  // If already absolute, return as-is
  if (/^https?:\/\//i.test(url)) return url;

  // Normalize uploads paths
  if (url.startsWith('/uploads')) return `${backendBase}${url}`;
  if (url.startsWith('uploads/')) return `${backendBase}/${url}`;

  return url;
}
