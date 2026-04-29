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
        messages.insert(0, {"role": "system", "content": "You are a senior technical architect and specialized AI tutor. Your responses must be highly detailed, technically accurate, and provide deep conceptual insights. Use professional terminology and real-world analogies. CRITICAL: Your output MUST be ONLY a valid JSON object, nothing else. Ensure all brackets, braces, and quotes are perfectly balanced and escaped. Do not include any markdown, code blocks, or text outside the JSON."})

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {"model": MODEL, "messages": messages,
                "max_tokens": max_tokens, "temperature": temperature}
    res = requests.post(GROQ_URL, headers=headers, json=payload, timeout=60)
    if res.status_code != 200:
        print(f"Groq API Error: {res.status_code} - {res.text}")
    res.raise_for_status()
    return res.json()["choices"][0]["message"]["content"]

def parse_json(text):
    try:
        # cleanup markdown blocks
        clean = re.sub(r"```json|```", "", text).strip()
        
        # find the first { and last }
        start = clean.find('{')
        end = clean.rfind('}')
        if start != -1 and end != -1:
            clean = clean[start:end+1]

        # try to parse
        return json.loads(clean, strict=False)
    except json.JSONDecodeError as e:
        # Strategy 1: Replace literal newlines inside quoted strings
        try:
            # Use regex to find strings and replace internal newlines with spaces
            def replace_internal_newlines(match):
                s = match.group(0)
                # Replace newlines with space, preserving escaped quotes
                s = s.replace('\n', ' ').replace('\r', ' ')
                return s
            
            # Find all quoted strings and replace newlines within them
            clean_v2 = re.sub(r'"[^"]*"', replace_internal_newlines, clean)
            result = json.loads(clean_v2, strict=False)
            return result
        except:
            pass
        
        # Strategy 2: Extract just the critical fields using regex
        try:
            result = {}
            
            # Extract title
            title_match = re.search(r'"title"\s*:\s*"([^"]*)"', clean)
            if title_match:
                result['title'] = title_match.group(1)
            
            # Extract tagline
            tagline_match = re.search(r'"tagline"\s*:\s*"([^"]*)"', clean)
            if tagline_match:
                result['tagline'] = tagline_match.group(1)
            
            # Extract narration (may have newlines)
            narration_match = re.search(r'"narration"\s*:\s*"((?:[^"\\]|\\.)*)"', clean, re.DOTALL)
            if narration_match:
                narration_text = narration_match.group(1)
                # Unescape known escape sequences
                narration_text = narration_text.replace('\\n', '\n').replace('\\r', '\r')
                result['narration'] = narration_text
            
            # Try to extract tech_stack array
            tech_match = re.search(r'"tech_stack"\s*:\s*\[(.*?)\]', clean, re.DOTALL)
            if tech_match:
                tech_text = tech_match.group(1)
                techs = re.findall(r'"([^"]*)"', tech_text)
                result['tech_stack'] = techs
            
            # Extract architecture
            arch_match = re.search(r'"architecture"\s*:\s*"((?:[^"\\]|\\.)*)"', clean, re.DOTALL)
            if arch_match:
                result['architecture'] = arch_match.group(1).replace('\\n', '\n')
            
            # Extract difficulty
            diff_match = re.search(r'"difficulty"\s*:\s*"([^"]*)"', clean)
            if diff_match:
                result['difficulty'] = diff_match.group(1)
            
            if result:
                return result
        except:
            pass
        
        # Strategy 3: Try fixing missing closing braces
        try:
            repaired = clean
            if not repaired.endswith('}'): repaired += '}'
            return json.loads(repaired, strict=False)
        except:
            pass
        
        print(f"DEBUG: JSON Parse Error. Error: {str(e)}")
        print(f"Full text:\n{text[:1000]}\n...")
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

