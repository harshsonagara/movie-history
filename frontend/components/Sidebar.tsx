'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Compass, Film, Tv, Bookmark,
  BarChart2, Clock, Plus,
} from 'lucide-react'

const NAV = [
  { href: '/',           label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/discover',   label: 'Discover',   icon: Compass },
  { href: '/movies',     label: 'Movies',     icon: Film },
  { href: '/series',     label: 'Series',     icon: Tv },
  { href: '/watchlist',  label: 'Watchlist',  icon: Bookmark },
  null,
  { href: '/statistics', label: 'Statistics', icon: BarChart2 },
  { href: '/history',    label: 'History',    icon: Clock },
  null,
  { href: '/add',        label: 'Add Content', icon: Plus, highlight: true },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-text">
          <span className="logo-cine">Cine</span>Log
        </span>
        <span className="logo-sub">PERSONAL TRACKER</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item, i) =>
          !item ? (
            <div key={i} className="sidebar-divider" />
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'sidebar-link',
                pathname === item.href ? 'active' : '',
                item.highlight ? 'add-link' : '',
              ].join(' ')}
            >
              <item.icon size={15} strokeWidth={1.75} />
              {item.label}
            </Link>
          )
        )}
      </nav>

      <div className="sidebar-user">
        <div className="user-avatar">C</div>
        <div>
          <div className="user-name">CineLog</div>
          <div className="user-sub">Personal Tracker</div>
        </div>
      </div>
    </aside>
  )
}
