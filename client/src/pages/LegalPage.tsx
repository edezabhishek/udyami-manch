import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

type Doc = 'terms' | 'privacy'

const UPDATED = '29 October 2026'
const CONTACT = 'edezabhishek@gmail.com'

function Terms() {
  return (
    <>
      <h1>Terms of Use</h1>
      <p className="meta">Last updated {UPDATED}</p>
      <p>Udyami Manch ("we", "us") is a directory of businesses owned and run by Nepali and Indian people, and a place to find online community events. By using udyamimanch.com you agree to these terms.</p>
      <h2>Using the site</h2>
      <p>Anyone can browse the directory, events and map. You need an account to list a business, save listings, register for events or nominate a business. You are responsible for your account and for keeping your password safe.</p>
      <h2>Listing a business</h2>
      <ul>
        <li>List only a business you own, run, or have the owner's permission to list.</li>
        <li>What you submit must be true and not misleading, and you must have the right to share it, including any photos.</li>
        <li>New and edited listings are reviewed before they appear. We may approve, change, reject or remove any listing or event at our discretion.</li>
        <li>Listings appear publicly, including the contact details you provide.</li>
      </ul>
      <h2>Events</h2>
      <p>Events are run by their hosts, not by us. We do not guarantee any event, speaker or outcome. Join links are shown to registered attendees only. Do not share them publicly.</p>
      <h2>Behaviour</h2>
      <p>Do not post anything unlawful, deceptive, hateful or harassing, do not impersonate others, and do not try to break or misuse the site or collect other people's data from it. We may suspend accounts that do.</p>
      <h2>No endorsement</h2>
      <p>A listing is not a recommendation or guarantee of a business. Deal with businesses at your own judgement. We are not a party to any dealings between users and businesses.</p>
      <h2>Liability</h2>
      <p>We provide the site as is. To the extent the law allows, we are not liable for loss arising from your use of it. Nothing here limits rights you have under New Zealand consumer law that cannot be excluded.</p>
      <h2>Changes and contact</h2>
      <p>We may update these terms and will post the new date above. Questions or removal requests: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
      <p>These terms are governed by the laws of New Zealand.</p>
    </>
  )
}

function Privacy() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="meta">Last updated {UPDATED}</p>
      <p>This explains what Udyami Manch collects and why. We follow the New Zealand Privacy Act 2020.</p>
      <h2>What we collect</h2>
      <ul>
        <li><b>Account:</b> your username, email address and a hashed password.</li>
        <li><b>Listings you submit:</b> business name, category, community, description, address, phone, email, website and photos. These are shown publicly once approved.</li>
        <li><b>Events and nominations:</b> what you submit, and which events you register for.</li>
        <li><b>Basic technical data:</b> your IP address and device details in server logs, and cookies that keep you signed in.</li>
      </ul>
      <h2>Why we use it</h2>
      <p>To run the directory and events, review submissions, keep accounts secure and contact you about your account or listings. We do not sell your information and we do not run third-party advertising.</p>
      <h2>Who sees it</h2>
      <p>Approved listings are public. Your email and registrations are visible only to you and the site administrators, and to an event host for the events you register for. Our hosting provider stores the data on our behalf.</p>
      <h2>Keeping and deleting data</h2>
      <p>We keep your data while your account is active. To see, correct or delete your information, or to remove a listing, email <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
      <h2>Cookies</h2>
      <p>We use only the cookies needed to keep you signed in and remember your settings.</p>
      <h2>Contact</h2>
      <p>Privacy questions or complaints: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. You can also contact the New Zealand Office of the Privacy Commissioner.</p>
    </>
  )
}

/** The Terms of Use and Privacy Policy, open to everyone. */
export default function LegalPage({ doc }: { doc: Doc }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-secondary)' }}>
      <div className="mx-auto max-w-[760px] px-5 py-10">
        <Link to="/atlas" className="mb-6 inline-flex items-center gap-2 text-[13px] font-semibold no-underline" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={15} /> Udyami Manch
        </Link>
        <article
          className="rounded-[20px] border p-6 sm:p-8 [&_a]:underline [&_h1]:m-0 [&_h1]:text-[28px] [&_h1]:font-bold [&_h2]:mb-1 [&_h2]:mt-6 [&_h2]:text-[16px] [&_h2]:font-semibold [&_li]:mb-1 [&_p]:my-2 [&_ul]:my-2 [&_ul]:ps-5 [&_.meta]:text-[12px]"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-faint)', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 14 }}
        >
          {doc === 'terms' ? <Terms /> : <Privacy />}
        </article>
        <p className="mt-4 text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
          <Link to="/terms" style={{ color: 'inherit' }}>Terms</Link> · <Link to="/privacy" style={{ color: 'inherit' }}>Privacy</Link>
        </p>
      </div>
    </div>
  )
}
