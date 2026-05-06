function getBaseURL() {
  const configUrl = window.APP_CONFIG?.API_BASE_URL;
  if (typeof configUrl === 'string') return normalizeBaseURL(configUrl);

  const meta = document.querySelector('meta[name="api-base"]');
  if (meta) return normalizeBaseURL(meta.getAttribute('content') || '');
  return '';
}

function normalizeBaseURL(url) {
  return url.trim().replace(/\/+$/, '');
}

const BASE_URL = getBaseURL();

async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const defaultHeaders = {};

  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url, {
      ...options,
      cache: 'no-store',
      headers: { ...defaultHeaders, ...options.headers },
    });

    if (res.status === 204) return { data: null, error: null, status: 204 };

    const data = await res.json();
    if (!res.ok) return { data: null, error: data, status: res.status };
    return { data, error: null, status: res.status };
  } catch (err) {
    return { data: null, error: { error: 'Network error. ¿Está el servidor corriendo?' }, status: 0 };
  }
}

export async function getSeries(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/series${qs ? '?' + qs : ''}`);
}

export async function getSerieById(id) {
  return apiFetch(`/series/${id}`);
}

export async function createSerie(body) {
  return apiFetch('/series', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateSerie(id, body) {
  return apiFetch(`/series/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteSerie(id) {
  return apiFetch(`/series/${id}`, { method: 'DELETE' });
}

export async function uploadSerieImage(id, file) {
  const formData = new FormData();
  formData.append('image', file);
  return apiFetch(`/series/${id}/image`, { method: 'POST', body: formData });
}

export async function getRatings(serieId) {
  return apiFetch(`/series/${serieId}/rating`);
}

export async function createRating(serieId, body) {
  return apiFetch(`/series/${serieId}/rating`, { method: 'POST', body: JSON.stringify(body) });
}

export async function deleteRating(serieId, ratingId) {
  return apiFetch(`/series/${serieId}/rating/${ratingId}`, { method: 'DELETE' });
}

export { BASE_URL };
