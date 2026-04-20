import { useNavigate } from 'react-router-dom'
import styles from './Home.module.css'

const TOOLS = [
  {
    to: '/sqllens',
    icon: '◈',
    name: 'SQLens',
    tag: 'SQL Learning',
    desc: 'Type natural language → get SQL + live visual breakdown of every clause. Run queries on a sample database instantly.',
    accent: 'sql',
    features: ['Natural language → SQL', 'Clause-by-clause explainer', 'Live query runner'],
  },
  {
    to: '/gitnarrate',
    icon: '◎',
    name: 'GitNarrate',
    tag: 'Repo Explorer',
    desc: 'Paste any GitHub repo URL → get an AI-generated audio-style walkthrough of its architecture, tech stack and how to contribute.',
    accent: 'git',
    features: ['Architecture breakdown', 'Audio narration script', 'Contribution guide'],
  },
  {
    to: '/dsa',
    icon: '⬡',
    name: 'DSAVisualizer',
    tag: 'Algorithm Trainer',
    desc: 'Watch algorithms animate live while AI narrates every single step in plain English. Like having a tutor beside you.',
    accent: 'dsa',
    features: ['Live animation', 'AI step narration', '8+ algorithms'],
  },
  {
    to: '/score',
    icon: '◆',
    name: 'DevMind Score',
    tag: 'Skill Engine',
    desc: 'Your cross-tool learning graph. The platform watches how you learn across all three tools and builds your personal skill map.',
    accent: 'score',
    features: ['Cross-tool tracking', 'Skill gap detection', 'Smart recommendations'],
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.badge}>AI Developer Learning Platform</div>
          <h1 className={styles.title}>
            Learn SQL. Explore code.<br />Master algorithms.
          </h1>
          <p className={styles.sub}>
            DevMind combines three powerful AI tools into one platform — with a smart learning engine that connects your progress across all of them.
          </p>
          <div className={styles.heroBtns}>
            <button className={styles.primaryBtn} onClick={() => navigate('/sqllens')}>
              Start with SQLens →
            </button>
            <button className={styles.ghostBtn} onClick={() => navigate('/score')}>
              View my DevMind Score
            </button>
          </div>
        </div>
        <div className={styles.heroGrid}>
          <div className={styles.terminal}>
            <div className={styles.termBar}>
              <span /><span /><span />
            </div>
            <div className={styles.termBody}>
              <p><span className={styles.c1}>$</span> devmind start</p>
              <p><span className={styles.c2}>✓</span> SQLens ready</p>
              <p><span className={styles.c3}>✓</span> GitNarrate ready</p>
              <p><span className={styles.c4}>✓</span> DSAVisualizer ready</p>
              <p><span className={styles.c5}>◆</span> DevMind Score: tracking...</p>
              <p className={styles.cursor}>_</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.toolsGrid}>
        {TOOLS.map((t, i) => (
          <div
            key={t.to}
            className={`${styles.toolCard} ${styles[t.accent]}`}
            style={{ animationDelay: `${i * 0.08}s` }}
            onClick={() => navigate(t.to)}
          >
            <div className={styles.toolTop}>
              <span className={styles.toolIcon}>{t.icon}</span>
              <span className={styles.toolTag}>{t.tag}</span>
            </div>
            <h2 className={styles.toolName}>{t.name}</h2>
            <p className={styles.toolDesc}>{t.desc}</p>
            <ul className={styles.toolFeatures}>
              {t.features.map(f => (
                <li key={f}><span>→</span>{f}</li>
              ))}
            </ul>
            <div className={styles.toolCta}>Open {t.name} →</div>
          </div>
        ))}
      </div>

      <div className={styles.patentSection}>
        <div className={styles.patentBadge}>⚖️ Innovation</div>
        <h3 className={styles.patentTitle}>The DevMind Score — cross-tool adaptive learning</h3>
        <p className={styles.patentDesc}>
          Unlike isolated learning tools, DevMind watches your behaviour across SQLens, GitNarrate, and DSAVisualizer
          to build a unified skill graph. When you struggle with SQL JOINs, it suggests the Binary Search Tree
          visualization. When you explore a repo, it links to the algorithms inside it. No other platform does this.
        </p>
      </div>
    </div>
  )
}
