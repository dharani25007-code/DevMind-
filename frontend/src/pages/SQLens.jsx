import { useState, useRef } from 'react'
import axios from 'axios'
import styles from './SQLens.module.css'

const EXAMPLES = [
  "Show me all employees in Engineering with salary above 90000",
  "Find the top 3 products by price in Electronics category",
  "Count orders per customer and show only those with more than 1 order",
  "Get average salary by department ordered highest first",
  "Find employees who placed orders and show their total spend",
  "Show products that have never been ordered",
]

const CHALLENGES = [
  { title: "JOIN Challenge", desc: "Write a query to find each employee's orders with product names", hint: "INNER JOIN on customer name ↔ employee name", xp: 50 },
  { title: "Aggregation", desc: "Find departments where average salary exceeds 100k", hint: "GROUP BY + HAVING", xp: 40 },
  { title: "Subquery", desc: "Find employees earning more than the company average", hint: "WHERE salary > (SELECT AVG...)", xp: 60 },
  { title: "NULL Handling", desc: "Find orders with no matching product (orphan check)", hint: "LEFT JOIN + IS NULL", xp: 45 },
]

const CLAUSE_COLORS = {
  SELECT: '#38bdf8', FROM: '#a78bfa', WHERE: '#34d399',
  JOIN: '#f59e0b', GROUP: '#f87171', ORDER: '#fb923c',
  HAVING: '#e879f9', LIMIT: '#94a3b8', WITH: '#67e8f9',
}

const SCHEMA = [
  {
    name: 'employees', icon: '👤',
    cols: [
      { name: 'id', type: 'INT', pk: true },
      { name: 'name', type: 'TEXT' },
      { name: 'role', type: 'TEXT' },
      { name: 'department', type: 'TEXT' },
      { name: 'salary', type: 'REAL' },
      { name: 'hire_date', type: 'TEXT' },
      { name: 'experience_years', type: 'INT' },
      { name: 'last_project', type: 'TEXT' },
    ]
  },
  {
    name: 'products', icon: '📦',
    cols: [
      { name: 'id', type: 'INT', pk: true },
      { name: 'name', type: 'TEXT' },
      { name: 'category', type: 'TEXT' },
      { name: 'price', type: 'REAL' },
      { name: 'stock', type: 'INT' },
      { name: 'brand', type: 'TEXT' },
      { name: 'release_year', type: 'INT' },
    ]
  },
  {
    name: 'orders', icon: '🛒',
    cols: [
      { name: 'id', type: 'INT', pk: true },
      { name: 'customer', type: 'TEXT' },
      { name: 'product_id', type: 'INT', fk: 'products.id' },
      { name: 'quantity', type: 'INT' },
      { name: 'order_date', type: 'TEXT' },
      { name: 'total', type: 'REAL' },
      { name: 'status', type: 'TEXT' },
      { name: 'shipping_region', type: 'TEXT' },
    ]
  },
]

