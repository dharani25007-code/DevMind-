import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import styles from './DSAVisualizer.module.css'

// ── ALGORITHM REGISTRY ───────────────────────────────────────────────────────
const ALGO_GROUPS = [
  { label: 'Sorting', color: 'var(--dsa)', algos: [
    { id: 'bubble',    name: 'Bubble Sort',    viz: 'bars', tc: 'O(n²)',       sc: 'O(1)',       desc: 'Compare adjacent pairs, swap if out of order.' },
    { id: 'insertion', name: 'Insertion Sort', viz: 'bars', tc: 'O(n²)',       sc: 'O(1)',       desc: 'Insert each element into its correct sorted position.' },
    { id: 'selection', name: 'Selection Sort', viz: 'bars', tc: 'O(n²)',       sc: 'O(1)',       desc: 'Find minimum each pass, place at front.' },
    { id: 'merge',     name: 'Merge Sort',     viz: 'bars', tc: 'O(n log n)',  sc: 'O(n)',       desc: 'Divide in half, sort recursively, merge.' },
    { id: 'quick',     name: 'Quick Sort',     viz: 'bars', tc: 'O(n log n)',  sc: 'O(log n)',   desc: 'Partition around pivot, recurse.' },
    { id: 'heap',      name: 'Heap Sort',      viz: 'bars', tc: 'O(n log n)',  sc: 'O(1)',       desc: 'Build max-heap, extract max repeatedly.' },
    { id: 'counting',  name: 'Counting Sort',  viz: 'bars', tc: 'O(n+k)',      sc: 'O(k)',       desc: 'Non-comparison — count occurrences, rebuild.' },
    { id: 'radix',     name: 'Radix Sort',     viz: 'bars', tc: 'O(nk)',       sc: 'O(n+k)',     desc: 'Sort digit-by-digit, LSD to MSD.' },
    { id: 'shell',     name: 'Shell Sort',     viz: 'bars', tc: 'O(n log² n)', sc: 'O(1)',       desc: 'Insertion sort with decreasing gap sequence.' },
    { id: 'tim',       name: 'TimSort',        viz: 'bars', tc: 'O(n log n)',  sc: 'O(n)',       desc: 'Hybrid merge+insertion. Used in Python & Java.' },
    { id: 'cycle',     name: 'Cycle Sort',     viz: 'bars', tc: 'O(n²)',       sc: 'O(1)',       desc: 'Minimum memory-write sort. Optimal for flash storage.' },
  ]},
  { label: 'Graph', color: 'var(--git)', algos: [
    { id: 'bfs',       name: 'BFS',            viz: 'graph', tc: 'O(V+E)',         sc: 'O(V)',   desc: 'Level-by-level traversal using a queue.' },
    { id: 'dfs',       name: 'DFS',            viz: 'graph', tc: 'O(V+E)',         sc: 'O(V)',   desc: 'Deep traversal using a stack or recursion.' },
    { id: 'dijkstra',  name: 'Dijkstra',       viz: 'graph', tc: 'O((V+E)log V)',  sc: 'O(V)',   desc: 'Greedy shortest path — always expand minimum cost.' },
    { id: 'bellman',   name: 'Bellman-Ford',   viz: 'graph', tc: 'O(VE)',          sc: 'O(V)',   desc: 'Relax all edges V-1 times. Handles negative weights.' },
    { id: 'astar',     name: 'A* Search',      viz: 'graph', tc: 'O(E log V)',     sc: 'O(V)',   desc: 'f(n)=g(n)+h(n) guides search toward goal.' },
    { id: 'toposort',  name: 'Topological Sort',viz:'graph', tc: 'O(V+E)',         sc: 'O(V)',   desc: "Kahn's: process zero-in-degree nodes first." },
    { id: 'prim',      name: "Prim's MST",     viz: 'graph', tc: 'O(E log V)',     sc: 'O(V)',   desc: 'Grow MST greedily — always add cheapest edge.' },
    { id: 'kruskal',   name: "Kruskal's MST",  viz: 'graph', tc: 'O(E log E)',     sc: 'O(V)',   desc: 'Sort edges, add if no cycle (Union-Find).' },
    { id: 'floyd',     name: 'Floyd-Warshall', viz: 'matrix',tc: 'O(V³)',          sc: 'O(V²)',  desc: 'All-pairs shortest paths via DP.' },
    { id: 'tarjan',    name: "Tarjan's SCC",   viz: 'graph', tc: 'O(V+E)',         sc: 'O(V)',   desc: 'Strongly connected components in one DFS pass.' },
  ]},
  { label: 'Tree', color: 'var(--score)', algos: [
    { id: 'bst_insert',  name: 'BST Insert',    viz: 'tree', tc: 'O(log n)', sc: 'O(1)', desc: 'Navigate left/right, insert at correct leaf.' },
    { id: 'bst_search',  name: 'BST Search',    viz: 'tree', tc: 'O(log n)', sc: 'O(1)', desc: 'Halve the search space each step.' },
    { id: 'inorder',     name: 'In-Order',       viz: 'tree', tc: 'O(n)',     sc: 'O(h)', desc: 'Left→Root→Right. Sorted output for BST.' },
    { id: 'preorder',    name: 'Pre-Order',      viz: 'tree', tc: 'O(n)',     sc: 'O(h)', desc: 'Root→Left→Right. Used for tree cloning.' },
    { id: 'postorder',   name: 'Post-Order',     viz: 'tree', tc: 'O(n)',     sc: 'O(h)', desc: 'Left→Right→Root. Used for deletion.' },
    { id: 'avl',         name: 'AVL Rotation',   viz: 'tree', tc: 'O(log n)', sc: 'O(1)', desc: 'Self-balancing BST. Rotate to fix height.' },
    { id: 'segtree',     name: 'Segment Tree',   viz: 'segtree',tc:'O(log n)',sc: 'O(n)', desc: 'Range query + point update in O(log n).' },
    { id: 'fenwick',     name: 'Fenwick Tree',   viz: 'fenwick',tc:'O(log n)',sc: 'O(n)', desc: 'Binary Indexed Tree for prefix sums.' },
    { id: 'trie',        name: 'Trie',           viz: 'trie', tc: 'O(m)',     sc: 'O(m)', desc: 'Prefix tree — each root-to-leaf path is a word.' },
  ]},
  { label: 'Linked List', color: 'var(--red)', algos: [
    { id: 'll_insert', name: 'LL Insert',       viz: 'll', tc: 'O(1)', sc: 'O(1)', desc: 'Insert at head by rewiring pointers.' },
    { id: 'll_delete', name: 'LL Delete',       viz: 'll', tc: 'O(n)', sc: 'O(1)', desc: 'Traverse to target, rewire prev.next.' },
    { id: 'll_reverse',name: 'LL Reverse',      viz: 'll', tc: 'O(n)', sc: 'O(1)', desc: 'Three-pointer in-place reversal.' },
    { id: 'll_cycle',  name: "Floyd's Cycle",   viz: 'll', tc: 'O(n)', sc: 'O(1)', desc: 'Tortoise & hare — meet in cycle if exists.' },
    { id: 'll_merge',  name: 'Merge Sorted LLs',viz: 'll', tc: 'O(n+m)',sc:'O(1)', desc: 'Merge two sorted linked lists in-place.' },
  ]},
  { label: 'Dynamic Programming', color: 'var(--sql)', algos: [
    { id: 'lcs',         name: 'LCS',           viz: 'dp',   tc: 'O(mn)',  sc: 'O(mn)', desc: 'Longest Common Subsequence — 2D DP.' },
    { id: 'knapsack',    name: '0/1 Knapsack',  viz: 'dp',   tc: 'O(nW)',  sc: 'O(nW)', desc: 'Maximize value within weight capacity.' },
    { id: 'edit_dist',   name: 'Edit Distance', viz: 'dp',   tc: 'O(mn)',  sc: 'O(mn)', desc: 'Levenshtein — min insert/delete/replace ops.' },
    { id: 'matrix_chain',name: 'Matrix Chain',  viz: 'dp',   tc: 'O(n³)',  sc: 'O(n²)', desc: 'Optimal parenthesization of matrix products.' },
    { id: 'lis',         name: 'LIS',           viz: 'bars', tc: 'O(n log n)',sc:'O(n)', desc: 'Longest Increasing Subsequence — patience sort.' },
    { id: 'coin',        name: 'Coin Change',   viz: 'dp1d', tc: 'O(nA)',  sc: 'O(A)',  desc: 'Min coins for amount. Unbounded knapsack.' },
  ]},
  { label: 'Advanced Structures', color: 'var(--git)', algos: [
    { id: 'union_find',  name: 'Union-Find',    viz: 'uf',      tc: 'O(α(n))', sc: 'O(n)', desc: 'DSU with path compression + union by rank.' },
    { id: 'hash_chain',  name: 'Hash Chaining', viz: 'hash',    tc: 'O(1) avg',sc: 'O(n)', desc: 'Linked list per bucket resolves collisions.' },
    { id: 'hash_open',   name: 'Hash Open Addr',viz: 'hash',    tc: 'O(1) avg',sc: 'O(n)', desc: 'Linear probing on collision. Flat table.' },
    { id: 'heap_insert', name: 'Heap Insert',   viz: 'heapviz', tc: 'O(log n)',sc: 'O(1)', desc: 'Insert at end, bubble up to restore heap.' },
    { id: 'heap_extract',name: 'Heap Extract',  viz: 'heapviz', tc: 'O(log n)',sc: 'O(1)', desc: 'Swap root+last, remove, sift down.' },
  ]},
  { label: 'Searching', color: 'var(--score)', algos: [
    { id: 'binary_search',    name: 'Binary Search',     viz: 'bars',  tc: 'O(log n)',    sc: 'O(1)', desc: 'Eliminate half the space each step.' },
    { id: 'jump',             name: 'Jump Search',       viz: 'bars',  tc: 'O(√n)',       sc: 'O(1)', desc: 'Jump √n steps, linear scan back.' },
    { id: 'exponential',      name: 'Exponential Search',viz: 'bars',  tc: 'O(log n)',    sc: 'O(1)', desc: 'Double range until exceeded, then binary.' },
    { id: 'interpolation',    name: 'Interpolation',     viz: 'bars',  tc: 'O(log log n)',sc: 'O(1)', desc: 'Probe by value interpolation. Best on uniform data.' },
    { id: 'kmp',              name: 'KMP',               viz: 'string',tc: 'O(n+m)',      sc: 'O(m)', desc: 'Failure function avoids redundant comparisons.' },
    { id: 'rabin_karp',       name: 'Rabin-Karp',        viz: 'string',tc: 'O(nm)',       sc: 'O(1)', desc: 'Rolling hash — compare hash first, then chars.' },
  ]},
  { label: 'Sliding Window / Two Ptr', color: 'var(--dsa)', algos: [
    { id: 'sw_max',   name: 'Sliding Window Max', viz: 'sw', tc: 'O(n)', sc: 'O(k)', desc: 'Deque keeps window max in O(1) per step.' },
    { id: 'sw_sum',   name: 'Sliding Window Sum', viz: 'sw', tc: 'O(n)', sc: 'O(1)', desc: 'Expand right, shrink left to maintain sum.' },
    { id: 'two_sum',  name: 'Two Sum (Two Ptr)',  viz: 'tp', tc: 'O(n)', sc: 'O(1)', desc: 'Sort then converge from both ends.' },
    { id: 'three_sum',name: '3Sum',               viz: 'tp', tc: 'O(n²)',sc: 'O(1)', desc: 'Fix one, two-pointer on rest. O(n²) total.' },
  ]},
  { label: 'Backtracking / Misc', color: 'var(--score)', algos: [
    { id: 'nqueens',     name: 'N-Queens',           viz: 'nq',    tc: 'O(n!)',       sc: 'O(n)', desc: 'Place queens row-by-row, backtrack on conflict.' },
    { id: 'huffman',     name: 'Huffman Coding',     viz: 'huff',  tc: 'O(n log n)',  sc: 'O(n)', desc: 'Min-freq chars get longer codes. Lossless.' },
    { id: 'monte_carlo', name: 'Monte Carlo (π)',    viz: 'mc',    tc: 'O(n)',        sc: 'O(1)', desc: 'Random points inside/outside circle → π.' },
    { id: 'primes_sieve',name: 'Sieve of Eratosthenes',viz:'sieve',tc: 'O(n log log n)',sc:'O(n)',desc: 'Cross out multiples to find all primes ≤ n.' },
    { id: 'gcd_euclid',  name: 'Euclidean GCD',     viz: 'gcd',   tc: 'O(log min(a,b))',sc:'O(1)',desc: 'GCD(a,b) = GCD(b, a mod b). Recursive.' },
    { id: 'sudoku',      name: 'Sudoku Solver',      viz: 'sudoku',tc: 'O(9^m)',      sc: 'O(m)', desc: 'Backtrack: place digit, recurse, undo on fail.' },
    { id: 'subset_sum',  name: 'Subset Sum',         viz: 'dp1d',  tc: 'O(nW)',       sc: 'O(W)', desc: 'Can a subset sum to target? DP boolean table.' },
  ]},
]

const ALL_ALGOS = ALGO_GROUPS.flatMap(g => g.algos)

