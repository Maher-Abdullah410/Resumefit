import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { PageLayout } from '../components/SiteLayout.jsx'

export default function Login() {
  const { login } = useAuth(); const nav = useNavigate()
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault(); setError('')
    try { await login(email, password); nav('/dashboard') } catch (err) { setError(err.message) }
  }
  return (
    <PageLayout>
      <main className="mx-auto max-w-md px-5 py-16">
        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <div className="mb-7 flex rounded-xl bg-slate-100 p-1 text-sm font-semibold"><Link to="/login" className="flex-1 rounded-lg bg-white py-2.5 text-center text-indigo-700 shadow-sm">Log in</Link><Link to="/signup" className="flex-1 rounded-lg py-2.5 text-center text-slate-600 hover:text-indigo-700">Sign up</Link></div>
          <h1 className="text-2xl font-black">Welcome back</h1><p className="mt-2 text-sm text-slate-600">Log in to review your resume analyses.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold">Email<input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label className="block text-sm font-semibold">Password<input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700">Log in</button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-600">New to ResumeFit? <Link className="font-semibold text-indigo-700 hover:underline" to="/signup">Create an account</Link></p>
        </section>
      </main>
    </PageLayout>
  )
}
