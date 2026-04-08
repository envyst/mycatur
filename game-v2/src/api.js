async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof body === 'object' && body?.error ? body.error : `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return body;
}

export const api = {
  me: () => request('/api/me'),
  login: (username, password) => request('/api/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request('/api/logout', { method: 'POST' }),
  listSessions: () => request('/api/sessions'),
  createSession: (payload) => request('/api/sessions', { method: 'POST', body: JSON.stringify(payload) }),
  getSession: (id) => request(`/api/sessions/${id}`),
  updateSession: (id, payload) => request(`/api/sessions/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
};
