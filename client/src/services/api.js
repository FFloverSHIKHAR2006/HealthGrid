const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const getToken = () => localStorage.getItem('hg_token');
export const setToken = (token) => localStorage.setItem('hg_token', token);
export const removeToken = () => {
  localStorage.removeItem('hg_token');
  localStorage.removeItem('hg_user');
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('hg_user') || 'null');
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  localStorage.setItem('hg_user', JSON.stringify(user));
};

export async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && token) {
      removeToken();
      window.dispatchEvent(new CustomEvent('hg_auth_expired'));
    }
    const errorMsg = data.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  login: (identifier, password) =>
    request('/auth/login', {
      method: 'POST',
      body: { identifier, email: identifier, password },
    }),
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  getMe: () => request('/auth/me'),
  getOAuthConfig: () => request('/auth/oauth/config'),
  googleLogin: (credential, role) =>
    request('/auth/oauth/google', { method: 'POST', body: { credential, role } }),
  microsoftLogin: (idToken, role) =>
    request('/auth/oauth/microsoft', { method: 'POST', body: { idToken, role } }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, newPassword) =>
    request('/auth/reset-password', { method: 'POST', body: { token, newPassword } }),

  // Patients
  getPatients: () => request('/patients'),
  getPatientVault: (id) => request(`/patients/${id}`),
  updatePatient: (id, data) => request(`/patients/${id}`, { method: 'PUT', body: data }),

  // Records
  getRecord: (id) => request(`/records/${id}`),
  createRecord: (data) => request('/records', { method: 'POST', body: data }),
  deleteRecord: (id) => request(`/records/${id}`, { method: 'DELETE' }),
  verifyRecord: (id, expectedHash) =>
    request(`/records/${id}/verify`, { method: 'POST', body: { expectedHash } }),

  // Prescriptions
  createPrescription: (data) => request('/prescriptions', { method: 'POST', body: data }),

  // Routines
  createRoutine: (data) => request('/routines', { method: 'POST', body: data }),
  updateRoutine: (id, data) => request(`/routines/${id}`, { method: 'PUT', body: data }),
  deleteRoutine: (id) => request(`/routines/${id}`, { method: 'DELETE' }),

  // Reminders (Medication & Appointments)
  getReminders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reminders${query ? `?${query}` : ''}`);
  },
  createReminder: (data) => request('/reminders', { method: 'POST', body: data }),
  updateReminder: (id, data) => request(`/reminders/${id}`, { method: 'PUT', body: data }),
  deleteReminder: (id) => request(`/reminders/${id}`, { method: 'DELETE' }),
  recordAdherence: (id, status, note, scheduledTime) =>
    request(`/reminders/${id}/adherence`, { method: 'POST', body: { status, note, scheduledTime } }),
  createFromPrescription: (prescriptionId) =>
    request(`/reminders/from-prescription/${prescriptionId}`, { method: 'POST' }),
  triggerReminderCheck: () => request('/reminders/trigger-check', { method: 'POST' }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),
  deleteNotification: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),

  // Audit
  getAuditLogs: (page = 1, limit = 50) => {
    const p = typeof page === 'object' ? page.page || 1 : page;
    const l = typeof page === 'object' ? page.limit || 50 : limit;
    return request(`/audit-logs?page=${p}&limit=${l}`);
  },
  verifyChain: () => request('/audit-logs/verify'),
  verifyAuditLogs: () => request('/audit-logs/verify'),
};
