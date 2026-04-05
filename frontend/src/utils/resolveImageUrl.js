const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" fill="%23e5e7eb"%3E%3Crect width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3ESem imagem%3C/text%3E%3C/svg%3E';

export function resolveImageUrl(url) {
  if (!url) return PLACEHOLDER;
  const apiBase = import.meta.env.VITE_API_BASE || '';
  const backendBase = apiBase.replace(/\/api\/?$/i, '');

  // If already absolute, return as-is
  if (/^https?:\/\//i.test(url)) return url;

  // Normalize uploads paths
  if (url.startsWith('/uploads')) return `${backendBase}${url}`;
  if (url.startsWith('uploads/')) return `${backendBase}/${url}`;

  return url;
}

export { PLACEHOLDER };
export function handleImgError(e) {
  e.currentTarget.onerror = null;
  e.currentTarget.src = PLACEHOLDER;
}
