import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageLayout } from '../components/SiteLayout.jsx'
import { api } from '../lib/api.js'

function KeywordList({ title, items, tone, dashed = false }) {
  return (
    <section>
      <h2 className="text-lg font-bold">{title} <span className="text-sm font-medium text-slate-400">({items.length})</span></h2>
      {items.length ? <ul className="mt-3 flex flex-wrap gap-2">{items.map((item) => <li key={item} className={`rounded-full border px-3 py-1 text-sm ${dashed ? 'border-dashed' : 'border-transparent'} ${tone}`}>{item}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">None found</p>}
    </section>
  )
}

function ScoreBar({ label, matched, total }) {
  const score = total ? Math.round((matched / total) * 100) : 0
  return <div><div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="font-semibold">{score}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${score}%` }} /></div></div>
}

export default function Results() {
  const { analysisId } = useParams()
  const [analysis, setAnalysis] = useState(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [loading, setLoading] = useState(true)
  const [coverLoading, setCoverLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getAnalysis(analysisId)
      .then(setAnalysis)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [analysisId])

  const createCoverLetter = async () => {
    setError('')
    setCoverLoading(true)
    try {
      const result = await api.generateCoverLetter(analysisId)
      setCoverLetter(result.cover_letter)
    } catch (err) {
      setError(err.message)
    } finally {
      setCoverLoading(false)
    }
  }

  if (loading) return <PageLayout><p className="mx-auto max-w-7xl px-5 py-12 text-slate-500">Loading analysis…</p></PageLayout>
  if (!analysis) return <PageLayout><div className="mx-auto max-w-3xl px-5 py-16"><h1 className="text-2xl font-bold">Analysis unavailable</h1><p role="alert" className="mt-3 text-slate-600">{error || 'This analysis could not be found.'}</p><Link to="/dashboard" className="mt-5 inline-flex font-semibold text-indigo-700">Back to dashboard</Link></div></PageLayout>

  const skillTotal = analysis.matched_skills.length + analysis.missing_skills.length
  const keywordTotal = analysis.matched_keywords.length + analysis.missing_keywords.length
  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><Link to="/dashboard" className="no-print text-sm font-semibold text-indigo-700 hover:text-indigo-900">← Dashboard</Link><p className="mt-5 font-semibold text-indigo-600">Analysis results</p><h1 className="mt-1 text-3xl font-black tracking-tight">{analysis.job_title}</h1></div>
          <button onClick={() => window.print()} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold hover:bg-slate-50">Export report PDF</button>
        </div>
        {error && <p role="alert" className="no-print mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {analysis.suggestions_error && <p role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Your ATS analysis was saved, but AI suggestions could not be generated: {analysis.suggestions_error}</p>}

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-5">
              <div className="grid size-28 shrink-0 place-items-center rounded-full border-[10px] border-indigo-500 bg-indigo-50 text-3xl font-black text-indigo-800">{analysis.ats_score}</div>
              <div><p className="font-bold">ATS match estimate</p><p className="mt-1 text-sm leading-6 text-slate-500">Out of 100 · Informational, not a hiring decision.</p></div>
            </div>
            <div className="mt-8 space-y-5">
              <ScoreBar label="Skills match" matched={analysis.matched_skills.length} total={skillTotal} />
              <ScoreBar label="Keyword match" matched={analysis.matched_keywords.length} total={keywordTotal} />
            </div>
            <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">This estimate uses detected skill and keyword coverage and may not reflect an employer’s actual screening system.</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-7">
              <KeywordList title="Matched skills" items={analysis.matched_skills} tone="bg-emerald-50 text-emerald-800" />
              <KeywordList title="Missing skills" items={analysis.missing_skills} tone="bg-amber-50 text-amber-800" dashed />
              <KeywordList title="Matched keywords" items={analysis.matched_keywords} tone="bg-sky-50 text-sky-800" />
              <KeywordList title="Missing keywords" items={analysis.missing_keywords} tone="bg-slate-100 text-slate-700" dashed />
              {analysis.custom_keywords.length > 0 && <KeywordList title="Your added keywords" items={analysis.custom_keywords} tone="bg-violet-50 text-violet-800" />}
            </div>
          </section>
        </div>

        <section className="no-print mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-bold">Next steps</h2><p className="mt-1 text-sm text-slate-600">Review suggestions and tailor your resume before exporting.</p></div><div className="flex flex-wrap gap-3"><Link to={`/analyses/${analysis.id}/rewrite`} className="rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700">Rewrite with AI →</Link><button onClick={createCoverLetter} disabled={coverLoading} className="rounded-xl border border-slate-300 px-4 py-2.5 font-semibold hover:bg-slate-50 disabled:opacity-60">{coverLoading ? 'Generating…' : 'Generate cover letter'}</button></div></div>
          {analysis.suggestions.length > 0 && <ul className="mt-5 grid gap-3 md:grid-cols-2">{analysis.suggestions.map((suggestion, index) => <li key={`${index}-${suggestion}`} className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{suggestion}</li>)}</ul>}
        </section>
        {coverLetter && <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="no-print mb-4 flex justify-between"><h2 className="text-lg font-bold">Cover letter draft</h2><button onClick={() => window.print()} className="font-semibold text-indigo-700">Print / save PDF</button></div><pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-700">{coverLetter}</pre><p className="no-print mt-4 text-xs text-slate-500">Review and personalize this AI-generated draft before sending it.</p></section>}
      </div>
    </PageLayout>
  )
}
