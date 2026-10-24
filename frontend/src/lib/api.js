// Small fetch wrapper. The access token lives in memory only (not localStorage), so scripts
// injected into the page cannot steal it. The refresh token is an HttpOnly cookie handled by the browser.
let accessToken = null
export const setAccessToken = (t) => { accessToken = t }

async function request(path, { method = 'GET', body, retry = true } = {}) {
  const res = await fetch(`/api/v1${path}`, {
    method,
    credentials: 'include',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401 && retry && path !== '/auth/refresh' && path !== '/auth/login') {
    const r = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' })
    if (r.ok) { accessToken = (await r.json()).access_token; return request(path, { method, body, retry: false }) }
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data?.error?.message || 'Request failed'), { status: res.status, code: data?.error?.code })
  return data
}

export const api = {
  register: (b) => request('/auth/register', { method: 'POST', body: b }),
  login: (b) => request('/auth/login', { method: 'POST', body: b }),
  refresh: () => request('/auth/refresh', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/users/me'),
}