def difficulty_to_score(diff, base=70):
    d = str(diff).lower()
    if "advanced" in d: return 92
    if "intermediate" in d: return 78
    if "beginner" in d: return 62
    return base

    try:
        result = groq_chat([{"role": "user", "content": prompt}], max_tokens=2048)
        parsed = parse_json(result)

        # track learning event
        score = difficulty_to_score(parsed.get("difficulty", "Intermediate"), base=70)
        for concept in parsed.get("concepts", []):
            track_event("sqllens", concept, score)

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
    prompt = f"""You are a Lead Software Architect providing a technical analysis of a GitHub repository.

Repository: {owner}/{repo}
Description: {repo_info.get('description', 'No description')}
Primary Language: {repo_info.get('language', 'Unknown')}
Stats: {repo_info.get('stargazers_count', 0)} stars, {repo_info.get('forks_count', 0)} forks

README: {readme_text[:2000]}
Files: {chr(10).join(files[:20])}
Recent commits: {chr(10).join(commits)}

RESPOND WITH ONLY VALID JSON. NO OTHER TEXT. Ensure all strings use proper escaping. Return exactly this structure:
{{
  "title": "Repository Title",
  "tagline": "One sentence value proposition",
  "narration": "A technical 300-word analysis",
  "tech_stack": ["list", "of", "technologies"],
  "architecture": "2-3 sentences on architecture",
  "key_files": [{{"path": "file.py", "purpose": "What it does"}}],
  "concepts": ["concepts"],
  "difficulty": "Beginner|Intermediate|Advanced",
  "contribute_tip": "Tip for contributors"
}}"""

    try:
        result = groq_chat([{"role": "user", "content": prompt}], max_tokens=2500)
        parsed = parse_json(result)
        parsed["stars"] = repo_info.get("stargazers_count", 0)
        parsed["language"] = repo_info.get("language", "Unknown")
        parsed["repo_url"] = repo_url

        score = difficulty_to_score(parsed.get("difficulty", "Intermediate"), base=65)
        for concept in parsed.get("concepts", []):
            track_event("gitnarrate", concept, score)

        return jsonify(parsed)
    except Exception as e:
        return jsonify({"error": f"AI analysis failed: {str(e)}"}), 500


# ─── DSA VISUALIZER ──────────────────────────────────────────────────────────

@app.route("/api/dsa/explain", methods=["POST"])
def dsa_explain():
    data = request.json
    algorithm = data.get("algorithm", "bubble_sort")
    
    ALGO_COMPLEXITY_SCORES = {
        "bubble": 45, "insertion": 48, "selection": 50, "shell": 65, "counting": 68, "radix": 72, "cycle": 75,
        "merge": 82, "quick": 85, "heap": 88, "tim": 92,
        "bfs": 75, "dfs": 78, "dijkstra": 95, "bellman": 90, "astar": 98, "toposort": 85, "prim": 92, "kruskal": 92, "floyd": 95, "tarjan": 98,
        "lcs": 94, "knapsack": 96, "edit_dist": 92, "matrix_chain": 98, "lis": 95, "coin": 88,
        "nqueens": 95, "huffman": 88, "sudoku": 98, "subset_sum": 94
    }
    base_score = ALGO_COMPLEXITY_SCORES.get(algorithm, 70)
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
        result = groq_chat([{"role": "user", "content": prompt}], max_tokens=600)
        parsed = parse_json(result)

        track_event("dsa", algorithm, base_score)
        return jsonify(parsed)
    except Exception as e:
        return jsonify({"error": f"DSA explanation failed: {str(e)}"}), 500


