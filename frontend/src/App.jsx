import { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'

const Home = lazy(() => import('./pages/Home'))
const SQLens = lazy(() => import('./pages/SQLens'))
const GitNarrate = lazy(() => import('./pages/GitNarrate'))
const DSAVisualizer = lazy(() => import('./pages/DSAVisualizer'))
const DevMindScore = lazy(() => import('./pages/DevMindScore'))
const AuthPage = lazy(() => import('./pages/AuthPage'))

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let userId = localStorage.getItem('devmind_user_id')
    let username = localStorage.getItem('devmind_username')
    if (!userId || !username) {
      userId = 'guest_101'
      username = 'Developer Learner'
      localStorage.setItem('devmind_user_id', userId)
      localStorage.setItem('devmind_username', username)
    }
    setUser({ id: userId, username })
    setLoading(false)
  }, [])

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser)
  }

  const handleLogout = () => {
    localStorage.removeItem('devmind_user_id')
    localStorage.removeItem('devmind_username')
    setUser(null)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)'
      }}>
        <div className="spinner" style={{ marginRight: '10px' }} /> Loading...
      </div>
    )
  }

  const pageFallback = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      gap: '12px',
      color: 'var(--text-muted)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div className="spinner" style={{ width: '28px', height: '28px', borderTopColor: 'var(--primary)' }} />
      <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em' }}>Loading DevMind Experience...</span>
    </div>
  )

  if (!user) {
    return (
      <Suspense fallback={pageFallback}>
        <AuthPage onLogin={handleLogin} />
      </Suspense>
    )
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Suspense fallback={pageFallback}>
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/sqllens"     element={<SQLens />} />
          <Route path="/gitnarrate"  element={<GitNarrate />} />
          <Route path="/dsa"         element={<DSAVisualizer />} />
          <Route path="/score"       element={<DevMindScore />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
