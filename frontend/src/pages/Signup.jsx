import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Signup() {
  const { login } = useAuth(); const nav = useNavigate()
  const [f, setF] = useState({ full_name: '', email: '', password: '', consent: false }); const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const submit = async (e) => {
    e.preventDefault(); setError('')
    try { await api.register(f); await login(f.email, f.password); nav('/dashboard') } catch (err) { setError(err.message) }
  }
  return (
    <main className="mx-auto mt-16 max-w-sm rounded border p-6">
      <h1 className="mb-4 text-2xl font-bold">Sign Up</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full rounded border p-2" placeholder="Full name" value={f.full_name} onChange={set('full_name')} required />
        <input className="w-full rounded border p-2" type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
        <input className="w-full rounded border p-2" type="password" placeholder="Password (8+ chars, letter and digit)" value={f.password} onChange={set('password')} required />
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={f.consent} onChange={set('consent')} /> I agree to the Privacy Policy</label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-gray-800 p-2 font-semibold text-white">Create account</button>
      </form>
      <p className="mt-3 text-sm">Already registered? <Link className="underline" to="/login">Log in</Link></p>
    </main>
  )
}