@app.route("/api/dsa/overview", methods=["POST"])
def dsa_overview():
    data = request.json
    algorithm = data.get("algorithm", "bubble_sort")

    # Map algorithm IDs to human-readable names
    ALGO_NAMES = {
        # Sorting
        "bubble":          "Bubble Sort",
        "insertion":        "Insertion Sort",
        "selection":        "Selection Sort",
        "merge":            "Merge Sort",
        "quick":            "Quick Sort",
        "heap":             "Heap Sort",
        "counting":         "Counting Sort",
        "radix":            "Radix Sort",
        "shell":            "Shell Sort",
        "tim":              "TimSort",
        "cycle":            "Cycle Sort",
        # Graph
        "bfs":              "Breadth-First Search (BFS)",
        "dfs":              "Depth-First Search (DFS)",
        "dijkstra":         "Dijkstra's Shortest Path",
        "bellman":          "Bellman-Ford Algorithm",
        "astar":            "A* Search Algorithm",
        "toposort":         "Topological Sort (Kahn's Algorithm)",
        "prim":             "Prim's Minimum Spanning Tree",
        "kruskal":          "Kruskal's Minimum Spanning Tree",
        "floyd":            "Floyd-Warshall All-Pairs Shortest Paths",
        "tarjan":           "Tarjan's Strongly Connected Components",
        # Tree
        "bst_insert":       "Binary Search Tree Insert",
        "bst_search":       "Binary Search Tree Search",
        "inorder":          "In-Order Tree Traversal",
        "preorder":         "Pre-Order Tree Traversal",
        "postorder":        "Post-Order Tree Traversal",
        "avl":              "AVL Tree Rotation",
        "segtree":          "Segment Tree (Range Sum Query)",
        "fenwick":          "Fenwick Tree / Binary Indexed Tree",
        "trie":             "Trie (Prefix Tree)",
        # Linked List
        "ll_insert":        "Linked List Insert",
        "ll_delete":        "Linked List Delete",
        "ll_reverse":       "Linked List Reverse",
        "ll_cycle":         "Floyd's Cycle Detection (Tortoise & Hare)",
        "ll_merge":         "Merge Two Sorted Linked Lists",
        # Dynamic Programming
        "lcs":              "Longest Common Subsequence (LCS)",
        "knapsack":         "0/1 Knapsack Problem",
        "edit_dist":        "Edit Distance (Levenshtein Distance)",
        "matrix_chain":     "Matrix Chain Multiplication",
        "lis":              "Longest Increasing Subsequence (LIS)",
        "coin":             "Coin Change (Minimum Coins)",
        # Advanced Structures
        "union_find":       "Union-Find / Disjoint Set Union (DSU)",
        "hash_chain":       "Hash Table with Chaining",
        "hash_open":        "Hash Table with Open Addressing (Linear Probing)",
        "heap_insert":      "Min-Heap Insert",
        "heap_extract":     "Min-Heap Extract-Min",
        # Searching
        "binary_search":    "Binary Search",
        "jump":             "Jump Search",
        "exponential":      "Exponential Search",
        "interpolation":    "Interpolation Search",
        "kmp":              "KMP String Matching (Knuth-Morris-Pratt)",
        "rabin_karp":       "Rabin-Karp Rolling Hash String Search",
        # Sliding Window / Two Pointer
        "sw_max":           "Sliding Window Maximum (Monotonic Deque)",
        "sw_sum":           "Sliding Window Sum",
        "two_sum":          "Two Sum (Two Pointer)",
        "three_sum":        "3Sum (Three Pointer)",
        # Backtracking / Misc
        "nqueens":          "N-Queens Backtracking",
        "huffman":          "Huffman Coding (Greedy Compression)",
        "monte_carlo":      "Monte Carlo Simulation (Pi Estimation)",
        "primes_sieve":     "Sieve of Eratosthenes",
        "gcd_euclid":       "Euclidean GCD Algorithm",
        "sudoku":           "Sudoku Solver (Backtracking)",
        "subset_sum":       "Subset Sum (Boolean DP)",
        # Legacy IDs kept for backwards compatibility
        "bubble_sort":      "Bubble Sort",
        "selection_sort":   "Selection Sort",
        "insertion_sort":   "Insertion Sort",
        "merge_sort":       "Merge Sort",
        "quick_sort":       "Quick Sort",
        "linear_search":    "Linear Search",
        "binary_search_v1": "Binary Search",
        "tree_inorder":     "In-Order Tree Traversal",
        "tree_preorder":    "Pre-Order Tree Traversal",
        "ll_reverse":       "Linked List Reverse",
    }
    algo_name = ALGO_NAMES.get(algorithm, algorithm.replace("_", " ").title())

    prompt = f"""You are a Computer Science Professor and Systems Engineer. Provide a comprehensive, high-level overview of the {algo_name} algorithm, focusing on its theoretical foundations and real-world application in enterprise systems.

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


@app.route("/api/dsa/code", methods=["POST"])
def dsa_code():
    data = request.json
    algorithm = data.get("algorithm", "bubble_sort")
    language = data.get("language", "python")

    ALGO_NAMES = {
        "bubble": "Bubble Sort", "insertion": "Insertion Sort", "selection": "Selection Sort",
        "merge": "Merge Sort", "quick": "Quick Sort", "heap": "Heap Sort",
        "counting": "Counting Sort", "radix": "Radix Sort", "shell": "Shell Sort",
        "tim": "TimSort", "cycle": "Cycle Sort",
        "bfs": "Breadth-First Search", "dfs": "Depth-First Search",
        "dijkstra": "Dijkstra's Shortest Path", "bellman": "Bellman-Ford",
        "astar": "A* Search", "toposort": "Topological Sort",
        "prim": "Prim's MST", "kruskal": "Kruskal's MST",
        "floyd": "Floyd-Warshall", "tarjan": "Tarjan's SCC",
        "bst_insert": "BST Insert", "bst_search": "BST Search",
        "inorder": "In-Order Traversal", "preorder": "Pre-Order Traversal",
        "postorder": "Post-Order Traversal", "avl": "AVL Tree Rotation",
        "segtree": "Segment Tree", "fenwick": "Fenwick Tree", "trie": "Trie",
        "ll_insert": "Linked List Insert", "ll_delete": "Linked List Delete",
        "ll_reverse": "Linked List Reverse", "ll_cycle": "Floyd's Cycle Detection",
        "ll_merge": "Merge Sorted Linked Lists",
        "lcs": "Longest Common Subsequence", "knapsack": "0/1 Knapsack",
        "edit_dist": "Edit Distance", "matrix_chain": "Matrix Chain Multiplication",
        "lis": "Longest Increasing Subsequence", "coin": "Coin Change",
        "union_find": "Union-Find DSU", "hash_chain": "Hash Table Chaining",
        "hash_open": "Hash Table Open Addressing",
        "heap_insert": "Min-Heap Insert", "heap_extract": "Min-Heap Extract",
        "binary_search": "Binary Search", "jump": "Jump Search",
        "exponential": "Exponential Search", "interpolation": "Interpolation Search",
        "kmp": "KMP String Matching", "rabin_karp": "Rabin-Karp",
        "sw_max": "Sliding Window Maximum", "sw_sum": "Sliding Window Sum",
        "two_sum": "Two Sum", "three_sum": "3Sum",
        "nqueens": "N-Queens", "huffman": "Huffman Coding",
        "monte_carlo": "Monte Carlo Pi", "primes_sieve": "Sieve of Eratosthenes",
        "gcd_euclid": "Euclidean GCD", "sudoku": "Sudoku Solver",
        "subset_sum": "Subset Sum",
    }
    algo_name = ALGO_NAMES.get(algorithm, algorithm.replace("_", " ").title())

    prompt = f"""You are an expert programmer. Write a complete, correct, well-commented implementation of the {algo_name} algorithm in {language}.

