import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import SQLens from './pages/SQLens'
import GitNarrate from './pages/GitNarrate'
import DSAVisualizer from './pages/DSAVisualizer'
import DevMindScore from './pages/DevMindScore'

export default function App() {
  return (
    <Layout>
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