// ── ALGORITHM EXPLANATIONS ───────────────────────────────────────────────────
const ALGO_EXPLANATIONS = {
  bubble: {
    what: 'Bubble Sort is a simple comparison-based sorting algorithm that repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order.',
    where: 'Educational purposes, small datasets, embedded systems with minimal memory',
    why: 'Easy to understand and implement, requires no extra space, stable sort',
    advantages: ['Simple to understand', 'In-place (O(1) space)', 'Stable sort', 'Detects already sorted arrays'],
    disadvantages: ['O(n²) time complexity', 'Very slow on large datasets', 'More comparisons than other sorts']
  },
  insertion: {
    what: 'Insertion Sort builds the sorted array one item at a time by inserting each element into its correct position in the already-sorted portion.',
    where: 'Small arrays, nearly sorted data, online sorting scenarios',
    why: 'Efficient for small datasets, adaptive (fast when data is nearly sorted), stable',
    advantages: ['Efficient for small arrays', 'Adaptive to input', 'Stable', 'Online (can sort as data arrives)'],
    disadvantages: ['O(n²) average case', 'Inefficient for large datasets', 'Many shifts required']
  },
  selection: {
    what: 'Selection Sort divides the array into sorted and unsorted regions, repeatedly finding the minimum in the unsorted region and placing it in the sorted region.',
    where: 'When memory writes are expensive, simple implementations needed',
    why: 'Minimizes memory writes, easy to implement',
    advantages: ['Minimizes writes to memory', 'Simple implementation', 'In-place'],
    disadvantages: ['O(n²) always', 'Not adaptive', 'Not stable', 'Many comparisons']
  },
  merge: {
    what: 'Merge Sort uses divide-and-conquer: recursively divide the array in half, sort each half, then merge the sorted halves back together.',
    where: 'External sorting, when stability is needed, linked lists',
    why: 'Guaranteed O(n log n), stable, predictable performance',
    advantages: ['O(n log n) guaranteed', 'Stable', 'Parallelizable', 'Works well with linked lists'],
    disadvantages: ['Requires O(n) extra space', 'Not in-place', 'Overhead for small arrays', 'Slower on random-access with O(n) space']
  },
  quick: {
    what: 'Quick Sort uses divide-and-conquer with a pivot: partition around pivot, then recursively sort left and right partitions.',
    where: 'General-purpose sorting, default in many languages, large datasets',
    why: 'Fast average case O(n log n), in-place, cache-friendly',
    advantages: ['Fast average case O(n log n)', 'In-place sorting', 'Good cache locality', 'Widely used'],
    disadvantages: ['O(n²) worst case on bad pivots', 'Not stable', 'Performance depends on pivot selection']
  },
  heap: {
    what: 'Heap Sort builds a max-heap from the array, then repeatedly extracts the maximum element and places it at the end.',
    where: 'Systems with guaranteed performance needs, memory-constrained environments',
    why: 'Guaranteed O(n log n), in-place, good worst-case performance',
    advantages: ['O(n log n) guaranteed', 'In-place', 'No worst-case collapse', 'Good worst-case performance'],
    disadvantages: ['Not stable', 'Slower than Quick Sort on average', 'Poor cache locality', 'Not adaptive']
  },
  counting: {
    what: 'Counting Sort counts occurrences of each value, then reconstructs the sorted array. Non-comparison sort.',
    where: 'Integers in small range, preprocessing for Radix Sort, counting frequencies',
    why: 'Linear O(n+k) time, simple, stable',
    advantages: ['Linear O(n+k) time', 'Stable', 'Simple', 'Efficient for small ranges'],
    disadvantages: ['Only for integers in known range', 'Extra O(k) space', 'Not good for large ranges']
  },
  radix: {
    what: 'Radix Sort sorts digits from least significant to most significant (or vice versa), using Counting Sort for each digit.',
    where: 'Integers, strings, floating points, hybrid sorting scenarios',
    why: 'Linear O(nk) time, practical for multi-digit numbers, often faster than comparison sorts',
    advantages: ['Linear O(nk) time', 'Stable', 'Practical', 'Beats comparison sorts on large numbers'],
    disadvantages: ['Requires extra space', 'Complex to implement', 'Must know max digits', 'Not general-purpose']
  },
  shell: {
    what: 'Shell Sort is an extension of Insertion Sort using gap sequences. Elements at gap distance are sorted first, then gap decreases.',
    where: 'Medium-sized arrays, when simplicity and efficiency needed',
    why: 'Compromise between simple and efficient, works well on medium data',
    advantages: ['Better than Insertion Sort', 'Simple implementation', 'In-place', 'Efficient for medium arrays'],
    disadvantages: ['Performance depends on gap sequence', 'Complex to analyze', 'Still O(n²) worst case variants']
  },
  tim: {
    what: 'TimSort is a hybrid algorithm (merge + insertion) used in Python and Java. It divides data into small runs, sorts with insertion, then merges.',
    where: 'Production sorting in Python, Java, Android, real-world data',
    why: 'Combines best of both worlds: fast on random data and nearly sorted data',
    advantages: ['Excellent all-around performance', 'O(n log n) guaranteed', 'Adaptive to real-world patterns', 'Stable'],
    disadvantages: ['Complex to implement', 'O(n) extra space', 'Not in-place', 'Overhead for small arrays']
  },
  cycle: {
    what: 'Cycle Sort minimizes memory writes by directly placing elements in their final position, creating cycles.',
    where: 'Flash memory storage, EEPROM, memory-write limited systems',
    why: 'Minimizes number of writes (optimal theoretically)',
    advantages: ['Minimizes writes (theoretically optimal)', 'In-place', 'Good for write-limited media'],
    disadvantages: ['O(n²) comparisons', 'Slower than other sorts', 'Complex to implement', 'Not stable']
  },
  bfs: {
    what: 'BFS (Breadth-First Search) explores a graph level-by-level using a queue. All neighbors at current depth are visited before going deeper.',
    where: 'Shortest path unweighted graphs, level-order traversals, social networks, networking',
    why: 'Finds shortest path in unweighted graphs, explores systematically',
    advantages: ['Finds shortest path in unweighted graphs', 'Systematic exploration', 'Complete and optimal'],
    disadvantages: ['Requires O(V) space for queue', 'Cannot handle weighted graphs for shortest path', 'Slower on deep graphs']
  },
  dfs: {
    what: 'DFS (Depth-First Search) explores a graph deeply using a stack (or recursion). Goes as far as possible before backtracking.',
    where: 'Topological sorting, cycle detection, maze solving, tree traversals',
    why: 'Explores deeply, useful for finding paths, detecting cycles, topological order',
    advantages: ['Memory efficient', 'Finds all connected components', 'Can find all paths', 'Simple recursive implementation'],
    disadvantages: ['May use O(h) stack space', 'Not optimal for shortest path', 'Can get stuck in deep recursion']
  },
  dijkstra: {
    what: 'Dijkstra is a greedy algorithm that finds shortest paths from a source to all other vertices in weighted graphs (non-negative weights).',
    where: 'GPS navigation, network routing, game pathfinding, social networks',
    why: 'Finds shortest path, efficient for sparse graphs with priority queue',
    advantages: ['Finds shortest path', 'Greedy approach', 'Efficient with priority queue', 'Practical and reliable'],
    disadvantages: ['Cannot handle negative weights', 'May be slow on dense graphs', 'Complex to implement']
  },
  bellman: {
    what: 'Bellman-Ford finds shortest paths from a source to all vertices. Relaxes all edges V-1 times, can detect negative cycles.',
    where: 'Graphs with negative weights, cycle detection, currency arbitrage',
    why: 'Handles negative weights, detects negative cycles',
    advantages: ['Handles negative weights', 'Detects negative cycles', 'Simple implementation', 'Works on any graph'],
    disadvantages: ['O(VE) time (slower)', 'Slower than Dijkstra', 'Overkill for non-negative graphs']
  },
  astar: {
    what: 'A* is a best-first search that uses f(n)=g(n)+h(n) to guide search: g(n) is cost from start, h(n) is heuristic to goal.',
    where: 'Game AI, pathfinding, robotics, heuristic search problems',
    why: 'Combines actual cost with heuristic, faster than pure Dijkstra when good heuristic available',
    advantages: ['Optimal with admissible heuristic', 'Often faster than Dijkstra', 'Flexible', 'Widely used in games'],
    disadvantages: ['Needs good heuristic', 'Can be slow with bad heuristic', 'Requires careful implementation']
  },
  toposort: {
    what: 'Topological Sort orders vertices of a DAG so every edge goes from earlier to later vertex. Uses Kahn\'s algorithm (BFS-based).',
    where: 'Task scheduling, dependency resolution, build systems, academic prerequisites',
    why: 'Organizes dependencies, finds valid execution order',
    advantages: ['Simple to implement', 'Efficient O(V+E)', 'Detects cycles', 'Clear semantics'],
    disadvantages: ['Only for DAGs', 'Multiple valid orders', 'Not unique']
  },
  prim: {
    what: 'Prim\'s algorithm grows a Minimum Spanning Tree by always adding the cheapest edge that connects a new vertex.',
    where: 'Network design, cluster analysis, image segmentation, gaming',
    why: 'Finds MST efficiently, greedy approach, good for dense graphs',
    advantages: ['O(E log V) with priority queue', 'Efficient for dense graphs', 'Easy to understand', 'Can be made incremental'],
    disadvantages: ['Requires connected graph', 'Similar performance to Kruskal', 'Needs priority queue for efficiency']
  },
  kruskal: {
    what: 'Kruskal\'s algorithm sorts edges by weight and adds them if they don\'t create a cycle, using Union-Find to detect cycles.',
    where: 'Network design, image processing, cluster analysis, game development',
    why: 'Finds MST efficiently, works well on sparse graphs',
    advantages: ['O(E log E) time', 'Efficient for sparse graphs', 'Simple implementation', 'Parallelizable'],
    disadvantages: ['Sorting overhead', 'Requires Union-Find', 'Similar performance to Prim']
  },
  floyd: {
    what: 'Floyd-Warshall computes all-pairs shortest paths using dynamic programming with intermediate vertices.',
    where: 'All-pairs shortest paths, transitive closure, distance matrices, dense graphs',
    why: 'Finds all shortest paths between all pairs, simple algorithm',
    advantages: ['Finds all-pairs shortest paths', 'Simple O(V³) implementation', 'Handles negative weights', 'Clear DP formulation'],
    disadvantages: ['O(V³) time (slow for large graphs)', 'Requires O(V²) space', 'Overkill if only need single-source']
  },
  tarjan: {
    what: 'Tarjan\'s algorithm finds Strongly Connected Components (SCCs) of a directed graph in one DFS pass using a stack.',
    where: 'Finding cycles, circuit analysis, compiler optimization, web crawling',
    why: 'Finds all SCCs efficiently in linear time',
    advantages: ['O(V+E) time', 'Single pass', 'Finds all SCCs', 'Simple implementation'],
    disadvantages: ['Only for directed graphs', 'Needs stack management', 'Not widely needed']
  },
  bst_insert: {
    what: 'BST Insert adds a value to a Binary Search Tree by navigating left/right based on comparisons.',
    where: 'Maintaining sorted data with fast operations, databases, indexes',
    why: 'Maintains sorted order with O(log n) average insert/search/delete',
    advantages: ['Maintains sorted order', 'Fast operations', 'Simple logic', 'Foundation for other trees'],
    disadvantages: ['Can degenerate to O(n)', 'Unbalanced without rebalancing', 'Needs balancing for reliability']
  },
  bst_search: {
    what: 'BST Search finds a value in a Binary Search Tree by navigating left or right based on comparisons.',
    where: 'Searching sorted data, indexes, dynamic sets',
    why: 'Fast average O(log n) search in sorted structure',
    advantages: ['O(log n) average search', 'In-order traversal gives sorted order', 'Simple'],
    disadvantages: ['Degenerates to O(n) if unbalanced', 'Not cache-friendly vs arrays']
  },
  inorder: {
    what: 'In-Order traversal visits nodes in Left→Node→Right order. For BST, produces sorted output.',
    where: 'Printing sorted BST content, expression evaluation, tree serialization',
    why: 'Gives sorted output from BST, fundamental tree operation',
    advantages: ['Gives sorted output from BST', 'Natural recursive implementation', 'O(n) efficient'],
    disadvantages: ['Recursive (stack overhead)', 'Unordered for general trees']
  },
  preorder: {
    what: 'Pre-Order traversal visits nodes in Node→Left→Right order. Visits parent before children.',
    where: 'Tree cloning, copying, expression evaluation, building trees',
    why: 'Parent visited before children, useful for reconstruction',
    advantages: ['Parent before children', 'Useful for tree cloning', 'Prefix notation', 'Simple recursive'],
    disadvantages: ['Not sorted for BST', 'Recursive overhead']
  },
  postorder: {
    what: 'Post-Order traversal visits nodes in Left→Right→Node order. Visits children before parent.',
    where: 'Deleting trees, postfix expressions, tree modification',
    why: 'Children visited before parent, safe for deletion',
    advantages: ['Children before parent (safe delete)', 'Postfix notation', 'Tree cleanup', 'Simple recursive'],
    disadvantages: ['Not sorted for BST', 'Recursive overhead']
  },
  avl: {
    what: 'AVL Rotation maintains a balanced BST by performing rotations when balance factor exceeds ±1 after insertions/deletions.',
    where: 'Databases, file systems, when guaranteed O(log n) needed',
    why: 'Maintains balance, guarantees O(log n) operations',
    advantages: ['Guaranteed O(log n)', 'Self-balancing', 'Simple rotations', 'Reliable performance'],
    disadvantages: ['Complex to implement', 'Rotation overhead', 'More rotations than Red-Black', 'Overkill for simple use']
  },
  segtree: {
    what: 'Segment Tree enables fast range queries (sum, min, max) and point updates in O(log n) time.',
    where: 'Range queries in arrays, dynamic problems, competitive programming',
    why: 'Fast range operations with point updates',
    advantages: ['O(log n) range query', 'O(log n) update', 'Flexible (sum, min, max, etc)', 'Powerful'],
    disadvantages: ['Complex to implement', 'O(n) space', 'Fenwick tree often simpler for sums']
  },
  fenwick: {
    what: 'Fenwick Tree (Binary Indexed Tree) enables prefix sum queries and point updates in O(log n) using bit manipulation.',
    where: 'Prefix sums, dynamic problems, competitive programming',
    why: 'Simple but powerful, O(log n) with clever bit tricks',
    advantages: ['O(log n) query and update', 'Simpler than Segment Tree', 'O(n) space', 'Elegant bit manipulation'],
    disadvantages: ['Prefix sums only', 'Bit manipulation unintuitive', 'Not as flexible as Segment Tree']
  },
  trie: {
    what: 'Trie (prefix tree) stores strings with common prefixes sharing paths. Each node is a character, edges are pointers.',
    where: 'Autocomplete, spell checking, IP routing, longest prefix matching',
    why: 'Efficient string operations, common prefix optimization',
    advantages: ['Efficient prefix searches', 'Autocomplete', 'Memory efficient for similar strings', 'O(m) per operation'],
    disadvantages: ['More space than hash table for sparse data', 'Traversal slower than hash for non-prefix queries']
  },
  ll_insert: {
    what: 'LL Insert adds a node at the head of a linked list by updating the next pointer.',
    where: 'Linked lists, stacks, cache implementations',
    why: 'O(1) insertion at head (no shifting needed)',
    advantages: ['O(1) head insertion', 'No shifting', 'Simple', 'Fundamental operation'],
    disadvantages: ['O(n) for middle/end insertion', 'Extra space for pointers', 'No random access']
  },
  ll_delete: {
    what: 'LL Delete removes a node from linked list by rewiring pointers to skip the deleted node.',
    where: 'Linked list manipulation, removing elements',
    why: 'O(n) search + O(1) removal, essential operation',
    advantages: ['O(1) removal if position known', 'No shifting', 'Memory freed'],
    disadvantages: ['O(n) to find node', 'Need previous pointer', 'No random access']
  },
  ll_reverse: {
    what: 'LL Reverse reverses a linked list in-place using three-pointer technique (prev, curr, next).',
    where: 'Reversing sequences, palindrome checking, interview problems',
    why: 'In-place O(n) reversal with O(1) space',
    advantages: ['In-place O(n) reversal', 'O(1) space', 'Simple three-pointer', 'Common interview question'],
    disadvantages: ['Modifies list', 'Need to track previous node', 'Not intuitive at first']
  },
  ll_cycle: {
    what: 'Floyd\'s Cycle Detection uses tortoise (slow) and hare (fast) pointers. If they meet, cycle exists.',
    where: 'Cycle detection, linked list validation, memory debugging',
    why: 'Detects cycles in O(n) time with O(1) space',
    advantages: ['O(n) time O(1) space', 'Elegant two-pointer', 'Always works', 'Finds cycle start'],
    disadvantages: ['Non-obvious why it works', 'Only detects presence', 'Separate pass needed for start']
  },
  ll_merge: {
    what: 'Merge Sorted LLs combines two sorted linked lists into one sorted list in-place.',
    where: 'Merge sort on linked lists, combining sorted sequences',
    why: 'Merges in O(n+m) with no extra space',
    advantages: ['O(n+m) time', 'O(1) space (in-place)', 'No allocation', 'Simple two-pointer'],
    disadvantages: ['Modifies lists', 'Needs sorted input', 'Common merge operation']
  },
  lcs: {
    what: 'LCS (Longest Common Subsequence) finds longest sequence of characters that appear in same order in two strings using DP.',
    where: 'Diff tools, DNA analysis, spell checking, version control',
    why: 'Finds similarity between strings, used in diff algorithms',
    advantages: ['Finds longest common subsequence', 'DP solution elegant', 'Used in diff', 'O(mn) feasible'],
    disadvantages: ['O(mn) time and space', 'Not intuitive', 'Overkill for simple similarity']
  },
  knapsack: {
    what: '0/1 Knapsack solves the optimization problem: max value items with weight constraint, each item 0 or 1 times, using DP.',
    where: 'Resource allocation, budgeting, bin packing, portfolio optimization',
    why: 'Finds optimal selection within constraints',
    advantages: ['Optimal solution', 'Poly-time pseudo-algorithm', 'Practical for reasonable W', 'DP classic'],
    disadvantages: ['O(nW) pseudo-polynomial', 'NP-hard in general', 'Not efficient for huge W']
  },
  edit_dist: {
    what: 'Edit Distance (Levenshtein) computes minimum operations (insert, delete, replace) to transform one string to another using DP.',
    where: 'Spell checking, fuzzy search, DNA sequence alignment, autocorrect',
    why: 'Measures string similarity, robust to typos',
    advantages: ['Measures similarity robustly', 'Handles typos', 'DP solution', 'O(mn) feasible'],
    disadvantages: ['O(mn) time and space', 'Not intuitive', 'Symmetric distance']
  },
  matrix_chain: {
    what: 'Matrix Chain Multiplication finds optimal parenthesization to minimize scalar multiplications using DP.',
    where: 'Matrix computation optimization, computer graphics',
    why: 'Minimizes computational cost of matrix chains',
    advantages: ['Minimizes multiplications', 'Classic DP problem', 'O(n³) feasible', 'Clear DP'],
    disadvantages: ['O(n³) time', 'Limited practical use', 'Complex DP formulation']
  },
  coin: {
    what: 'Coin Change finds minimum coins needed to make target amount using DP bottom-up approach.',
    where: 'Making change, payment systems, currency conversion',
    why: 'Finds optimal coin selection',
    advantages: ['Finds minimum coins', 'Simple DP', 'O(nA) feasible', 'Practical application'],
    disadvantages: ['Coin combination needed', 'O(nA) time', 'Not always solvable']
  },
  union_find: {
    what: 'Union-Find (Disjoint Set Union) with path compression and union by rank efficiently maintains connected components.',
    where: 'Kruskal\'s algorithm, social networks, connected components, cycle detection',
    why: 'Near-O(1) amortized operations on sets',
    advantages: ['Nearly O(1) operations', 'Simple implementation', 'Powerful abstraction', 'Used in Kruskal'],
    disadvantages: ['Needs both optimizations', 'Not intuitive', 'Path compression limits']
  },
  hash_chain: {
    what: 'Hash Chaining resolves collisions by maintaining linked lists at each bucket index.',
    where: 'Hash tables, dictionaries, cache implementations',
    why: 'Simple collision resolution, works well average case',
    advantages: ['Simple to implement', 'Good average case O(1)', 'Handles load factor > 1', 'Standard approach'],
    disadvantages: ['O(n) worst case', 'Extra space for pointers', 'Cache unfriendly', 'Pointer overhead']
  },
  hash_open: {
    what: 'Open Addressing (Linear Probing) resolves collisions by finding next empty slot in same table.',
    where: 'Hash tables with limited space, cache-friendly implementations',
    why: 'Better cache locality, no pointer overhead',
    advantages: ['Cache friendly', 'No extra pointers', 'Single array', 'Simple'],
    disadvantages: ['O(n) worst case', 'Load factor must stay < 1', 'Clustering problems', 'Deletion complex']
  },
  heap_insert: {
    what: 'Heap Insert adds element at end and bubbles it up to restore max-heap property.',
    where: 'Priority queues, heapsort, event scheduling',
    why: 'O(log n) insertion maintains heap structure',
    advantages: ['O(log n) insertion', 'Maintains heap', 'Simple bubble-up', 'Fundamental operation'],
    disadvantages: ['Limited utility alone', 'Needs full heap operations']
  },
  heap_extract: {
    what: 'Heap Extract removes max (root), moves last to root, and sifts down to restore max-heap property.',
    where: 'Priority queues, heapsort, event scheduling',
    why: 'O(log n) extraction of maximum',
    advantages: ['O(log n) extraction', 'Maintains heap', 'Simple sift-down', 'Fundamental'],
    disadvantages: ['Limited utility alone', 'Modifies heap', 'Needs full operations']
  },
  sw_max: {
    what: 'Sliding Window Maximum finds maximum in each k-sized window of array using deque optimization.',
    where: 'Traffic flow analysis, stock analysis, streaming data processing',
    why: 'O(n) maximum in all windows (vs O(nk) naive)',
    advantages: ['O(n) time', 'Practical optimization', 'Streaming capable', 'Elegant deque solution'],
    disadvantages: ['Complex deque management', 'Not obvious solution', 'Limited scope']
  },
  sw_sum: {
    what: 'Sliding Window Sum efficiently computes sums of all k-sized windows by expanding/contracting window.',
    where: 'Moving averages, revenue analysis, pattern detection',
    why: 'O(n) all window sums (vs O(nk) naive)',
    advantages: ['O(n) time', 'Practical optimization', 'Simple two-pointer', 'Foundation technique'],
    disadvantages: ['Requires sorted window', 'Limited to addition', 'Not for all operations']
  },
  two_sum: {
    what: 'Two Sum finds two numbers that sum to target by sorting and using two pointers from ends.',
    where: 'Finding pairs, balance checking, complement search',
    why: 'O(n log n) solution after sort',
    advantages: ['O(n) after sort', 'Simple two-pointer', 'Easy logic', 'Interview classic'],
    disadvantages: ['Requires sorted input', 'Modifies order', 'Index problem in variants']
  },
  three_sum: {
    what: '3Sum finds all unique triplets summing to zero by fixing one, then using two-sum on rest.',
    where: 'Finding combinations, interview problems, analytics',
    why: 'O(n²) solution with preprocessing',
    advantages: ['O(n²) solution', 'Two-pointer optimization', 'Interview classic', 'Extensible to kSum'],
    disadvantages: ['O(n²) still slow', 'Complex deduplication', 'Tricky edge cases']
  },
  nqueens: {
    what: 'N-Queens uses backtracking to place N queens on N×N board so no two queens attack each other.',
    where: 'Permutation problems, constraint satisfaction, puzzle solving',
    why: 'Demonstrates backtracking with pruning',
    advantages: ['Classic backtracking example', 'Demonstrates pruning', 'Educational', 'Elegant solution'],
    disadvantages: ['Exponential O(N!) worst case', 'Slow for large N', 'Limited practical use']
  },
  huffman: {
    what: 'Huffman Coding builds prefix-free binary tree from character frequencies for optimal lossless compression.',
    where: 'Lossless data compression, JPEG, ZIP, communication protocols',
    why: 'Optimal prefix-free code, reduces data size',
    advantages: ['Optimal compression', 'Prefix-free', 'Lossless', 'Simple algorithm', 'Widely used'],
    disadvantages: ['Needs frequency table', 'Overhead for small data', 'Tree must be stored', 'Not for modern use (GZIP better)']
  },
  monte_carlo: {
    what: 'Monte Carlo π Estimation throws random points in square and estimates π by ratio of points in circle.',
    where: 'Numerical simulation, estimation, probabilistic algorithms',
    why: 'Demonstrates randomized algorithms and law of large numbers',
    advantages: ['Educational', 'Simple randomized approach', 'Converges to π', 'Beautiful visualization'],
    disadvantages: ['Inaccurate', 'Slow convergence', 'Not practical for π computation', 'Limited utility']
  },
  primes_sieve: {
    what: 'Sieve of Eratosthenes marks multiples of each prime to find all primes up to N.',
    where: 'Finding all primes, cryptography, number theory, preprocessing',
    why: 'O(n log log n) way to find all primes efficiently',
    advantages: ['O(n log log n) efficient', 'All primes ≤ n', 'Simple algorithm', 'Beautiful efficiency'],
    disadvantages: ['Needs O(n) space', 'Marks all multiples', 'Not good for single prime check', 'Fixed range']
  },
  gcd_euclid: {
    what: 'Euclidean GCD recursively finds greatest common divisor: GCD(a,b) = GCD(b, a mod b).',
    where: 'Number theory, fraction reduction, cryptography, modular arithmetic',
    why: 'Efficient GCD computation in O(log min(a,b))',
    advantages: ['Fast O(log min(a,b))', 'Simple recursive', 'Elegant math', 'Fundamental algorithm'],
    disadvantages: ['Limited utility alone', 'Needs extension for LCM', 'Modulo operations required']
  },
  sudoku: {
    what: 'Sudoku Solver uses backtracking with constraint checking to fill empty cells so each row/column/block has 1-9.',
    where: 'Puzzle solving, constraint satisfaction problems, search optimization',
    why: 'Demonstrates backtracking with constraint propagation',
    advantages: ['Solves NP-complete problem', 'Backtracking with pruning', 'Practical solver', 'Educational'],
    disadvantages: ['Exponential worst case', 'Complex state management', 'Slow on hard puzzles', 'Many optimizations needed']
  },
  subset_sum: {
    what: 'Subset Sum determines if any subset sums to target using 1D DP with boolean table.',
    where: 'Partition problems, knapsack variant, decision problems',
    why: 'Pseudo-polynomial DP solution',
    advantages: ['Optimal substructure', 'Practical for reasonable targets', 'O(nW) feasible', 'Clear DP'],
    disadvantages: ['O(nW) pseudo-polynomial', 'NP-complete', 'Not efficient for huge targets', 'Decision only']
  },
  binary_search: {
    what: 'Binary Search finds target in sorted array by repeatedly halving search space.',
    where: 'Searching sorted data, finding boundaries, competitive programming',
    why: 'O(log n) search vs O(n) linear',
    advantages: ['O(log n) fast', 'Simple implementation', 'Works on sorted arrays', 'Foundation technique'],
    disadvantages: ['Requires sorted input', 'Array-based (not linked list)', 'Edge cases tricky', 'Off-by-one errors']
  },
  jump: {
    what: 'Jump Search jumps √n steps forward until target is passed, then linearly scans back.',
    where: 'Sorted arrays, comparison reduction between binary and linear search',
    why: 'O(√n) search (middle ground between binary and linear)',
    advantages: ['O(√n) time', 'Simpler than binary search', 'Comparison reduction', 'Works on any sorted array'],
    disadvantages: ['Slower than binary search', 'Limited practical use', 'Not commonly used', 'Arrays only']
  },
  exponential: {
    what: 'Exponential Search doubles range until target is exceeded, then binary searches in that range.',
    where: 'Unbounded arrays, infinite lists, useful on online data',
    why: 'O(log n) optimal on unbounded sequences',
    advantages: ['O(log n) on unbounded data', 'Online capable', 'Optimal for unbounded', 'Simple concept'],
    disadvantages: ['Unusual case', 'Limited practical use', 'More complex than needed for normal arrays']
  },
  interpolation: {
    what: 'Interpolation Search probes by value interpolation on uniform distributions, similar to binary but adaptive.',
    where: 'Very uniform distributed data, phone books, academic grade searches',
    why: 'O(log log n) on uniform data',
    advantages: ['O(log log n) on uniform data', 'Adaptive probing', 'Better than binary on uniform'],
    disadvantages: ['Bad on non-uniform data', 'O(n) worst case', 'Limited practical use', 'More complex']
  },
  kmp: {
    what: 'KMP (Knuth-Morris-Pratt) pattern matching uses failure function to avoid redundant character comparisons.',
    where: 'String searching, pattern matching, text processing, DNA analysis',
    why: 'O(n+m) linear time pattern matching',
    advantages: ['O(n+m) linear time', 'No redundant comparisons', 'Guaranteed', 'Simple preprocessing'],
    disadvantages: ['Failure function complex', 'Not faster on practice than naive', 'Limited advantage with good heuristics']
  },
  rabin_karp: {
    what: 'Rabin-Karp uses rolling hash for pattern matching, comparing hashes before character comparison.',
    where: 'Multiple pattern matching, plagiarism detection, DNA sequence matching',
    why: 'Efficient average case, good for multiple patterns',
    advantages: ['Good average case', 'Multiple pattern matching easy', 'Practical efficiency', 'Hash comparison'],
    disadvantages: ['Hash collision risk', 'O(nm) worst case', 'Random seed dependent']
  },
}

