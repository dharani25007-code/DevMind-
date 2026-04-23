<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=38bdf8&height=200&section=header&text=DevMind&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=AI%20Developer%20Learning%20Platform&descAlignY=60&descAlign=50" width="100%"/>

<br/>

[![Typing SVG](https://readme-typing-svg.demolab.com?font=JetBrains+Mono&size=22&duration=3000&pause=1000&color=38BDF8&center=true&vCenter=true&multiline=true&repeat=true&width=700&height=80&lines=Learn+SQL+with+AI+%E2%97%88+SQLens;Explore+GitHub+Repos+%E2%97%8E+GitNarrate;Master+Algorithms+%E2%AC%A1+DSAVisualizer)](https://git.io/typing-svg)

<br/>

![DevMind](https://img.shields.io/badge/DevMind-v1.0-38bdf8?style=for-the-badge&logo=openai&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-Free_API-FF6B35?style=for-the-badge&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-22c55e?style=for-the-badge)

<br/>

> **DevMind** is a unified AI-powered learning platform that combines SQL practice, GitHub repo exploration, and algorithm visualization — connected by a **patent-pending cross-tool adaptive learning engine** that builds your personal skill graph across all three tools.

<br/>

[🚀 Get Started](#-getting-started) · [📖 Docs](#-api-endpoints) · [💡 Innovation](#%EF%B8%8F-the-innovation--devmind-score) · [🗺️ Roadmap](#-roadmap) · [🤝 Contribute](#-contributing)

</div>

---

## 📸 Platform Overview

<div align="center">

| | Tool | What it does | Color |
|---|---|---|---|
| ◈ | **SQLens** | Type in plain English → get SQL + live visual clause breakdown + run it instantly | `#38bdf8` |
| ◎ | **GitNarrate** | Paste any GitHub URL → AI generates a podcast-style audio walkthrough of the repo | `#a78bfa` |
| ⬡ | **DSAVisualizer** | Watch 60+ algorithms animate live while AI narrates every single step | `#34d399` |
| ◆ | **DevMind Score** | Cross-tool skill graph — tracks your progress across all 3 tools and recommends what to learn next | `#f59e0b` |

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### ◈ SQLens
- 🔤 Natural language → SQL conversion
- 🎨 Color-coded clause-by-clause visual breakdown
- 🖱️ Click any SQL clause to understand what it does
- ▶️ Live query runner on 3 real sample tables
- 📊 Difficulty rating (Beginner / Intermediate / Advanced)

</td>
<td width="50%">

### ◎ GitNarrate
- 🔗 Analyze any public GitHub repository instantly
- 🎙️ AI-generated podcast-style narration script
- 🔊 Browser text-to-speech playback — zero API cost
- 📁 Key files breakdown + tech stack detection
- 🏗️ Architecture summary + contribution guide

</td>
</tr>
<tr>
<td width="50%">

### ⬡ DSAVisualizer
- 🎬 60+ algorithms spanning Sorting, Graphs, Trees, DP, Strings, and Advanced Data Structures
- 🌈 Color-coded live bar chart animation
- ⚡ Speed control slider (slow to blazing fast)
- 🤖 AI narration at each step in plain English
- 📐 Algorithm complexity reference (Best / Avg / Worst / Space)

</td>
<td width="50%">

### ◆ DevMind Score ⚖️ Patent Pending
- 🧠 Tracks every interaction across all 3 tools
- 🗺️ Per-concept skill scoring with progress bars
- 🔗 Cross-tool recommendations (unique innovation)
- 🏆 Level progression: Beginner → Expert
- 📈 Recent activity feed + session history

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
devmind/
├── 📄 README.md
├── 📄 LICENSE
├── 📄 CONTRIBUTING.md
├── 📄 .gitignore
│
├── 🐍 backend/
│   ├── app.py                  # Flask API — 8 endpoints across 4 tools
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # API key template
│   └── devmind_scores.db       # Auto-created SQLite skill tracker
│
└── ⚛️  frontend/
    ├── index.html              # HTML entry point + Google Fonts
    ├── package.json            # React 18 + Vite 5 + Axios
    ├── vite.config.js          # Dev server + API proxy to Flask
    └── src/
        ├── main.jsx            # React entry — BrowserRouter wrapper
        ├── App.jsx             # Route definitions (5 pages)
        ├── index.css           # Global dark theme + CSS design tokens
        ├── components/
        │   ├── Layout.jsx      # Persistent sidebar with NavLinks
        │   └── Layout.module.css
        └── pages/
            ├── Home.jsx        # Landing page with terminal animation
            ├── SQLens.jsx      # NL → SQL + clause explainer + runner
            ├── GitNarrate.jsx  # Repo analyzer + Web Speech API
            ├── DSAVisualizer.jsx  # Algorithm animation + AI narration
            └── DevMindScore.jsx   # Adaptive skill dashboard
```

---

## 🔌 API Endpoints

### ◈ SQLens
| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/api/sqllens/generate` | Convert natural language → SQL with clause-by-clause breakdown |
| `POST` | `/api/sqllens/run` | Execute SELECT query on in-memory SQLite sample database |

### ◎ GitNarrate
| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/api/gitnarrate/analyze` | Fetch GitHub repo data + generate AI narration script |

### ⬡ DSAVisualizer
| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/api/dsa/explain` | AI narration for current animation frame/state |
| `POST` | `/api/dsa/overview` | Algorithm complexity + key concept explanation |

### ◆ DevMind Score
| Method | Endpoint | Description |
|:---:|---|---|
| `GET` | `/api/devmind/score` | Full cross-tool skill map + smart recommendations |
| `POST` | `/api/devmind/suggest` | Next learning action based on current tool + concept |
| `GET` | `/health` | Backend health check |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A free [Groq API key](https://console.groq.com)

### 1. Clone the repo

```bash
git clone https://github.com/dharani25007-code/devmind.git
cd devmind
```

### 2. Backend setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
```

Now open `.env` and add your key:
```env
GROQ_API_KEY=your_groq_api_key_here
```

```bash
# Start Flask server
python app.py
# ✅ Running at http://localhost:5000
```

### 3. Frontend setup

```bash
cd frontend

npm install
npm run dev
# ✅ Running at http://localhost:5173
```

> **Both servers must run simultaneously.** Open two terminals.

### 4. Get your free Groq API key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for free (no credit card needed)
3. Go to **API Keys** → **Create API Key**
4. Paste it into `backend/.env`

Groq runs **Llama3-8B completely free** at hundreds of tokens per second — faster than OpenAI GPT-4.

---




## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + React Router 6 | SPA with client-side routing |
| **Bundler** | Vite 5 | Dev server + production build |
| **Styling** | CSS Modules + CSS Variables | Scoped styles, dark theme |
| **HTTP Client** | Axios | API calls to Flask backend |
| **Backend** | Python 3.10 + Flask 3.0 | REST API server |
| **AI Model** | Llama3-8B via Groq | Free, fast AI inference |
| **Skill DB** | SQLite | Persistent cross-tool skill tracking |
| **Query Runner** | In-memory SQLite | Safe live SQL execution |
| **Audio** | Web Speech API | Browser-native TTS, zero cost |
| **Repo Data** | GitHub REST API | Free, 60 requests/hr |
| **Fonts** | Space Grotesk + JetBrains Mono | Google Fonts, free |

</div>

---

## 🌱 Roadmap

- [x] SQLens — NL to SQL with clause explainer
- [x] GitNarrate — repo audio walkthrough
- [x] DSAVisualizer — 60+ algorithms with AI narration
- [x] DevMind Score — cross-tool adaptive engine
- [ ] Merge Sort + Quick Sort full step visualization
- [ ] User accounts + persistent score history across sessions
- [x] More algorithms: Dijkstra, BFS, DFS, Heap Sort, DP, Tree Traversal and more
- [ ] SQL challenge mode with scoring and leaderboard
- [ ] Export DevMind Score as shareable PDF report
- [ ] Mobile responsive layout improvements
- [ ] Deploy on Render (backend) + Vercel (frontend) — free tier
- [ ] Dark/light theme toggle

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Fork → branch → commit → PR
git checkout -b feature/your-feature-name
git commit -m "feat: describe your change"
git push origin feature/your-feature-name
```

**Good first issues:**
- Add a new algorithm to DSAVisualizer
- Add more SQL example queries to SQLens
- Improve mobile responsiveness

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

## 👨‍💻 Author

<div align="center">

<img src="https://github.com/dharani25007-code.png" width="100" style="border-radius:50%"/>

### Dharanidharan M


*Building things that matter, one commit at a time.*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Dharanidharan_M-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/dharani-dharan-m-370083376/)
[![GitHub](https://img.shields.io/badge/GitHub-dharani25007--code-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/dharani25007-code)

</div>

---

<div align="center">

**If DevMind helped you, please consider giving it a ⭐ — it means a lot!**

<img src="https://capsule-render.vercel.app/api?type=waving&color=38bdf8&height=100&section=footer" width="100%"/>

</div>
