import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/SiteLayout.jsx'
import { api } from '../lib/api.js'

const MAX_FILE_BYTES = 5 * 1024 * 1024

export default function Analyze() {
  const navigate = useNavigate()
  const fileInput = useRef(null)
  const [jobTitle, setJobTitle] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [keywords, setKeywords] = useState([])
  const [keywordDraft, setKeywordDraft] = useState('')
  const [fileName, setFileName] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const uploadFile = async (file) => {
    if (!file) return
    setError('')
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Choose a PDF file.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('PDF files must be 5 MB or smaller.')
      return
    }
    setFileName(file.name)
    setExtracting(true)
    try {
      const result = await api.extractResume(file)
      setResumeText(result.text)
    } catch (err) {
      setError(err.message)
      setFileName('')
    } finally {
      setExtracting(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const addKeyword = (event) => {
    event.preventDefault()
    const value = keywordDraft.trim()
    if (value && !keywords.some((keyword) => keyword.toLowerCase() === value.toLowerCase()) && keywords.length < 30) {
      setKeywords((items) => [...items, value])
    }
    setKeywordDraft('')
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const analysis = await api.createAnalysis({
        job_title: jobTitle.trim() || 'Resume analysis',
        resume_text: resumeText,
        job_description: jobDescription,
        custom_keywords: keywords,
      })
      navigate(`/analyses/${analysis.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-8">
          <p className="font-semibold text-indigo-600">Step 1 of 2 · Resume and job</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Start a new analysis</h1>
          <p className="mt-2 text-slate-600">Upload a PDF or paste your resume, then compare it with the role.</p>
        </div>

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <label className="block"><span className="mb-2 block text-sm font-bold">Job title <span className="font-normal text-slate-500">(optional)</span></span><input value={jobTitle} maxLength={120} onChange={(event) => setJobTitle(event.target.value)} placeholder="e.g. Junior Web Developer" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
            <div>
              <h2 className="mb-2 text-sm font-bold">Your resume</h2>
              <button type="button" onClick={() => fileInput.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); uploadFile(event.dataTransfer.files[0]) }} className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50">
                <span className="mx-auto grid size-11 place-items-center rounded-xl bg-white text-xl text-indigo-600 shadow-sm">↑</span>
                <span className="mt-3 block font-semibold">Drag and drop your PDF, or browse</span>
                <span className="mt-1 block text-sm text-slate-500">PDF only · Up to 5 MB · Selectable text required</span>
                <input ref={fileInput} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => uploadFile(event.target.files[0])} />
              </button>
              {fileName && <div className="mt-3 flex items-center justify-between rounded-xl bg-indigo-50 px-3 py-2 text-sm"><span className="truncate text-indigo-800">{extracting ? 'Extracting' : 'PDF loaded'} · {fileName}</span><button type="button" onClick={() => { setFileName(''); setResumeText('') }} aria-label="Remove PDF" className="ml-3 font-bold text-slate-500 hover:text-red-600">×</button></div>}
            </div>
            <label className="block"><span className="mb-2 block text-sm font-bold">Extracted text preview</span><textarea value={resumeText} onChange={(event) => setResumeText(event.target.value)} minLength={100} maxLength={30000} required rows={10} placeholder="Upload a PDF above or paste your resume text here (100–30,000 characters)." className="w-full rounded-xl border border-slate-300 p-3 text-sm leading-6 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /><span className="mt-1 block text-right text-xs text-slate-500">{resumeText.length.toLocaleString()} / 30,000</span></label>
          </section>

          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <label className="block"><span className="mb-2 block text-sm font-bold">Job description</span><textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} minLength={50} maxLength={20000} required rows={12} placeholder="Paste the full job description here (50–20,000 characters)." className="w-full rounded-xl border border-slate-300 p-3 text-sm leading-6 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /><span className="mt-1 block text-right text-xs text-slate-500">{jobDescription.length.toLocaleString()} / 20,000</span></label>
            <div>
              <h2 className="text-sm font-bold">Add important keywords <span className="font-normal text-slate-500">(optional)</span></h2>
              <p className="mt-1 text-sm text-slate-500">Add role-specific terms to include in your match estimate.</p>
              <div className="mt-3 flex flex-wrap gap-2">{keywords.map((keyword) => <span key={keyword} className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-sm text-indigo-800">{keyword}<button type="button" onClick={() => setKeywords((items) => items.filter((item) => item !== keyword))} aria-label={`Remove ${keyword}`} className="font-bold text-indigo-500 hover:text-red-600">×</button></span>)}</div>
              <div className="mt-3 flex gap-2"><input value={keywordDraft} maxLength={40} onChange={(event) => setKeywordDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addKeyword(event) }} placeholder="Add a keyword" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /><button type="button" onClick={addKeyword} disabled={!keywordDraft.trim() || keywords.length >= 30} className="rounded-xl border border-slate-300 px-4 py-2 font-semibold hover:bg-slate-50 disabled:opacity-50">Add</button></div>
            </div>
            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button disabled={loading || extracting} className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Analyzing…' : 'Analyze resume'}</button>
            <p className="text-xs leading-5 text-slate-500">The ATS score is an estimate, not a hiring decision. Resume text and the job description are sent to Gemini for suggestions.</p>
          </section>
        </form>
      </div>
    </PageLayout>
  )
}
