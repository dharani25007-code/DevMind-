import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import SQLens from './pages/SQLens'
import GitNarrate from './pages/GitNarrate'
import DSAVisualizer from './pages/DSAVisualizer'
import DevMindScore from './pages/DevMindScore'
import AuthPage from './pages/AuthPage'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = localStorage.getItem('devmind_user_id')
    const username = localStorage.getItem('devmind_username')
    if (userId && username) {
      setUser({ id: userId, username })
    }
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

  if (!user) {
    return <AuthPage onLogin={handleLogin} />
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/sqllens"     element={<SQLens />} />
        <Route path="/gitnarrate"  element={<GitNarrate />} />
        <Route path="/dsa"         element={<DSAVisualizer />} />
        <Route path="/score"       element={<DevMindScore />} />
      </Routes>
    </Layout>
  )
}
