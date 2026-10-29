import { CalendarDays, Globe, Store } from 'lucide-react'
import { useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router'

const LINKS = [
  { to: '/dashboard', label: 'Home', icon: Store },
  { to: '/atlas', label: 'World Map', icon: Globe },
  { to: '/vacay', label: 'Events', icon: CalendarDays },
]

/**
 * The top bar a visitor sees before signing in: the logo, the three public pages
 * and the way in. Sign in sends them back to the page they were on.
 */
export default function GuestNavbar() {
  const location = useLocation()
  // Pages offset their content by --nav-h; on a phone it is 0 because the app shell owns the chrome.
  useEffect(() => {
    const root = document.documentElement
    const before = root.style.getPropertyValue('--nav-h')
    root.style.setProperty('--nav-h', '60px')
    return () => { if (before) root.style.setProperty('--nav-h', before); else root.style.removeProperty('--nav-h') }
  }, [])
  const back = encodeURIComponent(location.pathname + location.search)
  return (
    <header
      className="fixed inset-x-0 top-0 z-40 flex h-[60px] items-center gap-3 border-b px-3 sm:px-6"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
    >
      <Link to="/atlas" className="flex flex-none items-center gap-2 no-underline" aria-label="Udyami Manch home">
        <img src="/icons/icon-dark.svg" alt="" className="h-8 w-8 rounded-lg dark:hidden" />
        <img src="/icons/icon-white.svg" alt="" className="hidden h-8 w-8 rounded-lg dark:block" />
        <span className="hidden text-[15px] font-bold sm:inline" style={{ color: 'var(--text-primary)' }}>Udyami Manch</span>
      </Link>

      <nav className="mx-auto flex items-center gap-1 rounded-full p-1" style={{ background: 'var(--bg-secondary)' }}>
        {LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold no-underline"
            style={({ isActive }) => ({
              background: isActive ? 'var(--bg-card)' : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
            })}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-none items-center gap-2">
        <Link to={`/login?redirect=${back}`} className="rounded-full px-3 py-1.5 text-[13px] font-semibold no-underline" style={{ color: 'var(--text-primary)' }}>
          Sign in
        </Link>
        <Link
          to={`/register?redirect=${back}`}
          className="rounded-full px-4 py-1.5 text-[13px] font-semibold text-white no-underline"
          style={{ background: 'var(--accent)' }}
        >
          Join
        </Link>
      </div>
    </header>
  )
}
