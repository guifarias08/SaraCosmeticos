const API_BASE = window.location.origin;

async function apiFetch(path, options = {}) {
  const { redirectOnUnauthorized = true, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});

  if (fetchOptions.body && !(fetchOptions.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    credentials: 'same-origin',
    headers,
  });

  if (response.status === 401 && redirectOnUnauthorized) {
    window.location.replace('login.html');
    throw new Error('Sessão expirada.');
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.erro || 'Não foi possível concluir a operação.');
  return data;
}

async function getAdminSession() {
  return apiFetch('/api/admin/session', { redirectOnUnauthorized: false });
}

async function logoutAdmin() {
  try {
    await apiFetch('/api/admin/logout', { method: 'POST', redirectOnUnauthorized: false });
  } finally {
    window.location.replace('login.html');
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value) || 0);
}
