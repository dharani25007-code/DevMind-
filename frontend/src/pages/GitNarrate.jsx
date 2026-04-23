import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import styles from './GitNarrate.module.css'

const EXAMPLES = [
  'https://github.com/facebook/react',
  'https://github.com/fastapi/fastapi',
  'https://github.com/vitejs/vite',
  'https://github.com/pallets/flask',
  'https://github.com/django/django',
  'https://github.com/expressjs/express',
]

const LANG_COLORS = {
  JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3572a5',
  Rust: '#dea584', Go: '#00add8', Java: '#b07219', Ruby: '#701516',
  C: '#555555', 'C++': '#f34b7d', Swift: '#ffac45', Kotlin: '#a97bff',
  CSS: '#563d7c', HTML: '#e34c26', Shell: '#89e051',
}

export default function GitNarrate() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gitnarrate_bookmarks') || '[]') } catch { return [] }
  })
  const [bookmarkAdded, setBookmarkAdded] = useState(false)
  const synth = useRef(window.speechSynthesis)
  const utterRef = useRef(null)

  const handleAnalyze = async (u) => {
    const target = u || url
    if (!target.trim()) return
    setLoading(true); setError(''); setResult(null); stopSpeech()
    try {
      const res = await axios.post('/api/gitnarrate/analyze', { repo_url: target })
      setResult({ ...res.data, repo_url: target })
      setActiveTab('overview')
      setBookmarkAdded(false)
    } catch (e) {
      setError(e.response?.data?.error || 'Backend not connected. Run Flask on port 5000.')
    } finally {
      setLoading(false)
    }
  }

  const stopSpeech = () => { synth.current.cancel(); setSpeaking(false); utterRef.current = null }

  const handleSpeak = () => {
    if (!result?.narration) return
    if (speaking) { stopSpeech(); return }
    const utt = new SpeechSynthesisUtterance(result.narration)
    utt.rate = 0.95; utt.pitch = 1
    utt.onend = () => setSpeaking(false)
    utterRef.current = utt
    synth.current.speak(utt)
    setSpeaking(true)
  }

  const addBookmark = () => {
    if (!result) return
    const bm = { title: result.title, url: result.repo_url || url, tagline: result.tagline, ts: Date.now() }
    const updated = [bm, ...bookmarks.filter(b => b.url !== bm.url)].slice(0, 12)
    setBookmarks(updated)
    try { localStorage.setItem('gitnarrate_bookmarks', JSON.stringify(updated)) } catch {}
    setBookmarkAdded(true)
  }

  const removeBookmark = (bmUrl) => {
    const updated = bookmarks.filter(b => b.url !== bmUrl)
    setBookmarks(updated)
    try { localStorage.setItem('gitnarrate_bookmarks', JSON.stringify(updated)) } catch {}
  }

  const copyNarration = () => { if (result?.narration) navigator.clipboard.writeText(result.narration) }

  useEffect(() => () => stopSpeech(), [])

  // Derive language distribution from tech_stack for viz
  const topLang = result?.language
  const langColor = topLang ? (LANG_COLORS[topLang] || 'var(--git)') : 'var(--git)'

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.icon}>◎</span>
          <div>
            <h1 className={styles.title}>GitNarrate</h1>
            <p className={styles.sub}>Any GitHub repo → deep AI-powered code walkthrough</p>
          </div>
        </div>
      </div>

      <div className={styles.inputSection}>
        <div className={styles.inputRow}>
          <input
            className={styles.input}
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
          />
          <button className={styles.analyzeBtn} onClick={() => handleAnalyze()} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Analyze →'}
          </button>
        </div>
        <div className={styles.examples}>
          {EXAMPLES.map(ex => (
            <button key={ex} className={styles.exBtn} onClick={() => { setUrl(ex); handleAnalyze(ex) }}>
              {ex.replace('https://github.com/', '')}
            </button>
          ))}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Bookmarks */}
      {!result && bookmarks.length > 0 && (
        <div className={styles.bookmarksSection}>
          <div className={styles.bookmarksHeader}>
            <span className={styles.bookmarksLabel}>◈ Saved Repos</span>
          </div>
          <div className={styles.bookmarksList}>
            {bookmarks.map(bm => (
              <div key={bm.url} className={styles.bookmarkCard}>
                <div className={styles.bmInfo} onClick={() => { setUrl(bm.url); handleAnalyze(bm.url) }}>
                  <span className={styles.bmTitle}>{bm.title}</span>
                  <span className={styles.bmTagline}>{bm.tagline}</span>
                </div>
                <button className={styles.bmRemove} onClick={() => removeBookmark(bm.url)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className={styles.resultWrap}>
          {/* Repo Card */}
          <div className={styles.repoCard}>
            <div className={styles.repoTop}>
              <div className={styles.repoLeft}>
                <h2 className={styles.repoTitle}>{result.title}</h2>
                <p className={styles.repoTagline}>{result.tagline}</p>
              </div>
              <div className={styles.repoRight}>
                <div className={styles.repoMeta}>
                  <span className={styles.metaBadge}>⭐ {result.stars?.toLocaleString()}</span>
                  <span className={styles.metaBadge} style={{ color: langColor, borderColor: `${langColor}40`, background: `${langColor}10` }}>
                    <span className={styles.langDot} style={{ background: langColor }} />{result.language}
                  </span>
                  <span className={styles.metaBadge} data-level={result.difficulty}>{result.difficulty}</span>
                </div>
                <div className={styles.repoActions}>
                  <button className={`${styles.bookmarkBtn} ${bookmarkAdded ? styles.bookmarked : ''}`} onClick={addBookmark}>
                    {bookmarkAdded ? '◈ Saved' : '+ Save'}
                  </button>
                  <a href={result.repo_url || url} target="_blank" rel="noopener noreferrer" className={styles.openRepoBtn}>
                    Open on GitHub ↗
                  </a>
                </div>
              </div>
            </div>

            {/* Tech Stack */}
            <div className={styles.techRow}>
              {result.tech_stack?.map(t => (
                <span key={t} className={styles.tech}>{t}</span>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            {[['overview','◎ Overview'], ['narration','▶ Narration'], ['files','⊞ Files'], ['contribute','⚙ Contribute']].map(([id, label]) => (
              <button key={id} className={`${styles.tab} ${activeTab === id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(id)}>{label}</button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className={styles.overviewTab}>
              <div className={styles.twoCol}>
                <div className={styles.infoCard}>
                  <div className={styles.cardLabel}>Architecture</div>
                  <p className={styles.archText}>{result.architecture}</p>
                </div>
                <div className={styles.infoCard}>
                  <div className={styles.cardLabel}>Contribution Tip</div>
                  <p className={styles.archText}>{result.contribute_tip}</p>
                </div>
              </div>

              {/* Key Concepts */}
              {result.concepts?.length > 0 && (
                <div className={styles.conceptsCard}>
                  <div className={styles.cardLabel}>Core Concepts Used</div>
                  <div className={styles.conceptsRow}>
                    {result.concepts.map(c => (
                      <span key={c} className={styles.conceptBadge}>{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Difficulty visual */}
              <div className={styles.difficultyCard}>
                <div className={styles.cardLabel}>Codebase Complexity</div>
                <div className={styles.diffRow}>
                  {['Beginner', 'Intermediate', 'Advanced'].map((level, i) => (
                    <div key={level} className={`${styles.diffStep} ${result.difficulty === level ? styles.diffActive : ''}`}
                      data-level={level}>
                      {level}
                    </div>
                  ))}
                </div>
                <div className={styles.diffBar}>
                  <div className={styles.diffFill} data-level={result.difficulty}
                    style={{ width: result.difficulty === 'Beginner' ? '33%' : result.difficulty === 'Intermediate' ? '66%' : '100%' }} />
                </div>
              </div>
            </div>
          )}

          {/* Narration Tab */}
          {activeTab === 'narration' && (
            <div className={styles.narrationCard}>
              <div className={styles.narrationHeader}>
                <span className={styles.narLabel}>AI Narration Script</span>
                <div className={styles.narActions}>
                  <button className={styles.copyNarBtn} onClick={copyNarration}>Copy Text</button>
                  <button
                    className={`${styles.speakBtn} ${speaking ? styles.speaking : ''}`}
                    onClick={handleSpeak}
                  >
                    {speaking ? '⏹ Stop' : '▶ Play Audio'}
                  </button>
                </div>
              </div>
              {speaking && (
                <div className={styles.audioBar}>
                  {Array.from({length: 24}).map((_, i) => (
                    <div key={i} className={styles.audioWave} style={{ animationDelay: `${i * 0.07}s` }} />
                  ))}
                </div>
              )}
              <ul className={styles.narBulletList}>
                {result.narration.split('\n\n').filter(p => p.trim()).map((para, i) => {
                  const clean = para.trim().replace(/^\*\*.*?\*\*\n?/gm, '').replace(/^\d+\.\s*/, '').trim()
                  return clean ? <li key={i} className={styles.narBulletItem}>{clean}</li> : null
                })}
              </ul>
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && result.key_files?.length > 0 && (
            <div className={styles.filesCard}>
              <div className={styles.cardLabel}>Key Files — What each does</div>
              <div className={styles.filesList}>
                {result.key_files.map((f, i) => {
                  const ext = f.path.split('.').pop()?.toLowerCase()
                  const extColors = { py:'#3572a5', js:'#f7df1e', ts:'#3178c6', jsx:'#61dafb', tsx:'#3178c6', md:'#888', yml:'#f59e0b', yaml:'#f59e0b', json:'#34d399', css:'#563d7c', html:'#e34c26', go:'#00add8', rs:'#dea584' }
                  return (
                    <div key={i} className={styles.fileRow}>
                      <div className={styles.fileLeft}>
                        <span className={styles.fileExt} style={{ background: `${extColors[ext] || '#8b89a8'}20`, color: extColors[ext] || 'var(--text2)', border: `1px solid ${extColors[ext] || '#8b89a8'}40` }}>
                          .{ext}
                        </span>
                        <span className={styles.filePath}>{f.path}</span>
                      </div>
                      <span className={styles.filePurpose}>{f.purpose}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Contribute Tab */}
          {activeTab === 'contribute' && (
            <div className={styles.contributeTab}>
              <div className={styles.contributeCard}>
                <div className={styles.cardLabel}>How to Contribute</div>
                <p className={styles.archText} style={{ marginBottom: '1.25rem' }}>{result.contribute_tip}</p>

                <div className={styles.stepsGrid}>
                  {[
                    { n:'1', title:'Fork & Clone', desc:`git clone [your-fork] && cd ${result.title?.split('/').pop() || 'repo'}` },
                    { n:'2', title:'Read the Docs', desc:'Check README, CONTRIBUTING.md, and open issues labeled "good first issue"' },
                    { n:'3', title:'Make Changes', desc:'Create a feature branch, make your changes with clear commit messages' },
                    { n:'4', title:'Submit PR', desc:'Push your branch and open a pull request with a description of your changes' },
                  ].map(s => (
                    <div key={s.n} className={styles.stepCard}>
                      <span className={styles.stepNum}>{s.n}</span>
                      <div>
                        <span className={styles.stepTitle}>{s.title}</span>
                        <p className={styles.stepDesc}>{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.quickCommands}>
                  <div className={styles.cardLabel} style={{ marginBottom: '.5rem' }}>Quick Commands</div>
                  {[
                    `git clone ${result.repo_url || url}`,
                    'git checkout -b my-feature',
                    'git add . && git commit -m "feat: my change"',
                    'git push origin my-feature',
                  ].map((cmd, i) => (
                    <div key={i} className={styles.cmdRow}>
                      <code className={styles.cmdCode}>{cmd}</code>
                      <button className={styles.cmdCopy} onClick={() => navigator.clipboard.writeText(cmd)}>Copy</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}