const API_URL = (import.meta.env.VITE_API_URL || 'https://domain-anda.com/gudang').replace(/\/+$/, '');

function getToken() {
  return localStorage.getItem('gti_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    localStorage.removeItem('gti_token');
    localStorage.removeItem('gti_user');
    // Reload supaya App.jsx jatuh kembali ke halaman login dengan state bersih
    window.location.reload();
    throw new Error(data.message || 'Sesi berakhir, silakan login kembali.');
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Terjadi kesalahan pada server.');
  }

  return data;
}

export const api = {
  login: (username, password) =>
    request('/auth/login.php', { method: 'POST', body: JSON.stringify({ username, password }) }),

  me: () => request('/auth/me.php'),
  changePassword: (oldPassword, newPassword) =>
    request('/auth/change_password.php', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    }),

  getInventory: () => request('/inventory/list.php'),
  createInventory: (item) =>
    request('/inventory/create.php', { method: 'POST', body: JSON.stringify(item) }),
  updateInventory: (id, item) =>
    request(`/inventory/update.php?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteInventory: (id) =>
    request(`/inventory/delete.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  getTransactions: () => request('/transactions/list.php'),
  inbound: (payload) =>
    request('/transactions/inbound.php', { method: 'POST', body: JSON.stringify(payload) }),
  outbound: (payload) =>
    request('/transactions/outbound.php', { method: 'POST', body: JSON.stringify(payload) }),

  getLoans: () => request('/loans/list.php'),
  createLoan: (payload) =>
    request('/loans/create.php', { method: 'POST', body: JSON.stringify(payload) }),
  returnLoan: (id, payload) =>
    request(`/loans/return.php?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }),

  getUsers: () => request('/users/list.php'),
  createUser: (payload) =>
    request('/users/create.php', { method: 'POST', body: JSON.stringify(payload) }),
  updateUser: (id, payload) =>
    request(`/users/update.php?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteUser: (id) =>
    request(`/users/delete.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

export { getToken };