Requirements:
1. The code MUST be 100% correct and runnable
2. Include detailed inline comments explaining each step
3. Include a main function or driver code that demonstrates usage with example input/output
4. Follow best practices and idiomatic style for {language}
5. Include time and space complexity in comments at the top

Return ONLY a JSON object:
{{
  "code": "the complete code as a single string with proper newlines (use \\n for newlines)",
  "language": "{language}",
  "filename": "suggested_filename.ext",
  "explanation": "A 2-3 sentence summary of the implementation approach"
}}"""

    try:
        print(f"DEBUG: Generating code for {algorithm} in {language}")
        result = groq_chat([{"role": "user", "content": prompt}], max_tokens=3500)
        
        parsed = {}
        try:
            parsed = parse_json(result)
        except Exception as parse_err:
            print(f"DEBUG: JSON parse failed, falling back to regex: {str(parse_err)}")
            # If JSON parsing fails, the model likely just dumped the code or messed up escaping
            if "```" in result:
                # Find all code blocks
                code_blocks = re.findall(r"```(?:\w+)?\n(.*?)```", result, re.DOTALL)
                if code_blocks:
                    # Take the largest code block or the last one (often the full implementation)
                    parsed["code"] = max(code_blocks, key=len)
                else:
                    parsed["code"] = result
            else:
                parsed["code"] = result
            
            parsed["language"] = language
            parsed["filename"] = f"{algorithm}.{language}"
            parsed["explanation"] = "Generated code implementation (Fallback parsing)"

        # Final safety check for code field
        if "code" not in parsed or not parsed["code"]:
            parsed["code"] = result
            
        return jsonify(parsed)
    except Exception as e:
        print(f"ERROR: Code generation failed: {str(e)}")
        return jsonify({"error": f"Code generation failed: {str(e)}"}), 500


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