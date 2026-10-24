import { createContext, useContext, useEffect, useState } from 'react'
import { api, setAccessToken } from '../lib/api.js'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On page load, try to restore the session from the refresh-token cookie.
  useEffect(() => {
    api.refresh()
      .then((d) => { setAccessToken(d.access_token); setUser(d.user) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const d = await api.login({ email, password })
    setAccessToken(d.access_token); setUser(d.user)
  }
  const logout = async () => { await api.logout().catch(() => {}); setAccessToken(null); setUser(null) }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}
