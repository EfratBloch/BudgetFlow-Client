// The frame of every page: the drifting background, the header with logo, role-based menu
// and user box, plus the footer.
import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { roleLabel } from '../utils/format'
import { Aurora, Icon, Logo, type IconName } from './Art'

const guideMenu: { to: string; label: string; icon: IconName }[] = [
  { to: '/dashboard', label: 'דף הבית', icon: 'home' },
  { to: '/participants', label: 'החניכות שלי', icon: 'users' },
  { to: '/meetings', label: 'המפגשים שלי', icon: 'calendar' },
  { to: '/equipment', label: 'מחסן ציוד', icon: 'box' },
]

const coordinatorMenu: { to: string; label: string; icon: IconName }[] = [
  { to: '/dashboard', label: 'דף הבית', icon: 'home' },
  { to: '/guides', label: 'מדריכות', icon: 'user' },
  { to: '/branch-participants', label: 'כל החניכות', icon: 'users' },
  { to: '/meetings', label: 'המפגשים שלי', icon: 'calendar' },
  { to: '/guide-meetings', label: 'מפגשי המדריכות', icon: 'list' },
  { to: '/additions', label: 'תוספות תקציב', icon: 'coins' },
  { to: '/equipment', label: 'מחסן ציוד', icon: 'box' },
]

export function Layout() {
  const { session, isCoordinator, logout } = useAuth()
  const location = useLocation()
  // The phone menu remembers which page it was opened on, so it closes by itself after navigating
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === location.pathname
  const setOpen = (toggle: (wasOpen: boolean) => boolean) => setOpenOn(toggle(open) ? location.pathname : null)
  const [scrolled, setScrolled] = useState(false)

  // The header gets more glass once the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const menu = session ? (isCoordinator ? coordinatorMenu : guideMenu) : []

  return (
    <div className="app">
      <Aurora />

      <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
        <div className="header-inner">
          <Link to={session ? '/dashboard' : '/'} className="brand">
            <Logo size={38} />
            <span className="brand-name">
              Budget<span>Flow</span>
            </span>
          </Link>

          {session && (
            <button className={`menu-toggle ${open ? 'is-open' : ''}`} onClick={() => setOpen((v) => !v)} aria-label="תפריט" aria-expanded={open}>
              <span />
              <span />
              <span />
            </button>
          )}

          <nav className={`nav ${open ? 'nav-open' : ''}`}>
            {menu.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon name={item.icon} size={17} />
                {item.label}
              </NavLink>
            ))}
            {session && (
              <div className="user-box user-box-mobile">
                <button className="btn btn-ghost btn-small" onClick={logout}>
                  <Icon name="logout" size={16} /> יציאה
                </button>
              </div>
            )}
          </nav>

          {session ? (
            <div className="user-box">
              <span className="avatar">{session.fullName.slice(0, 1)}</span>
              <span className="user-text">
                <strong>{session.fullName}</strong>
                <span className={`role-badge role-${session.role}`}>{roleLabel[session.role]}</span>
              </span>
              <button className="btn btn-ghost btn-small" onClick={logout}>
                <Icon name="logout" size={16} /> יציאה
              </button>
            </div>
          ) : (
            location.pathname !== '/login' && (
              <Link to="/login" className="btn btn-primary btn-small">
                כניסה
              </Link>
            )
          )}
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <Logo size={20} /> BudgetFlow · ניהול תקציב, מפגשים וציוד לסניף
      </footer>
    </div>
  )
}

// Pages that need a logged-in user (optionally a coordinator)
export function RequireAuth({ coordinatorOnly = false }: { coordinatorOnly?: boolean }) {
  const { session, isCoordinator } = useAuth()
  const location = useLocation()
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (coordinatorOnly && !isCoordinator) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