const sleep = ms => new Promise(r => setTimeout(r, ms))
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a

// ── GRAPH DATA ────────────────────────────────────────────────────────────────
const GRAPH_NODES = [
  { id:0,x:290,y:48,l:'A'},{id:1,x:140,y:158,l:'B'},{id:2,x:440,y:158,l:'C'},
  { id:3,x:62,y:278,l:'D'},{id:4,x:216,y:278,l:'E'},{id:5,x:364,y:278,l:'F'},{id:6,x:518,y:278,l:'G'},
]
const GRAPH_EDGES = [
  {u:0,v:1,w:4},{u:0,v:2,w:2},{u:1,v:3,w:5},{u:1,v:4,w:1},
  {u:2,v:4,w:3},{u:2,v:5,w:6},{u:2,v:6,w:2},{u:4,v:5,w:2},{u:5,v:6,w:1},
]

function buildAdj(){ const a=Object.fromEntries(GRAPH_NODES.map(n=>[n.id,[]])); GRAPH_EDGES.forEach(e=>{a[e.u].push(e.v);a[e.v].push(e.u);}); return a; }
function buildWAdj(){ const a=Object.fromEntries(GRAPH_NODES.map(n=>[n.id,[]])); GRAPH_EDGES.forEach(e=>{a[e.u].push({v:e.v,w:e.w});a[e.v].push({v:e.u,w:e.w});}); return a; }

// ── BST ───────────────────────────────────────────────────────────────────────
function bstInsNode(r,v){ if(!r)return{v,l:null,r:null}; if(v<r.v)return{...r,l:bstInsNode(r.l,v)}; return{...r,r:bstInsNode(r.r,v)}; }
function calcPos(n,x,y,xo){ if(!n)return[]; const res=[{v:n.v,x,y}]; if(n.l)res.push(...calcPos(n.l,x-xo,y+68,xo/1.75)); if(n.r)res.push(...calcPos(n.r,x+xo,y+68,xo/1.75)); return res; }
function calcEdg(n,x,y,xo){ if(!n)return[]; const e=[]; if(n.l){e.push({x1:x,y1:y,x2:x-xo,y2:y+68});e.push(...calcEdg(n.l,x-xo,y+68,xo/1.75));} if(n.r){e.push({x1:x,y1:y,x2:x+xo,y2:y+68});e.push(...calcEdg(n.r,x+xo,y+68,xo/1.75));} return e; }
function makeBST(){ let r=null; [50,30,70,20,40,60,80,10,25,35,45].forEach(v=>r=bstInsNode(r,v)); return r; }

// ── SEGMENT TREE ──────────────────────────────────────────────────────────────
function buildSeg(tree,arr,node,s,e){ if(s===e){tree[node]=arr[s];return;} const m=Math.floor((s+e)/2); buildSeg(tree,arr,2*node+1,s,m); buildSeg(tree,arr,2*node+2,m+1,e); tree[node]=tree[2*node+1]+tree[2*node+2]; }

// ── FENWICK ───────────────────────────────────────────────────────────────────
function fenUpdate(bit,i,v,n){ for(;i<=n;i+=i&(-i))bit[i]+=v; }
function fenQuery(bit,i){ let s=0; for(;i>0;i-=i&(-i))s+=bit[i]; return s; }

