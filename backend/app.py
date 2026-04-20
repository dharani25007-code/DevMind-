from flask import Flask, request, jsonify
from flask_cors import CORS
import requests, os, json, re, sqlite3, tempfile
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "your-groq-api-key-here")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.1-8b-instant"

SCORE_DB = "devmind_scores.db"

# ─── DB SETUP ───────────────────────────────────────────────────────────────

def init_db():
    conn = sqlite3.connect(SCORE_DB)
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tool TEXT, concept TEXT, score INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS skill_map (
        concept TEXT PRIMARY KEY,
        tool TEXT, attempts INTEGER DEFAULT 0,
        avg_score REAL DEFAULT 0, last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")
    conn.commit()
    conn.close()

init_db()

# ─── GROQ HELPER ─────────────────────────────────────────────────────────────

def groq_chat(messages, max_tokens=1024, temperature=0.2):
    # Add system-level constraint if not present
    if not any(m.get("role") == "system" for m in messages):
        messages.insert(0, {"role": "system", "content": "You are a senior technical architect and specialized AI tutor. Your responses must be highly detailed, technically accurate, and provide deep conceptual insights. Use professional terminology and real-world analogies. CRITICAL: Your output must be a VALID JSON object. Ensure all brackets, braces, and quotes are perfectly balanced and escaped."})

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {"model": MODEL, "messages": messages,
                "max_tokens": max_tokens, "temperature": temperature}
    res = requests.post(GROQ_URL, headers=headers, json=payload, timeout=30)
    if res.status_code != 200:
        print(f"Groq API Error: {res.status_code} - {res.text}")
    res.raise_for_status()
    return res.json()["choices"][0]["message"]["content"]

def parse_json(text):
    try:
        # cleanup markdown blocks
        clean = re.sub(r"```json|```", "", text).strip()
        
        # fix literal newlines in strings before finding bounds
        # this is tricky but sometimes models put real newlines inside "..."
        # we try to replace them with \n
        
        # find the first { and last }
        start = clean.find('{')
        end = clean.rfind('}')
        if start != -1 and end != -1:
            clean = clean[start:end+1]

        # try to parse
        return json.loads(clean, strict=False)
    except Exception as e:
        # attempt basic repair for missing closing braces
        if 'Expecting' in str(e) or 'Unterminated' in str(e):
            try:
                repaired = clean
                if not repaired.endswith('}'): repaired += '}'
                return json.loads(repaired, strict=False)
            except: pass
        
        print(f"DEBUG: JSON Parse Error at line/col. Full text below:\n{text}\n")
        print(f"JSON Parse Error: {str(e)}")
        # fallback for very messy output: try to find anything that looks like a JSON field
        if '"sql":' in text and '"explanation":' in text:
            # try a more desperate regex
            match = re.search(r"(\{.*\})", text, re.DOTALL)
            if match:
                try: return json.loads(match.group())
                except: pass
        raise e

# ─── SQLLENS ─────────────────────────────────────────────────────────────────

@app.route("/api/sqllens/generate", methods=["POST"])
def sqllens_generate():
    data = request.json
    nl = data.get("query", "")
    schema = data.get("schema", "")

    schema_hint = f"\nDatabase schema:\n{schema}" if schema else ""
    prompt = f"""You are a SQL Performance Architect and Expert Tutor. Convert this natural language query to highly optimized SQL and provide a comprehensive, multi-layered explanation.{schema_hint}

Natural language user intent: "{nl}"

Return ONLY a JSON object with this EXACT structure:
{{
  "sql": "the optimized SQL query",
  "explanation": "A detailed, 3-4 sentence technical breakdown of the query logic, including the conceptual approach and any performance considerations (like indexing or join order).",
  "clauses": [
    {{
      "name": "SELECT|FROM|WHERE|JOIN|GROUP BY|ORDER BY|etc.",
      "part": "exact fragment from generated query",
      "meaning": "Highly detailed explanation of what this specific clause accomplishes, referencing specific columns and the technical reason for its inclusion."
    }}
  ],
  "concepts": ["list", "of", "relational", "database", "concepts", "used"],
  "performance_tip": "A specific tip on how this query can be optimized for larger datasets (e.g., specific indexes, partitioning, or query plan considerations).",
  "difficulty": "Beginner|Intermediate|Advanced"
}}
Include all relevant clauses that appear in the query. Ensure the explanation is technical and precise."""

    try:
        result = groq_chat([{"role": "user", "content": prompt}], max_tokens=2048)
        parsed = parse_json(result)

        # track learning event
        for concept in parsed.get("concepts", []):
            track_event("sqllens", concept, 70)

        return jsonify(parsed)
    except Exception as e:
        return jsonify({"error": f"AI generation failed: {str(e)}"}), 500


@app.route("/api/sqllens/run", methods=["POST"])
def sqllens_run():
    data = request.json
    sql = data.get("sql", "")

    # safety check - only allow SELECT
    if not sql.strip().upper().startswith("SELECT"):
        return jsonify({"error": "Only SELECT queries allowed for safety."}), 400

    # run on in-memory sample DB
    try:
        conn = sqlite3.connect(":memory:")
        c = conn.cursor()
        # seed enriched sample data
        c.executescript("""
            CREATE TABLE employees (
                id INTEGER PRIMARY KEY, 
                name TEXT, 
                role TEXT,
                department TEXT, 
                salary REAL, 
                hire_date TEXT,
                experience_years INTEGER,
                last_project TEXT
            );
            INSERT INTO employees VALUES 
                (1,'Alice Johnson','Senior Engineer','Engineering',125000,'2021-03-15',8,'Cloud Migration'),
                (2,'Bob Smith','Marketing Lead','Marketing',82000,'2020-07-01',12,'Q3 Campaign'),
                (3,'Carol Williams','Backend Architect','Engineering',155000,'2019-11-20',15,'Distributed Core'),
                (4,'Dave Miller','HR Coordinator','HR',68000,'2022-01-10',3,'Policy Refresh'),
                (5,'Eve Chen','Frontend Dev','Engineering',98000,'2021-09-05',5,'UI Overhaul'),
                (6,'Frank Wright','SEO Specialist','Marketing',78000,'2020-03-22',6,'Site Ranking'),
                (7,'Grace Hopper','Director of People','HR',140000,'2018-06-30',22,'Organizational Growth'),
                (8,'Henry Ford','Supply Chain Lead','Operations',92000,'2021-12-01',10,'Global Logistics'),
                (9,'Isabel Diaz','DevOps Engineer','Engineering',115000,'2022-04-15',7,'CI/CD Pipeline'),
                (10,'Jack Black','Content Strategist','Marketing',85000,'2021-02-10',9,'Social Media Push');

            CREATE TABLE products (
                id INTEGER PRIMARY KEY, 
                name TEXT, 
                category TEXT, 
                price REAL, 
                stock INTEGER,
                brand TEXT,
                release_year INTEGER
            );
            INSERT INTO products VALUES 
                (1,'UltraBook Pro 14','Electronics',1299.99,45,'Zenth',2023),
                (2,'SmartStream Phone 12','Electronics',899.99,120,'Phono',2024),
                (3,'ErgoDesk 5000','Furniture',499.99,25,'WorkWell',2022),
                (4,'Aura Gaming Chair','Furniture',349.99,80,'ComfortX',2023),
                (5,'SonicNoise Headphones','Electronics',249.99,210,'Audiophile',2023),
                (6,'Vista UHD Monitor','Electronics',449.99,65,'Visuals',2022),
                (7,'CloudKey Mechanical KB','Peripherals',159.99,150,'MechType',2024),
                (8,'Precision Mouse Z','Peripherals',89.50,300,'LogiPlus',2023);

            CREATE TABLE orders (
                id INTEGER PRIMARY KEY, 
                customer TEXT, 
                product_id INTEGER, 
                quantity INTEGER, 
                order_date TEXT, 
                total REAL,
                status TEXT,
                shipping_region TEXT
            );
            INSERT INTO orders VALUES 
                (1,'Alice Johnson',1,1,'2024-01-15',1299.99,'Delivered','North America'),
                (2,'Bob Smith',2,2,'2024-01-20',1799.98,'Delivered','Europe'),
                (3,'Carol Williams',5,1,'2024-02-01',249.99,'Pending','North America'),
                (4,'Dave Miller',3,1,'2024-02-10',499.99,'Delivered','Asia'),
                (5,'Alice Johnson',6,1,'2024-02-15',449.99,'Shipped','North America'),
                (6,'Eve Chen',2,1,'2024-03-01',899.99,'Delivered','Asia'),
                (7,'Jack Black',7,2,'2024-03-12',319.98,'Pending','Europe'),
                (8,'Isabel Diaz',1,1,'2024-03-15',1299.99,'Shipped','South America');
        """)
        rows = c.execute(sql).fetchall()
        cols = [d[0] for d in c.description] if c.description else []
        conn.close()
        return jsonify({"columns": cols, "rows": rows[:50]})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ─── GITNARRATE ───────────────────────────────────────────────────────────────

@app.route("/api/gitnarrate/analyze", methods=["POST"])
def gitnarrate_analyze():
    data = request.json
    repo_url = data.get("repo_url", "")

    # extract owner/repo
    match = re.search(r"github\.com/([^/]+)/([^/\s?#]+)", repo_url)
    if not match:
        return jsonify({"error": "Invalid GitHub URL"}), 400

    owner, repo = match.group(1), match.group(2).removesuffix(".git")

    headers = {"Accept": "application/vnd.github.v3+json",
               "User-Agent": "DevMind-App"}
    gh_token = os.environ.get("GITHUB_TOKEN", "")
    if gh_token and "your_github_token" not in gh_token:
        headers["Authorization"] = f"token {gh_token}"

    base = f"https://api.github.com/repos/{owner}/{repo}"

    # fetch repo info
    try:
        repo_info_res = requests.get(base, headers=headers, timeout=10)
        repo_info_res.raise_for_status()
        repo_info = repo_info_res.json()
    except requests.exceptions.ConnectionError:
        return jsonify({"error": "GitHub API unreachable. Check your internet connection."}), 503
    except Exception as e:
        return jsonify({"error": f"Failed to fetch repo info: {str(e)}"}), 400

    # fetch README
    readme_text = ""
    try:
        readme_b64 = requests.get(f"{base}/readme", headers=headers, timeout=10).json()
        if "content" in readme_b64:
            import base64
            readme_text = base64.b64decode(readme_b64["content"]).decode("utf-8", errors="ignore")[:3000]
    except:
        pass

    # fetch top files
    try:
        tree = requests.get(f"{base}/git/trees/HEAD?recursive=1", headers=headers, timeout=10).json()
        files = [f["path"] for f in tree.get("tree", []) if f["type"] == "blob"][:30]
    except:
        files = []

    # fetch recent commits
    try:
        commits_raw = requests.get(f"{base}/commits?per_page=5", headers=headers, timeout=10).json()
        commits = [c["commit"]["message"].split("\n")[0] for c in commits_raw if isinstance(c, dict)]
    except:
        commits = []

    # build AI prompt
    prompt = f"""You are a Lead Software Architect providing a forensic audio walkthrough of a GitHub repository. Your goal is to explain not just WHAT the code does, but WHY it was designed this way.

Repository: {owner}/{repo}
Description: {repo_info.get('description', 'No description')}
Primary Language: {repo_info.get('language', 'Unknown')}
Stats: {repo_info.get('stargazers_count', 0)} stars, {repo_info.get('forks_count', 0)} forks

README Insights:
{readme_text[:2500]}

File Structure Context:
{chr(10).join(files[:30])}

Recent development activity:
{chr(10).join(commits)}

Return ONLY a JSON object with this EXACT structure:
{{
  "title": "Comprehensive Title",
  "tagline": "A sophisticated one-sentence value proposition",
  "narration": "A 350-500 word deeply technical audio script. Structure it as: 1. High-level technical philosophy. 2. Forensic analysis of the core engine/logic. 3. Evaluation of design patterns used. 4. Scaling or performance trade-offs noted. 5. Future-proofing or contribution roadmap. Use a professional, authoritative, yet engaging tone.",
  "tech_stack": ["comprehensive", "list", "including", "frameworks", "and", "utilities"],
  "architecture": "A detailed 4-5 sentence architectural breakdown, explaining the interaction between major components and data flow patterns.",
  "key_files": [{{"path": "path/to/file", "purpose": "In-depth technical role of this file in the overall system architecture"}}],
  "concepts": ["advanced", "architectural", "and", "programming", "concepts"],
  "difficulty": "Beginner|Intermediate|Advanced",
  "contribute_tip": "A strategic tip for a senior contributor looking to optimize or refactor a core module."
}}"""

    try:
        result = groq_chat([{"role": "user", "content": prompt}], max_tokens=2500)
        parsed = parse_json(result)
        parsed["stars"] = repo_info.get("stargazers_count", 0)
        parsed["language"] = repo_info.get("language", "Unknown")
        parsed["repo_url"] = repo_url

        for concept in parsed.get("concepts", []):
            track_event("gitnarrate", concept, 65)

        return jsonify(parsed)
    except Exception as e:
        return jsonify({"error": f"AI analysis failed: {str(e)}"}), 500


# ─── DSA VISUALIZER ──────────────────────────────────────────────────────────

@app.route("/api/dsa/explain", methods=["POST"])
def dsa_explain():
    data = request.json
    algorithm = data.get("algorithm", "bubble_sort")
    state = data.get("state", {})
    step = data.get("step", 0)
    arr = data.get("array", [])

    prompt = f"""You are a specialized Discrete Mathematics and Algorithm Professor narrating a live visualization. Your goal is to explain the mathematical and logical rationale behind every micro-operation.

Algorithm: {algorithm}
Current state of the structure: {arr}
Current step in sequence: {step}
Precise execution state data: {json.dumps(state)}

Return ONLY a JSON object with this EXACT structure:
{{
  "narration": "A highly detailed 4-5 sentence technical explanation. Precisely describe the state change, the comparison logic being applied, and the invariant being maintained at this specific step.",
  "mathematical_insight": "A one-sentence explanation of the mathematical principle or complexity implication at play here (e.g., how this reduces the remaining search space).",
  "key_insight": "A technical observation about why this specific operation is critical for the algorithm's correctness or efficiency.",
  "complexity_note": "A note on how this specific step contributes to the overall Big O time or space complexity.",
  "next_hint": "A predictive technical hint about the next state transition based on current logical conditions."
}}"""

    try:
        result = groq_chat([{"role": "user", "content": prompt}], max_tokens=300)
        parsed = parse_json(result)

        track_event("dsa", algorithm, 75)
        return jsonify(parsed)
    except Exception as e:
        return jsonify({"error": f"DSA explanation failed: {str(e)}"}), 500


@app.route("/api/dsa/overview", methods=["POST"])
def dsa_overview():
    data = request.json
    algorithm = data.get("algorithm", "bubble_sort")

    prompt = f"""You are a Computer Science Professor and Systems Engineer. Provide a comprehensive, high-level overview of the {algorithm} algorithm, focusing on its theoretical foundations and real-world application in enterprise systems.

Return ONLY a JSON object with this EXACT structure:
{{
  "name": "Full Technical Name of the Algorithm",
  "description": "A detailed 3-4 sentence description covering its core logic, historical context, and the fundamental problem it solves.",
  "time_complexity": {{
    "best": "O(?) with a brief condition (e.g., already sorted)",
    "average": "O(?)",
    "worst": "O(?) with a brief condition (e.g., reverse sorted)"
  }},
  "space_complexity": "O(?) with explanation of auxiliary space usage",
  "theoretical_foundation": "The core mathematical or logical principle (e.g., Divide and Conquer, Greedy approach, etc.)",
  "production_use_cases": [
    "A specific real-world example (e.g., 'Used in the Linux kernel for task scheduling')",
    "Another specific example (e.g., 'Used in database engines for B-Tree indexing')"
  ],
  "key_concept": "The single most important technical invariant to understand for this algorithm.",
  "concepts": ["list", "of", "advanced", "computer", "science", "and", "mathematical", "concepts"]
}}"""

    try:
        result = groq_chat([{"role": "user", "content": prompt}])
        return jsonify(parse_json(result))
    except Exception as e:
        return jsonify({"error": f"DSA overview failed: {str(e)}"}), 500


# ─── DEVMIND SCORE ENGINE ─────────────────────────────────────────────────────

def track_event(tool, concept, score):
    try:
        conn = sqlite3.connect(SCORE_DB)
        c = conn.cursor()
        c.execute("INSERT INTO events (tool, concept, score) VALUES (?,?,?)",
                  (tool, concept, score))
        c.execute("""INSERT INTO skill_map (concept, tool, attempts, avg_score)
                     VALUES (?, ?, 1, ?)
                     ON CONFLICT(concept) DO UPDATE SET
                     attempts = attempts + 1,
                     avg_score = (avg_score * attempts + ?) / (attempts + 1),
                     last_updated = CURRENT_TIMESTAMP""",
                  (concept, tool, score, score))
        conn.commit()
        conn.close()
    except:
        pass


@app.route("/api/devmind/score", methods=["GET"])
def devmind_score():
    try:
        conn = sqlite3.connect(SCORE_DB)
        c = conn.cursor()

        skills = c.execute("SELECT concept, tool, attempts, avg_score FROM skill_map ORDER BY avg_score DESC").fetchall()
        events = c.execute("SELECT tool, COUNT(*) as cnt FROM events GROUP BY tool").fetchall()
        recent = c.execute("SELECT tool, concept, score, timestamp FROM events ORDER BY timestamp DESC LIMIT 10").fetchall()
        conn.close()

        tool_counts = {row[0]: row[1] for row in events}
        total_sessions = sum(tool_counts.values())
        overall_score = round(sum(s[3] for s in skills) / len(skills), 1) if skills else 0

        skill_list = [{"concept": s[0], "tool": s[1], "attempts": s[2], "score": round(s[3], 1)} for s in skills]

        # build cross-tool recommendations
        recommendations = build_recommendations(skill_list)

        return jsonify({
            "overall_score": overall_score,
            "total_sessions": total_sessions,
            "tool_counts": tool_counts,
            "skills": skill_list[:20],
            "recent_activity": [{"tool": r[0], "concept": r[1], "score": r[2], "time": r[3]} for r in recent],
            "recommendations": recommendations,
            "level": get_level(overall_score)
        })
    except Exception as e:
        return jsonify({"overall_score": 0, "total_sessions": 0, "tool_counts": {},
                        "skills": [], "recent_activity": [], "recommendations": [],
                        "level": "Beginner", "error": str(e)})


def build_recommendations(skills):
    recs = []
    sql_concepts = {s["concept"] for s in skills if s["tool"] == "sqllens"}
    dsa_concepts = {s["concept"] for s in skills if s["tool"] == "dsa"}
    git_concepts = {s["concept"] for s in skills if s["tool"] == "gitnarrate"}

    if sql_concepts and not dsa_concepts:
        recs.append({"from_tool": "SQLens", "to_tool": "DSAVisualizer",
                     "message": "You've been practising SQL joins — try visualising Binary Search Trees to understand how databases index data."})
    if dsa_concepts and not sql_concepts:
        recs.append({"from_tool": "DSAVisualizer", "to_tool": "SQLens",
                     "message": "You know sorting algorithms — try writing ORDER BY queries in SQLens to see them in a real database context."})
    if git_concepts and not dsa_concepts:
        recs.append({"from_tool": "GitNarrate", "to_tool": "DSAVisualizer",
                     "message": "You explored real repos — try visualising the algorithms those repos implement in DSAVisualizer."})
    if len(sql_concepts) >= 2 and len(dsa_concepts) >= 2:
        recs.append({"from_tool": "All Tools", "to_tool": "GitNarrate",
                     "message": "Great progress! Explore a real open-source project on GitNarrate that uses both SQL and your practised algorithms."})
    return recs


def get_level(score):
    if score >= 85: return "Expert"
    if score >= 70: return "Advanced"
    if score >= 50: return "Intermediate"
    return "Beginner"


@app.route("/api/devmind/suggest", methods=["POST"])
def devmind_suggest():
    data = request.json
    current_tool = data.get("tool", "")
    concept = data.get("concept", "")

    prompt = f"""A developer just used {current_tool} and learned about "{concept}".

Suggest how they should continue learning across these tools: SQLens (SQL practice), GitNarrate (real GitHub repos), DSAVisualizer (algorithm animations).

Return ONLY a JSON object:
{{
  "next_tool": "SQLens|GitNarrate|DSAVisualizer",
  "reason": "one sentence why this next tool connects to what they just learned",
  "suggested_action": "specific thing to try next (e.g. 'Try a GROUP BY query', 'Explore the redis repo', 'Visualize QuickSort')"
}}"""

    try:
        result = groq_chat([{"role": "user", "content": prompt}], max_tokens=200)
        return jsonify(parse_json(result))
    except Exception as e:
        return jsonify({"error": f"Suggestion failed: {str(e)}"}), 500


@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "DevMind API", "version": "1.0.0"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
