import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import styles from './DevMindScore.module.css'

const TOOL_META = {
  sqllens:    { label: 'SQLens',        color: 'var(--sql)',   icon: '◈' },
  gitnarrate: { label: 'GitNarrate',    color: 'var(--git)',   icon: '◎' },
  dsa:        { label: 'DSAVisualizer', color: 'var(--dsa)',   icon: '⬡' },
}

const TOOL_ROUTES = {
  SQLens: '/sqllens', GitNarrate: '/gitnarrate', DSAVisualizer: '/dsa'
}

export default function DevMindScore() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { fetchScore() }, [])

  const fetchScore = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/devmind/score')
      setData(res.data)
    } catch {
      setData({
        overall_score: 0, total_sessions: 0, tool_counts: {},
        skills: [], recent_activity: [], recommendations: [], level: 'Beginner'
      })
    } finally {
      setLoading(false)
    }
  }

  const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
  const levelIdx = data ? LEVELS.indexOf(data.level) : 0
  const levelPct = data ? ((levelIdx + 1) / LEVELS.length) * 100 : 0

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.icon}>✧</span>
          <div>
            <h1 className={styles.title}>DevMind Score</h1>
            <p className={styles.sub}>Your cross-tool adaptive skill map</p>
          </div>
        </div>
        <button className={styles.refreshBtn} onClick={fetchScore}>↻ Refresh</button>
      </div>

      {loading ? (
        <div className={styles.loadingWrap}>
          <div className="spinner" />
          <p>Loading your skill map...</p>
        </div>
      ) : (
        <>
          <div className={styles.scoreHero}>
            <div className={styles.bigScore}>
              <span className={styles.scoreNum}>{data.overall_score || '—'}</span>
              <span className={styles.scoreMax}>/100</span>
            </div>
            <div className={styles.scoreRight}>
              <div className={styles.levelRow}>
                {LEVELS.map((l, i) => (
                  <div key={l} className={`${styles.levelStep} ${i <= levelIdx ? styles.levelActive : ''}`}>
                    {l}
                  </div>
                ))}
              </div>
              <div className={styles.levelBar}>
                <div className={styles.levelFill} style={{ width: `${levelPct}%` }} />
              </div>
              <p className={styles.sessionsLabel}>{data.total_sessions} total learning sessions</p>
            </div>
          </div>

          <div className={styles.toolGrid}>
            {Object.entries(TOOL_META).map(([key, meta]) => {
              const count = data.tool_counts?.[key] || 0
              return (
                <div key={key} className={styles.toolCard} style={{ '--tc': meta.color }}>
                  <div className={styles.toolTop}>
                    <span className={styles.toolIcon}>{meta.icon}</span>
                    <span className={styles.toolLabel}>{meta.label}</span>
                  </div>
                  <div className={styles.toolSessions}>{count}</div>
                  <div className={styles.toolSubLabel}>sessions</div>
                  <div className={styles.toolBar}>
                    <div className={styles.toolBarFill} style={{ width: `${Math.min(count * 10, 100)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          {data.recommendations?.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Smart Recommendations</div>
              <div className={styles.recList}>
                {data.recommendations.map((r, i) => (
                  <div key={i} className={styles.recCard}>
                    <div className={styles.recFlow}>
                      <span className={styles.recFrom}>{r.from_tool}</span>
                      <span className={styles.recArrow}>→</span>
                      <span className={styles.recTo}>{r.to_tool}</span>
                    </div>
                    <p className={styles.recMsg}>{r.message}</p>
                    <button
                      className={styles.recBtn}
                      onClick={() => navigate(TOOL_ROUTES[r.to_tool] || '/')}
                    >
                      Open {r.to_tool} →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.skills?.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Skill Map</div>
              <div className={styles.skillsGrid}>
                {data.skills.map((s, i) => {
                  const meta = TOOL_META[s.tool] || { color: 'var(--text2)', icon: '·' }
                  return (
                    <div key={i} className={styles.skillCard}>
                      <div className={styles.skillTop}>
                        <span className={styles.skillConcept}>{s.concept}</span>
                        <span className={styles.skillIcon} style={{ color: meta.color }}>{meta.icon}</span>
                      </div>
                      <div className={styles.skillBar}>
                        <div className={styles.skillFill} style={{ width: `${s.score}%`, background: meta.color }} />
                      </div>
                      <div className={styles.skillMeta}>
                        <span style={{ color: meta.color }}>{s.score}/100</span>
                        <span>{s.attempts} attempt{s.attempts !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {data.recent_activity?.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Recent Activity</div>
              <div className={styles.activityList}>
                {data.recent_activity.map((a, i) => {
                  const meta = TOOL_META[a.tool] || { color: 'var(--text2)', icon: '·', label: a.tool }
                  return (
                    <div key={i} className={styles.actItem}>
                      <span className={styles.actIcon} style={{ color: meta.color }}>{meta.icon}</span>
                      <span className={styles.actConcept}>{a.concept}</span>
                      <span className={styles.actTool} style={{ color: meta.color }}>{meta.label}</span>
                      <span className={styles.actScore}>{a.score}/100</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {data.total_sessions === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>◆</div>
              <h3>Your skill map is empty</h3>
              <p>Start using SQLens, GitNarrate, or DSAVisualizer and your progress will appear here automatically.</p>
              <div className={styles.emptyBtns}>
                <button onClick={() => navigate('/sqllens')}>Try SQLens →</button>
                <button onClick={() => navigate('/dsa')}>Try DSAVisualizer →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
