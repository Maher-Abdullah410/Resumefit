import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { PageLayout } from '../components/SiteLayout.jsx'

export default function Signup() {
  const { login } = useAuth(); const nav = useNavigate()
  const [f, setF] = useState({ full_name: '', email: '', password: '', consent: false }); const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const submit = async (e) => {
    e.preventDefault(); setError('')
    try { await api.register(f); await login(f.email, f.password); nav('/dashboard') } catch (err) { setError(err.message) }
  }
  return (
    <PageLayout>
      <main className="mx-auto max-w-md px-5 py-16">
        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <div className="mb-7 flex rounded-xl bg-slate-100 p-1 text-sm font-semibold"><Link to="/login" className="flex-1 rounded-lg py-2.5 text-center text-slate-600 hover:text-indigo-700">Log in</Link><Link to="/signup" className="flex-1 rounded-lg bg-white py-2.5 text-center text-indigo-700 shadow-sm">Sign up</Link></div>
          <h1 className="text-2xl font-black">Create your account</h1><p className="mt-2 text-sm text-slate-600">Save analyses and come back to your results anytime.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold">Full name<input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" autoComplete="name" placeholder="Your name" value={f.full_name} onChange={set('full_name')} required /></label>
            <label className="block text-sm font-semibold">Email<input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" type="email" autoComplete="email" placeholder="name@example.com" value={f.email} onChange={set('email')} required /></label>
            <label className="block text-sm font-semibold">Password<input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={f.password} onChange={set('password')} required /></label>
            <label className="flex items-start gap-2 text-sm leading-5 text-slate-600"><input type="checkbox" className="mt-1 accent-indigo-600" checked={f.consent} onChange={set('consent')} required /> I agree to the <Link className="text-indigo-700 underline" to="/privacy">Privacy Policy</Link> and consent to processing of my resume text for analysis.</label>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700">Create account</button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-600">Already registered? <Link className="font-semibold text-indigo-700 hover:underline" to="/login">Log in</Link></p>
        </section>
      </main>
    </PageLayout>
  )
}
