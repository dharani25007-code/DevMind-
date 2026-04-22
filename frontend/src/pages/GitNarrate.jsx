import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import styles from './GitNarrate.module.css'

const EXAMPLES = [
  'https://github.com/facebook/react',
  'https://github.com/fastapi/fastapi',
  'https://github.com/vitejs/vite',
  'https://github.com/pallets/flask',
]

export default function GitNarrate() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [narrationIdx, setNarrationIdx] = useState(0)
  const synth = useRef(window.speechSynthesis)
  const utterRef = useRef(null)

  const handleAnalyze = async (u) => {
    const target = u || url
    if (!target.trim()) return
    setLoading(true); setError(''); setResult(null); stopSpeech()
    try {
      const res = await axios.post('/api/gitnarrate/analyze', { repo_url: target })
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.error || 'Backend not connected. Run Flask on port 5000.')
    } finally {
      setLoading(false)
    }
  }

  const stopSpeech = () => {
    synth.current.cancel()
    setSpeaking(false)
    utterRef.current = null
  }

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

  useEffect(() => () => stopSpeech(), [])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.icon}>◎</span>
          <div>
            <h1 className={styles.title}>GitNarrate</h1>
            <p className={styles.sub}>Any GitHub repo → AI audio walkthrough</p>
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

      {result && (
        <div className={styles.resultWrap}>
          <div className={styles.repoCard}>
            <div className={styles.repoTop}>
              <div>
                <h2 className={styles.repoTitle}>{result.title}</h2>
                <p className={styles.repoTagline}>{result.tagline}</p>
              </div>
              <div className={styles.repoMeta}>
                <span className={styles.metaBadge}>⭐ {result.stars?.toLocaleString()}</span>
                <span className={styles.metaBadge} style={{color:'var(--git)'}}>{result.language}</span>
                <span className={styles.metaBadge} data-level={result.difficulty}>{result.difficulty}</span>
              </div>
            </div>
          </div>

          <div className={styles.narrationCard}>
            <div className={styles.narrationHeader}>
              <span className={styles.narLabel}>AI Narration Script</span>
              <button
                className={`${styles.speakBtn} ${speaking ? styles.speaking : ''}`}
                onClick={handleSpeak}
              >
                {speaking ? '⏹ Stop' : '▶ Play Audio'}
              </button>
            </div>
            {speaking && (
              <div className={styles.audioBar}>
                {Array.from({length: 20}).map((_, i) => (
                  <div key={i} className={styles.audioWave} style={{ animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>
            )}
            <ul className={styles.narBulletList}>
              {result.narration.split('\n\n').filter(p => p.trim()).map((para, i) => {
                const cleanPara = para.trim().replace(/^\*\*.*?\*\*\n?/gm, '').replace(/^\d+\.\s*/, '').trim()
                return cleanPara ? <li key={i} className={styles.narBulletItem}>{cleanPara}</li> : null
              })}
            </ul>
          </div>

          <div className={styles.twoCol}>
            <div className={styles.infoCard}>
              <div className={styles.cardLabel}>Architecture</div>
              <p className={styles.archText}>{result.architecture}</p>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.cardLabel}>Contribution tip</div>
              <p className={styles.archText}>{result.contribute_tip}</p>
            </div>
          </div>

          {result.key_files?.length > 0 && (
            <div className={styles.filesCard}>
              <div className={styles.cardLabel}>Key Files</div>
              <div className={styles.filesList}>
                {result.key_files.map((f, i) => (
                  <div key={i} className={styles.fileRow}>
                    <span className={styles.filePath}>{f.path}</span>
                    <span className={styles.filePurpose}>{f.purpose}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.techRow}>
            {result.tech_stack?.map(t => (
              <span key={t} className={styles.tech}>{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
