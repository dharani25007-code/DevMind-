import { useState } from 'react'
import axios from 'axios'
import styles from './SQLens.module.css'

const EXAMPLES = [
  "Show me all employees in Engineering with salary above 90000",
  "Find the top 3 products by price in Electronics category",
  "Count orders per customer and show only those with more than 1 order",
  "Get average salary by department ordered highest first",
]

const CLAUSE_COLORS = {
  SELECT: '#38bdf8', FROM: '#a78bfa', WHERE: '#34d399',
  JOIN: '#f59e0b', GROUP: '#f87171', ORDER: '#fb923c',
  HAVING: '#e879f9', LIMIT: '#94a3b8',
}

export default function SQLens() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [runResult, setRunResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [activeClause, setActiveClause] = useState(null)

  const handleGenerate = async (q) => {
    const text = q || query
    if (!text.trim()) return
    setLoading(true); setError(''); setResult(null); setRunResult(null)
    try {
      const res = await axios.post('/api/sqllens/generate', { query: text })
      setResult(res.data)
      setActiveClause(null)
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
      </div>

      <div className={styles.inputSection}>
        <div className={styles.inputWrap}>
          <textarea
            className={styles.textarea}
            placeholder="Describe what data you want in plain English..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            rows={3}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleGenerate() }}
          />
          <button className={styles.generateBtn} onClick={() => handleGenerate()} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Generate SQL →'}
          </button>
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
                <button
                  className={styles.copyBtn}
                  onClick={() => navigator.clipboard.writeText(result.sql)}
                >Copy</button>
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
              {result.concepts.map(c => (
                <span key={c} className={styles.concept}>{c}</span>
              ))}
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
                <thead>
                  <tr>{runResult.columns?.map(c => <th key={c}>{c}</th>)}</tr>
                </thead>
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

      <div className={styles.schemaHint}>
        <div className={styles.sectionLabel}>Sample database schema</div>
        <div className={styles.schemaGrid}>
          {[
            { name: 'employees', cols: 'id, name, role, department, salary, hire_date, experience_years, last_project' },
            { name: 'products',  cols: 'id, name, category, price, stock, brand, release_year' },
            { name: 'orders',    cols: 'id, customer, product_id, quantity, order_date, total, status, shipping_region' },
          ].map(t => (
            <div key={t.name} className={styles.schemaTable}>
              <span className={styles.tableName}>{t.name}</span>
              <span className={styles.tableCols}>{t.cols}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
