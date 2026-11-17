import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function SiteHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const signOut = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8" aria-label="Main navigation">
        <Link to={user ? '/dashboard' : '/'} className="text-xl font-black tracking-tight text-indigo-700">ResumeFit</Link>
        <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {user ? <>
            <Link to="/dashboard" className="hover:text-indigo-700">Dashboard</Link>
            <Link to="/analyze" className="hover:text-indigo-700">New analysis</Link>
          </> : <>
            <a href="/#features" className="hover:text-indigo-700">Features</a>
            <a href="/#how-it-works" className="hover:text-indigo-700">How it works</a>
          </>}
          <Link to="/about" className="hover:text-indigo-700">About</Link>
          <Link to="/contact" className="hover:text-indigo-700">Contact</Link>
        </div>
        <div className="flex items-center gap-3">
          {user ? <>
            <span className="hidden max-w-48 truncate text-sm text-slate-500 sm:inline">{user.email}</span>
            <button onClick={signOut} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Log out</button>
          </> : <>
            <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Log in</Link>
            <Link to="/signup" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Sign up</Link>
          </>}
        </div>
      </nav>
      <div className="flex gap-5 overflow-x-auto border-t border-slate-100 px-5 py-2.5 text-sm font-medium text-slate-600 md:hidden">
        {user ? <><Link to="/dashboard" className="shrink-0">Dashboard</Link><Link to="/analyze" className="shrink-0">New analysis</Link></> : <><a href="/#features" className="shrink-0">Features</a><a href="/#how-it-works" className="shrink-0">How it works</a></>}
        <Link to="/about" className="shrink-0">About</Link><Link to="/contact" className="shrink-0">Contact</Link>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>ResumeFit helps you prepare; it does not guarantee interview or hiring outcomes.</p>
        <div className="flex gap-4">
          <Link to="/privacy" className="hover:text-indigo-700">Privacy</Link>
          <Link to="/terms" className="hover:text-indigo-700">Terms</Link>
          <Link to="/contact" className="hover:text-indigo-700">Contact</Link>
        </div>
      </div>
    </footer>
  )
}

export function PageLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
