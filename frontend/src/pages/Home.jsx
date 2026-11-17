import { Link } from 'react-router-dom'
import { PageLayout } from '../components/SiteLayout.jsx'

const features = [
  ['ATS match estimate', 'See keyword coverage and skills that already match the role.'],
  ['PDF resume upload', 'Extract selectable text from your PDF and review it before analysis.'],
  ['AI rewrite suggestions', 'Improve resume bullets without inventing experience or achievements.'],
]

export default function Home() {
  return (
    <PageLayout>
      <section className="overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-sky-50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="inline-flex rounded-full border border-indigo-100 bg-white px-3 py-1 text-sm font-semibold text-indigo-700">A clearer way to tailor your resume</p>
            <h1 className="mt-6 max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">Tailor your resume.<br /><span className="text-indigo-600">Feel ready to apply.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Compare your resume with a job description, find keyword gaps, and get practical AI suggestions to make your experience easier to understand.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-indigo-700">Get started free</Link>
              <a href="#how-it-works" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50">How it works</a>
            </div>
            <p className="mt-4 text-sm text-slate-500">Your score is an estimate, not a hiring decision.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-indigo-100/70 sm:p-8">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-semibold text-slate-500">ATS match estimate</p><p className="mt-1 text-4xl font-black">78<span className="text-xl text-slate-400">/100</span></p></div>
              <div className="grid size-20 place-items-center rounded-full border-[10px] border-indigo-500 bg-indigo-50 font-bold text-indigo-700">78%</div>
            </div>
            <div className="mt-7 space-y-4">
              <div><div className="mb-1 flex justify-between text-sm"><span>Skills coverage</span><span className="font-semibold">Strong</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 w-3/4 rounded-full bg-indigo-500" /></div></div>
              <div className="flex flex-wrap gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">React</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">REST APIs</span><span className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-700">Docker</span></div>
              <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">Review missing keywords and decide which suggestions genuinely reflect your experience.</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="max-w-2xl"><p className="font-semibold text-indigo-600">Built for a focused job search</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Everything you need to prepare one application at a time.</h2></div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {features.map(([title, description], index) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="grid size-10 place-items-center rounded-xl bg-indigo-50 font-bold text-indigo-700">0{index + 1}</span><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 leading-6 text-slate-600">{description}</p></article>)}
        </div>
      </section>

      <section id="how-it-works" className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {['Upload or paste your resume', 'Add the job description', 'Review your match and suggestions', 'Export a tailored copy'].map((step, index) => <li key={step} className="flex gap-4"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-600 font-bold text-white">{index + 1}</span><p className="pt-1 font-semibold">{step}</p></li>)}
          </ol>
          <Link to="/signup" className="mt-10 inline-flex rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">Start your first analysis</Link>
        </div>
      </section>
    </PageLayout>
  )
}
