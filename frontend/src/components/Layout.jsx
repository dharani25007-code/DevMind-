import { NavLink, useLocation } from 'react-router-dom'
import styles from './Layout.module.css'

const NAV = [
  { to: '/',           label: 'Home',          icon: '⌂',  accent: 'text' },
  { to: '/sqllens',    label: 'SQLens',         icon: '◈',  accent: 'sql'  },
  { to: '/gitnarrate', label: 'GitNarrate',     icon: '◎',  accent: 'git'  },
  { to: '/dsa',        label: 'DSAVisualizer',  icon: '⬡',  accent: 'dsa'  },
  { to: '/score',      label: 'DevMind Score',  icon: '◆',  accent: 'score'},
]

export default function Layout({ children }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>◈</span>
          <span className={styles.brandName}>DevMind</span>
        </div>
        <nav className={styles.nav}>
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''} ${styles[n.accent]}`
              }
            >
              <span className={styles.navIcon}>{n.icon}</span>
              <span className={styles.navLabel}>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <span className={styles.version}>Feel Free to Learn and Explore. </span>
        </div>
      </aside>
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