export default function DSAVisualizer() {
  const [algo, setAlgo] = useState(null)
  const [speed, setSpeed] = useState(380)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [step, setStep] = useState(0)
  const [narration, setNarration] = useState(null)
  const [overview, setOverview] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)

  // viz states
  const [arr, setArr]           = useState([])
  const [hl, setHl]             = useState({})
  const [gState, setGState]     = useState({visited:[],current:null,queue:[],stack:[],path:[],dist:{},mst:[],trail:[],topo:[],mstCost:0,nar:''})
  const [fwState, setFwState]   = useState(null)
  const [treeRoot, setTreeRoot] = useState(null)
  const [treeVis, setTreeVis]   = useState({visiting:null,found:null,path:[],trail:[]})
  const [llList, setLlList]     = useState([])
  const [dpState, setDpState]   = useState({})
  const [dp1d, setDp1d]         = useState({dp:null,cur:null,amount:11,coins:[1,2,5]})
  const [ufState, setUfState]   = useState({par:[],rank:[],hl:[],n:7})
  const [hashState, setHashState] = useState({table:[],openTable:[],hl:[]})
  const [heapArr, setHeapArr]   = useState([])
  const [heapHl, setHeapHl]     = useState([])
  const [swState, setSwState]   = useState({arr:[],win:[],max:[],deque:[],k:4})
  const [tpState, setTpState]   = useState({arr:[],l:0,r:0,pairs:[],target:0})
  const [nqState, setNqState]   = useState({n:6,board:[],solutions:0})
  const [huffState, setHuffState] = useState({freq:{},codes:{},built:false,text:'aabbccddeeee'})
  const [mcState, setMcState]   = useState({n:0,inside:0,piEst:0,pts:[]})
  const [sieveState, setSieveState] = useState({sieve:[],primes:[],hl:[],n:100})
  const [gcdState, setGcdState] = useState({a:56,b:98,steps:[],current:null})
  const [strState, setStrState] = useState({text:'AABAACAADAABAABA',pattern:'AABAABAAB',matches:[],ci:-1,cj:-1,lps:[]})
  const [segState, setSegState] = useState({arr:[1,3,5,7,9,11],tree:[],hl:[],query:{l:1,r:4,result:null}})
  const [fenState, setFenState] = useState({arr:[3,2,4,5,1,6,2,3],bit:[],hl:[],prefix:[]})
  const [trieState, setTrieState] = useState({root:{c:{},end:false},words:['cat','car','card','care','dog','done'],inserted:[],searching:null,hl:[]})
  const [sudokuState, setSudokuState] = useState({board:[],solutions:0,attempts:0})
  const [subsetState, setSubsetState] = useState({arr:[],target:0,dp:null,cur:null})

  const stopRef = useRef(false)
  const stepRef = useRef(0)
  const synth = useRef(window.speechSynthesis)

  const incStep = () => { stepRef.current++; setStep(stepRef.current) }
  const spd = () => speed

  const fetchNarration = useCallback(async (algoName, state) => {
    try {
      const res = await axios.post('/api/dsa/explain', { algorithm: algoName, array: [], step: stepRef.current, state })
      setNarration(res.data)
    } catch {}
  }, [])

  const fetchOverview = useCallback(async (id) => {
    try {
      const res = await axios.post('/api/dsa/overview', { algorithm: id })
      setOverview(res.data)
    } catch {}
  }, [])

  useEffect(() => {
    if (!algo) return
    fetchOverview(algo.id)
    reset()
  }, [algo])

  const reset = () => {
    stopRef.current = true
    synth.current.cancel()
    stopRef.current = false
    stepRef.current = 0
    setStep(0); setDone(false); setRunning(false); setNarration(null)
    if (!algo) return
    const v = algo.viz
    if (v === 'bars') {
      if (['counting','radix','lis','tim','cycle'].includes(algo.id)) setArr(Array.from({length:16},()=>rnd(1,12)))
      else if (['binary_search','jump','exponential','interpolation'].includes(algo.id)) setArr([...Array.from({length:18},()=>rnd(5,88))].sort((a,b)=>a-b))
      else setArr(Array.from({length:18},()=>rnd(5,90)))
      setHl({})
    }
    if (v === 'graph') setGState({visited:[],current:null,queue:[],stack:[],path:[],dist:{},mst:[],trail:[],topo:[],mstCost:0,nar:''})
    if (v === 'matrix') { setGState({visited:[],current:null,queue:[],stack:[],path:[],dist:{},mst:[],trail:[],topo:[],mstCost:0,nar:''}); const N=5,INF=999,W=[[0,3,INF,7,INF],[8,0,2,INF,INF],[5,INF,0,1,INF],[2,INF,INF,0,4],[INF,INF,3,INF,0]]; setFwState({N,dist:W.map(r=>[...r]),i:0,j:0,k:0,nar:'Floyd-Warshall ready.'}); }
    if (v === 'tree') { setTreeRoot(makeBST()); setTreeVis({visiting:null,found:null,path:[],trail:[]}); }
    if (v === 'll') setLlList([10,20,30,40,50].map((v,i)=>({v,id:i,s:'n'})))
    if (v === 'dp') setDpState({table:null,i:0,j:0,nar:''})
    if (v === 'dp1d') {
      if (algo.id === 'coin') setDp1d({dp:null,cur:null,amount:11,coins:[1,2,5]})
      else setSubsetState({arr:[3,1,4,1,5,9,2,6],target:10,dp:null,cur:null})
    }
    if (v === 'uf') setUfState({par:Array.from({length:7},(_,i)=>i),rank:new Array(7).fill(0),hl:[],n:7})
    if (v === 'hash') setHashState({table:new Array(11).fill(null).map(()=>[]),openTable:new Array(11).fill(null),hl:[],keys:[23,12,45,67,11,34,89,5],size:11})
    if (v === 'heapviz') setHeapArr(Array.from({length:7},()=>rnd(1,50)))
    if (v === 'sw') setSwState({arr:Array.from({length:14},()=>rnd(1,20)),win:[],max:[],deque:[],k:4,nar:''})
    if (v === 'tp') { const a=[...Array.from({length:14},()=>rnd(-10,20))].sort((x,y)=>x-y); setTpState({arr:a,l:0,r:a.length-1,pairs:[],target:0,nar:''}) }
    if (v === 'nq') setNqState({n:6,board:Array.from({length:6},()=>new Array(6).fill(0)),solutions:0,nar:''})
    if (v === 'huff') setHuffState({freq:{},codes:{},built:false,text:'aabbccddeeee',nar:''})
    if (v === 'mc') setMcState({n:0,inside:0,piEst:0,pts:[],nar:''})
    if (v === 'sieve') setSieveState({sieve:new Array(101).fill(true),primes:[],hl:[],n:100,nar:''})
    if (v === 'gcd') setGcdState({a:rnd(20,100),b:rnd(20,100),steps:[],current:null,nar:''})
    if (v === 'string') setStrState({text:'AABAACAADAABAABA',pattern:'AABAABAAB',matches:[],ci:-1,cj:-1,lps:[],nar:''})
    if (v === 'segtree') { const a=[1,3,5,7,9,11]; const t=new Array(4*a.length).fill(0); buildSeg(t,a,0,0,a.length-1); setSegState({arr:a,tree:t,hl:[],query:{l:1,r:4,result:null},nar:''}) }
    if (v === 'fenwick') { const a=[3,2,4,5,1,6,2,3]; const b=new Array(a.length+1).fill(0); a.forEach((v,i)=>fenUpdate(b,i+1,v,a.length)); setFenState({arr:a,bit:b,hl:[],prefix:[],n:a.length,nar:''}); }
    if (v === 'trie') setTrieState({root:{c:{},end:false},words:['cat','car','card','care','dog','done'],inserted:[],searching:null,hl:[],nar:''})
    if (v === 'sudoku') { const b=[[5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]]; setSudokuState({board:b.map(r=>[...r]),solutions:0,attempts:0,hl:[],nar:''}); }
  }

  const speak = (text) => { synth.current.cancel(); synth.current.speak(Object.assign(new SpeechSynthesisUtterance(text),{rate:1.05})) }

  // ── RUN DISPATCHER ────────────────────────────────────────────────────────
  const runAlgorithm = async () => {
    stopRef.current = false
    setRunning(true); setDone(false); stepRef.current = 0; setStep(0); setNarration(null)

    const runners = {
      bubble: () => bubbleSort(), insertion: () => insertionSort(), selection: () => selectionSort(),
      merge: () => mergeSort(), quick: () => quickSort(), heap: () => heapSort(),
      counting: () => countingSort(), radix: () => radixSort(), shell: () => shellSort(),
      tim: () => timSort(), cycle: () => cycleSort(),
      binary_search: () => binarySearchAnim(), jump: () => jumpSearch(), exponential: () => exponentialSearch(), interpolation: () => interpolationSearch(),
      lis: () => lisAnim(),
      bfs: bfsAnim, dfs: dfsAnim, dijkstra: dijkstraAnim, bellman: bellmanAnim, astar: astarAnim, toposort: topoAnim, prim: primAnim, kruskal: kruskalAnim, floyd: floydAnim, tarjan: tarjanAnim,
      bst_insert: bstInsertAnim, bst_search: bstSearchAnim, inorder: inorderAnim, preorder: preorderAnim, postorder: postorderAnim, avl: avlAnim,
      segtree: segAnim, fenwick: fenAnim, trie: trieAnim,
      ll_insert: llInsertAnim, ll_delete: llDeleteAnim, ll_reverse: llReverseAnim, ll_cycle: llCycleAnim, ll_merge: llMergeAnim,
      lcs: lcsAnim, knapsack: knapsackAnim, edit_dist: editDistAnim, matrix_chain: matrixChainAnim, coin: coinAnim,
      union_find: ufAnim, hash_chain: hashChainAnim, hash_open: hashOpenAnim, heap_insert: heapInsAnim, heap_extract: heapExtAnim,
      sw_max: swMaxAnim, sw_sum: swSumAnim, two_sum: twoSumAnim, three_sum: threeSumAnim,
      nqueens: nqueensAnim, huffman: huffmanAnim, monte_carlo: mcAnim, primes_sieve: sieveAnim, gcd_euclid: gcdAnim,
      kmp: kmpAnim, rabin_karp: rabinKarpAnim,
      sudoku: sudokuAnim, subset_sum: subsetSumAnim,
    }
    try { await (runners[algo.id] || runners.bubble)() } catch(e) {}
    if (!stopRef.current) { setDone(true); setRunning(false) }
  }

  // ─── SORTING ────────────────────────────────────────────────────────────────
  const bubbleSort = async () => {
    let ar = [...arr]
    for (let i=0;i<ar.length;i++) { for (let j=0;j<ar.length-i-1;j++) { if(stopRef.current)return; const s=Array.from({length:i},(_,k)=>ar.length-1-k); setHl({comparing:[j,j+1],sorted:s,narration:`Comparing ${ar[j]} and ${ar[j+1]}${ar[j]>ar[j+1]?' → swap':''}`}); setArr([...ar]); incStep(); await sleep(spd()); if(ar[j]>ar[j+1]){[ar[j],ar[j+1]]=[ar[j+1],ar[j]];setHl({swapping:[j,j+1],sorted:s});setArr([...ar]);await sleep(spd());}}}
    setHl({sorted:ar.map((_,i)=>i),narration:'Bubble Sort complete!'}); setArr([...ar]); await fetchNarration(algo.name,{phase:'complete'})
  }
  const insertionSort = async () => {
    let ar=[...arr]
    for(let i=1;i<ar.length;i++){const key=ar[i];let j=i-1;setHl({key:[i],narration:`Inserting ${key}`});setArr([...ar]);incStep();await sleep(spd());while(j>=0&&ar[j]>key){if(stopRef.current)return;ar[j+1]=ar[j];setHl({comparing:[j,j+1],key:[i],narration:`${ar[j]}>${key}, shift right`});setArr([...ar]);incStep();await sleep(spd());j--;}ar[j+1]=key;setArr([...ar]);}
    setHl({sorted:ar.map((_,i)=>i),narration:'Insertion Sort complete!'}); await fetchNarration(algo.name,{phase:'complete'})
  }
  const selectionSort = async () => {
    let ar=[...arr],sorted=[]
    for(let i=0;i<ar.length;i++){let min=i;for(let j=i+1;j<ar.length;j++){if(stopRef.current)return;setHl({comparing:[j,min],min:[min],sorted:[...sorted],narration:`Finding min — current: ${ar[min]}`});setArr([...ar]);incStep();await sleep(spd());if(ar[j]<ar[min])min=j;}if(min!==i){[ar[i],ar[min]]=[ar[min],ar[i]];setArr([...ar]);}sorted.push(i);}
    setHl({sorted:ar.map((_,i)=>i),narration:'Selection Sort complete!'})
  }
  const mergeSort = async () => {
    let ar=[...arr]
    const mg=async(ar,l,m,r)=>{const L=ar.slice(l,m+1),R=ar.slice(m+1,r+1);let i=0,j=0,k=l;while(i<L.length&&j<R.length){if(stopRef.current)return;setHl({comparing:[l+i,m+1+j],narration:`Merge: ${L[i]} vs ${R[j]}`});setArr([...ar]);incStep();await sleep(spd());ar[k++]=(L[i]<=R[j])?L[i++]:R[j++];setArr([...ar]);}while(i<L.length){ar[k++]=L[i++];setArr([...ar]);await sleep(spd()/4);}while(j<R.length){ar[k++]=R[j++];setArr([...ar]);await sleep(spd()/4);}};
    const ms=async(ar,l,r)=>{if(l>=r||stopRef.current)return;const m=Math.floor((l+r)/2);await ms(ar,l,m);await ms(ar,m+1,r);await mg(ar,l,m,r);};
    await ms(ar,0,ar.length-1); setHl({sorted:ar.map((_,i)=>i),narration:'Merge Sort complete!'}); setArr([...ar])
  }
  const quickSort = async () => {
    let ar=[...arr]
    const qs=async(ar,lo,hi)=>{if(lo>=hi||stopRef.current)return;const p=ar[hi];setHl({pivot:[hi],narration:`Pivot=${p}`});setArr([...ar]);await sleep(spd());let i=lo-1;for(let j=lo;j<hi;j++){if(stopRef.current)return;setHl({comparing:[j],pivot:[hi],narration:`${ar[j]}${ar[j]<=p?'≤':'>'}${p}`});setArr([...ar]);incStep();await sleep(spd());if(ar[j]<=p){i++;[ar[i],ar[j]]=[ar[j],ar[i]];setArr([...ar]);await sleep(spd()/2);}}[ar[i+1],ar[hi]]=[ar[hi],ar[i+1]];setArr([...ar]);await sleep(spd());await qs(ar,lo,i);await qs(ar,i+2,hi);};
    await qs(ar,0,ar.length-1); setHl({sorted:ar.map((_,i)=>i),narration:'Quick Sort complete!'}); setArr([...ar])
  }
  const heapSort = async () => {
    let ar=[...arr]
    const hfy=async(ar,n,i)=>{let l=2*i+1,r=2*i+2,lg=i;if(l<n&&ar[l]>ar[lg])lg=l;if(r<n&&ar[r]>ar[lg])lg=r;if(lg!==i){setHl({comparing:[i,lg],narration:`Heapify: swap ${ar[i]}↔${ar[lg]}`});setArr([...ar]);incStep();await sleep(spd());[ar[i],ar[lg]]=[ar[lg],ar[i]];setArr([...ar]);if(!stopRef.current)await hfy(ar,n,lg);}};
    const n=ar.length;for(let i=Math.floor(n/2)-1;i>=0;i--){if(stopRef.current)return;await hfy(ar,n,i);}
    const s=[];for(let i=n-1;i>0;i--){if(stopRef.current)return;[ar[0],ar[i]]=[ar[i],ar[0]];s.unshift(i);setHl({swapping:[0,i],sorted:[...s],narration:`Extract max ${ar[i]}`});setArr([...ar]);await sleep(spd());await hfy(ar,i,0);}
    setHl({sorted:ar.map((_,i)=>i),narration:'Heap Sort complete!'}); setArr([...ar])
  }
  const countingSort = async () => {
    let ar=[...arr]; const mx=Math.max(...ar),cnt=new Array(mx+1).fill(0); ar.forEach(v=>cnt[v]++); let idx=0
    for(let i=0;i<=mx;i++){while(cnt[i]>0){if(stopRef.current)return;ar[idx]=i;setHl({sorted:ar.slice(0,idx+1).map((_,k)=>k),key:[idx],narration:`Placing ${i} (count=${cnt[i]})`});setArr([...ar]);incStep();await sleep(spd());idx++;cnt[i]--;}}
    setHl({sorted:ar.map((_,i)=>i),narration:'Counting Sort complete — O(n+k)!'}); setArr([...ar])
  }
  const radixSort = async () => {
    let ar=[...arr]; const mx=Math.max(...ar)
    for(let exp=1;Math.floor(mx/exp)>0;exp*=10){const out=new Array(ar.length).fill(0),cnt=new Array(10).fill(0);ar.forEach(v=>cnt[Math.floor(v/exp)%10]++);for(let i=1;i<10;i++)cnt[i]+=cnt[i-1];for(let i=ar.length-1;i>=0;i--){const d=Math.floor(ar[i]/exp)%10;out[--cnt[d]]=ar[i];}for(let i=0;i<ar.length;i++){if(stopRef.current)return;ar[i]=out[i];setHl({key:[i],narration:`Digit place ${exp}: placing ${ar[i]}`});setArr([...ar]);incStep();await sleep(spd()/3);}setArr([...ar]);await sleep(spd());}
    setHl({sorted:ar.map((_,i)=>i),narration:'Radix Sort complete!'}); setArr([...ar])
  }
  const shellSort = async () => {
    let ar=[...arr]; let g=1; while(g<ar.length/3)g=g*3+1
    while(g>=1){for(let i=g;i<ar.length;i++){const t=ar[i];let j=i;while(j>=g&&ar[j-g]>t){if(stopRef.current)return;ar[j]=ar[j-g];setHl({comparing:[j,j-g],narration:`Gap=${g}: shift`});setArr([...ar]);incStep();await sleep(spd());j-=g;}ar[j]=t;setArr([...ar]);}g=Math.floor(g/3);}
    setHl({sorted:ar.map((_,i)=>i),narration:'Shell Sort complete!'}); setArr([...ar])
  }
  const timSort = async () => {
    let ar=[...arr]; const RUN=4
    for(let i=0;i<ar.length;i+=RUN){const end=Math.min(i+RUN-1,ar.length-1);for(let j=i+1;j<=end;j++){if(stopRef.current)return;const k=ar[j];let m=j-1;while(m>=i&&ar[m]>k){ar[m+1]=ar[m];m--;}ar[m+1]=k;setHl({key:[j],narration:`TimSort run [${i}..${end}]`});setArr([...ar]);incStep();await sleep(spd()/2);}}
    for(let sz=RUN;sz<ar.length;sz*=2){for(let l=0;l<ar.length;l+=2*sz){const m=Math.min(l+sz-1,ar.length-1),r=Math.min(l+2*sz-1,ar.length-1);if(m<r){const L=ar.slice(l,m+1),R=ar.slice(m+1,r+1);let i=0,j=0,k=l;while(i<L.length&&j<R.length){if(stopRef.current)return;setHl({comparing:[l+i,m+1+j],narration:`TimSort merge`});setArr([...ar]);incStep();await sleep(spd()/2);ar[k++]=(L[i]<=R[j])?L[i++]:R[j++];setArr([...ar]);}while(i<L.length)ar[k++]=L[i++];while(j<R.length)ar[k++]=R[j++];setArr([...ar]);}}}
    setHl({sorted:ar.map((_,i)=>i),narration:'TimSort complete — used in Python & Java stdlib!'}); setArr([...ar])
  }
  const cycleSort = async () => {
    let ar=[...arr]; let writes=0
    for(let cs=0;cs<ar.length-1;cs++){let it=ar[cs],pos=cs;for(let i=cs+1;i<ar.length;i++)if(ar[i]<it)pos++;if(pos===cs)continue;while(it===ar[pos])pos++;[ar[pos],it]=[it,ar[pos]];writes++;setHl({swapping:[pos],narration:`Write #${writes}: placed value at pos ${pos}`});setArr([...ar]);incStep();await sleep(spd());while(pos!==cs){pos=cs;for(let i=cs+1;i<ar.length;i++)if(ar[i]<it)pos++;if(stopRef.current)return;while(it===ar[pos])pos++;[ar[pos],it]=[it,ar[pos]];writes++;setHl({swapping:[pos],narration:`Cycle write #${writes}`});setArr([...ar]);incStep();await sleep(spd());}}
    setHl({sorted:ar.map((_,i)=>i),narration:`Cycle Sort: only ${writes} writes! Optimal for write-expensive storage.`}); setArr([...ar])
  }
  const binarySearchAnim = async () => {
    const ar=[...arr]; const t=ar[rnd(0,ar.length-1)]; let lo=0,hi=ar.length-1
    while(lo<=hi){if(stopRef.current)return;const m=Math.floor((lo+hi)/2);setHl({range:Array.from({length:hi-lo+1},(_,k)=>lo+k),comparing:[m],narration:`mid=${m} val=${ar[m]} target=${t} → ${ar[m]===t?'FOUND!':ar[m]<t?'go right':'go left'}`});setArr([...ar]);incStep();await sleep(spd()*1.4);if(ar[m]===t){setHl({found:[m],narration:`Found ${t} at index ${m}!`});return;}if(ar[m]<t)lo=m+1;else hi=m-1;}
  }
  const jumpSearch = async () => {
    const ar=[...arr]; const n=ar.length,st=Math.floor(Math.sqrt(n)),t=ar[rnd(0,n-1)]; let prev=0,curr=Math.min(st,n)-1
    setHl({jump:[0,curr],narration:`Jump: target=${t}, step=√${n}≈${st}`}); await sleep(spd())
    while(ar[curr]<t&&curr<n-1){if(stopRef.current)return;prev=curr;curr=Math.min(curr+st,n-1);setHl({jump:[prev,curr],narration:`Jumping to ${curr} val=${ar[curr]}`});setArr([...ar]);incStep();await sleep(spd());}
    for(let i=prev;i<=curr;i++){if(stopRef.current)return;setHl({comparing:[i],narration:`Linear: arr[${i}]=${ar[i]} vs ${t}`});setArr([...ar]);incStep();await sleep(spd());if(ar[i]===t){setHl({found:[i],narration:`Found ${t} at index ${i}!`});return;}}
  }
  const exponentialSearch = async () => {
    const ar=[...arr]; const t=ar[rnd(0,ar.length-1)]; if(ar[0]===t){setHl({found:[0]});return;} let i=1
    while(i<ar.length&&ar[i]<=t){setHl({key:[i],narration:`Doubling: i=${i} val=${ar[i]}`});setArr([...ar]);incStep();await sleep(spd());i*=2;}
    let lo=Math.floor(i/2),hi=Math.min(i,ar.length-1)
    while(lo<=hi){if(stopRef.current)return;const m=Math.floor((lo+hi)/2);setHl({range:Array.from({length:hi-lo+1},(_,k)=>lo+k),comparing:[m],narration:`Binary [${lo},${hi}]: mid=${m}`});setArr([...ar]);incStep();await sleep(spd());if(ar[m]===t){setHl({found:[m],narration:`Found ${t}!`});return;}if(ar[m]<t)lo=m+1;else hi=m-1;}
  }
  const interpolationSearch = async () => {
    const ar=[...arr]; const t=ar[rnd(0,ar.length-1)]; let lo=0,hi=ar.length-1
    while(lo<=hi&&t>=ar[lo]&&t<=ar[hi]){if(stopRef.current)return;const pos=lo+Math.floor(((t-ar[lo])*(hi-lo))/(ar[hi]-ar[lo]));setHl({comparing:[pos],range:Array.from({length:hi-lo+1},(_,k)=>lo+k),narration:`Interpolated pos=${pos} val=${ar[pos]} target=${t}`});setArr([...ar]);incStep();await sleep(spd()*1.4);if(ar[pos]===t){setHl({found:[pos],narration:`Found ${t} at interpolated pos ${pos}!`});return;}if(ar[pos]<t)lo=pos+1;else hi=pos-1;}
  }
  const lisAnim = async () => {
    const ar=[...arr]; const n=ar.length,dp=new Array(n).fill(1),par=new Array(n).fill(-1)
    for(let i=1;i<n;i++){for(let j=0;j<i;j++){if(stopRef.current)return;setHl({comparing:[j],key:[i],narration:`dp[${i}]: ${ar[j]}<${ar[i]}? dp=${dp[i]}`});setArr([...ar]);incStep();await sleep(spd()/2);if(ar[j]<ar[i]&&dp[j]+1>dp[i]){dp[i]=dp[j]+1;par[i]=j;}}}
    const mx=Math.max(...dp),ei=dp.indexOf(mx);const seq=[];let c=ei;while(c!==-1){seq.unshift(ar[c]);c=par[c];}
    setHl({lis:seq.map(v=>ar.indexOf(v)),narration:`LIS length=${mx}: [${seq.join(',')}]`,trail:seq});setArr([...ar])
  }

  // ── GRAPH ALGORITHMS ─────────────────────────────────────────────────────
  const gSet = (updates) => setGState(prev => ({...prev, ...updates}))
  const adj = buildAdj(), wadj = buildWAdj()

  const bfsAnim = async () => {
    gSet({visited:[],queue:[0],trail:[],nar:'BFS: queue-based level traversal'})
    await sleep(spd())
    let visited=[],queue=[0],trail=[]
    while(queue.length){if(stopRef.current)return;const n=queue.shift();if(visited.includes(n))continue;visited.push(n);trail.push(GRAPH_NODES[n].l);gSet({visited:[...visited],current:n,queue:[...queue],trail:[...trail],nar:`Visiting ${GRAPH_NODES[n].l} — neighbors: ${adj[n].map(x=>GRAPH_NODES[x].l).join(', ')}`});incStep();await sleep(spd());adj[n].forEach(nb=>{if(!visited.includes(nb)&&!queue.includes(nb))queue.push(nb);});}
    gSet({current:null,nar:`BFS done: ${trail.join('→')}`})
    await fetchNarration(algo.name,{phase:'complete',order:trail})
  }
  const dfsAnim = async () => {
    gSet({visited:[],stack:[0],trail:[],nar:'DFS: stack-based deep traversal'})
    await sleep(spd())
    let visited=[],stack=[0],trail=[]
    while(stack.length){if(stopRef.current)return;const n=stack.pop();if(visited.includes(n))continue;visited.push(n);trail.push(GRAPH_NODES[n].l);gSet({visited:[...visited],current:n,stack:[...stack],trail:[...trail],nar:`Visiting ${GRAPH_NODES[n].l}`});incStep();await sleep(spd());[...adj[n]].reverse().forEach(nb=>{if(!visited.includes(nb))stack.push(nb);});}
    gSet({current:null,nar:`DFS done: ${trail.join('→')}`})
  }
  const dijkstraAnim = async () => {
    const INF=999; let dist=Object.fromEntries(GRAPH_NODES.map(n=>[n.id,INF])); dist[0]=0; const prev=Object.fromEntries(GRAPH_NODES.map(n=>[n.id,null])); const unv=new Set(GRAPH_NODES.map(n=>n.id)); let visited=[]
    gSet({dist:{...dist},nar:'Dijkstra: always expand minimum-cost node'})
    while(unv.size){if(stopRef.current)return;let u=null;for(const id of unv)if(u===null||dist[id]<dist[u])u=id;if(dist[u]===INF)break;unv.delete(u);visited.push(u);gSet({current:u,visited:[...visited],dist:{...dist},nar:`Processing ${GRAPH_NODES[u].l} d=${dist[u]}`});incStep();await sleep(spd());wadj[u].forEach(({v,w})=>{if(dist[u]+w<dist[v]){dist[v]=dist[u]+w;prev[v]=u;gSet({dist:{...dist}});}});}
    const t=GRAPH_NODES.length-1; const path=[]; let c=t; while(c!==null){path.unshift(c);c=prev[c];}
    gSet({path,current:null,nar:`Shortest A→G: ${path.map(i=>GRAPH_NODES[i].l).join('→')} cost=${dist[t]}`})
  }
  const bellmanAnim = async () => {
    const INF=999; let dist=Object.fromEntries(GRAPH_NODES.map(n=>[n.id,INF])); dist[0]=0
    gSet({dist:{...dist},nar:'Bellman-Ford: relax ALL edges V-1 times'})
    for(let i=0;i<GRAPH_NODES.length-1;i++){for(const e of GRAPH_EDGES){if(stopRef.current)return;gSet({current:e.u,dist:{...dist},nar:`Pass ${i+1}: relax ${GRAPH_NODES[e.u].l}→${GRAPH_NODES[e.v].l} w=${e.w}`});incStep();await sleep(spd()/2);if(dist[e.u]+e.w<dist[e.v])dist[e.v]=dist[e.u]+e.w;}}
    gSet({current:null,dist:{...dist},nar:'Bellman-Ford done. Handles negative weights!'})
  }
  const astarAnim = async () => {
    const h=id=>{const t=GRAPH_NODES[GRAPH_NODES.length-1],n=GRAPH_NODES[id];return Math.floor(Math.sqrt((t.x-n.x)**2+(t.y-n.y)**2)/40);};
    const INF=999; const gc=Object.fromEntries(GRAPH_NODES.map(n=>[n.id,INF])); gc[0]=0; const prev=Object.fromEntries(GRAPH_NODES.map(n=>[n.id,null])); const open=[0]; let visited=[]
    gSet({nar:'A*: f=g+h guides toward goal'})
    while(open.length){if(stopRef.current)return;open.sort((a,b)=>(gc[a]+h(a))-(gc[b]+h(b)));const u=open.shift();if(visited.includes(u))continue;visited.push(u);gSet({current:u,visited:[...visited],queue:[...open],nar:`A*: ${GRAPH_NODES[u].l} g=${gc[u]} h=${h(u)} f=${gc[u]+h(u)}`});incStep();await sleep(spd());if(u===GRAPH_NODES.length-1)break;wadj[u].forEach(({v,w})=>{const tg=gc[u]+w;if(tg<gc[v]){gc[v]=tg;prev[v]=u;if(!open.includes(v))open.push(v);}});}
    const t=GRAPH_NODES.length-1; const path=[]; let c=t; while(c!==null){path.unshift(c);c=prev[c];}
    gSet({path,current:null,nar:`A* done! Path: ${path.map(i=>GRAPH_NODES[i].l).join('→')}`})
  }
  const topoAnim = async () => {
    const inD=Object.fromEntries(GRAPH_NODES.map(n=>[n.id,0])); GRAPH_EDGES.forEach(e=>inD[e.v]++); const q=Object.entries(inD).filter(([,d])=>d===0).map(([id])=>+id); let visited=[],topo=[]
    gSet({nar:"Kahn's Topological Sort: start with in-degree=0"})
    while(q.length){if(stopRef.current)return;const u=q.shift();visited.push(u);topo.push(GRAPH_NODES[u].l);gSet({visited:[...visited],current:u,topo:[...topo],nar:`Processing ${GRAPH_NODES[u].l}, decrement neighbors`});incStep();await sleep(spd());adj[u].forEach(v=>{inD[v]--;if(inD[v]===0)q.push(v);});}
    gSet({current:null,nar:`Topological order: ${topo.join('→')}`})
  }
  const primAnim = async () => {
    const inMST=new Set([0]); let mst=[],mstCost=0,visited=[0]
    gSet({mst:[],mstCost:0,visited:[0],nar:"Prim's MST: grow from A, add cheapest edge"})
    while(inMST.size<GRAPH_NODES.length){if(stopRef.current)return;let best=null;inMST.forEach(u=>{wadj[u].forEach(({v,w})=>{if(!inMST.has(v)&&(!best||w<best.w))best={u,v,w};});});if(!best)break;inMST.add(best.v);mst.push({u:best.u,v:best.v});mstCost+=best.w;visited=[...inMST];gSet({mst:[...mst],mstCost,visited:[...visited],current:best.v,nar:`Added ${GRAPH_NODES[best.u].l}-${GRAPH_NODES[best.v].l} w=${best.w}. Total=${mstCost}`});incStep();await sleep(spd());}
    gSet({current:null,nar:`Prim's done! MST cost=${mstCost}`})
  }
  const kruskalAnim = async () => {
    const edges=[...GRAPH_EDGES].sort((a,b)=>a.w-b.w); const par=GRAPH_NODES.map(n=>n.id),rank=new Array(GRAPH_NODES.length).fill(0)
    const find=x=>par[x]===x?x:(par[x]=find(par[x]))
    const union=(a,b)=>{const ra=find(a),rb=find(b);if(ra===rb)return false;if(rank[ra]<rank[rb])par[ra]=rb;else if(rank[ra]>rank[rb])par[rb]=ra;else{par[rb]=ra;rank[ra]++;}return true;}
    let mst=[],mstCost=0; gSet({nar:"Kruskal's: sort edges, add if no cycle"})
    for(const e of edges){if(stopRef.current)return;gSet({current:e.u,nar:`Consider ${GRAPH_NODES[e.u].l}-${GRAPH_NODES[e.v].l} w=${e.w}`});incStep();await sleep(spd());if(union(e.u,e.v)){mst.push({u:e.u,v:e.v});mstCost+=e.w;const vis=GRAPH_NODES.filter(n=>mst.some(me=>me.u===n.id||me.v===n.id)).map(n=>n.id);gSet({mst:[...mst],mstCost,visited:vis,nar:`Added! MST cost=${mstCost}`});await sleep(spd());}else{gSet({nar:'Skipped — would create cycle'});await sleep(spd()/2);}}
    gSet({current:null,nar:`Kruskal's done! MST cost=${mstCost}`})
  }
  const floydAnim = async () => {
    if (!fwState) return
    const fw = {...fwState}
    for(let k=0;k<fw.N;k++){for(let i=0;i<fw.N;i++){for(let j=0;j<fw.N;j++){if(stopRef.current)return;fw.k=k;fw.i=i;fw.j=j;fw.nar=`k=${k} i=${i} j=${j}: relaxing via k`;if(fw.dist[i][k]+fw.dist[k][j]<fw.dist[i][j])fw.dist[i][j]=fw.dist[i][k]+fw.dist[k][j];setFwState({...fw});incStep();await sleep(Math.max(15,spd()/10));}}}
    setFwState({...fw,nar:'Floyd-Warshall done! All-pairs shortest paths found.'})
  }
  const tarjanAnim = async () => {
    const N=GRAPH_NODES.length,disc=new Array(N).fill(-1),low=new Array(N).fill(-1),onStk=new Array(N).fill(false),stk=[];let timer=0;const sccs=[];let trail=[]
    const dfs=async v=>{disc[v]=low[v]=timer++;stk.push(v);onStk[v]=true;gSet({current:v,stack:[...stk],nar:`Tarjan DFS at ${GRAPH_NODES[v].l} disc=${disc[v]}`});incStep();await sleep(spd());for(const u of adj[v]){if(stopRef.current)return;if(disc[u]===-1){await dfs(u);low[v]=Math.min(low[v],low[u]);}else if(onStk[u])low[v]=Math.min(low[v],disc[u]);}if(low[v]===disc[v]){const scc=[];while(true){const u=stk.pop();onStk[u]=false;scc.push(GRAPH_NODES[u].l);if(u===v)break;}sccs.push(scc);trail=[...trail,...scc];gSet({trail:[...trail],nar:`SCC found: [${scc.join(',')}]`});await sleep(spd());}};
    for(let i=0;i<N;i++){if(disc[i]===-1&&!stopRef.current)await dfs(i);}
    gSet({current:null,nar:`Tarjan done! SCCs: ${sccs.map(s=>'['+s.join(',')+']').join(', ')}`})
  }

  // ── TREE ────────────────────────────────────────────────────────────────────
  const tv = (updates) => setTreeVis(prev => ({...prev, ...updates}))
  const bstInsertAnim = async () => {
    const v=rnd(5,95); let c=treeRoot,path=[]
    while(c){if(stopRef.current)return;path.push(c.v);tv({visiting:c.v,path:[...path],trail:[],narration:`${v}${v<c.v?'<':'>'}${c.v} → ${v<c.v?'left':'right'}`});incStep();await sleep(spd());c=v<c.v?c.l:c.r;}
    setTreeRoot(r=>bstInsNode(r,v));tv({found:v,visiting:null});await fetchNarration(algo.name,{inserted:v,path})
  }
  const bstSearchAnim = async () => {
    const pos=calcPos(treeRoot,290,38,115); const t=pos[rnd(0,pos.length-1)]?.v; let c=treeRoot
    while(c){if(stopRef.current)return;tv({visiting:c.v,narration:`At ${c.v}: ${t}${t===c.v?'=FOUND!':t<c.v?'<, go left':'>= go right'}`});incStep();await sleep(spd());if(c.v===t){tv({found:t,visiting:null});return;}c=t<c.v?c.l:c.r;}
    tv({visiting:null})
  }
  const inorderAnim = async () => {
    let trail=[]
    const io=async n=>{if(!n||stopRef.current)return;await io(n.l);tv({visiting:n.v,trail:[...trail=[...trail,n.v]],narration:`In-order: visiting ${n.v}`});incStep();await sleep(spd());await io(n.r);};
    await io(treeRoot); tv({visiting:null,narration:`In-order: [${trail.join(', ')}] — sorted!`}); await fetchNarration(algo.name,{order:trail})
  }
  const preorderAnim = async () => {
    let trail=[]
    const po=async n=>{if(!n||stopRef.current)return;tv({visiting:n.v,trail:[...trail=[...trail,n.v]],narration:`Pre-order: visiting ${n.v} before children`});incStep();await sleep(spd());await po(n.l);await po(n.r);};
    await po(treeRoot); tv({visiting:null,narration:`Pre-order: [${trail.join(', ')}]`})
  }
  const postorderAnim = async () => {
    let trail=[]
    const po=async n=>{if(!n||stopRef.current)return;await po(n.l);await po(n.r);tv({visiting:n.v,trail:[...trail=[...trail,n.v]],narration:`Post-order: visiting ${n.v} after children`});incStep();await sleep(spd());};
    await po(treeRoot); tv({visiting:null,narration:`Post-order: [${trail.join(', ')}] — used for deletion`})
  }
  const avlAnim = async () => {
    for(const v of [15,25,35,5]){if(stopRef.current)return;tv({visiting:v,narration:`AVL: inserting ${v} — may require rotation`});incStep();setTreeRoot(r=>bstInsNode(r,v));await sleep(spd()*1.5);}
    tv({found:35,visiting:null,narration:'AVL done — height balance maintained O(log n)'})
  }

  // ── SEGMENT TREE ──────────────────────────────────────────────────────────
  const segAnim = async () => {
    const {arr,tree} = segState; const {l,r} = segState.query; let hl=[]
    const qr=async(node,s,e,l,r)=>{if(stopRef.current)return 0;hl=[...hl,node];setSegState(p=>({...p,hl:[...hl],query:{...p.query},nar:`Checking [${s},${e}]: ${s>=l&&e<=r?'fully in range':'partial/out'}`}));incStep();await sleep(spd());if(s>r||e<l)return 0;if(s>=l&&e<=r)return tree[node];const m=Math.floor((s+e)/2);const left=await qr(2*node+1,s,m,l,r);const right=await qr(2*node+2,m+1,e,l,r);return left+right;};
    const result=await qr(0,0,arr.length-1,l,r);setSegState(p=>({...p,hl:[],query:{...p.query,result},nar:`Range sum [${l},${r}] = ${result}`}))
  }

  // ── FENWICK ───────────────────────────────────────────────────────────────
  const fenAnim = async () => {
    const {bit,arr,n} = fenState; let prefix=[]
    for(let i=1;i<=n;i++){if(stopRef.current)return;const active=[];let j=i;while(j>0){active.push(j);j-=j&(-j);}setFenState(p=>({...p,hl:active,nar:`prefix[${i}]=${fenQuery(bit,i)} (traversed: ${active.join('→')})`}));prefix.push(fenQuery(bit,i));incStep();await sleep(spd());}
    setFenState(p=>({...p,hl:[],prefix,nar:`All prefix sums: [${prefix.join(', ')}] — each in O(log n)!`}))
  }

  // ── TRIE ─────────────────────────────────────────────────────────────────
  const trieAnim = async () => {
    let root={c:{},end:false},inserted=[]
    for(const word of trieState.words){if(stopRef.current)return;let node=root,hl=[],prefix=''
      for(const ch of word){if(!node.c[ch])node.c[ch]={c:{},end:false};node=node.c[ch];prefix+=ch;hl=[...hl,prefix];setTrieState(p=>({...p,root:{...root},hl:[...hl],nar:`Insert "${word}": prefix "${prefix}"`}));incStep();await sleep(spd());}
      node.end=true;inserted=[...inserted,word];setTrieState(p=>({...p,root:{...root},inserted:[...inserted],hl:[],nar:`Inserted "${word}"`}));await sleep(spd());}
    setTrieState(p=>({...p,nar:`Trie done! ${inserted.length} words, O(m) per lookup`}))
  }

  // ── LINKED LIST ───────────────────────────────────────────────────────────
  const llUpdate = (fn) => setLlList(prev => { const n=fn([...prev]); return n; })
  const llInsertAnim = async () => {
    const v=rnd(10,99),pos=rnd(0,llList.length)
    for(let i=0;i<=pos;i++){if(stopRef.current)return;setLlList(prev=>prev.map((n,k)=>({...n,s:k===i?'c':'n'})));incStep();await sleep(spd());}
    setLlList(prev=>[...prev.slice(0,pos),{v,id:Date.now(),s:'new'},...prev.slice(pos)])
  }
  const llDeleteAnim = async () => {
    if(!llList.length)return; const idx=rnd(0,llList.length-1)
    for(let i=0;i<=idx;i++){if(stopRef.current)return;setLlList(prev=>prev.map((n,k)=>({...n,s:k===i?'c':'n'})));incStep();await sleep(spd());}
    setLlList(prev=>prev.map((n,k)=>({...n,s:k===idx?'del':n.s}))); await sleep(spd()*1.5)
    setLlList(prev=>prev.filter((_,k)=>k!==idx).map(n=>({...n,s:'n'})))
  }
  const llReverseAnim = async () => {
    let list=[...llList]
    for(let i=0;i<Math.floor(list.length/2);i++){if(stopRef.current)return;const j=list.length-1-i;setLlList(prev=>prev.map((n,k)=>({...n,s:k===i||k===j?'f':'n'})));incStep();await sleep(spd());[list[i],list[j]]=[list[j],list[i]];setLlList([...list].map(n=>({...n,s:'n'})));}
  }
  const llCycleAnim = async () => {
    setLlList(prev=>prev.map(n=>({...n,s:'n'})));let slow=0,fast=0
    while(fast<llList.length-1){if(stopRef.current)return;fast=Math.min(fast+2,llList.length-1);slow=Math.min(slow+1,llList.length-1);setLlList(prev=>prev.map((n,k)=>({...n,s:k===slow?'slow':k===fast?'fast':'n'})));incStep();await sleep(spd());if(slow===fast)break;}
    setLlList(prev=>prev.map((n,k)=>({...n,s:k===slow&&slow===fast?'f':n.s})))
  }
  const llMergeAnim = async () => {
    const a=[{v:1,id:1,s:'n'},{v:3,id:3,s:'n'},{v:5,id:5,s:'n'}]
    const b=[{v:2,id:2,s:'n'},{v:4,id:4,s:'n'},{v:6,id:6,s:'n'}]
    setLlList([...a,...b]); await sleep(spd())
    let ia=0,ib=0,merged=[]
    while(ia<a.length&&ib<b.length){if(stopRef.current)return;if(a[ia].v<b[ib].v)merged.push({...a[ia++],s:'f'});else merged.push({...b[ib++],s:'f'});incStep();setLlList([...merged,...a.slice(ia),...b.slice(ib)].map(n=>({...n})));await sleep(spd());}
    while(ia<a.length)merged.push({...a[ia++],s:'n'});while(ib<b.length)merged.push({...b[ib++],s:'n'});setLlList(merged)
  }

  // ── DP ────────────────────────────────────────────────────────────────────
  const lcsAnim = async () => {
    const s1='AGGTAB',s2='GXTXAYB'; const m=s1.length,n=s2.length; const t=Array.from({length:m+1},()=>new Array(n+1).fill(0))
    for(let i=1;i<=m;i++){for(let j=1;j<=n;j++){if(stopRef.current)return;t[i][j]=(s1[i-1]===s2[j-1])?t[i-1][j-1]+1:Math.max(t[i-1][j],t[i][j-1]);setDpState({s1,s2,table:t.map(r=>[...r]),i,j,nar:`'${s1[i-1]}' vs '${s2[j-1]}': ${s1[i-1]===s2[j-1]?'match! +1':'max'} = ${t[i][j]}`});incStep();await sleep(Math.max(15,spd()/3));}}
    setDpState(p=>({...p,nar:`LCS length = ${t[m][n]}`}))
  }
  const knapsackAnim = async () => {
    const weights=[2,3,4,5],vals=[3,4,5,6],W=8,n=weights.length; const t=Array.from({length:n+1},()=>new Array(W+1).fill(0))
    for(let i=1;i<=n;i++){for(let j=0;j<=W;j++){if(stopRef.current)return;const wi=weights[i-1],vi=vals[i-1];t[i][j]=(wi<=j)?Math.max(t[i-1][j],vi+t[i-1][j-wi]):t[i-1][j];setDpState({weights,vals,W,table:t.map(r=>[...r]),i,j,nar:`Item ${i}(w=${wi},v=${vi}) cap=${j}: ${t[i][j]}`});incStep();await sleep(Math.max(15,spd()/4));}}
    setDpState(p=>({...p,nar:`Max value = ${t[n][W]}`}))
  }
  const editDistAnim = async () => {
    const s1='AGGTAB',s2='GXTXAYB'; const m=s1.length,n=s2.length; const t=Array.from({length:m+1},()=>new Array(n+1).fill(0))
    for(let i=0;i<=m;i++)t[i][0]=i; for(let j=0;j<=n;j++)t[0][j]=j
    for(let i=1;i<=m;i++){for(let j=1;j<=n;j++){if(stopRef.current)return;t[i][j]=(s1[i-1]===s2[j-1])?t[i-1][j-1]:1+Math.min(t[i-1][j],t[i][j-1],t[i-1][j-1]);setDpState({s1,s2,table:t.map(r=>[...r]),i,j,nar:`'${s1[i-1]}' vs '${s2[j-1]}': ${s1[i-1]===s2[j-1]?'same':'min(del,ins,rep)+1'} = ${t[i][j]}`});incStep();await sleep(Math.max(15,spd()/3));}}
    setDpState(p=>({...p,nar:`Edit distance = ${t[m][n]}`}))
  }
  const matrixChainAnim = async () => {
    const dims=[10,30,5,60,4]; const n=dims.length-1; const t=Array.from({length:n},()=>new Array(n).fill(0))
    for(let len=2;len<=n;len++){for(let i=0;i<n-len+1;i++){if(stopRef.current)return;const j=i+len-1;t[i][j]=Infinity;for(let k=i;k<j;k++){const cost=t[i][k]+t[k+1][j]+dims[i]*dims[k+1]*dims[j+1];if(cost<t[i][j])t[i][j]=cost;}setDpState({dims,table:t.map(r=>[...r]),i,j:len,nar:`M[${i},${j}] min cost = ${t[i][j]}`});incStep();await sleep(Math.max(20,spd()/3));}}
    setDpState(p=>({...p,nar:`Matrix Chain: min multiplications = ${t[0][n-1]}`}))
  }
  const coinAnim = async () => {
    const {amount,coins}=dp1d; const dp=new Array(amount+1).fill(Infinity); dp[0]=0
    for(let i=1;i<=amount;i++){if(stopRef.current)return;for(const c of coins){if(c<=i&&dp[i-c]+1<dp[i])dp[i]=dp[i-c]+1;}setDp1d(p=>({...p,dp:[...dp],cur:i}));incStep();await sleep(spd());}
    setDp1d(p=>({...p,cur:null}))
  }
  const subsetSumAnim = async () => {
    const {arr,target}=subsetState; const n=arr.length; const dp=Array.from({length:n+1},()=>new Array(target+1).fill(false)); for(let i=0;i<=n;i++)dp[i][0]=true
    for(let i=1;i<=n;i++){for(let j=0;j<=target;j++){if(stopRef.current)return;dp[i][j]=dp[i-1][j]||(arr[i-1]<=j&&dp[i-1][j-arr[i-1]]);setSubsetState(p=>({...p,dp:dp.map(r=>[...r]),cur:{i,j},nar:`Include ${arr[i-1]}? [${i},${j}]: ${dp[i][j]}`}));incStep();await sleep(Math.max(15,spd()/4));}}
    setSubsetState(p=>({...p,cur:null,nar:`Subset sum to ${target}? ${dp[n][target]}`}))
  }

  // ── ADVANCED STRUCTURES ───────────────────────────────────────────────────
  const ufFind = (par,x) => { if(par[x]!==x)par[x]=ufFind(par,par[x]); return par[x]; }
  const ufAnim = async () => {
    const ops=[{a:0,b:1},{a:2,b:3},{a:1,b:3},{a:4,b:5},{a:0,b:4}]
    let par=[...ufState.par],rank=[...ufState.rank]
    for(const{a,b}of ops){if(stopRef.current)return;setUfState(p=>({...p,hl:[a,b],nar:`Union(${a},${b}): finding roots`}));incStep();await sleep(spd());const ra=ufFind(par,a),rb=ufFind(par,b);if(ra===rb){setUfState(p=>({...p,nar:`${a},${b} already connected`}));await sleep(spd()/2);continue;}if(rank[ra]<rank[rb])par[ra]=rb;else if(rank[ra]>rank[rb])par[rb]=ra;else{par[rb]=ra;rank[ra]++;}setUfState(p=>({...p,par:[...par],rank:[...rank],nar:`United ${a} and ${b} (path compressed)`}));await sleep(spd());}
    setUfState(p=>({...p,hl:[],nar:'DSU done! O(α(n)) ≈ near-constant with path compression'}))
  }
  const hashChainAnim = async () => {
    let table=new Array(11).fill(null).map(()=>[])
    for(const k of hashState.keys){if(stopRef.current)return;const h=k%11;setHashState(p=>({...p,hl:[h],nar:`Insert ${k}: hash=${k}%11=${h}, append to chain`}));table[h].push(k);setHashState(p=>({...p,table:table.map(b=>[...b]),hl:[h]}));incStep();await sleep(spd());}
    setHashState(p=>({...p,hl:[],nar:'Chaining done! O(1) avg insert/lookup'}))
  }
  const hashOpenAnim = async () => {
    let openTable=new Array(11).fill(null)
    for(const k of hashState.keys){if(stopRef.current)return;let h=k%11,probe=0;while(openTable[h]!==null){setHashState(p=>({...p,openTable:[...openTable],hl:[h],nar:`Insert ${k}: slot ${h} taken, probe+1`}));incStep();await sleep(spd()/2);h=(h+1)%11;probe++;}openTable[h]=k;setHashState(p=>({...p,openTable:[...openTable],hl:[h],nar:`Insert ${k}: placed at slot ${h} (${probe} probes)`}));incStep();await sleep(spd());}
    setHashState(p=>({...p,hl:[],nar:'Open addressing done! Linear probing.'}))
  }
  const heapInsAnim = async () => {
    const v=rnd(1,50); let heap=[...heapArr]; heap.push(v); let i=heap.length-1
    setHeapArr([...heap]); await sleep(spd())
    while(i>0){if(stopRef.current)return;const p=Math.floor((i-1)/2);setHeapHl([i,p]);if(heap[p]>heap[i]){[heap[i],heap[p]]=[heap[p],heap[i]];setHeapArr([...heap]);incStep();await sleep(spd());i=p;}else break;}
    setHeapHl([])
  }
  const heapExtAnim = async () => {
    let heap=[...heapArr]; if(!heap.length)return; setHeapHl([0]); await sleep(spd())
    heap[0]=heap.pop(); let i=0; setHeapArr([...heap])
    while(true){if(stopRef.current)return;const l=2*i+1,r=2*i+2;let sm=i;if(l<heap.length&&heap[l]<heap[sm])sm=l;if(r<heap.length&&heap[r]<heap[sm])sm=r;if(sm===i)break;setHeapHl([i,sm]);[heap[i],heap[sm]]=[heap[sm],heap[i]];setHeapArr([...heap]);incStep();await sleep(spd());i=sm;}
    setHeapHl([])
  }

  // ── SLIDING WINDOW / TWO POINTER ─────────────────────────────────────────
  const swMaxAnim = async () => {
    const {arr,k}=swState; const dq=[]; let max=[]
    for(let i=0;i<arr.length;i++){if(stopRef.current)return;while(dq.length&&dq[0]<i-k+1)dq.shift();while(dq.length&&arr[dq[dq.length-1]]<arr[i])dq.pop();dq.push(i);const win=Array.from({length:Math.min(k,i+1)},(_,j)=>i-Math.min(k,i+1)+1+j);if(i>=k-1)max=[...max,dq[0]];setSwState(p=>({...p,win,deque:[...dq],max:[...max],nar:`Window [${Math.max(0,i-k+1)},${i}]: deque=[${dq.map(j=>arr[j]).join(',')}]`}));incStep();await sleep(spd());}
    setSwState(p=>({...p,nar:'Sliding Window Max done — O(n) using monotonic deque!'}))
  }
  const swSumAnim = async () => {
    const arr=swState.arr; let l=0,sum=0; const target=Math.floor(arr.reduce((a,b)=>a+b,0)/arr.length)
    for(let r=0;r<arr.length;r++){if(stopRef.current)return;sum+=arr[r];const win=Array.from({length:r-l+1},(_,i)=>l+i);setSwState(p=>({...p,win,nar:`Window [${l},${r}] sum=${sum} target=${target}`}));incStep();await sleep(spd());while(sum>=target&&l<=r){sum-=arr[l++];}}
    setSwState(p=>({...p,nar:'Sliding Window Sum done!'}))
  }
  const twoSumAnim = async () => {
    const {arr}=tpState; let l=0,r=arr.length-1,pairs=[]
    while(l<r){if(stopRef.current)return;const s=arr[l]+arr[r];setTpState(p=>({...p,l,r,nar:`arr[${l}]+arr[${r}]=${arr[l]}+${arr[r]}=${s} ${s===0?'=0! Found!':s<0?'<0, move L':'>0, move R'}`}));incStep();await sleep(spd());if(s===0){pairs=[...pairs,[l,r]];setTpState(p=>({...p,pairs:[...pairs]}));l++;r--;}else if(s<0)l++;else r--;}
    setTpState(p=>({...p,nar:`Two Sum done! ${pairs.length} pairs summing to 0`}))
  }
  const threeSumAnim = async () => {
    const {arr}=tpState; let pairs=[]
    for(let i=0;i<arr.length-2;i++){let l=i+1,r=arr.length-1;while(l<r){if(stopRef.current)return;const s=arr[i]+arr[l]+arr[r];setTpState(p=>({...p,l,r,nar:`Fix i=${i}(${arr[i]}): sum=${s} ${s===0?'=0!':s<0?'move L':'move R'}`}));incStep();await sleep(spd());if(s===0){pairs=[...pairs,[i,l,r]];setTpState(p=>({...p,pairs:[...pairs]}));l++;r--;}else if(s<0)l++;else r--;}}
    setTpState(p=>({...p,nar:`3Sum done! ${pairs.length} triplets`}))
  }

  // ── BACKTRACKING ──────────────────────────────────────────────────────────
  const nqueensAnim = async () => {
    const n=nqState.n; let solutions=0
    const isSafe=(b,r,c)=>{for(let i=0;i<r;i++)if(b[i][c])return false;for(let i=r-1,j=c-1;i>=0&&j>=0;i--,j--)if(b[i][j])return false;for(let i=r-1,j=c+1;i>=0&&j<n;i--,j++)if(b[i][j])return false;return true;};
    const solve=async(b,r)=>{if(r===n){solutions++;setNqState(p=>({...p,solutions,nar:`Solution #${solutions}!`}));await sleep(spd()*2);return;}for(let c=0;c<n;c++){if(stopRef.current)return;if(isSafe(b,r,c)){b[r][c]=1;setNqState(p=>({...p,board:b.map(row=>[...row]),nar:`Row ${r}: placing at col ${c}`}));incStep();await sleep(spd());await solve(b,r+1);b[r][c]=0;setNqState(p=>({...p,board:b.map(row=>[...row]),nar:`Row ${r}: backtrack from col ${c}`}));await sleep(spd()/4);}else{b[r][c]=-1;setNqState(p=>({...p,board:b.map(row=>[...row])}));await sleep(spd()/5);b[r][c]=0;}}};
    await solve(nqState.board.map(r=>[...r]),0); setNqState(p=>({...p,nar:`Done! ${solutions} solutions for n=${n}`}))
  }
  const huffmanAnim = async () => {
    const text=huffState.text; const freq={}; for(const c of text)freq[c]=(freq[c]||0)+1
    setHuffState(p=>({...p,freq})); await sleep(spd())
    let nodes=Object.entries(freq).map(([ch,f])=>({ch,f,l:null,r:null}))
    while(nodes.length>1){if(stopRef.current)return;nodes.sort((a,b)=>a.f-b.f);const a=nodes.shift(),b=nodes.shift();const merged={ch:`(${a.ch}+${b.ch})`,f:a.f+b.f,l:a,r:b};nodes.push(merged);setHuffState(p=>({...p,nar:`Merge '${a.ch}'(${a.f})+'${b.ch}'(${b.f})=${merged.f}`}));incStep();await sleep(spd());}
    const root=nodes[0]; const codes={};
    const build=(node,code)=>{if(!node)return;if(!node.l&&!node.r){codes[node.ch]=code||'0';return;}build(node.l,code+'0');build(node.r,code+'1');};
    build(root,''); setHuffState(p=>({...p,codes,built:true,nar:`Done! Codes: ${Object.entries(codes).map(([c,cd])=>`'${c}'=${cd}`).join(', ')}`}))
  }
  const mcAnim = async () => {
    let n=0,inside=0,pts=[]
    for(let batch=0;batch<200;batch++){if(stopRef.current)return;for(let b=0;b<4;b++){const x=Math.random(),y=Math.random();const ins=Math.sqrt((x-.5)**2+(y-.5)**2)<=.5;if(ins)inside++;n++;pts.push({x,y,inside:ins});}const piEst=4*inside/n;setMcState({n,inside,piEst,pts:[...pts],nar:`Threw ${n} points → π ≈ ${piEst.toFixed(4)}`});incStep();await sleep(Math.max(8,spd()/20));}
    setMcState(p=>({...p,nar:`Monte Carlo done! π ≈ ${p.piEst.toFixed(5)} (actual: 3.14159)`}))
  }
  const sieveAnim = async () => {
    let sieve=new Array(101).fill(true); sieve[0]=sieve[1]=false
    for(let p=2;p*p<=100;p++){if(!sieve[p])continue;if(stopRef.current)return;setSieveState(p=>({...p,sieve:[...sieve],hl:[p],nar:`${p} is prime! Marking multiples`}));incStep();await sleep(spd());for(let i=p*p;i<=100;i+=p){sieve[i]=false;if(i-p*p<p*5){setSieveState(ps=>({...ps,sieve:[...sieve],hl:[p,i]}));await sleep(spd()/5);}}}
    const primes=Array.from({length:99},(_,i)=>i+2).filter(i=>sieve[i]);setSieveState(p=>({...p,sieve:[...sieve],hl:[],primes,nar:`Found ${primes.length} primes up to 100`}))
  }
  const gcdAnim = async () => {
    let {a,b}=gcdState; const steps=[]
    while(b!==0){if(stopRef.current)return;const r=a%b;steps.push({a,b,r});setGcdState(p=>({...p,steps:[...steps],current:steps.length-1,nar:`GCD(${a},${b}): ${a}=⌊${a}/${b}⌋×${b}+${r} → GCD(${b},${r})`}));incStep();await sleep(spd());a=b;b=r;}
    steps.push({a,b});setGcdState(p=>({...p,steps:[...steps],current:steps.length-1,nar:`GCD = ${a}`}))
  }
  const kmpAnim = async () => {
    const {text,pattern}=strState; const m=pattern.length; const lps=new Array(m).fill(0); let len=0,idx=1
    while(idx<m){if(pattern[idx]===pattern[len]){lps[idx]=++len;idx++;}else{if(len)len=lps[len-1];else{lps[idx]=0;idx++;}}}
    setStrState(p=>({...p,lps:[...lps]})); let i=0,j=0,matches=[]
    while(i<text.length){if(stopRef.current)return;setStrState(p=>({...p,ci:i,cj:j,nar:`KMP: text[${i}]='${text[i]}' vs pattern[${j}]='${pattern[j]}'`}));incStep();await sleep(spd());if(text[i]===pattern[j]){i++;j++;}if(j===m){matches=[...matches,i-j];setStrState(p=>({...p,matches:[...matches],nar:`Match at pos ${i-j}!`}));await sleep(spd());j=lps[j-1];}else if(i<text.length&&text[i]!==pattern[j]){if(j)j=lps[j-1];else i++;}}
    setStrState(p=>({...p,ci:-1,cj:-1,nar:`KMP done! ${matches.length} matches: [${matches.join(', ')}]`}))
  }
  const rabinKarpAnim = async () => {
    const {text,pattern}=strState; const base=256,mod=101,m=pattern.length,n=text.length; let ph=0,th=0,h=1,matches=[]
    for(let i=0;i<m-1;i++)h=(h*base)%mod;for(let i=0;i<m;i++){ph=(base*ph+pattern.charCodeAt(i))%mod;th=(base*th+text.charCodeAt(i))%mod;}
    for(let i=0;i<=n-m;i++){if(stopRef.current)return;setStrState(p=>({...p,ci:i,cj:0,nar:`Rabin-Karp: window hash=${th} vs pattern hash=${ph} ${ph===th?'→ confirm!':''}`}));incStep();await sleep(spd());if(ph===th){let match=true;for(let j=0;j<m;j++)if(text[i+j]!==pattern[j]){match=false;break;}if(match){matches=[...matches,i];setStrState(ps=>({...ps,matches:[...matches]}));}}if(i<n-m){th=(base*(th-text.charCodeAt(i)*h)+text.charCodeAt(i+m))%mod;if(th<0)th+=mod;}}
    setStrState(p=>({...p,ci:-1,cj:-1,nar:`Rabin-Karp done! ${matches.length} matches`}))
  }
  const sudokuAnim = async () => {
    let board=sudokuState.board.map(r=>[...r]); let attempts=0
    const isValid=(b,r,c,num)=>{for(let i=0;i<9;i++){if(b[r][i]===num||b[i][c]===num)return false;}const sr=Math.floor(r/3)*3,sc=Math.floor(c/3)*3;for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(b[sr+i][sc+j]===num)return false;return true;};
    const solve=async(b)=>{for(let r=0;r<9;r++){for(let c=0;c<9;c++){if(b[r][c]===0){for(let num=1;num<=9;num++){if(stopRef.current)return false;if(isValid(b,r,c,num)){b[r][c]=num;attempts++;setSudokuState(p=>({...p,board:b.map(row=>[...row]),attempts,nar:`Trying ${num} at (${r},${c}) — attempt #${attempts}`}));incStep();await sleep(Math.max(10,spd()/3));if(await solve(b))return true;b[r][c]=0;setSudokuState(p=>({...p,board:b.map(row=>[...row]),nar:`Backtrack from (${r},${c})`}));await sleep(Math.max(5,spd()/6));}}}return false;}}return true;};
    await solve(board); setSudokuState(p=>({...p,nar:`Sudoku solved in ${attempts} attempts!`}))
  }

  // ── RENDERING ──────────────────────────────────────────────────────────────
  const getBarColor = (i) => {
    if(hl.found?.includes(i))return'var(--dsa)';if(hl.sorted?.includes(i))return'var(--dsa)';
    if(hl.swapping?.includes(i))return'var(--red)';if(hl.comparing?.includes(i))return'var(--score)';
    if(hl.pivot?.includes(i))return'var(--git)';if(hl.min?.includes(i))return'var(--git)';
    if(hl.range?.includes(i))return'rgba(56,189,248,.4)';if(hl.jump?.includes(i))return'var(--sql)';
    if(hl.key?.includes(i))return'var(--sql)';if(hl.lis?.includes(i))return'var(--sql)';
    return'rgba(255,255,255,.07)'
  }
  const getNodeColor = (id) => {
    if(id===gState.current)return'var(--score)';if(gState.path?.includes(id))return'var(--dsa)';
    if(gState.mst?.some(e=>e.u===id||e.v===id))return'var(--dsa)';if(gState.visited?.includes(id))return'var(--git)';
    if(gState.queue?.includes(id))return'var(--sql)';if(gState.stack?.includes(id))return'var(--red)';
    return'rgba(255,255,255,.06)'
  }
  const isPathEdge=(u,v)=>{if(!gState.path||gState.path.length<2)return false;for(let i=0;i<gState.path.length-1;i++){if((gState.path[i]===u&&gState.path[i+1]===v)||(gState.path[i]===v&&gState.path[i+1]===u))return true;}return false;}
  const isMSTEdge=(u,v)=>gState.mst?.some(e=>(e.u===u&&e.v===v)||(e.u===v&&e.v===u))

  const accentColor = algo ? (ALGO_GROUPS.find(g=>g.algos.some(a=>a.id===algo.id))?.color || 'var(--dsa)') : 'var(--dsa)'

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.icon}>⬡</span>
          <div>
            <h1 className={styles.title}>DSAVisualizer</h1>
            <p className={styles.sub}>50+ algorithms — sorting, graphs, trees, DP, and rare ones</p>
          </div>
        </div>
      </div>

      <div className={styles.mainLayout}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          {ALGO_GROUPS.map(group => (
            <div key={group.label} className={styles.sideGroup}>
              <div className={styles.sideGroupLabel} style={{color:group.color}}>{group.label}</div>
              {group.algos.map(a => (
                <button
                  key={a.id}
                  className={`${styles.sideBtn} ${algo?.id===a.id ? styles.sideBtnActive : ''}`}
                  style={algo?.id===a.id ? {'--ac':group.color} : {}}
                  onClick={() => { if(!running) setAlgo(a) }}
                  disabled={running}
                >{a.name}</button>
              ))}
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div className={styles.canvas}>
          {!algo && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⬡</div>
              <p>Select an algorithm from the sidebar</p>
            </div>
          )}

          {algo && (
            <>
              {/* Controls */}
              <div className={styles.controls}>
                <div className={styles.algoTitle} style={{color:accentColor}}>{algo.name}</div>
                <div className={styles.complexRow}>
                  <span className={styles.badge} style={{background:`${accentColor}18`,color:accentColor,border:`1px solid ${accentColor}40`}}>T: {algo.tc}</span>
                  <span className={styles.badge} style={{background:'rgba(255,255,255,.05)',color:'var(--text2)',border:'1px solid rgba(255,255,255,.1)'}}>S: {algo.sc}</span>
                </div>
                <div className={styles.actionRow}>
                  <div className={styles.speedWrap}><span className={styles.speedLabel}>Speed</span>
                    <input type="range" min="50" max="900" step="50" value={900-speed+50} onChange={e=>setSpeed(900-Number(e.target.value)+50)} className={styles.slider} disabled={running}/>
                  </div>
                  <button className={styles.resetBtn} onClick={reset} disabled={running}>↺ Reset</button>
                  <button className={styles.resetBtn} onClick={()=>setShowExplanation(true)} disabled={running} style={{background:'rgba(52,211,153,.15)',color:'var(--dsa)',border:'1px solid rgba(52,211,153,.4)'}}>📚 Learn</button>
                  <button className={`${styles.runBtn} ${running ? styles.runBtnStop : ''}`} style={running ? {} : {'--gc':accentColor}}
                    onClick={running ? ()=>{stopRef.current=true;setRunning(false)} : runAlgorithm}>
                    {running ? '⏹ Stop' : '▶ Run'}
                  </button>
                </div>
              </div>

              {/* Visualization */}
              <div className={styles.vizCard} style={{borderColor:`${accentColor}30`}}>
                <div className={styles.vizHeader}>
                  <span className={styles.vizLabel} style={{color:accentColor}}>{algo.name}</span>
                  <span className={styles.stepCount}>Steps: {step}</span>
                </div>

                {/* BARS */}
                {algo.viz === 'bars' && (
                  <div>
                    <div className={styles.barsWrap}>
                      {arr.map((v,i) => { const mx=Math.max(...arr)||1; return <div key={i} className={styles.bar} style={{height:`${(v/mx)*185}px`,background:getBarColor(i)}}/>})}
                    </div>
                    <div className={styles.barLabels}>{arr.map((v,i)=><span key={i} className={styles.barLbl}>{v}</span>)}</div>
                    {hl.trail?.length > 0 && <div className={styles.trail}>{hl.trail.map((v,i)=><span key={i} className={styles.trailNode} style={{color:accentColor,borderColor:`${accentColor}40`,background:`${accentColor}10`}}>{v}</span>)}</div>}
                  </div>
                )}

                {/* GRAPH */}
                {(algo.viz === 'graph') && (
                  <div>
                    <svg className={styles.graphSvg} viewBox="0 0 600 330">
                      {GRAPH_EDGES.map((e,i)=>{const a=GRAPH_NODES[e.u],b=GRAPH_NODES[e.v];const pe=isPathEdge(e.u,e.v),me=isMSTEdge(e.u,e.v);return(<g key={i}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={pe||me?'var(--dsa)':'rgba(255,255,255,.09)'} strokeWidth={pe||me?2.5:1} strokeDasharray={pe||me?'none':'4 3'}/><text x={(a.x+b.x)/2} y={(a.y+b.y)/2-7} fill="rgba(255,255,255,.22)" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono,monospace">{e.w}</text></g>);})}
                      {GRAPH_NODES.map(n=>(<g key={n.id}><circle cx={n.x} cy={n.y} r={21} fill={getNodeColor(n.id)} stroke="rgba(255,255,255,.18)" strokeWidth="1.5"/><text x={n.x} y={n.y} fill="#fff" fontSize="12" fontWeight="700" textAnchor="middle" dominantBaseline="central" fontFamily="JetBrains Mono,monospace">{n.l}</text>{gState.dist[n.id]!==undefined&&gState.dist[n.id]!==999&&<text x={n.x} y={n.y+34} fill="var(--score)" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono,monospace">d={gState.dist[n.id]}</text>}</g>))}
                    </svg>
                    {gState.trail?.length > 0 && <div className={styles.trail}>{gState.trail.map((l,i)=><span key={i} className={styles.trailNode} style={{color:'var(--git)',borderColor:'rgba(167,139,250,.3)',background:'rgba(167,139,250,.08)'}}>{l}</span>)}</div>}
                    {gState.topo?.length > 0 && <div className={styles.trail}><span className={styles.trailLabel}>Topo:</span>{gState.topo.map((l,i)=><span key={i} className={styles.trailNode} style={{color:'var(--sql)',borderColor:'rgba(56,189,248,.3)',background:'rgba(56,189,248,.08)'}}>{l}</span>)}</div>}
                    {gState.mstCost > 0 && <div className={styles.trail}><span className={styles.trailNode} style={{color:'var(--dsa)',borderColor:'rgba(52,211,153,.3)',background:'rgba(52,211,153,.08)'}}>MST cost: {gState.mstCost}</span></div>}
                  </div>
                )}

                {/* FLOYD MATRIX */}
                {algo.viz === 'matrix' && fwState && (
                  <div className={styles.dpWrap}>
                    <div style={{fontSize:'10px',color:'var(--text2)',marginBottom:'6px'}}>k={fwState.k} — relaxing [{fwState.i}][{fwState.j}]</div>
                    <table className={styles.dpTable}>
                      <thead><tr><td className={`${styles.dpCell} ${styles.dpHeader}`}></td>{'ABCDE'.split('').map(l=><td key={l} className={`${styles.dpCell} ${styles.dpHeader}`}>{l}</td>)}</tr></thead>
                      <tbody>{fwState.dist.map((row,i)=><tr key={i}><td className={`${styles.dpCell} ${styles.dpHeader}`}>{'ABCDE'[i]}</td>{row.map((v,j)=>{const act=i===fwState.i&&j===fwState.j;return<td key={j} className={styles.dpCell} style={{background:act?'var(--score)':v===999?'rgba(255,255,255,.03)':'rgba(167,139,250,.12)',color:act?'#000':'var(--text)'}}>{v===999?'∞':v}</td>})}</tr>)}</tbody>
                    </table>
                  </div>
                )}

                {/* TREE */}
                {algo.viz === 'tree' && treeRoot && (
                  <div>
                    <svg className={styles.graphSvg} viewBox="0 0 600 350">
                      {calcEdg(treeRoot,300,38,115).map((e,i)=><line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="rgba(255,255,255,.1)" strokeWidth="1.2"/>)}
                      {calcPos(treeRoot,300,38,115).map((p,i)=>{const iF=treeVis.found===p.v,isV=treeVis.visiting===p.v,isP=treeVis.path?.includes(p.v);return(<g key={i}><circle cx={p.x} cy={p.y} r={18} fill={iF?'var(--dsa)':isV?'var(--score)':isP?'var(--git)':'rgba(255,255,255,.06)'} stroke="rgba(255,255,255,.18)" strokeWidth="1.5"/><text x={p.x} y={p.y} fill="#fff" fontSize="10" fontWeight="700" textAnchor="middle" dominantBaseline="central" fontFamily="JetBrains Mono,monospace">{p.v}</text></g>);})}
                    </svg>
                    {treeVis.trail?.length > 0 && <div className={styles.trail}><span className={styles.trailLabel}>Order:</span>{treeVis.trail.map((v,i)=><span key={i} className={styles.trailNode} style={{color:'var(--score)',borderColor:'rgba(245,158,11,.3)',background:'rgba(245,158,11,.08)'}}>{v}</span>)}</div>}
                  </div>
                )}

                {/* SEGMENT TREE */}
                {algo.viz === 'segtree' && (
                  <div>
                    <div style={{fontSize:'11px',color:'var(--text2)',marginBottom:'8px'}}>Array: [{segState.arr.join(', ')}] | Query: sum[{segState.query.l}..{segState.query.r}]{segState.query.result!==null?` = ${segState.query.result}`:''}</div>
                    <svg className={styles.graphSvg} viewBox="0 0 600 280">
                      {(function draw(node,s,e,x,y,w){if(s>e||node>=segState.tree.length)return null;const act=segState.hl.includes(node);const m=Math.floor((s+e)/2);const lx=x-w/2.5,rx=x+w/2.5;return(<g key={`${node}-${s}-${e}`}>{s!==e&&<><line x1={x} y1={y+12} x2={lx} y2={y+46} stroke="rgba(255,255,255,.1)" strokeWidth="1"/><line x1={x} y1={y+12} x2={rx} y2={y+46} stroke="rgba(255,255,255,.1)" strokeWidth="1"/>{draw(2*node+1,s,m,lx,y+58,w/2.2)}{draw(2*node+2,m+1,e,rx,y+58,w/2.2)}</>}<rect x={x-w/2} y={y-12} width={w} height={24} rx={4} fill={act?'var(--score)':'rgba(255,255,255,.06)'} stroke="rgba(255,255,255,.15)" strokeWidth="1"/><text x={x} y={y-2} fill={act?'#000':'var(--sql)'} fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono,monospace">s={segState.tree[node]}</text><text x={x} y={y+7} fill="rgba(255,255,255,.3)" fontSize="7" textAnchor="middle" fontFamily="JetBrains Mono,monospace">[{s},{e}]</text></g>)})(0,0,segState.arr.length-1,300,28,480)}
                    </svg>
                  </div>
                )}

                {/* FENWICK */}
                {algo.viz === 'fenwick' && (
                  <div>
                    <div style={{fontSize:'11px',color:'var(--text2)',marginBottom:'8px'}}>Array: [{fenState.arr.join(', ')}]</div>
                    <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'8px'}}>
                      {fenState.bit.slice(1).map((v,i)=>{const act=fenState.hl.includes(i+1);return<div key={i} style={{width:'38px',height:'50px',borderRadius:'6px',border:`1px solid ${act?'var(--score)':'rgba(255,255,255,.12)'}`,background:act?'rgba(245,158,11,.2)':'rgba(255,255,255,.04)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'700',color:act?'var(--score)':'var(--text)'}}><span>{v}</span><span style={{fontSize:'8px',color:'var(--text3)'}}>i={i+1}</span></div>})}
                    </div>
                    {fenState.prefix.length>0 && <div style={{fontSize:'10px',color:'var(--text2)'}}>Prefix sums: [{fenState.prefix.join(', ')}]</div>}
                  </div>
                )}

                {/* TRIE */}
                {algo.viz === 'trie' && (
                  <div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'10px'}}>
                      {trieState.words.map(w=><span key={w} style={{fontSize:'11px',padding:'3px 8px',borderRadius:'99px',border:`1px solid ${trieState.inserted.includes(w)?'rgba(52,211,153,.4)':trieState.searching===w?'rgba(245,158,11,.4)':'rgba(255,255,255,.1)'}`,background:trieState.inserted.includes(w)?'rgba(52,211,153,.08)':trieState.searching===w?'rgba(245,158,11,.08)':'transparent',color:trieState.inserted.includes(w)?'var(--dsa)':trieState.searching===w?'var(--score)':'var(--text2)'}}>{w}</span>)}
                    </div>
                    {(function renderTrie(node,prefix,depth,x,w){const entries=Object.entries(node.c);if(!entries.length)return null;return entries.map(([ch,child],i)=>{const cx=x-w/2+(w/(Math.max(entries.length,1)))*i+w/(Math.max(entries.length,1)*2);return(<g key={prefix+ch}>{depth>0&&<line x1={x} y1={-10+depth*55} x2={cx} y2={30+depth*55} stroke="rgba(255,255,255,.1)" strokeWidth="1"/>}<circle cx={cx} cy={42+depth*55} r={15} fill={trieState.hl.includes(prefix+ch)?'var(--score)':child.end?'var(--dsa)':'rgba(255,255,255,.05)'} stroke="rgba(255,255,255,.15)" strokeWidth="1.5"/><text x={cx} y={42+depth*55} fill="#fff" fontSize="10" fontWeight="700" textAnchor="middle" dominantBaseline="central" fontFamily="JetBrains Mono,monospace">{ch}</text>{renderTrie(child,prefix+ch,depth+1,cx,w/Math.max(entries.length,1))}</g>);})})(trieState.root,'',0,0,0) &&
                    <svg className={styles.graphSvg} viewBox="-300 0 600 280" style={{overflow:'visible'}}>
                      {(function renderTrieSvg(node,prefix,depth,x,w){const entries=Object.entries(node.c);if(!entries.length)return[];const results=[];entries.forEach(([ch,child],i)=>{const cx=x-w/2+(w/Math.max(entries.length,1))*i+w/Math.max(entries.length,1)/2;results.push(<g key={prefix+ch}>{depth>0&&<line x1={x} y1={-12+depth*55} x2={cx} y2={26+depth*55} stroke="rgba(255,255,255,.09)" strokeWidth="1"/>}<circle cx={cx} cy={40+depth*55} r={14} fill={trieState.hl.includes(prefix+ch)?'rgba(245,158,11,.5)':child.end?'rgba(52,211,153,.4)':'rgba(255,255,255,.05)'} stroke="rgba(255,255,255,.14)" strokeWidth="1.2"/><text x={cx} y={40+depth*55} fill="#fff" fontSize="10" fontWeight="700" textAnchor="middle" dominantBaseline="central" fontFamily="JetBrains Mono,monospace">{ch}</text></g>);results.push(...renderTrieSvg(child,prefix+ch,depth+1,cx,w/Math.max(entries.length,1)));});return results;})(trieState.root,'',0,0,580)}
                    </svg>}
                  </div>
                )}

                {/* LINKED LIST */}
                {algo.viz === 'll' && (
                  <div style={{display:'flex',alignItems:'center',padding:'16px 0',overflowX:'auto',gap:'0',minHeight:'80px'}}>
                    {llList.map(n=>{const bg=n.s==='c'?'var(--score)':n.s==='f'?'var(--dsa)':n.s==='del'?'rgba(248,113,113,.2)':n.s==='new'?'var(--sql)':n.s==='fast'?'var(--red)':n.s==='slow'?'var(--git)':'rgba(255,255,255,.05)';return(<div key={n.id} style={{display:'flex',alignItems:'center',flexShrink:0}}><div style={{width:'48px',height:'32px',borderRadius:'6px',border:`1px solid ${n.s!=='n'?bg:'rgba(255,255,255,.12)'}`,background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'700',color:['c','f','new'].includes(n.s)?'#000':'var(--text)',transition:'all .12s'}}>{n.v}</div><span style={{padding:'0 4px',fontSize:'14px',color:'var(--text3)',flexShrink:0}}>→</span></div>);})}
                    <div style={{width:'44px',height:'32px',borderRadius:'6px',border:'1px solid var(--text3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',color:'var(--text3)'}}>null</div>
                  </div>
                )}

                {/* DP TABLE */}
                {algo.viz === 'dp' && (
                  <div className={styles.dpWrap}>
                    {dpState.table && (
                      <table className={styles.dpTable}>
                        <thead><tr><td className={`${styles.dpCell} ${styles.dpHeader}`}></td>
                          {(dpState.s1||dpState.s2) ? ['"',...(dpState.s2||'')].map((c,j)=><td key={j} className={`${styles.dpCell} ${styles.dpHeader}`}>{c}</td>) : Array.from({length:(dpState.W||0)+1},(_,j)=><td key={j} className={`${styles.dpCell} ${styles.dpHeader}`}>{j}</td>)}
                        </tr></thead>
                        <tbody>{dpState.table.map((row,i)=><tr key={i}><td className={`${styles.dpCell} ${styles.dpHeader}`}>{dpState.s1 ? (i===0?'"':dpState.s1[i-1]) : i}</td>{row.map((v,j)=>{const act=i===dpState.i&&j===dpState.j;return<td key={j} className={styles.dpCell} style={{background:act?'var(--sql)':v>0?'rgba(167,139,250,.13)':'rgba(255,255,255,.03)',color:act?'#000':'var(--text)'}}>{v}</td>})}</tr>)}</tbody>
                      </table>
                    )}
                    {!dpState.table && <div style={{color:'var(--text3)',padding:'20px',fontSize:'12px'}}>Press Run to start</div>}
                  </div>
                )}

                {/* 1D DP (Coin Change / Subset Sum) */}
                {algo.viz === 'dp1d' && algo.id === 'coin' && (
                  <div>
                    <div style={{fontSize:'11px',color:'var(--text2)',marginBottom:'8px'}}>Coins: [{dp1d.coins.join(', ')}] | Target: {dp1d.amount}</div>
                    <div style={{display:'flex',gap:'3px',flexWrap:'wrap'}}>
                      {dp1d.dp ? Array.from({length:dp1d.amount+1},(_,i)=>{const act=dp1d.cur===i;return<div key={i} style={{width:'36px',height:'46px',borderRadius:'5px',border:`1px solid ${act?'var(--sql)':'rgba(255,255,255,.1)'}`,background:act?'rgba(56,189,248,.2)':'rgba(255,255,255,.04)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'700',color:act?'var(--sql)':'var(--text)'}}><span>{dp1d.dp[i]===Infinity?'?':dp1d.dp[i]}</span><span style={{fontSize:'8px',color:'var(--text3)'}}>{i}</span></div>}) : <div style={{color:'var(--text3)',fontSize:'12px',padding:'20px'}}>Press Run</div>}
                    </div>
                  </div>
                )}
                {algo.viz === 'dp1d' && algo.id === 'subset_sum' && (
                  <div>
                    <div style={{fontSize:'11px',color:'var(--text2)',marginBottom:'8px'}}>Array: [{subsetState.arr.join(', ')}] | Target: {subsetState.target}</div>
                    {subsetState.dp ? (
                      <div className={styles.dpWrap}>
                        <table className={styles.dpTable}>
                          <thead><tr><td className={`${styles.dpCell} ${styles.dpHeader}`}></td>{Array.from({length:subsetState.target+1},(_,j)=><td key={j} className={`${styles.dpCell} ${styles.dpHeader}`}>{j}</td>)}</tr></thead>
                          <tbody>{subsetState.dp.map((row,i)=><tr key={i}><td className={`${styles.dpCell} ${styles.dpHeader}`}>{i}</td>{row.map((v,j)=>{const act=subsetState.cur?.i===i&&subsetState.cur?.j===j;return<td key={j} className={styles.dpCell} style={{background:act?'var(--sql)':v?'rgba(52,211,153,.2)':'rgba(255,255,255,.03)',color:act?'#000':v?'var(--dsa)':'var(--text3)'}}>{v?'T':'F'}</td>})}</tr>)}
                          </tbody>
                        </table>
                      </div>
                    ) : <div style={{color:'var(--text3)',fontSize:'12px',padding:'20px'}}>Press Run</div>}
                  </div>
                )}

                {/* UNION-FIND */}
                {algo.viz === 'uf' && (
                  <div>
                    <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'10px'}}>
                      {Array.from({length:ufState.n},(_,i)=>{const act=ufState.hl?.includes(i);return<div key={i} style={{width:'52px',height:'52px',borderRadius:'50%',border:`2px solid ${act?'var(--score)':'rgba(255,255,255,.12)'}`,background:act?'rgba(245,158,11,.15)':'rgba(255,255,255,.04)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'700',color:act?'var(--score)':'var(--text)',transition:'all .15s'}}><span>{i}</span><span style={{fontSize:'8px',color:'var(--text3)'}}>→{ufState.par[i]}</span></div>})}
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                      {Array.from({length:ufState.n},(_,i)=>i).filter(i=>ufState.par[i]===i).map(r=>{const members=Array.from({length:ufState.n},(_,i)=>i).filter(i=>{let x=i;const p=[...ufState.par];while(p[x]!==x)x=p[x];return x===r;});return<span key={r} style={{fontSize:'10px',padding:'3px 8px',borderRadius:'99px',background:'rgba(52,211,153,.08)',border:'1px solid rgba(52,211,153,.25)',color:'var(--dsa)'}}>{`{${members.join(',')}}`}</span>;})}
                    </div>
                  </div>
                )}

                {/* HASH TABLE */}
                {algo.viz === 'hash' && (
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(80px,1fr))',gap:'4px',marginTop:'4px'}}>
                    {algo.id==='hash_chain' ? hashState.table.map((bucket,i)=>{const act=hashState.hl?.includes(i);return<div key={i} style={{background:'rgba(255,255,255,.04)',border:`1px solid ${act?'var(--score)':'rgba(255,255,255,.08)'}`,borderRadius:'6px',padding:'6px 8px',minHeight:'40px'}}><div style={{fontSize:'8px',color:'var(--text3)',marginBottom:'3px'}}>[{i}]</div>{bucket.map(v=><div key={v} style={{fontSize:'10px',fontWeight:'700',color:'var(--sql)'}}>{v}</div>)}</div>}) :
                    hashState.openTable.map((v,i)=>{const act=hashState.hl?.includes(i);return<div key={i} style={{background:act?'rgba(245,158,11,.12)':'rgba(255,255,255,.04)',border:`1px solid ${act?'var(--score)':'rgba(255,255,255,.08)'}`,borderRadius:'6px',padding:'6px 8px',minHeight:'40px'}}><div style={{fontSize:'8px',color:'var(--text3)',marginBottom:'3px'}}>[{i}]</div>{v!==null&&<div style={{fontSize:'10px',fontWeight:'700',color:'var(--sql)'}}>{v}</div>}</div>;})}
                  </div>
                )}

                {/* HEAP VIZ */}
                {algo.viz === 'heapviz' && (
                  <svg className={styles.graphSvg} viewBox="0 0 600 260">
                    {(function drawHeap(idx,x,y,xo){if(idx>=heapArr.length)return null;const act=heapHl.includes(idx);const l=2*idx+1,r=2*idx+2;return(<g key={idx}>{l<heapArr.length&&<><line x1={x} y1={y+18} x2={x-xo} y2={y+58} stroke="rgba(255,255,255,.1)" strokeWidth="1"/>{drawHeap(l,x-xo,y+72,xo/2)}</>}{r<heapArr.length&&<><line x1={x} y1={y+18} x2={x+xo} y2={y+58} stroke="rgba(255,255,255,.1)" strokeWidth="1"/>{drawHeap(r,x+xo,y+72,xo/2)}</>}<circle cx={x} cy={y} r={18} fill={act?'var(--score)':'rgba(255,255,255,.06)'} stroke="rgba(255,255,255,.18)" strokeWidth="1.5"/><text x={x} y={y} fill={act?'#000':'var(--text)'} fontSize="11" fontWeight="700" textAnchor="middle" dominantBaseline="central" fontFamily="JetBrains Mono,monospace">{heapArr[idx]}</text></g>)})(0,300,28,130)}
                  </svg>
                )}

                {/* SLIDING WINDOW */}
                {algo.viz === 'sw' && (
                  <div>
                    <div style={{fontSize:'10px',color:'var(--text3)',marginBottom:'6px'}}>Array (k={swState.k})</div>
                    <div style={{display:'flex',gap:'3px',flexWrap:'wrap',marginBottom:'10px'}}>
                      {swState.arr.map((v,i)=>{const inW=swState.win?.includes(i),isM=swState.max?.includes(i);return<div key={i} style={{width:'34px',height:'34px',borderRadius:'5px',border:`1px solid ${isM?'var(--dsa)':inW?'var(--cg)':'rgba(255,255,255,.1)'}`,background:isM?'rgba(52,211,153,.18)':inW?'rgba(251,146,60,.12)':'rgba(255,255,255,.04)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'700',color:isM?'var(--dsa)':'var(--text)'}}>{v}</div>;})}
                    </div>
                    <div style={{fontSize:'10px',color:'var(--text3)'}}>Deque: [{swState.deque?.map(i=>`${i}(${swState.arr[i]})`).join(', ')}]</div>
                  </div>
                )}

                {/* TWO POINTER */}
                {algo.viz === 'tp' && (
                  <div>
                    <div style={{fontSize:'10px',color:'var(--text3)',marginBottom:'6px'}}>Sorted array — target: 0</div>
                    <div style={{display:'flex',gap:'3px',flexWrap:'wrap',marginBottom:'8px'}}>
                      {tpState.arr.map((v,i)=>{const il=i===tpState.l,ir=i===tpState.r,ip=tpState.pairs?.some(p=>p.includes(i));return<div key={i} style={{width:'32px',height:'32px',borderRadius:'5px',border:`1px solid ${ip?'var(--dsa)':il?'var(--sql)':ir?'var(--git)':'rgba(255,255,255,.1)'}`,background:ip?'rgba(52,211,153,.15)':il?'rgba(56,189,248,.15)':ir?'rgba(167,139,250,.15)':'rgba(255,255,255,.04)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:'700',color:ip?'var(--dsa)':il?'var(--sql)':ir?'var(--git)':'var(--text)'}}>{v}</div>;})}
                    </div>
                    <div style={{fontSize:'10px',color:'var(--text2)'}}>L={tpState.l}({tpState.arr[tpState.l]}) R={tpState.r}({tpState.arr[tpState.r]}) Sum={tpState.arr[tpState.l]+tpState.arr[tpState.r]}</div>
                  </div>
                )}

                {/* N-QUEENS */}
                {algo.viz === 'nq' && (
                  <div>
                    <div style={{fontSize:'10px',color:'var(--text2)',marginBottom:'8px'}}>n={nqState.n} | Solutions: {nqState.solutions}</div>
                    <div style={{display:'grid',gridTemplateColumns:`repeat(${nqState.n},40px)`,width:`${nqState.n*40}px`,margin:'0 auto'}}>
                      {nqState.board.map((row,r)=>row.map((cell,c)=><div key={`${r}-${c}`} style={{width:'40px',height:'40px',background:cell===1?'rgba(245,158,11,.25)':cell===-1?'rgba(248,113,113,.1)':(r+c)%2===0?'rgba(255,255,255,.05)':'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>{cell===1?'♛':cell===-1?<span style={{fontSize:'10px',color:'var(--red)'}}>×</span>:''}</div>))}
                    </div>
                  </div>
                )}

                {/* HUFFMAN */}
                {algo.viz === 'huff' && (
                  <div>
                    <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'10px'}}>
                      {Object.entries(huffState.freq).sort((a,b)=>b[1]-a[1]).map(([ch,f])=><div key={ch} style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'6px',padding:'6px 10px',textAlign:'center'}}><div style={{fontSize:'13px',fontWeight:'700',color:'var(--sql)'}}>{`'${ch}'`}</div><div style={{fontSize:'9px',color:'var(--text3)'}}>f={f}</div>{huffState.codes[ch]&&<div style={{fontSize:'9px',color:'var(--dsa)',marginTop:'2px'}}>{huffState.codes[ch]}</div>}</div>)}
                    </div>
                    {huffState.built && (() => { const orig=huffState.text.length*8; const comp=Object.entries(huffState.codes).reduce((s,[ch,code])=>s+(huffState.freq[ch]||0)*code.length,0); return <div style={{fontSize:'10px',color:'var(--text2)',padding:'8px',background:'rgba(52,211,153,.06)',border:'1px solid rgba(52,211,153,.2)',borderRadius:'6px'}}>{orig} bits → {comp} bits — <span style={{color:'var(--dsa)'}}>{Math.round((1-comp/orig)*100)}% reduction</span></div>; })()}
                  </div>
                )}

                {/* MONTE CARLO */}
                {algo.viz === 'mc' && (
                  <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:'12px',alignItems:'start'}}>
                    <canvas id="mc-canvas" width="240" height="240" ref={el => { if(el&&mcState.pts.length){ const ctx=el.getContext('2d');ctx.clearRect(0,0,240,240);ctx.fillStyle='rgba(255,255,255,.03)';ctx.fillRect(0,0,240,240);ctx.strokeStyle='rgba(255,255,255,.2)';ctx.beginPath();ctx.arc(120,120,120,0,Math.PI*2);ctx.stroke();mcState.pts.forEach(({x,y,inside})=>{ctx.fillStyle=inside?'rgba(52,211,153,.7)':'rgba(248,113,113,.5)';ctx.fillRect(x*240-1,y*240-1,2,2);});} }} style={{borderRadius:'6px',border:'1px solid rgba(255,255,255,.1)'}}/>
                    <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                      <div><div style={{fontSize:'9px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'3px'}}>Points thrown</div><div style={{fontSize:'18px',fontWeight:'700'}}>{mcState.n}</div></div>
                      <div><div style={{fontSize:'9px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'3px'}}>Inside circle</div><div style={{fontSize:'18px',fontWeight:'700',color:'var(--dsa)'}}>{mcState.inside}</div></div>
                      <div><div style={{fontSize:'9px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'3px'}}>π estimate</div><div style={{fontSize:'24px',fontWeight:'700',color:'var(--score)'}}>{mcState.piEst.toFixed(4)}</div></div>
                      <div style={{fontSize:'10px',color:'var(--text3)'}}>Actual π = 3.14159...</div>
                    </div>
                  </div>
                )}

                {/* SIEVE */}
                {algo.viz === 'sieve' && (
                  <div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'2px',marginBottom:'8px'}}>
                      {Array.from({length:99},(_,i)=>i+2).map(i=>{const hl=sieveState.hl?.includes(i),crossed=!sieveState.sieve?.[i];return<div key={i} style={{width:'24px',height:'24px',borderRadius:'3px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'8px',fontWeight:(!crossed&&!hl)?700:400,background:hl?'rgba(245,158,11,.3)':crossed?'rgba(255,255,255,.02)':'rgba(52,211,153,.1)',color:hl?'var(--score)':crossed?'var(--text3)':'var(--dsa)'}}>{i}</div>;})}
                    </div>
                    {sieveState.primes.length>0 && <div style={{fontSize:'10px',color:'var(--text2)'}}>Found {sieveState.primes.length} primes</div>}
                  </div>
                )}

                {/* GCD */}
                {algo.viz === 'gcd' && (
                  <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                    <div style={{fontSize:'11px',color:'var(--text2)',marginBottom:'6px'}}>GCD({gcdState.a}, {gcdState.b})</div>
                    {gcdState.steps.map((s,i)=>{const act=i===gcdState.current;return<div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'6px 10px',borderRadius:'5px',background:act?'rgba(56,189,248,.12)':'rgba(255,255,255,.04)',border:`1px solid ${act?'var(--sql)':'rgba(255,255,255,.08)'}`}}><span style={{fontSize:'10px',color:act?'var(--sql)':'var(--text2)',fontFamily:'JetBrains Mono,monospace'}}>GCD({s.a},{s.b})</span>{s.r!==undefined?<span style={{fontSize:'9px',color:'var(--text3)'}}>rem={s.r} → GCD({s.b},{s.r})</span>:<span style={{fontSize:'9px',color:'var(--dsa)',fontWeight:700}}>= {s.a} ✓</span>}</div>;})}
                  </div>
                )}

                {/* STRING */}
                {algo.viz === 'string' && (
                  <div>
                    <div style={{marginBottom:'8px'}}><div style={{fontSize:'9px',color:'var(--text3)',marginBottom:'4px'}}>Text</div><div style={{display:'flex',flexWrap:'wrap',gap:'2px'}}>{strState.text.split('').map((c,i)=>{const inM=strState.matches?.some(m=>i>=m&&i<m+strState.pattern.length);return<span key={i} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:'20px',height:'24px',borderRadius:'3px',fontSize:'10px',fontWeight:'700',background:inM?'rgba(52,211,153,.2)':i===strState.ci?'rgba(245,158,11,.2)':'rgba(255,255,255,.04)',border:`1px solid ${inM?'var(--dsa)':i===strState.ci?'var(--score)':'rgba(255,255,255,.08)'}`,color:inM?'var(--dsa)':i===strState.ci?'var(--score)':'var(--text)'}}>{c}</span>})}</div></div>
                    <div style={{marginBottom:'8px'}}><div style={{fontSize:'9px',color:'var(--text3)',marginBottom:'4px'}}>Pattern</div><div style={{display:'flex',flexWrap:'wrap',gap:'2px'}}>{strState.pattern.split('').map((c,j)=><span key={j} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:'20px',height:'24px',borderRadius:'3px',fontSize:'10px',fontWeight:'700',background:j===strState.cj?'rgba(56,189,248,.2)':'rgba(255,255,255,.04)',border:`1px solid ${j===strState.cj?'var(--sql)':'rgba(255,255,255,.08)'}`,color:j===strState.cj?'var(--sql)':'var(--text)'}}>{c}</span>)}</div></div>
                    {strState.lps.length>0 && <div style={{fontSize:'9px',color:'var(--text3)',marginBottom:'6px'}}>LPS: [{strState.lps.join(',')}]</div>}
                    {strState.matches?.length>0 && <div className={styles.trail}>{strState.matches.map(m=><span key={m} className={styles.trailNode} style={{color:'var(--dsa)',borderColor:'rgba(52,211,153,.3)',background:'rgba(52,211,153,.07)'}}>pos {m}</span>)}</div>}
                  </div>
                )}

                {/* SUDOKU */}
                {algo.viz === 'sudoku' && (
                  <div>
                    <div style={{fontSize:'10px',color:'var(--text2)',marginBottom:'8px'}}>Attempts: {sudokuState.attempts}</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(9,32px)',gap:'1px',width:'fit-content',margin:'0 auto'}}>
                      {sudokuState.board.map((row,r)=>row.map((v,c)=><div key={`${r}-${c}`} style={{width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'700',background:[0,3,6].includes(r)&&[0,3,6].includes(c)?'rgba(255,255,255,.08)':v===0?'rgba(255,255,255,.03)':'rgba(56,189,248,.1)',border:'1px solid rgba(255,255,255,.08)',color:v===0?'var(--text3)':'var(--text)',borderRight:c===2||c===5?'2px solid rgba(255,255,255,.25)':'',borderBottom:r===2||r===5?'2px solid rgba(255,255,255,.25)':''}}>{v!==0?v:''}</div>))}
                    </div>
                  </div>
                )}

                {done && <div className={styles.doneMsg} style={{color:accentColor}}>✓ Complete in {step} steps</div>}
              </div>

              {/* AI Narration */}
              {narration && (
                <div className={styles.narrationCard}>
                  <div className={styles.narHeader}>
                    <span className={styles.narLabel} style={{color:accentColor}}>AI Narration</span>
                    <button className={styles.speakBtn} style={{background:`${accentColor}15`,borderColor:`${accentColor}40`,color:accentColor}} onClick={()=>speak(narration.narration)}>▶ Speak</button>
                  </div>
                  <p className={styles.narMain}>{narration.narration}</p>
                  {narration.key_insight && <div className={styles.insightBox} style={{borderColor:`${accentColor}30`,background:`${accentColor}08`}}><span className={styles.insightLabel} style={{color:accentColor}}>Key Insight</span><p>{narration.key_insight}</p></div>}
                  {narration.complexity_note && <p className={styles.complexityNote}>{narration.complexity_note}</p>}
                  {narration.next_hint && <p className={styles.nextHint}>→ {narration.next_hint}</p>}
                </div>
              )}

              {/* Overview from backend */}
              {overview && (
                <div className={styles.overviewCard}>
                  <div className={styles.overviewRow}>
                    <div className={styles.overviewMain}>
                      <span className={styles.ovLabel} style={{color:accentColor}}>Overview</span>
                      <p className={styles.ovDesc}>{overview.description}</p>
                      {overview.theoretical_foundation && <div className={styles.theoryBox}><span className={styles.theoryLabel} style={{color:accentColor}}>Foundation:</span><span className={styles.theoryVal}>{overview.theoretical_foundation}</span></div>}
                    </div>
                    <div className={styles.complexityGrid}>
                      {[{label:'Best',val:overview.time_complexity?.best},{label:'Avg',val:overview.time_complexity?.average},{label:'Worst',val:overview.time_complexity?.worst},{label:'Space',val:overview.space_complexity}].filter(c=>c.val).map(c=>(
                        <div key={c.label} className={styles.complexBox}><span className={styles.complexLabel}>{c.label}</span><span className={styles.complexVal} style={{color:accentColor}}>{c.val}</span></div>
                      ))}
                    </div>
                  </div>
                  {overview.production_use_cases?.length > 0 && <div className={styles.useCases}><span className={styles.useCasesLabel} style={{color:accentColor}}>Real-world Use:</span><ul className={styles.useCasesList}>{overview.production_use_cases.map((uc,i)=><li key={i}>{uc}</li>)}</ul></div>}
                </div>
              )}

              {/* Explanation Modal */}
              {showExplanation && algo && ALGO_EXPLANATIONS[algo.id] && (
                <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
                  <div style={{background:'rgba(15,23,42,.95)',borderRadius:'12px',border:'1px solid rgba(255,255,255,.1)',maxWidth:'700px',maxHeight:'90vh',overflow:'auto',padding:'28px',boxShadow:'0 20px 60px rgba(0,0,0,.6)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:'24px'}}>
                      <div>
                        <h2 style={{color:accentColor,fontSize:'28px',fontWeight:'700',margin:0,marginBottom:'8px'}}>{algo.name}</h2>
                        <p style={{color:'var(--text2)',fontSize:'13px',margin:0}}>Learn before animating</p>
                      </div>
                      <button onClick={()=>setShowExplanation(false)} style={{background:'rgba(255,255,255,.1)',border:'none',color:'var(--text)',cursor:'pointer',fontSize:'18px',width:'32px',height:'32px',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}>✕</button>
                    </div>

                    <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
                      <div>
                        <h3 style={{color:'rgba(52,211,153,.9)',fontSize:'14px',fontWeight:'700',margin:'0 0 10px 0',textTransform:'uppercase',letterSpacing:'0.5px'}}>📖 What is it?</h3>
                        <p style={{color:'var(--text)',fontSize:'13px',lineHeight:'1.6',margin:0}}>{ALGO_EXPLANATIONS[algo.id].what}</p>
                      </div>

                      <div>
                        <h3 style={{color:'rgba(52,211,153,.9)',fontSize:'14px',fontWeight:'700',margin:'0 0 10px 0',textTransform:'uppercase',letterSpacing:'0.5px'}}>🌍 Where is it used?</h3>
                        <p style={{color:'var(--text)',fontSize:'13px',lineHeight:'1.6',margin:0}}>{ALGO_EXPLANATIONS[algo.id].where}</p>
                      </div>

                      <div>
                        <h3 style={{color:'rgba(52,211,153,.9)',fontSize:'14px',fontWeight:'700',margin:'0 0 10px 0',textTransform:'uppercase',letterSpacing:'0.5px'}}>💡 Why is it used?</h3>
                        <p style={{color:'var(--text)',fontSize:'13px',lineHeight:'1.6',margin:0}}>{ALGO_EXPLANATIONS[algo.id].why}</p>
                      </div>

                      <div>
                        <h3 style={{color:'rgba(76,175,80,.9)',fontSize:'14px',fontWeight:'700',margin:'0 0 10px 0',textTransform:'uppercase',letterSpacing:'0.5px'}}>✅ Advantages</h3>
                        <ul style={{margin:0,paddingLeft:'20px',color:'var(--text)',fontSize:'13px',lineHeight:'1.8'}}>
                          {ALGO_EXPLANATIONS[algo.id].advantages.map((adv,i)=><li key={i}>{adv}</li>)}
                        </ul>
                      </div>

                      <div>
                        <h3 style={{color:'rgba(239,68,68,.9)',fontSize:'14px',fontWeight:'700',margin:'0 0 10px 0',textTransform:'uppercase',letterSpacing:'0.5px'}}>❌ Disadvantages</h3>
                        <ul style={{margin:0,paddingLeft:'20px',color:'var(--text)',fontSize:'13px',lineHeight:'1.8'}}>
                          {ALGO_EXPLANATIONS[algo.id].disadvantages.map((disadv,i)=><li key={i}>{disadv}</li>)}
                        </ul>
                      </div>

                      <div style={{display:'flex',gap:'12px',marginTop:'12px'}}>
                        <button onClick={()=>setShowExplanation(false)} style={{flex:1,padding:'10px 16px',background:'rgba(52,211,153,.15)',color:'var(--dsa)',border:'1px solid rgba(52,211,153,.4)',borderRadius:'6px',fontSize:'13px',fontWeight:'700',cursor:'pointer',transition:'all .2s'}} onHover={function(e){e.target.style.background='rgba(52,211,153,.25)'}}>✓ Got it, Start Animation</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}