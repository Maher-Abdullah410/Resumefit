import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageLayout } from '../components/SiteLayout.jsx'
import { api } from '../lib/api.js'

export default function Rewrite() {
  const { analysisId } = useParams()
  const [analysis, setAnalysis] = useState(null)
  const [selectedLine, setSelectedLine] = useState(null)
  const [suggestions, setSuggestions] = useState({})
  const [accepted, setAccepted] = useState({})
  const [loadingLine, setLoadingLine] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAnalysis(analysisId)
      .then(setAnalysis)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [analysisId])

  const lines = useMemo(() => analysis ? analysis.resume_text.split(/\r?\n/) : [], [analysis])
  const candidateLines = useMemo(() => lines.map((text, index) => ({ text: text.trim(), index })).filter(({ text }) => text.length >= 12 && text.length <= 2000), [lines])

  const generate = async (index) => {
    setError('')
    setLoadingLine(index)
    try {
      const result = await api.rewriteBullet(analysisId, lines[index].trim())
      setSuggestions((items) => ({ ...items, [index]: result.suggestion }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingLine(null)
    }
  }

  const tailorText = lines.map((line, index) => accepted[index] || line).join('\n')
  if (loading) return <PageLayout><p className="mx-auto max-w-7xl px-5 py-12 text-slate-500">Loading resume…</p></PageLayout>
  if (!analysis) return <PageLayout><div className="mx-auto max-w-3xl px-5 py-16"><h1 className="text-2xl font-bold">Resume unavailable</h1><p role="alert" className="mt-3 text-slate-600">{error || 'This analysis could not be found.'}</p><Link to="/dashboard" className="mt-5 inline-flex font-semibold text-indigo-700">Back to dashboard</Link></div></PageLayout>

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="no-print flex flex-wrap items-end justify-between gap-5">
          <div><Link to={`/analyses/${analysis.id}`} className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">← Back to results</Link><h1 className="mt-5 text-3xl font-black tracking-tight">AI rewrite suggestions</h1><p className="mt-2 text-slate-600">Select a resume line to improve it for <span className="font-semibold">{analysis.job_title}</span>. Suggestions never guarantee accuracy—review before accepting.</p></div>
          <div className="rounded-xl bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-800">ATS estimate: {analysis.ats_score} / 100</div>
        </div>
        {error && <p role="alert" className="no-print mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <div className="no-print mt-8 grid gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <h2 className="mb-3 text-lg font-bold">Original resume lines</h2>
            {candidateLines.length
              ? candidateLines.map(({ index, text }) => <button key={index} onClick={() => setSelectedLine(index)} className={`block w-full rounded-xl border p-4 text-left text-sm leading-6 transition ${selectedLine === index ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-200 bg-white hover:border-indigo-300'}`}><span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Resume line {index + 1}</span><span className="mt-1 block">{accepted[index] || text}</span>{accepted[index] && <span className="mt-2 block text-xs font-semibold text-emerald-700">Accepted rewrite</span>}</button>)
              : <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">No resume lines are long enough to rewrite. Try uploading a text-based PDF or paste your resume with line breaks.</p>}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">AI suggestion</h2>
            {selectedLine === null
              ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">Select a resume line to get a rewrite suggestion.</div>
              : <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Original</p><p className="mt-2 text-sm leading-6">{lines[selectedLine].trim()}</p>
                <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Suggestion (editable)<textarea value={suggestions[selectedLine] || ''} onChange={(event) => setSuggestions((items) => ({ ...items, [selectedLine]: event.target.value }))} rows={5} maxLength={2000} placeholder="Click “Suggest rewrite” to generate a version." className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm font-normal leading-6 text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => generate(selectedLine)} disabled={loadingLine !== null} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{loadingLine === selectedLine ? 'Generating…' : suggestions[selectedLine] ? 'Another version' : 'Suggest rewrite'}</button>
                  <button onClick={() => setAccepted((items) => ({ ...items, [selectedLine]: suggestions[selectedLine] }))} disabled={!suggestions[selectedLine]?.trim()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">Accept</button>
                  <button onClick={() => setSuggestions((items) => ({ ...items, [selectedLine]: '' }))} disabled={!suggestions[selectedLine]} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Reject</button>
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500">AI can make mistakes. Only accept content that accurately describes your work.</p>
              </div>}
          </section>
        </div>
        <div className="no-print mt-8 flex flex-wrap gap-3">
          <button onClick={() => window.print()} className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">Export tailored PDF</button>
          <Link to={`/analyses/${analysis.id}`} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold hover:bg-slate-50">Back to results</Link>
        </div>
        <article className="print-only mx-auto hidden max-w-3xl bg-white p-10 text-slate-900">
          <h1 className="text-2xl font-bold">Tailored Resume</h1><p className="mt-1 text-sm text-slate-500">{analysis.job_title}</p>
          <pre className="mt-8 whitespace-pre-wrap font-sans text-sm leading-6">{tailorText}</pre>
        </article>
      </div>
    </PageLayout>
  )
}
