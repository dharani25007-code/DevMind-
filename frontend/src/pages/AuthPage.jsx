import { useState } from 'react'
import axios from 'axios'
import styles from './AuthPage.module.css'

export default function AuthPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
      const res = await axios.post(endpoint, { username, password })
      
      const user = res.data.user
      localStorage.setItem('devmind_user_id', user.id)
      localStorage.setItem('devmind_username', user.username)
      
      if (onLogin) {
        onLogin(user)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.circles}>
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
      </div>
      
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>◈</span>
          <span className={styles.brandName}>DevMind</span>
        </div>
        
        <h2 className={styles.title}>
          {isRegister ? 'Create your Account' : 'Welcome Back'}
        </h2>
        <p className={styles.subtitle}>
          {isRegister 
            ? 'Start your cross-tool adaptive AI developer learning journey today.' 
            : 'Log in to sync your SQL, git architecture, and DSA learning progress.'}
        </p>

        {error && (
          <div className={styles.errorAlert}>
            <span className={styles.errorIcon}>⚠</span>
            <span className={styles.errorMessage}>{error}</span>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="e.g. coder_dev"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
            />
          </div>

          {isRegister && (
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                required
              />
            </div>
          )}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <span className="spinner" />
            ) : isRegister ? (
              'Create Account →'
            ) : (
              'Sign In →'
            )}
          </button>
        </form>

        <div className={styles.switchMode}>
          <span>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button 
            type="button" 
            className={styles.switchBtn} 
            onClick={() => {
              setIsRegister(!isRegister)
              setError('')
              setUsername('')
              setPassword('')
              setConfirmPassword('')
            }}
            disabled={loading}
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  )
}
