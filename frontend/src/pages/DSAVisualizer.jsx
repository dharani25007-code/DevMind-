import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import styles from './DSAVisualizer.module.css'

const ALGORITHMS = [
  { id: 'bubble_sort',    name: 'Bubble Sort',    complexity: 'O(n²)',  space: 'O(1)' },
  { id: 'selection_sort', name: 'Selection Sort', complexity: 'O(n²)',  space: 'O(1)' },
  { id: 'insertion_sort', name: 'Insertion Sort', complexity: 'O(n²)',  space: 'O(1)' },
  { id: 'merge_sort',     name: 'Merge Sort',     complexity: 'O(n log n)', space: 'O(n)' },
  { id: 'quick_sort',     name: 'Quick Sort',     complexity: 'O(n log n)', space: 'O(log n)' },
  { id: 'linear_search',  name: 'Linear Search',  complexity: 'O(n)',   space: 'O(1)' },
  { id: 'binary_search',  name: 'Binary Search',  complexity: 'O(log n)', space: 'O(1)' },
]

function generateArray(n = 16) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 80) + 10)
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

export default function DSAVisualizer() {
  const [algo, setAlgo] = useState(ALGORITHMS[0])
  const [arr, setArr] = useState(generateArray())
  const [highlights, setHighlights] = useState({})
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [step, setStep] = useState(0)
  const [narration, setNarration] = useState(null)
  const [overview, setOverview] = useState(null)
  const [speed, setSpeed] = useState(300)
  const stopRef = useRef(false)
  const synth = useRef(window.speechSynthesis)

  const fetchNarration = useCallback(async (algorithm, array, stepNum, state) => {
    try {
      const res = await axios.post('/api/dsa/explain', {
        algorithm: algorithm.name, array, step: stepNum, state
      })
      setNarration(res.data)
    } catch { }
  }, [])

  const fetchOverview = useCallback(async (algorithm) => {
    try {
      const res = await axios.post('/api/dsa/overview', { algorithm: algorithm.id })
      setOverview(res.data)
    } catch { }
  }, [])

  useEffect(() => {
    fetchOverview(algo)
    reset()
  }, [algo])

  const reset = () => {
    stopRef.current = true
    synth.current.cancel()
    setArr(generateArray())
    setHighlights({})
    setRunning(false)
    setDone(false)
    setStep(0)
    setNarration(null)
  }

  const speak = (text) => {
    synth.current.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 1.1
    synth.current.speak(utt)
  }

  // ── SORTING ALGORITHMS ──────────────────────────────────────────────────

  const bubbleSort = async (a) => {
    const arr = [...a]; let s = 0
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        if (stopRef.current) return
        setHighlights({ comparing: [j, j+1], sorted: Array.from({length: i}, (_, k) => arr.length - 1 - k) })
        await sleep(speed)
        if (arr[j] > arr[j+1]) {
          [arr[j], arr[j+1]] = [arr[j+1], arr[j]]
          setArr([...arr])
          setHighlights({ swapping: [j, j+1], sorted: Array.from({length: i}, (_, k) => arr.length - 1 - k) })
          await sleep(speed)
        }
        s++; setStep(s)
      }
    }
    setHighlights({ sorted: arr.map((_, i) => i) })
    await fetchNarration(algo, arr, s, { phase: 'complete' })
  }

  const selectionSort = async (a) => {
    const arr = [...a]; let s = 0; const sorted = []
    for (let i = 0; i < arr.length; i++) {
      let min = i
      for (let j = i+1; j < arr.length; j++) {
        if (stopRef.current) return
        setHighlights({ comparing: [j, min], min: [min], sorted })
        await sleep(speed)
        if (arr[j] < arr[min]) min = j
        s++; setStep(s)
      }
      if (min !== i) { [arr[i], arr[min]] = [arr[min], arr[i]]; setArr([...arr]) }
      sorted.push(i)
    }
    setHighlights({ sorted: arr.map((_, i) => i) })
    await fetchNarration(algo, arr, s, { phase: 'complete' })
  }

  const insertionSort = async (a) => {
    const arr = [...a]; let s = 0
    for (let i = 1; i < arr.length; i++) {
      const key = arr[i]; let j = i - 1
      setHighlights({ key: [i] })
      await sleep(speed)
      while (j >= 0 && arr[j] > key) {
        if (stopRef.current) return
        arr[j+1] = arr[j]
        setArr([...arr])
        setHighlights({ comparing: [j, j+1], key: [i] })
        await sleep(speed)
        j--; s++; setStep(s)
      }
      arr[j+1] = key
      setArr([...arr])
    }
    setHighlights({ sorted: arr.map((_, i) => i) })
    await fetchNarration(algo, arr, s, { phase: 'complete' })
  }

  const linearSearch = async (a) => {
    const target = a[Math.floor(Math.random() * a.length)]
    let s = 0
    for (let i = 0; i < a.length; i++) {
      if (stopRef.current) return
      setHighlights({ comparing: [i], target })
      await sleep(speed)
      s++; setStep(s)
      if (a[i] === target) {
        setHighlights({ found: [i] })
        await fetchNarration(algo, a, s, { found: true, index: i, target })
        return
      }
    }
    setHighlights({ notfound: true })
  }

  const binarySearch = async (a) => {
    const sorted = [...a].sort((x, y) => x - y)
    setArr(sorted)
    const target = sorted[Math.floor(Math.random() * sorted.length)]
    let lo = 0, hi = sorted.length - 1, s = 0
    while (lo <= hi) {
      if (stopRef.current) return
      const mid = Math.floor((lo + hi) / 2)
      setHighlights({ range: Array.from({length: hi-lo+1}, (_, k) => lo+k), mid: [mid] })
      await sleep(speed * 1.5)
      s++; setStep(s)
      if (sorted[mid] === target) {
        setHighlights({ found: [mid] })
        await fetchNarration(algo, sorted, s, { found: true, index: mid, target })
        return
      }
      if (sorted[mid] < target) lo = mid + 1; else hi = mid - 1
    }
  }

  const runAlgorithm = async () => {
    stopRef.current = false
    setRunning(true); setDone(false); setStep(0); setNarration(null)
    const a = [...arr]

    await fetchNarration(algo, a, 0, { phase: 'start' })

    const map = {
      bubble_sort: bubbleSort, selection_sort: selectionSort,
      insertion_sort: insertionSort, linear_search: linearSearch,
      binary_search: binarySearch,
    }
    const fn = map[algo.id] || bubbleSort
    await fn(a)

    if (!stopRef.current) { setDone(true); setRunning(false) }
  }

  const getBarColor = (i) => {
    if (highlights.found?.includes(i))     return 'var(--dsa)'
    if (highlights.sorted?.includes(i))    return 'var(--dsa)'
    if (highlights.swapping?.includes(i))  return 'var(--red)'
    if (highlights.comparing?.includes(i)) return 'var(--score)'
    if (highlights.min?.includes(i))       return 'var(--git)'
    if (highlights.mid?.includes(i))       return 'var(--git)'
    if (highlights.key?.includes(i))       return 'var(--sql)'
    if (highlights.range?.includes(i))     return 'rgba(52,211,153,.3)'
    return 'var(--bg3)'
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.icon}>⬡</span>
          <div>
            <h1 className={styles.title}>DSAVisualizer</h1>
            <p className={styles.sub}>Live algorithm animation with AI step narration</p>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.algoGrid}>
          {ALGORITHMS.map(a => (
            <button
              key={a.id}
              className={`${styles.algoBtn} ${algo.id === a.id ? styles.algoActive : ''}`}
              onClick={() => { if (!running) setAlgo(a) }}
              disabled={running}
            >
              {a.name}
            </button>
          ))}
        </div>

        <div className={styles.actionRow}>
          <div className={styles.speedWrap}>
            <span className={styles.speedLabel}>Speed</span>
            <input
              type="range" min="50" max="800" step="50"
              value={800 - speed + 50}
              onChange={e => setSpeed(800 - Number(e.target.value) + 50)}
              className={styles.slider}
              disabled={running}
            />
          </div>
          <button className={styles.resetBtn} onClick={reset} disabled={running}>Shuffle</button>
          <button
            className={`${styles.runBtn} ${running ? styles.runBtnStop : ''}`}
            onClick={running ? () => { stopRef.current = true; setRunning(false) } : runAlgorithm}
          >
            {running ? '⏹ Stop' : '▶ Visualize'}
          </button>
        </div>
      </div>

      {overview && (
        <div className={styles.overviewCard}>
          <div className={styles.overviewRow}>
            <div className={styles.overviewMain}>
              <span className={styles.ovLabel}>Algorithm Overview</span>
              <p className={styles.ovDesc}>{overview.description}</p>
              <div className={styles.theoryBox}>
                <span className={styles.theoryLabel}>Theoretical Foundation:</span>
                <span className={styles.theoryVal}>{overview.theoretical_foundation}</span>
              </div>
            </div>
            <div className={styles.complexityGrid}>
              {[
                { label: 'Best', val: overview.time_complexity?.best },
                { label: 'Avg',  val: overview.time_complexity?.average },
                { label: 'Worst',val: overview.time_complexity?.worst },
                { label: 'Space',val: overview.space_complexity },
              ].map(c => (
                <div key={c.label} className={styles.complexBox}>
                  <span className={styles.complexLabel}>{c.label}</span>
                  <span className={styles.complexVal}>{c.val}</span>
                </div>
              ))}
            </div>
          </div>
          {overview.production_use_cases?.length > 0 && (
            <div className={styles.useCases}>
              <span className={styles.useCasesLabel}>Real-world Applications:</span>
              <ul className={styles.useCasesList}>
                {overview.production_use_cases.map((uc, i) => <li key={i}>{uc}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className={styles.vizCard}>
        <div className={styles.vizHeader}>
          <span className={styles.vizLabel}>{algo.name}</span>
          <div className={styles.legend}>
            {[
              { color: 'var(--score)', label: 'Comparing' },
              { color: 'var(--red)',   label: 'Swapping' },
              { color: 'var(--dsa)',   label: 'Sorted/Found' },
            ].map(l => (
              <span key={l.label} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
          <span className={styles.stepCount}>Steps: {step}</span>
        </div>
        <div className={styles.barsWrap}>
          {arr.map((val, i) => (
            <div key={i} className={styles.barCol}>
              <div
                className={styles.bar}
                style={{ height: `${val * 2.2}px`, background: getBarColor(i) }}
              />
              <span className={styles.barVal}>{val}</span>
            </div>
          ))}
        </div>
        {done && <div className={styles.doneMsg}>✓ Complete in {step} steps</div>}
      </div>

      {narration && (
        <div className={styles.narrationCard}>
          <div className={styles.narHeader}>
            <span className={styles.narLabel}>AI Narration</span>
            <button
              className={styles.speakBtn}
              onClick={() => speak(narration.narration)}
            >▶ Speak</button>
          </div>
          <p className={styles.narMain}>{narration.narration}</p>
          <div className={styles.innerInsights}>
            {narration.mathematical_insight && (
              <div className={styles.insightBox}>
                <span className={styles.insightLabel}>Mathematical Logic</span>
                <p>{narration.mathematical_insight}</p>
              </div>
            )}
            {narration.key_insight && (
              <div className={styles.insightBox}>
                <span className={styles.insightLabel}>Step Insight</span>
                <p>{narration.key_insight}</p>
              </div>
            )}
          </div>
          {narration.complexity_note && (
             <p className={styles.complexityNote}><strong>Complexity Check:</strong> {narration.complexity_note}</p>
          )}
          {narration.next_hint && (
            <p className={styles.nextHint}>→ {narration.next_hint}</p>
          )}
        </div>
      )}
    </div>
  )
}
