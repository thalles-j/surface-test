const TOKEN_KEY = "token";

export function getStoredToken() {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;

  // Accept legacy formats like `"token"` and `Bearer token`.
  const cleaned = String(raw).trim().replace(/^"|"$/g, "").replace(/^Bearer\s+/i, "");
  return cleaned || null;
}

export function saveToken(token) {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, String(token).trim());
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
