import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const { user, logout } = useAuth()
  return (
    <main className="mx-auto mt-16 max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Welcome back, {user.full_name}</h1>
      <p className="mt-2 text-gray-600">Dashboard placeholder. Analyses and history arrive in later weeks.</p>
      <button onClick={logout} className="mt-6 rounded border px-4 py-2">Log out</button>
    </main>
  )
}
