import '../styles/dashboard.css'
import { Plus } from 'lucide-react'
import { Link } from 'react-router'
import GuestNavbar from '../components/Layout/GuestNavbar'
import BusinessesSection from '../components/Udyami/BusinessesSection'
import DirectoryStats from '../components/Udyami/DirectoryStats'
import UdyamiSpotlightHero from '../components/Udyami/UdyamiSpotlightHero'
import { useTranslation } from '../i18n'

/**
 * Home for visitors who have not signed in: the Udyami of the Month, the directory
 * numbers and the listings, read-only. Adding, saving and nominating ask them to
 * sign in at the moment they try, and bring them back here.
 */
export default function PublicHomePage() {
  const { locale } = useTranslation()
  return (
    <>
      <GuestNavbar />
      <div className="trek-dash trek-dash-shell max-[720px]:pt-[60px]">
        <div className="trek-dash-scroll">
          <main className="page" data-no-sidebar="true">
            <div className="page-main">
              <UdyamiSpotlightHero locale={locale} />
              <div className="max-[720px]:hidden"><DirectoryStats refreshKey={0} /></div>
              <BusinessesSection addOpen={false} onAddClose={() => {}} onChanged={() => {}} />
            </div>
          </main>
        </div>
        <Link
          to={`/login?redirect=${encodeURIComponent('/dashboard?addBusiness=1')}`}
          className="fixed bottom-6 end-6 z-30 inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-bold text-white no-underline shadow-lg"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Plus size={18} /> List your business
        </Link>
      </div>
    </>
  )
}