export default function SQLens() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [runResult, setRunResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [activeClause, setActiveClause] = useState(null)
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('query') // 'query' | 'schema' | 'challenges'
  const [completedChallenges, setCompletedChallenges] = useState(new Set())
  const [xp, setXp] = useState(0)
  const [copiedIdx, setCopiedIdx] = useState(null)
  const textareaRef = useRef()

  const handleGenerate = async (q) => {
    const text = q || query
    if (!text.trim()) return
    setLoading(true); setError(''); setResult(null); setRunResult(null)
    try {
      const res = await axios.post('/api/sqllens/generate', { query: text })
      setResult(res.data)
      setActiveClause(null)
      setHistory(h => [{ nl: text, sql: res.data.sql, difficulty: res.data.difficulty, ts: Date.now() }, ...h].slice(0, 10))
    } catch (e) {
      setError(e.response?.data?.error || 'Backend not connected. Ensure Flask is running on port 5000.')
    } finally {
      setLoading(false)
    }
  }

  const handleRun = async () => {
    if (!result?.sql) return
    setRunning(true); setRunResult(null)
    try {
      const res = await axios.post('/api/sqllens/run', { sql: result.sql })
      setRunResult(res.data)
    } catch (e) {
      setRunResult({ error: e.response?.data?.error || 'Query failed' })
    } finally {
      setRunning(false)
    }
  }

  const handleRunCustomSQL = async (sql) => {
    setRunning(true); setRunResult(null)
    try {
      const res = await axios.post('/api/sqllens/run', { sql })
      setRunResult(res.data)
    } catch (e) {
      setRunResult({ error: e.response?.data?.error || 'Query failed' })
    } finally {
      setRunning(false)
    }
  }

  const handleCopyHistory = (sql, idx) => {
    navigator.clipboard.writeText(sql)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  const markChallengeComplete = (idx) => {
    if (completedChallenges.has(idx)) return
    setCompletedChallenges(s => new Set([...s, idx]))
    setXp(x => x + CHALLENGES[idx].xp)
  }

  const insertColName = (col) => {
    setQuery(q => q + (q && !q.endsWith(' ') ? ' ' : '') + col)
    textareaRef.current?.focus()
  }

  const getClauseColor = (name) => {
    const key = Object.keys(CLAUSE_COLORS).find(k => name?.toUpperCase().includes(k))
    return key ? CLAUSE_COLORS[key] : '#8b89a8'
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.icon}>◈</span>
          <div>
            <h1 className={styles.title}>SQLens</h1>
            <p className={styles.sub}>Natural language → SQL with live visual explainer</p>
          </div>
        </div>
        {xp > 0 && <div className={styles.xpBadge}>⚡ {xp} XP</div>}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {[['query','◈ Query'], ['schema','⊞ Schema'], ['challenges','⚡ Challenges'], ['history','◷ History']].map(([id, label]) => (
          <button key={id} className={`${styles.tab} ${activeTab === id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(id)}>{label}
            {id === 'history' && history.length > 0 && <span className={styles.tabBadge}>{history.length}</span>}
            {id === 'challenges' && completedChallenges.size > 0 && <span className={styles.tabBadge}>{completedChallenges.size}/{CHALLENGES.length}</span>}
          </button>
        ))}
      </div>

      {/* Query Tab */}
      {activeTab === 'query' && (
        <>
          <div className={styles.inputSection}>
            <div className={styles.inputWrap}>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                placeholder="Describe what data you want in plain English..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                rows={3}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate() }}
              />
              <div className={styles.inputFooter}>
                <span className={styles.inputHint}>⌘ Enter to generate</span>
                <button className={styles.generateBtn} onClick={() => handleGenerate()} disabled={loading}>
                  {loading ? <span className="spinner" /> : 'Generate SQL →'}
                </button>
              </div>
            </div>
            <div className={styles.examples}>
              {EXAMPLES.map(ex => (
                <button key={ex} className={styles.exBtn} onClick={() => { setQuery(ex); handleGenerate(ex) }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {result && (
            <div className={styles.resultWrap}>
              <div className={styles.sqlBlock}>
                <div className={styles.sqlHeader}>
                  <span className={styles.sqlLabel}>Generated SQL</span>
                  <div className={styles.sqlActions}>
                    <span className={styles.diffBadge} data-level={result.difficulty}>{result.difficulty}</span>
                    <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(result.sql)}>Copy</button>
                    <button className={styles.runBtn} onClick={handleRun} disabled={running}>
                      {running ? '...' : '▶ Run'}
                    </button>
                  </div>
                </div>
                <pre className={styles.sqlCode}>{result.sql}</pre>
              </div>

              <div className={styles.explanation}>
                <div className={styles.sectionLabel}>Technical Breakdown</div>
                <p>{result.explanation}</p>
                {result.performance_tip && (
                  <div className={styles.performanceTip}>
                    <span className={styles.tipIcon}>💡</span>
                    <div>
                      <span className={styles.tipLabel}>Performance Insight:</span>
                      <p>{result.performance_tip}</p>
                    </div>
                  </div>
                )}
              </div>

              {result.clauses?.length > 0 && (
                <div className={styles.clauseSection}>
                  <div className={styles.sectionLabel}>Click any clause to understand it</div>
                  <div className={styles.clauses}>
                    {result.clauses.map((cl, i) => (
                      <button
                        key={i}
                        className={`${styles.clause} ${activeClause === i ? styles.clauseActive : ''}`}
                        style={{ '--c': getClauseColor(cl.name) }}
                        onClick={() => setActiveClause(activeClause === i ? null : i)}
                      >
                        <span className={styles.clauseName}>{cl.name}</span>
                        <span className={styles.clausePart}>{cl.part}</span>
                      </button>
                    ))}
                  </div>
                  {activeClause !== null && (
                    <div className={styles.clauseDetail} style={{ '--c': getClauseColor(result.clauses[activeClause]?.name) }}>
                      <span className={styles.clauseDetailName}>{result.clauses[activeClause]?.name}</span>
                      <p>{result.clauses[activeClause]?.meaning}</p>
                    </div>
                  )}
                </div>
              )}

              {result.concepts?.length > 0 && (
                <div className={styles.conceptRow}>
                  {result.concepts.map(c => <span key={c} className={styles.concept}>{c}</span>)}
                </div>
              )}
            </div>
          )}

          {runResult && (
            <div className={styles.runResult}>
              <div className={styles.sectionLabel}>Query Results — Sample Database</div>
              {runResult.error ? (
                <div className={styles.error}>{runResult.error}</div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead><tr>{runResult.columns?.map(c => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>
                      {runResult.rows?.map((row, i) => (
                        <tr key={i}>{row.map((cell, j) => <td key={j}>{cell ?? 'NULL'}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                  <p className={styles.rowCount}>{runResult.rows?.length} row{runResult.rows?.length !== 1 ? 's' : ''} returned</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Schema Tab */}
      {activeTab === 'schema' && (
        <div className={styles.schemaFull}>
          <p className={styles.schemaIntro}>Click any column to insert it into your query. FK = foreign key, PK = primary key.</p>

          {/* ER Diagram */}
          <div className={styles.erDiagram}>
            <svg viewBox="0 0 560 180" className={styles.erSvg}>
              {/* employees box */}
              <rect x="10" y="40" width="140" height="100" rx="8" fill="#111120" stroke="#38bdf8" strokeWidth="1.5" />
              <rect x="10" y="40" width="140" height="28" rx="8" fill="#38bdf820" />
              <text x="80" y="59" fill="#38bdf8" fontSize="11" fontWeight="700" textAnchor="middle">employees</text>
              <text x="20" y="82" fill="#8b89a8" fontSize="9">PK id, name, department</text>
              <text x="20" y="96" fill="#8b89a8" fontSize="9">salary, role, hire_date</text>
              <text x="20" y="110" fill="#8b89a8" fontSize="9">experience_years</text>

              {/* products box */}
              <rect x="210" y="10" width="140" height="90" rx="8" fill="#111120" stroke="#a78bfa" strokeWidth="1.5" />
              <rect x="210" y="10" width="140" height="28" rx="8" fill="#a78bfa20" />
              <text x="280" y="29" fill="#a78bfa" fontSize="11" fontWeight="700" textAnchor="middle">products</text>
              <text x="220" y="52" fill="#8b89a8" fontSize="9">PK id, name, category</text>
              <text x="220" y="66" fill="#8b89a8" fontSize="9">price, stock, brand</text>

              {/* orders box */}
              <rect x="210" y="120" width="160" height="48" rx="8" fill="#111120" stroke="#34d399" strokeWidth="1.5" />
              <rect x="210" y="120" width="160" height="28" rx="8" fill="#34d39920" />
              <text x="290" y="139" fill="#34d399" fontSize="11" fontWeight="700" textAnchor="middle">orders</text>
              <text x="220" y="158" fill="#8b89a8" fontSize="9">FK product_id → products.id</text>

              {/* connector: employees → orders (via customer name) */}
              <line x1="150" y1="100" x2="210" y2="144" stroke="#38bdf840" strokeWidth="1" strokeDasharray="4 3" />
              <text x="175" y="127" fill="#4a4868" fontSize="8">name ↔ customer</text>

              {/* connector: products → orders */}
              <line x1="280" y1="100" x2="280" y2="120" stroke="#a78bfa40" strokeWidth="1" />
              <text x="285" y="113" fill="#4a4868" fontSize="8">FK</text>
            </svg>
          </div>

          <div className={styles.schemaTablesGrid}>
            {SCHEMA.map(table => (
              <div key={table.name} className={styles.schemaTableFull}>
                <div className={styles.schemaTableHeader}>
                  <span className={styles.schemaTableIcon}>{table.icon}</span>
                  <span className={styles.schemaTableName}>{table.name}</span>
                </div>
                <div className={styles.schemaCols}>
                  {table.cols.map(col => (
                    <button key={col.name} className={styles.schemaColBtn}
                      onClick={() => { setActiveTab('query'); insertColName(`${table.name}.${col.name}`) }}>
                      <span className={styles.schemaColName}>{col.name}</span>
                      <div className={styles.schemaColMeta}>
                        <span className={styles.schemaColType}>{col.type}</span>
                        {col.pk && <span className={styles.pkBadge}>PK</span>}
                        {col.fk && <span className={styles.fkBadge}>FK→{col.fk}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className={styles.challengesWrap}>
          <div className={styles.challengesHeader}>
            <p className={styles.challengesIntro}>SQL challenges to deepen your understanding. Generate the SQL, run it, then mark complete.</p>
            <div className={styles.xpTotal}>⚡ {xp} XP earned</div>
          </div>
          <div className={styles.challengesList}>
            {CHALLENGES.map((c, i) => {
              const done = completedChallenges.has(i)
              return (
                <div key={i} className={`${styles.challengeCard} ${done ? styles.challengeDone : ''}`}>
                  <div className={styles.challengeTop}>
                    <div>
                      <span className={styles.challengeTitle}>{c.title}</span>
                      <p className={styles.challengeDesc}>{c.desc}</p>
                    </div>
                    <span className={styles.challengeXp}>+{c.xp} XP</span>
                  </div>
                  <div className={styles.challengeHint}>
                    <span className={styles.hintIcon}>💡</span>
                    <span className={styles.hintText}>{c.hint}</span>
                  </div>
                  <div className={styles.challengeActions}>
                    <button className={styles.challengeTryBtn}
                      onClick={() => { setQuery(c.desc); setActiveTab('query') }}>
                      Try it →
                    </button>
                    {!done && (
                      <button className={styles.challengeMarkBtn} onClick={() => markChallengeComplete(i)}>
                        ✓ Mark Complete
                      </button>
                    )}
                    {done && <span className={styles.challengeCompletedBadge}>✓ Completed</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className={styles.historyWrap}>
          {history.length === 0 ? (
            <div className={styles.emptyHistory}>
              <p>No queries yet — generate some SQL first.</p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {history.map((h, i) => (
                <div key={h.ts} className={styles.historyCard}>
                  <div className={styles.historyTop}>
                    <p className={styles.historyNl}>{h.nl}</p>
                    <div className={styles.historyActions}>
                      <span className={styles.diffBadge} data-level={h.difficulty}>{h.difficulty}</span>
                      <button className={styles.copyBtn} onClick={() => handleCopyHistory(h.sql, i)}>
                        {copiedIdx === i ? '✓ Copied' : 'Copy'}
                      </button>
                      <button className={styles.runBtn} onClick={() => { handleRunCustomSQL(h.sql); setActiveTab('query') }}>▶ Run</button>
                      <button className={styles.reuseBtn} onClick={() => { setQuery(h.nl); setActiveTab('query') }}>Reuse</button>
                    </div>
                  </div>
                  <pre className={styles.historySql}>{h.sql}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schema hint at bottom of query tab */}
      {activeTab === 'query' && (
        <div className={styles.schemaHint}>
          <div className={styles.sectionLabel}>Sample database schema</div>
          <div className={styles.schemaGrid}>
            {SCHEMA.map(t => (
              <div key={t.name} className={styles.schemaTable}>
                <span className={styles.tableName}>{t.icon} {t.name}</span>
                <span className={styles.tableCols}>{t.cols.map(c=>c.name).join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}