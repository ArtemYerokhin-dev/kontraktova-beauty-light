// In production, point this at the deployed Worker (e.g. via VITE_API_BASE_URL
// set at build time). Locally it stays relative and goes through the Vite
// dev-server proxy configured in vite.config.js.
const BASE = `${import.meta.env.VITE_API_BASE_URL || ''}/api`;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const error = new Error(data?.error || `Помилка запиту (${res.status})`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  getServices: () => request('/services'),
  getAllServices: () => request('/services/all'),
  createService: (body) => request('/services', { method: 'POST', body: JSON.stringify(body) }),
  updateService: (id, body) => request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteService: (id) => request(`/services/${id}`, { method: 'DELETE' }),

  getMasters: (category) => request(`/masters${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  getAllMasters: () => request('/masters/all'),
  createMaster: (body) => request('/masters', { method: 'POST', body: JSON.stringify(body) }),
  updateMaster: (id, body) => request(`/masters/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteMaster: (id) => request(`/masters/${id}`, { method: 'DELETE' }),

  getSlots: (serviceId, masterId, date) =>
    request(`/bookings/slots?service_id=${serviceId}&master_id=${masterId}&date=${date}`),
  createBooking: (body) => request('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  getBookings: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/bookings${qs ? `?${qs}` : ''}`);
  },
  updateBooking: (id, body) => request(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteBooking: (id) => request(`/bookings/${id}`, { method: 'DELETE' }),

  getNotificationTargets: () => request('/admin/notification-targets'),
  saveNotificationTarget: (body) =>
    request('/admin/notification-targets', { method: 'POST', body: JSON.stringify(body) }),
  deleteNotificationTarget: (id) => request(`/admin/notification-targets/${id}`, { method: 'DELETE' }),

  login: (password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  masterLogin: (pin) => request('/master-auth/login', { method: 'POST', body: JSON.stringify({ pin }) }),
  masterLogout: () => request('/master-auth/logout', { method: 'POST' }),
  masterMe: () => request('/master-auth/me'),
  updateMySchedule: (body) => request('/master-auth/me/schedule', { method: 'PATCH', body: JSON.stringify(body) }),
};
