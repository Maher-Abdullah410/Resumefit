import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth(); const nav = useNavigate()
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault(); setError('')
    try { await login(email, password); nav('/dashboard') } catch (err) { setError(err.message) }
  }
  return (
    <main className="mx-auto mt-16 max-w-sm rounded border p-6">
      <h1 className="mb-4 text-2xl font-bold">Log In</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full rounded border p-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded border p-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-gray-800 p-2 font-semibold text-white">Log In</button>
      </form>
      <p className="mt-3 text-sm">No account? <Link className="underline" to="/signup">Sign up</Link></p>
    </main>
  )
}
