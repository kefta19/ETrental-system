export const API_BASE_URL = 'http://localhost:5000/api';

/** Server origin without the /api suffix. Uploaded files live here, e.g. /uploads/abc.jpg */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

/** Turns "/uploads/x.jpg" into a full URL on the API server. Full URLs pass through unchanged. */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  return url.startsWith('/') ? `${API_ORIGIN}${url}` : url;
}
