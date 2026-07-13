import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import axios from 'axios'
import styles from './Layout.module.css'

const NAV = [
  { to: '/',           label: 'Home',          icon: '⌂',  accent: 'text' },
  { to: '/sqllens',    label: 'SQLens',         icon: '◈',  accent: 'sql'  },
  { to: '/gitnarrate', label: 'GitNarrate',     icon: '◎',  accent: 'git'  },
  { to: '/dsa',        label: 'DSAVisualizer',  icon: '⬡',  accent: 'dsa'  },
  { to: '/score',      label: 'DevMind Score',  icon: '◆',  accent: 'score'},
]

export default function Layout({ children, user, onLogout }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await axios.post('/api/auth/delete')
      onLogout()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete account. Please try again.')
    } finally {
      setDeleting(false)
      setShowConfirm(false)
    }
  }

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
          <div className={styles.userCard}>
            <div className={styles.userHeader}>
              <div className={styles.avatar}>
                {user ? user.username.substring(0, 2).toUpperCase() : 'DV'}
              </div>
              <div className={styles.meta}>
                <div className={styles.username}>{user ? user.username : 'Developer'}</div>
                <div className={styles.role}>Active Learner</div>
              </div>
            </div>
            <div className={styles.userActions}>
              <button className={styles.logoutBtn} onClick={onLogout} title="Sign Out">
                ➔ Sign Out
              </button>
              <button className={styles.deleteBtn} onClick={() => setShowConfirm(true)} title="Delete Account">
                ✕ Delete
              </button>
            </div>
          </div>
        </div>
      </aside>
      
      <main className={styles.main}>
        {children}
      </main>

      {showConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3>Delete Account</h3>
            <p>Are you sure you want to permanently delete your DevMind account? This will erase all your learning milestones, events, and scores. This action cannot be undone.</p>
            <div className={styles.modalBtns}>
              <button 
                className={styles.cancelBtn} 
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className={styles.confirmDeleteBtn} 
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
