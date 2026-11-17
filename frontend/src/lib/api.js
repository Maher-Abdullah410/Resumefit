// Small fetch wrapper. The access token lives in memory only (not localStorage), so scripts
// injected into the page cannot steal it. The refresh token is an HttpOnly cookie handled by the browser.
let accessToken = null
export const setAccessToken = (t) => { accessToken = t }
const API_UNAVAILABLE_MESSAGE = 'ResumeFit API is unavailable. Make sure the backend is running and try again.'

async function request(path, { method = 'GET', body, retry = true } = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  let res
  try {
    res = await fetch(`/api/v1${path}`, {
      method,
      credentials: 'include',
      headers: { ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    })
  } catch {
    throw new Error(API_UNAVAILABLE_MESSAGE)
  }
  if (res.status === 401 && retry && path !== '/auth/refresh' && path !== '/auth/login') {
    let r
    try {
      r = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' })
    } catch {
      throw new Error(API_UNAVAILABLE_MESSAGE)
    }
    if (r.ok) { accessToken = (await r.json()).access_token; return request(path, { method, body, retry: false }) }
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data?.error?.message || (res.status >= 500 ? API_UNAVAILABLE_MESSAGE : `Request failed (${res.status}).`)
    throw Object.assign(new Error(message), { status: res.status, code: data?.error?.code })
  }
  return data
}

export const api = {
  register: (b) => request('/auth/register', { method: 'POST', body: b }),
  login: (b) => request('/auth/login', { method: 'POST', body: b }),
  refresh: () => request('/auth/refresh', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/users/me'),
  listAnalyses: () => request('/analyses'),
  createAnalysis: (body) => request('/analyses', { method: 'POST', body }),
  getAnalysis: (id) => request(`/analyses/${encodeURIComponent(id)}`),
  deleteAnalysis: (id) => request(`/analyses/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  extractResume: (file) => {
    const body = new FormData()
    body.append('file', file)
    return request('/analyses/extract', { method: 'POST', body })
  },
  rewriteBullet: (id, bullet) => request(`/analyses/${encodeURIComponent(id)}/rewrite`, { method: 'POST', body: { bullet } }),
  generateCoverLetter: (id) => request(`/analyses/${encodeURIComponent(id)}/cover-letter`, { method: 'POST' }),
}
