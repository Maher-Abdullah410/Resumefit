import { useState } from 'react'
import { PageLayout } from '../components/SiteLayout.jsx'

const pages = {
  about: {
    title: 'About ResumeFit',
    intro: 'ResumeFit helps job seekers compare their resume with a role and make thoughtful, evidence-based improvements.',
    sections: [
      ['Our goal', 'Make resume preparation more understandable by highlighting role-related skills and keywords, then letting you choose what to improve.'],
      ['How the score works', 'The ATS-style score is calculated from detected skills and keywords. It is an estimate only and cannot predict how any employer or hiring system will evaluate an application.'],
      ['AI suggestions', 'AI-generated text is a starting point. Check every suggestion for accuracy and only use statements that reflect your real experience.'],
    ],
  },
  privacy: {
    title: 'Privacy policy',
    intro: 'Your account and resume information should be handled with care.',
    sections: [
      ['Information you provide', 'Resume text, job descriptions, and analysis results are saved to your account so you can review your analysis history.'],
      ['AI processing', 'When AI suggestions are requested, the resume and job description are sent to the configured AI provider to generate suggestions. Do not upload sensitive information you do not want processed.'],
      ['Your choices', 'You can delete saved analyses from your dashboard. Contact the site administrator for account or data questions.'],
    ],
  },
  terms: {
    title: 'Terms of use',
    intro: 'Use ResumeFit as a preparation aid, and make your own decisions about what to include in an application.',
    sections: [
      ['No hiring guarantees', 'Scores and suggestions are informational and do not guarantee interviews, employment, or compatibility with a specific applicant tracking system.'],
      ['Accurate information', 'You are responsible for reviewing AI-generated content and ensuring your resume is truthful, accurate, and appropriate to share.'],
      ['Service availability', 'Features may change as the application is improved. Do not rely on ResumeFit as the only copy of your resume or application materials.'],
    ],
  },
}

export function InfoPage({ page }) {
  const content = pages[page]
  return (
    <PageLayout>
      <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <p className="font-semibold text-indigo-600">ResumeFit</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">{content.title}</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">{content.intro}</p>
        <div className="mt-10 space-y-8">{content.sections.map(([title, body]) => <section key={title}><h2 className="text-xl font-bold">{title}</h2><p className="mt-2 leading-7 text-slate-600">{body}</p></section>)}</div>
      </article>
    </PageLayout>
  )
}

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const submit = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const subject = encodeURIComponent(`ResumeFit support: ${form.get('subject')}`)
    const body = encodeURIComponent(`From: ${form.get('email')}\n\n${form.get('message')}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    setSubmitted(true)
  }

  return (
    <PageLayout>
      <section className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
        <p className="font-semibold text-indigo-600">We’re here to help</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Contact us</h1>
        <p className="mt-4 leading-7 text-slate-600">Send a message to the ResumeFit team. Your default email app will open with your message ready to send.</p>
        <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-semibold">Your email<input name="email" type="email" required className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
          <label className="block text-sm font-semibold">Subject<input name="subject" required maxLength={120} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
          <label className="block text-sm font-semibold">Message<textarea name="message" required maxLength={3000} rows={5} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
          {submitted && <p role="status" className="text-sm text-slate-600">Your email app should be open. Send the message there to contact us.</p>}
          <button className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">Open email app</button>
        </form>
      </section>
    </PageLayout>
  )
}
