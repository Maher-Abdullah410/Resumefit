import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'

function SkillList({ title, items, tone }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-700">{title} <span className="text-slate-400">({items.length})</span></h3>
      {items.length > 0
        ? <ul className="mt-3 flex flex-wrap gap-2">{items.map((item) => (
          <li key={item} className={`rounded-full px-3 py-1 text-sm ${tone}`}>{item}</li>
        ))}</ul>
        : <p className="mt-2 text-sm text-slate-500">None found</p>}
    </section>
  )
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listAnalyses()
      .then((items) => { setHistory(items); if (items.length) setAnalysis(items[0]) })
      .catch((err) => setError(`Could not load your analysis history: ${err.message}`))
      .finally(() => setHistoryLoading(false))
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await api.createAnalysis({ resume_text: resumeText, job_description: jobDescription })
      setAnalysis(result)
      setHistory((items) => [result, ...items])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/dashboard" className="text-xl font-extrabold tracking-tight text-indigo-700">ResumeFit</a>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-600 sm:inline">Hi, {user.full_name}</span>
            <button onClick={logout} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">Log out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Resume analysis</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">See how your resume matches the role.</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Compare your resume with a job description to get an ATS-style keyword and skill coverage estimate.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Resume text</span>
              <textarea
                className="min-h-56 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Paste your resume text (100–30,000 characters)"
                value={resumeText}
                onChange={(event) => setResumeText(event.target.value)}
                minLength={100}
                maxLength={30000}
                required
              />
              <span className="mt-1 block text-right text-xs text-slate-500">{resumeText.length}/30,000</span>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Job description</span>
              <textarea
                className="min-h-48 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Paste the job description (50–20,000 characters)"
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                minLength={50}
                maxLength={20000}
                required
              />
              <span className="mt-1 block text-right text-xs text-slate-500">{jobDescription.length}/20,000</span>
            </label>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button disabled={loading} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Analyzing…' : 'Analyze resume'}
            </button>
            <p className="text-xs leading-5 text-slate-500">Your analysis is saved to your account. This deterministic ATS estimate is informational and is not a hiring decision.</p>
          </form>

          <section aria-live="polite" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Analysis results</h2>
            {analysis
              ? <div className="mt-6">
                <div className="flex items-center gap-5 rounded-xl bg-indigo-50 p-5">
                  <div className="flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-indigo-600 bg-white text-2xl font-bold text-indigo-700">{analysis.ats_score}</div>
                  <div>
                    <p className="font-semibold">ATS match estimate</p>
                    <p className="mt-1 text-sm text-slate-600">Based on role skills and keyword coverage.</p>
                  </div>
                </div>
                <div className="mt-6 space-y-6">
                  <SkillList title="Matched skills" items={analysis.matched_skills} tone="bg-emerald-50 text-emerald-800" />
                  <SkillList title="Skills not found in your resume" items={analysis.missing_skills} tone="bg-amber-50 text-amber-800" />
                  <SkillList title="Matched keywords" items={analysis.matched_keywords} tone="bg-sky-50 text-sky-800" />
                  <SkillList title="Missing keywords" items={analysis.missing_keywords} tone="bg-slate-100 text-slate-700" />
                </div>
              </div>
              : <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                Run an analysis to see matched skills and keywords here.
              </div>}
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Recent analyses</h2>
          {historyLoading
            ? <p className="mt-4 text-sm text-slate-500">Loading history…</p>
            : history.length
              ? <ul className="mt-4 divide-y divide-slate-100">{history.map((item) => (
                <li key={item.id}>
                  <button onClick={() => setAnalysis(item)} className="flex w-full items-center justify-between py-3 text-left hover:text-indigo-700">
                    <span className="text-sm text-slate-600">{new Date(item.created_at).toLocaleString()}</span>
                    <span className="font-semibold">{item.ats_score}% match</span>
                  </button>
                </li>
              ))}</ul>
              : <p className="mt-4 text-sm text-slate-500">Your completed analyses will appear here.</p>}
        </section>
      </div>
    </main>
  )
}
