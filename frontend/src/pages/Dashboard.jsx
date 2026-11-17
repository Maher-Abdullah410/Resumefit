import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageLayout } from '../components/SiteLayout.jsx'
import { api } from '../lib/api.js'

function displayDate(value) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Dashboard() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadHistory = () => api.listAnalyses()
    .then(setHistory)
    .catch((err) => setError(`Could not load your analysis history: ${err.message}`))
    .finally(() => setLoading(false))

  useEffect(() => { loadHistory() }, [])

  const removeAnalysis = async (id) => {
    if (!window.confirm('Delete this saved analysis?')) return
    setError('')
    try {
      await api.deleteAnalysis(id)
      setHistory((items) => items.filter((item) => item.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  const average = history.length
    ? Math.round(history.reduce((total, item) => total + item.ats_score, 0) / history.length)
    : 0

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="font-semibold text-indigo-600">Your workspace</p><h1 className="mt-1 text-3xl font-black tracking-tight">Dashboard</h1><p className="mt-2 text-slate-600">Review your recent resume analyses.</p></div>
          <Link to="/analyze" className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">+ New analysis</Link>
        </div>

        {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Analysis summary">
          <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Total analyses</p><p className="mt-1 text-3xl font-black">{history.length}</p></article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Average ATS score</p><p className="mt-1 text-3xl font-black">{history.length ? `${average}%` : '—'}</p></article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Last analysis</p><p className="mt-1 text-3xl font-black">{history.length ? displayDate(history[0].created_at) : '—'}</p></article>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-lg font-bold">Analysis history</h2></div>
          {loading
            ? <p className="px-5 py-8 text-sm text-slate-500">Loading your analyses…</p>
            : history.length
              ? <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600"><tr><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Job title</th><th className="px-5 py-3 font-semibold">ATS score</th><th className="px-5 py-3 font-semibold">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{history.map((item) => <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-slate-600">{displayDate(item.created_at)}</td>
                    <td className="px-5 py-4 font-semibold">{item.job_title}</td>
                    <td className="px-5 py-4"><span className="rounded-full bg-indigo-50 px-3 py-1 font-bold text-indigo-700">{item.ats_score}%</span></td>
                    <td className="px-5 py-4"><div className="flex gap-2"><Link to={`/analyses/${item.id}`} className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold hover:border-indigo-400 hover:text-indigo-700">Open</Link><button onClick={() => removeAnalysis(item.id)} className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-600 hover:border-red-300 hover:text-red-700">Delete</button></div></td>
                  </tr>)}</tbody>
                </table>
              </div>
              : <div className="px-5 py-12 text-center"><p className="font-semibold">No analyses yet</p><p className="mt-2 text-sm text-slate-500">Start with a resume and a job description to see your match.</p><Link to="/analyze" className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">Create an analysis</Link></div>}
        </section>
      </div>
    </PageLayout>
  )
}
