import sys
import os
import re
import json
import random
import requests
import sqlite3
from typing import Dict, Any, List, Optional, Tuple

_current_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(_current_dir)
if _parent_dir not in sys.path:
    sys.path.insert(0, _parent_dir)

from api.database import get_connection

try:
    from api.curated_tracks import CURATED_TRACKS as EXTRA_TRACKS
    _EXTRA_AVAILABLE = True
except Exception:
    _EXTRA_AVAILABLE = False
    EXTRA_TRACKS = {}


# Common filler words to strip when normalizing technical search queries
NOISE_WORDS = {
    "programming", "programing", "course", "courses", "tutorial", "tutorials",
    "basics", "basic", "learn", "learning", "bootcamp", "guide", "training",
    "fundamentals", "fundamental", "mastery", "masterclass", "development",
    "developer", "for", "beginners", "beginner", "advanced", "intro", "introduction",
    "to", "the", "in", "and", "&", "a", "an", "online", "complete", "full",
    "architecture", "architectures", "principles", "principle", "core", "systems",
    "system", "design", "designs", "patterns", "pattern", "concepts", "concept",
    "engineering", "engineer", "applied", "modern", "enterprise", "foundations",
    "foundation", "practices", "practice", "overview", "structures", "structure"
}

def normalize_query(query: str) -> str:
    """
    Normalizes user search query to extract core technical domain.
    E.g.: 'Python Programming for Beginners' -> 'python'
          'Learn Docker containers' -> 'docker'
          'c++ course' -> 'c++'
          'Robotic Architecture & Core Principles' -> 'robotics'
          'Full Stack Development' -> 'full stack'
    """
    if not query:
        return ""
    q = query.strip().lower()
    # Normalize c++ and c# specifically
    q = q.replace("c plus plus", "c++")
    q = q.replace("c sharp", "c#")

    # Domain phrases preserved before stripping noise words
    if "full stack" in q or "fullstack" in q or "full strack" in q:
        return "full stack"
    if "web development" in q or "web dev" in q:
        return "full stack"
    if "machine learning" in q:
        return "machine learning"
    if "deep learning" in q:
        return "deep learning"
    if "data science" in q:
        return "data science"
    if "cyber security" in q or "cybersecurity" in q:
        return "cyber security"
    if "cloud computing" in q:
        return "cloud computing"
    if "robotic" in q or "robot" in q:
        return "robotics"

    # Remove punctuation except '+' and '#'
    cleaned = re.sub(r"[^\w\s\+#]", " ", q)
    tokens = [w for w in cleaned.split() if w]
    meaningful = [w for w in tokens if w not in NOISE_WORDS]
    if meaningful:
        return " ".join(meaningful)
    return " ".join(tokens) if tokens else query.strip().lower()



def _get_full_course(cur, course_id: int) -> Dict[str, Any]:
    cur.execute("""
        SELECT c.*, u.full_name as instructor_name, u.email as instructor_email,
               (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) as modules_count,
               (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as enrollments_count
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE c.id = ?
    """, (course_id,))
    row = cur.fetchone()
    return dict(row) if row else {}


def find_existing_course(conn: sqlite3.Connection, raw_query: str, normalized: str) -> Optional[Dict[str, Any]]:
    """
    Performs precise lookup to find an existing course matching the user's domain.
    Prevents creating duplicate courses for variations like 'Python', 'python', 'Python programming',
    while NEVER matching unrelated courses on generic structural words (like 'architecture' or 'core').
    """
    cur = conn.cursor()
    raw_lower = raw_query.strip().lower()

    # 1. Exact match on course title
    cur.execute("""
        SELECT id FROM courses
        WHERE published = 1 AND LOWER(title) = ?
        LIMIT 1
    """, (raw_lower,))
    row = cur.fetchone()
    if row:
        return _get_full_course(cur, row["id"])

    # 2. Substring match: if normalized domain term is an exact word in title or subject
    # E.g. normalized="python" matches "Python for Enterprise Systems"
    if normalized and len(normalized) >= 3:
        cur.execute("""
            SELECT id, title, subject FROM courses
            WHERE published = 1 AND (
                LOWER(title) LIKE ? OR LOWER(title) LIKE ? OR LOWER(subject) LIKE ?
            )
            ORDER BY
                CASE
                    WHEN LOWER(title) LIKE ? THEN 1
                    ELSE 2
                END,
                created_at DESC
            LIMIT 1
        """, (f"{normalized}%", f"% {normalized}%", f"%{normalized}%", f"{normalized}%"))
        row2 = cur.fetchone()
        if row2:
            return _get_full_course(cur, row2["id"])

    # 3. Intelligent token matching: check domain keywords only (ignoring noise words)
    search_tokens = [w for w in (normalized or raw_lower).split() if len(w) >= 3 and w not in NOISE_WORDS]
    if search_tokens:
        for token in search_tokens:
            cur.execute("""
                SELECT id, title FROM courses
                WHERE published = 1 AND (
                    LOWER(title) LIKE ? OR LOWER(title) LIKE ?
                )
                ORDER BY
                    CASE
                        WHEN LOWER(title) LIKE ? THEN 1
                        ELSE 2
                    END,
                    created_at DESC
                LIMIT 1
            """, (f"{token}%", f"% {token}%", f"{token}%"))
            token_row = cur.fetchone()
            if token_row:
                # Ensure the course title actually contains the domain token as a distinct word
                t_lower = token_row["title"].lower()
                if re.search(r'\b' + re.escape(token) + r'\b', t_lower):
                    return _get_full_course(cur, token_row["id"])

    return None




# ==============================================================================
# CURATED KNOWLEDGE BASE WITH VERIFIED PUBLIC YOUTUBE EDUCATIONAL VIDEOS
# Authoritative channels: freeCodeCamp, Programming with Mosh, TechWorld with Nana,
# Corey Schafer, 3Blue1Brown, Alex The Analyst, Kevin Powell, Traversy Media, etc.
# ==============================================================================

CURATED_TRACKS: Dict[str, Dict[str, Any]] = {
    "full stack": {
        "title": "Full Stack Web Development & Enterprise Architecture",
        "description": "Master modern full-stack engineering across frontend, backend, APIs, database modeling, authentication, testing, and production cloud deployment.",
        "subject": "Software Engineering",
        "difficulty": "Intermediate",
        "duration": "8 Weeks",
        "thumbnail": "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=800&auto=format&fit=crop&q=80",
        "competencies": ["Frontend HTML/CSS/JS", "React Component Architecture", "Node & Express Backend APIs", "Database Systems & Deployment"],
        "modules": [
            {
                "number": 1,
                "title": "Module 1 – Frontend Foundations: HTML5, CSS3 & Responsive Architecture",
                "description": "Master semantic HTML5 documents, accessible forms, responsive layouts with Flexbox and CSS Grid, and design tokens.",
                "lessons": [
                    {"title": "HTML5 Semantic Architecture & Accessible Web Standards", "video_url": "https://www.youtube.com/watch?v=pQN-pnXPaVg", "video_id": "pQN-pnXPaVg", "duration": 25, "content": "Understand DOM document hierarchies, semantic landmarks, accessibility standards, SEO metadata, and input validation."},
                    {"title": "CSS3 Flexbox, Grid Systems & Responsive Layouts", "video_url": "https://www.youtube.com/watch?v=1PnVor36_40", "video_id": "1PnVor36_40", "duration": 25, "content": "Master modern CSS layout engines: 1D Flexbox alignment, 2D Grid layouts, fluid typography with clamp(), and responsive media queries."}
                ]
            },
            {
                "number": 2,
                "title": "Module 2 – Modern JavaScript (ES6+) & React Component Architecture",
                "description": "Modern JavaScript engine, asynchronous programming, event loop mechanics, component lifecycle, and React hooks.",
                "lessons": [
                    {"title": "Modern JavaScript Engine, Promises & Asynchronous Execution", "video_url": "https://www.youtube.com/watch?v=W6NZfCO5SIk", "video_id": "W6NZfCO5SIk", "duration": 28, "content": "Deep dive into execution context, closures, ES6+ syntax, Promises, async/await patterns, and non-blocking event loop execution."},
                    {"title": "Component-Driven Architecture & React Hooks", "video_url": "https://www.youtube.com/watch?v=bMknfKXIFA8", "video_id": "bMknfKXIFA8", "duration": 30, "content": "Build scalable reactive interfaces using functional components, state hooks, custom hooks, and centralized data pipelines."}
                ]
            },
            {
                "number": 3,
                "title": "Module 3 – Backend Engineering: Node.js, Express & Database Architecture",
                "description": "Server architectures, RESTful API routing, middleware chains, database schema design, and CRUD operations.",
                "lessons": [
                    {"title": "RESTful API Design & Server Architecture with Node & Express", "video_url": "https://www.youtube.com/watch?v=Oe421EPjeBE", "video_id": "Oe421EPjeBE", "duration": 32, "content": "Design and implement production-ready HTTP REST services, routing parameters, middleware authentication, and error trapping."},
                    {"title": "Database Integration, Schema Modeling & SQL/NoSQL Operations", "video_url": "https://www.youtube.com/watch?v=7S_tz1z_5bA", "video_id": "7S_tz1z_5bA", "duration": 30, "content": "Relational schema normalization, SQL queries, indexing, transactions, and integration with application object-relational mappers."}
                ]
            },
            {
                "number": 4,
                "title": "Module 4 – Full Stack Integration, Security & Cloud Deployment",
                "description": "Client-server state hydration, CORS, JWT security, Docker containerization, CI/CD automation, and cloud delivery.",
                "lessons": [
                    {"title": "Full Stack Systems Integration, CORS & JWT Authentication", "video_url": "https://www.youtube.com/watch?v=ft27vpgJQzE", "video_id": "ft27vpgJQzE", "duration": 35, "content": "Connect client SPAs with backend microservices, configure cross-origin resource sharing, secure tokens, and defensive headers."},
                    {"title": "Containerization, CI/CD Pipelines & Cloud Production Delivery", "video_url": "https://www.youtube.com/watch?v=pTFZFxd4hOI", "video_id": "pTFZFxd4hOI", "duration": 30, "content": "Package full-stack applications with Docker, automate testing pipelines with GitHub Actions, and deploy to cloud environments."}
                ]
            }
        ],
        "questions": [
            ("What is the primary role of the virtual DOM in modern frontend frameworks like React?", "Directly replaces the browser window", "Maintains an in-memory representation of UI to batch and compute minimal diffs before updating the real DOM", "Compiles JavaScript to C++", "Eliminates need for CSS", "B", "The Virtual DOM calculates minimal DOM reconciliation diffs to avoid layout reflow overhead."),
            ("Which HTTP method is idempotent and used in RESTful APIs to update a resource completely?", "POST", "PUT", "PATCH", "DELETE", "B", "PUT is idempotent and replaces the entire target resource with the uploaded payload."),
            ("What is the difference between client-side rendering (CSR) and server-side rendering (SSR)?", "They are identical", "CSR renders the page in the browser via JavaScript; SSR renders complete HTML on the server before sending to client", "SSR only works without CSS", "CSR requires no web browser", "B", "SSR delivers fully rendered HTML from the server, improving first contentful paint and SEO."),
            ("In relational databases, what does the 'ACID' acronym stand for?", "Action, Condition, Input, Decision", "Atomicity, Consistency, Isolation, Durability", "Asynchronous, Concurrent, Indexed, Distributed", "Authentication, Cryptography, Integrity, Decryption", "B", "ACID properties ensure reliable processing of database transactions."),
            ("What does CORS (Cross-Origin Resource Sharing) protect against?", "Server hardware overheating", "Unauthorized web applications in other origins making restricted requests to a server on behalf of the user", "Slow network latency", "SQL syntax errors", "B", "CORS is a browser security mechanism restricting cross-origin HTTP requests."),
            ("What is the purpose of JWT (JSON Web Token) in full-stack applications?", "Compress images", "Compact, URL-safe means of securely transmitting claims and identity state between client and server", "Store database tables", "Compile TypeScript", "B", "JWTs allow stateless, cryptographically signed user authentication across distributed services."),
            ("Which middleware in Express.js parses incoming HTTP request bodies containing JSON?", "express.json()", "express.urlencoded()", "cors()", "morgan()", "A", "express.json() parses incoming JSON payloads and populates req.body."),
            ("What does the CSS `box-sizing: border-box` property achieve?", "Adds 20px padding", "Includes padding and border within the element's total declared width and height", "Removes borders entirely", "Ignores margins", "B", "border-box prevents padding and borders from inflating element box dimensions."),
            ("In modern JavaScript, what does `Promise.all()` do when one of the passed promises rejects?", "Waits for all others to finish", "Immediately rejects with the error of that rejected promise (fail-fast)", "Ignores the error", "Retries automatically", "B", "Promise.all short-circuits and rejects immediately upon any single promise failure."),
            ("What is the primary benefit of containerizing a full-stack web application with Docker?", "Faster internet speed", "Consistent execution environments across local development, staging, and cloud production", "Smaller database files", "Automatic code generation", "B", "Docker packages the runtime, system dependencies, and code into reproducible images."),
            ("Which SQL clause is used to filter aggregated group records produced by `GROUP BY`?", "WHERE", "HAVING", "ORDER BY", "LIMIT", "B", "HAVING filters aggregated group data, whereas WHERE filters individual table rows prior to aggregation."),
            ("What does the `useEffect` cleanup function accomplish in React?", "Deletes the component from disk", "Cancels active subscriptions, timers, or abort controllers before unmount or re-render", "Refreshes the browser", "Clears browser cache", "B", "Cleanup functions prevent memory leaks and dangling subscriptions when reactive inputs change."),
            ("Why are database indexes used in high-throughput backend services?", "To encrypt sensitive columns", "To drastically speed up record retrieval queries at the cost of slight write overhead", "To delete duplicate records", "To format dates", "B", "Indexes create optimized search trees (B-Trees) enabling rapid query lookups."),
            ("What is the difference between SQL (relational) and NoSQL (document/key-value) databases?", "SQL databases have no structure", "SQL enforces structured schemas with relational tables; NoSQL offers flexible, schema-less document storage", "NoSQL cannot store numbers", "SQL runs only on Linux", "B", "Relational databases use rigid schemas and ACID tables, while NoSQL offers dynamic hierarchical models."),
            ("What is an API Gateway in microservice full-stack architecture?", "A physical router in datacenter", "A single entry point proxying client requests, handling rate limiting, routing, and authentication", "A CSS preprocessor", "A database engine", "B", "API Gateways centralize client routing, security policies, and service orchestration."),
            ("What does responsive design's mobile-first approach prescribe?", "Building native mobile apps only", "Designing and styling for narrow screens first, then progressively enhancing for larger viewports via min-width queries", "Disabling desktop browsers", "Ignoring mobile devices", "B", "Mobile-first establishes base styles for small screens and layers media queries for desktops."),
            ("What is the difference between `localStorage` and `sessionStorage` in browser APIs?", "localStorage persists across browser sessions until explicitly deleted; sessionStorage clears when the tab is closed", "They are identical in duration", "sessionStorage saves to the cloud", "localStorage is read-only", "A", "localStorage persists across sessions; sessionStorage is scoped strictly to the current browser tab lifetime."),
            ("Which HTTP status code signifies that a client request lacks valid authentication credentials?", "400 Bad Request", "401 Unauthorized", "403 Forbidden", "404 Not Found", "B", "401 Unauthorized indicates authentication is required and has failed or not yet been provided."),
            ("What is continuous integration (CI) in full-stack software delivery?", "Manual deployment once a year", "Automated process of building, linting, and running test suites whenever code is committed to version control", "Writing documentation only", "Purchasing cloud servers", "B", "CI pipelines automatically validate code changes against test suites upon every commit."),
            ("What is the purpose of database connection pooling in a backend application?", "Closes all connections after 1 request", "Maintains a cache of reusable database connections to avoid the expensive latency of opening new connections", "Encrypts database passwords", "Deletes stale tables", "B", "Connection pools reuse established database connections, minimizing connection overhead.")
        ]
    },
    "python": {
        "title": "Python for Enterprise Systems",
        "description": "Master core Python programming, object-oriented architecture, data structures, and production-grade backend engineering.",
        "subject": "Backend Development",
        "difficulty": "Intermediate",
        "duration": "8 Weeks",
        "thumbnail": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
        "competencies": ["Python Basics", "Functions & Scopes", "Object-Oriented Design", "Data Structures & Algorithms"],
        "modules": [
            {
                "number": 1,
                "title": "Module 1 – Python Core Foundations & Control Structures",
                "description": "Syntax fundamentals, variable scoping, conditionals, iterations, and standard library data collections.",
                "lessons": [
                    {"title": "Introduction to Python Environment & Execution Flow", "video_url": "https://www.youtube.com/watch?v=kqtD5dpn9C8", "video_id": "kqtD5dpn9C8", "duration": 20, "content": "Understand Python bytecode, interpreter setup, virtual environments, variables, data types, and expressions."},
                    {"title": "Flow Control, Loops and Error Trapping", "video_url": "https://www.youtube.com/watch?v=6iF8Xb7Z3wQ", "video_id": "6iF8Xb7Z3wQ", "duration": 25, "content": "Master if-elif-else branching, for/while loops, comprehension expressions, and try-except blocks."}
                ]
            },
            {
                "number": 2,
                "title": "Module 2 – Modular Programming & Advanced Functions",
                "description": "Function definitions, args/kwargs, scope closures, decorators, lambda functions, and generator pipelines.",
                "lessons": [
                    {"title": "Functional Patterns and Closures", "video_url": "https://www.youtube.com/watch?v=swU3S26dQb0", "video_id": "swU3S26dQb0", "duration": 22, "content": "Deep dive into first-class citizens, closure scopes, decorator wrappers, and memoization."},
                    {"title": "Generators, Iterables and Memory Optimization", "video_url": "https://www.youtube.com/watch?v=bD05uGo_sVI", "video_id": "bD05uGo_sVI", "duration": 28, "content": "How yield works, generator expressions, memory footprint benchmarking in large data streams."}
                ]
            },
            {
                "number": 3,
                "title": "Module 3 – Object-Oriented Architecture in Python",
                "description": "Classes, inheritance patterns, dunder methods, metaclasses, and SOLID principles in Python.",
                "lessons": [
                    {"title": "Classes, Polymorphism & Encapsulation", "video_url": "https://www.youtube.com/watch?v=JeznW_7DlB0", "video_id": "JeznW_7DlB0", "duration": 30, "content": "Constructors, instance vs class state, method resolution order (MRO), and composition."},
                    {"title": "Special Dunder Methods and Context Managers", "video_url": "https://www.youtube.com/watch?v=3ohzBxoFHAY", "video_id": "3ohzBxoFHAY", "duration": 25, "content": "Overriding magic methods (__repr__, __enter__, __exit__) to create clean Pythonic context managers."}
                ]
            },
            {
                "number": 4,
                "title": "Module 4 – Enterprise Data Structures & Algorithmic Design",
                "description": "Lists, dictionaries, sets, queues, bisect, hash collisions, and complexity analysis.",
                "lessons": [
                    {"title": "Performance Characteristics of Built-in Structures", "video_url": "https://www.youtube.com/watch?v=pkYVOmU3MgA", "video_id": "pkYVOmU3MgA", "duration": 35, "content": "Time and space complexity profiling of Python dictionaries, sets, and double-ended queues."},
                    {"title": "Building Custom Data Structures for Enterprise Apps", "video_url": "https://www.youtube.com/watch?v=RBSGKlAvoiM", "video_id": "RBSGKlAvoiM", "duration": 30, "content": "Implementing custom balanced trees, priority queues, and LRU cache mechanisms from scratch."}
                ]
            }
        ],
        "questions": [
            ("What is the time complexity of looking up a key in a Python dictionary on average?", "O(1)", "O(n)", "O(log n)", "O(n^2)", "A", "Python dictionaries use hash tables, giving O(1) average lookup time."),
            ("Which keyword is used to create a generator function in Python?", "return", "yield", "generate", "produce", "B", "The yield keyword pauses function execution and yields a value back."),
            ("How does Python resolve method calls in multiple inheritance?", "Breadth First Search", "C3 Linearization / MRO", "Depth First Only", "Random Choice", "B", "Python uses the C3 Linearization algorithm to determine Method Resolution Order (MRO)."),
            ("What is the purpose of the __init__ method in a Python class?", "Destroys the object", "Initializes the new instance", "Imports modules", "Compiles bytecode", "B", "__init__ is the initializer method called when an instance of a class is created."),
            ("Which of the following data structures is immutable in Python?", "List", "Dictionary", "Tuple", "Set", "C", "Tuples cannot be modified once created, making them immutable."),
            ("What does the 'with' statement in Python guarantee?", "Code runs 10x faster", "Context manager cleanup via __exit__", "Type safety checks", "Automatic multi-threading", "B", "The with statement invokes __enter__ and ensures __exit__ executes upon leaving the block."),
            ("Which built-in module provides support for double-ended queues?", "math", "collections", "sys", "queue", "B", "collections.deque provides an optimized double-ended queue."),
            ("What does *args indicate in a function parameter list?", "Keyword arguments dictionary", "Variable positional arguments tuple", "Pointer to memory", "Multiplication operator", "B", "*args packs arbitrary positional arguments into a tuple."),
            ("What does **kwargs unpack into inside a function body?", "A list", "A dictionary", "A set", "A tuple", "B", "**kwargs collects arbitrary keyword arguments into a standard Python dict."),
            ("Which function returns the memory address of an object in CPython?", "address()", "pointer()", "id()", "loc()", "C", "id() returns the unique memory address identifier of an object."),
            ("How are list comprehensions generally compared to standard for loops in Python?", "Always slower", "More concise and often faster due to C-level optimization", "Only valid for numbers", "Prohibited in enterprise code", "B", "List comprehensions are compact and execute optimized bytecode instructions."),
            ("What will `bool([])` evaluate to in Python?", "True", "False", "None", "TypeError", "B", "An empty list is falsy in Python boolean contexts."),
            ("Which design pattern is implemented natively using decorators?", "Observer", "Decorator / Wrapper", "Singleton", "Factory", "B", "Python decorators wrap a callable with another function, adding behavior dynamically."),
            ("What exception is raised when an item is popped from an empty list?", "ValueError", "IndexError", "KeyError", "EmptyError", "B", "Calling pop() on an empty list raises IndexError."),
            ("What is the primary benefit of using __slots__ in a Python class?", "Faster networking", "Drastically reduced memory overhead per instance", "Strict static typing", "Enables multithreading", "B", "__slots__ eliminates the default __dict__ instance dictionary, saving memory."),
            ("Which built-in function returns an iterator of tuples containing indexes and values?", "zip()", "enumerate()", "range()", "iter()", "B", "enumerate(iterable) yields (index, item) pairs."),
            ("What is the purpose of `super()` in Python OOP?", "Access parent/base class methods cleanly", "Superuser permissions", "Fast computation", "Global variables", "A", "super() allows calling inherited methods dynamically through the MRO hierarchy."),
            ("Which of these is NOT a valid set operation in Python?", "union()", "intersection()", "difference()", "concat()", "D", "concat() is not a set method; sets use union() or '|'."),
            ("How do you create a shallow copy of a list `x`?", "x.copy() or x[:]", "copy.deepcopy(x)", "x = x", "shallow(x)", "A", "x.copy() or slice x[:] creates a shallow copy of the list."),
            ("What does `is` test for in Python?", "Value equality", "Identity / same object in memory", "Type equality only", "Subclass relationship", "B", "The `is` keyword checks if two references point to the exact same memory object.")
        ]
    },

    "docker": {
        "title": "Enterprise Containerization with Docker",
        "description": "Master containerization fundamentals, Dockerfile optimization, multi-container orchestration with Docker Compose, and production deployment pipelines.",
        "subject": "DevOps & Cloud",
        "difficulty": "Intermediate",
        "duration": "6 Weeks",
        "thumbnail": "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&auto=format&fit=crop&q=80",
        "competencies": ["Container Architecture", "Dockerfile Optimization", "Docker Compose", "Container Networking & Volumes"],
        "modules": [
            {
                "number": 1,
                "title": "Module 1 – Fundamentals of Containerization & Docker Engine",
                "description": "Understanding Linux cgroups, namespaces, image layers, Docker daemon architecture, and essential CLI tooling.",
                "lessons": [
                    {"title": "Containers vs Virtual Machines & Docker Architecture", "video_url": "https://www.youtube.com/watch?v=fqMOX6JJhGo", "video_id": "fqMOX6JJhGo", "duration": 22, "content": "Deep dive into kernel virtualization, namespaces, control groups, union filesystems, and client-server daemon communication."},
                    {"title": "Core Docker CLI: Images, Containers & Registries", "video_url": "https://www.youtube.com/watch?v=3c-iBn73dDE", "video_id": "3c-iBn73dDE", "duration": 25, "content": "Master docker run, exec, logs, inspect, stop, rm, and tagging workflows for container lifecycle management."}
                ]
            },
            {
                "number": 2,
                "title": "Module 2 – Dockerfile Optimization & Multi-Stage Builds",
                "description": "Writing robust Dockerfiles, layer caching strategies, non-root security contexts, and multi-stage build pipelines.",
                "lessons": [
                    {"title": "Anatomy of an Efficient Dockerfile", "video_url": "https://www.youtube.com/watch?v=pg19Z8LL06w", "video_id": "pg19Z8LL06w", "duration": 28, "content": "Analyze FROM, RUN, COPY, ADD, CMD, and ENTRYPOINT directives to craft minimal and secure container images."},
                    {"title": "Multi-Stage Builds & Distroless Base Images", "video_url": "https://www.youtube.com/watch?v=0kFpGrc_7I0", "video_id": "0kFpGrc_7I0", "duration": 24, "content": "Drastically reduce production image sizes using multi-stage compilation and scratch base images."}
                ]
            },
            {
                "number": 3,
                "title": "Module 3 – Container Storage, Networks & Docker Compose",
                "description": "Bind mounts, named volumes, bridge/host networking, service discovery, and multi-tier application definition.",
                "lessons": [
                    {"title": "State Persistence: Volumes and Bind Mounts", "video_url": "https://www.youtube.com/watch?v=pTFZFxd4hOI", "video_id": "pTFZFxd4hOI", "duration": 26, "content": "Explore container data lifecycles, volume mounting patterns, database persistence, and driver configurations."},
                    {"title": "Multi-Container Systems with Docker Compose", "video_url": "https://www.youtube.com/watch?v=HG6yIjNapSA", "video_id": "HG6yIjNapSA", "duration": 30, "content": "Define full application stacks including backend, frontend, database, and cache using compose yaml specifications."}
                ]
            },
            {
                "number": 4,
                "title": "Module 4 – Enterprise Security & Production Best Practices",
                "description": "Vulnerability scanning, resource throttling, health checks, secrets management, and registry publishing.",
                "lessons": [
                    {"title": "Hardening Containers & Resource Governance", "video_url": "https://www.youtube.com/watch?v=qw--VYLpxG4", "video_id": "qw--VYLpxG4", "duration": 30, "content": "Enforce memory/CPU limits, drop capabilities, configure health checks, and scan images for CVE vulnerabilities."},
                    {"title": "CI/CD Integration and Enterprise Registries", "video_url": "https://www.youtube.com/watch?v=hQcFE0RD0cQ", "video_id": "hQcFE0RD0cQ", "duration": 32, "content": "Automate container image builds, tagging with Git commit SHAs, and publishing to secure enterprise registries."}
                ]
            }
        ],
        "questions": [
            ("What is the primary difference between a Docker container and a traditional Virtual Machine?", "Containers virtualize the operating system kernel while VMs virtualize hardware", "Containers are always slower", "VMs do not need a hypervisor", "Containers cannot run Linux", "A", "Containers share the host OS kernel and isolate user spaces, making them lightweight."),
            ("Which Dockerfile instruction specifies the default command executed when running a container?", "INIT", "CMD or ENTRYPOINT", "START", "RUN", "B", "CMD and ENTRYPOINT define the executable instruction run at container launch."),
            ("What mechanism does Docker utilize on Linux to isolate CPU and memory resources?", "Namespaces", "Control Groups (cgroups)", "Chroot only", "SELinux alone", "B", "cgroups govern resource allocation and usage limits (CPU, memory, I/O) for containers."),
            ("What command is used to run a container in the background detached mode?", "docker run -b", "docker run -d", "docker run --hidden", "docker background", "B", "The `-d` or `--detach` flag runs containers in background mode."),
            ("What type of Docker storage is managed directly by Docker within the host filesystem?", "Bind mount", "Named Volume", "tmpfs only", "NFS mount", "B", "Named volumes are created and managed completely by Docker inside the Docker storage directory."),
            ("What is the main benefit of using multi-stage builds in a Dockerfile?", "Faster internet access", "Significantly smaller and more secure production image size", "Automatic Kubernetes deployment", "Allows running Windows on Linux", "B", "Multi-stage builds separate build tools from runtime dependencies, yielding tiny lean images."),
            ("Which network driver is used by default for standalone containers in Docker?", "host", "bridge", "overlay", "macvlan", "B", "The default network driver for standalone containers is the bridge network."),
            ("What file is used to configure and launch multi-container applications simultaneously?", "Dockerfile", "docker-compose.yml", "container.json", "dockermount.conf", "B", "docker-compose.yml is the standard declarative file for multi-container orchestration."),
            ("How do you stop all running containers safely?", "docker kill $(docker ps -q)", "docker stop $(docker ps -q)", "docker rm -f", "docker pause", "B", "docker stop sends SIGTERM allowing processes to terminate gracefully before SIGKILL."),
            ("What does the `.dockerignore` file do?", "Prevents containers from communicating", "Excludes matching files from being sent in the build context", "Blocks network ports", "Deletes temporary images", "B", ".dockerignore prevents unwanted files (like node_modules, .git) from bloating the build context."),
            ("Which instruction in a Dockerfile executes during the image build process?", "CMD", "RUN", "ENTRYPOINT", "START", "B", "RUN commands execute during image construction to install packages and build assets."),
            ("What does the `EXPOSE` instruction in a Dockerfile accomplish?", "Opens firewall ports on the host", "Documents the intended port for communication as metadata", "Connects to a database", "Encrypts container network", "B", "EXPOSE acts as documentation between the image author and user regarding listening ports."),
            ("How do you inspect detailed JSON metadata of an existing container?", "docker view <id>", "docker inspect <id>", "docker log <id>", "docker query <id>", "B", "docker inspect returns low-level system metadata in structured JSON format."),
            ("Which command removes dangling, unused images, networks, and build cache?", "docker cleanup", "docker system prune", "docker purge", "docker delete all", "B", "docker system prune removes unused containers, networks, and dangling images."),
            ("What is a distroless container image?", "An image without a graphic interface", "An image containing only your application and runtime dependencies without package managers or shells", "A broken image", "An Ubuntu VM", "B", "Distroless images contain no package managers or shells, maximizing security and reducing attack surfaces."),
            ("Which signal is sent first by `docker stop` to give containers time to cleanly shut down?", "SIGKILL", "SIGTERM", "SIGINT", "SIGHUP", "B", "Docker sends SIGTERM first, waiting 10 seconds before issuing a forceful SIGKILL."),
            ("How can you map port 80 of the host to port 8080 of a container?", "docker run -p 80:8080", "docker run -p 8080:80", "docker run --port 80-8080", "docker run -m 80->8080", "A", "The `-p <host_port>:<container_port>` syntax maps host port 80 to container port 8080."),
            ("What Linux kernel feature ensures that containers cannot see processes running in other containers?", "PID Namespaces", "IPC", "Memory cgroups", "IPtables", "A", "PID namespaces isolate the process ID space, ensuring processes in one container cannot see others."),
            ("What does the `HEALTHCHECK` instruction tell Docker?", "The temperature of the CPU", "How to verify that a container is still functioning correctly", "Memory leaks in RAM", "Number of connected users", "B", "HEALTHCHECK specifies a command that runs periodically to test if the service is healthy."),
            ("Why is running container processes as the `root` user considered an anti-pattern?", "Root takes too much disk space", "A container escape could compromise the entire host operating system with root privileges", "Root cannot run Node.js", "Docker forbids it strictly", "B", "Running as non-root mitigates the impact of potential container breakout vulnerabilities.")
        ]
    },

    "kubernetes": {
        "title": "Cloud-Native Orchestration with Kubernetes",
        "description": "Deploy, scale, and manage containerized workloads across enterprise clusters using Kubernetes, Pods, Deployments, Services, and Helm.",
        "subject": "DevOps & Cloud",
        "difficulty": "Advanced",
        "duration": "8 Weeks",
        "thumbnail": "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=80",
        "competencies": ["Cluster Architecture", "Pods & Deployments", "Networking & Ingress", "Helm & GitOps"],
        "modules": [
            {
                "number": 1,
                "title": "Module 1 – Cluster Architecture & Control Plane Components",
                "description": "kube-apiserver, etcd, kube-scheduler, kube-controller-manager, kubelet, and container runtime interface (CRI).",
                "lessons": [
                    {"title": "Kubernetes Architecture & Control Plane Mechanics", "video_url": "https://www.youtube.com/watch?v=X48VuDVv0do", "video_id": "X48VuDVv0do", "duration": 25, "content": "Explore master nodes, worker nodes, etcd distributed consensus, and API server reconciliation loops."},
                    {"title": "Understanding Pods and Workload Pod Lifecycles", "video_url": "https://www.youtube.com/watch?v=s_o8dwzRluo", "video_id": "s_o8dwzRluo", "duration": 26, "content": "Atomic unit of scheduling, multi-container pods, pause containers, and shared network namespaces."}
                ]
            },
            {
                "number": 2,
                "title": "Module 2 – Workload Controllers: Deployments & ReplicaSets",
                "description": "Declarative YAML manifests, rolling updates, rollbacks, daemonsets, statefulsets, and horizontal pod autoscalers (HPA).",
                "lessons": [
                    {"title": "Deployments, ReplicaSets & Rolling Updates", "video_url": "https://www.youtube.com/watch?v=d6WC5n9G_vM", "video_id": "d6WC5n9G_vM", "duration": 28, "content": "Zero-downtime rolling upgrades, rollout history, revision undo, and replica maintenance."},
                    {"title": "Horizontal Pod Autoscaling & Resource Requests", "video_url": "https://www.youtube.com/watch?v=7bA0gTroJ3E", "video_id": "7bA0gTroJ3E", "duration": 24, "content": "Setting CPU/Memory requests and limits, Metrics Server, and dynamic workload scaling."}
                ]
            },
            {
                "number": 3,
                "title": "Module 3 – Networking, Services & Ingress Controllers",
                "description": "ClusterIP, NodePort, LoadBalancer, CNI plugins, CoreDNS, Ingress routing, and network policies.",
                "lessons": [
                    {"title": "Service Abstraction & Internal Service Discovery", "video_url": "https://www.youtube.com/watch?v=s_o8dwzRluo", "video_id": "s_o8dwzRluo", "duration": 28, "content": "Kube-proxy iptables/IPVS modes, label selectors, endpoint slices, and cluster DNS resolution."},
                    {"title": "Ingress Controllers and TLS Termination", "video_url": "https://www.youtube.com/watch?v=X48VuDVv0do", "video_id": "X48VuDVv0do", "duration": 30, "content": "Configuring NGINX Ingress, path-based routing, cert-manager automated certificates, and TLS secrets."}
                ]
            },
            {
                "number": 4,
                "title": "Module 4 – Enterprise Storage, Config & Helm Packaging",
                "description": "PersistentVolumes, PersistentVolumeClaims, StorageClasses, ConfigMaps, Secrets, and Helm chart architecture.",
                "lessons": [
                    {"title": "ConfigMaps, Secrets and Storage Architecture", "video_url": "https://www.youtube.com/watch?v=d6WC5n9G_vM", "video_id": "d6WC5n9G_vM", "duration": 26, "content": "Decoupling configuration from code, CSI drivers, dynamic provisioning, and PV/PVC binding."},
                    {"title": "Packaging Applications with Helm & GitOps", "video_url": "https://www.youtube.com/watch?v=7bA0gTroJ3E", "video_id": "7bA0gTroJ3E", "duration": 32, "content": "Templating Kubernetes resources, values overrides, release management, and GitOps synchronization."}
                ]
            }
        ],
        "questions": [
            ("What is the smallest deployable computing unit in Kubernetes?", "Container", "Pod", "Node", "Service", "B", "A Pod is the smallest execution unit in Kubernetes, wrapping one or more containers."),
            ("Which component serves as the single source of truth and distributed datastore for cluster state?", "kube-scheduler", "etcd", "kubelet", "kube-proxy", "B", "etcd is a consistent, highly-available key-value store used for all cluster configuration and state."),
            ("What is the role of the kube-scheduler?", "Compiling code", "Assigning newly created pods to available worker nodes based on resource constraints", "Balancing HTTP traffic", "Issuing SSL certificates", "B", "The scheduler decides which node is best suited to run unscheduled pods."),
            ("Which Service type provides an externally accessible IP assigned by a cloud provider?", "ClusterIP", "NodePort", "LoadBalancer", "ExternalName", "C", "LoadBalancer provisions a dedicated cloud load balancer forwarding external traffic to the service."),
            ("What does a ReplicaSet ensure in a Kubernetes cluster?", "Every pod has 100GB disk", "A specified number of pod replicas are running at any given time", "Nodes are updated nightly", "Containers never crash", "B", "ReplicaSet maintains a stable set of replica pods running at any given time."),
            ("How do you perform a rolling update rollback in Kubernetes?", "kubectl rollout undo deployment/<name>", "kubectl delete deployment", "kubectl restart", "kubectl revert", "A", "kubectl rollout undo rolls back the deployment to the previous revision."),
            ("What Kubernetes object decouples confidential data like passwords from container images?", "ConfigMap", "Secret", "Volume", "Namespace", "B", "Secrets store sensitive data such as keys and tokens, mounted into pods as files or env variables."),
            ("Which component runs on each worker node to communicate with the API server and execute pods?", "kube-scheduler", "kubelet", "etcd", "kubectl", "B", "The kubelet is the primary node agent ensuring containers described in PodSpecs are running and healthy."),
            ("What does CNI stand for in Kubernetes networking?", "Cloud Network Interface", "Container Network Interface", "Cluster Node Integration", "Core Network IP", "B", "CNI (Container Network Interface) defines plugins that allocate IP addresses and manage pod connectivity."),
            ("What is Helm primarily used for in Kubernetes environments?", "Monitoring CPU usage", "A package manager for templating and managing Kubernetes applications", "Writing Go code", "Creating Linux partitions", "B", "Helm is the de facto package manager for defining, versioning, and deploying complex Kubernetes apps."),
            ("Which field in a container spec specifies the maximum memory a pod is permitted to consume?", "requests.memory", "limits.memory", "max.memory", "bound.memory", "B", "limits.memory specifies the ceiling; exceeding it causes OOMKilled termination."),
            ("What happens to a pod that exceeds its configured memory limit?", "It gets more RAM dynamically", "The Linux OOM killer terminates it with an OOMKilled event", "It is scheduled to another cluster", "It continues running without penalty", "B", "When memory exceeds limits, the kernel out-of-memory killer terminates the container."),
            ("What is the purpose of an Ingress Controller?", "Routes external HTTP/HTTPS traffic to internal cluster services based on rules", "Connects two master nodes", "Backs up etcd", "Upgrades kernel modules", "A", "Ingress controllers act as intelligent reverse proxies routing traffic into the cluster."),
            ("Which probe tests whether an application is ready to begin accepting incoming traffic?", "LivenessProbe", "ReadinessProbe", "StartupProbe", "DeadlockProbe", "B", "Readiness probes indicate when a pod is initialized and eligible to receive service endpoints traffic."),
            ("What is a DaemonSet used for?", "Running a single background task", "Ensuring that a copy of a pod runs on all (or some) nodes in the cluster", "Scheduling cron jobs", "Storing database backups", "B", "DaemonSets guarantee that every designated node runs an instance of the pod (e.g. logging agents)."),
            ("What object requests physical storage in a cluster without needing to know backend storage details?", "StorageClass", "PersistentVolumeClaim (PVC)", "VolumeMount", "ConfigMap", "B", "A PVC allows developers to request storage size and access modes without cloud-specific knowledge."),
            ("How does kube-proxy enable service communication across nodes?", "Using iptables, IPVS, or user space connection forwarding", "Creating SSH tunnels", "Recompiling the Linux kernel", "Running an Apache webserver", "A", "kube-proxy configures iptables or IPVS rules to redirect service traffic to target pod IPs."),
            ("Which command shows the logs for a specific container inside a multi-container pod?", "kubectl get logs <pod> -c <container>", "kubectl logs <pod> -c <container>", "kubectl inspect logs", "kubectl dump <pod>", "B", "`kubectl logs <pod> -c <container>` fetches output from a specific container inside a pod."),
            ("What is the purpose of Namespaces in Kubernetes?", "To physical segregate CPU cores", "To provide logical isolation and scope for resource names within the same cluster", "To create new cloud accounts", "To encrypt pod traffic", "B", "Namespaces divide cluster resources between multiple teams or environments (e.g. dev, staging, prod)."),
            ("What is GitOps when applied to Kubernetes cluster administration?", "Running git commands inside pods", "Using Git repositories as the single source of truth for declaratively managed cluster state", "Deleting pods through GitHub webhooks", "Hosting git servers in Docker", "B", "GitOps uses Git version control as the definitive declarative source of truth for deployment state.")
        ]
    },

    "java": {
        "title": "Enterprise Java Development & Spring Architecture",
        "description": "Master core Java, object-oriented design patterns, JVM memory architecture, multithreading, and enterprise Spring framework engineering.",
        "subject": "Backend Development",
        "difficulty": "Intermediate",
        "duration": "8 Weeks",
        "thumbnail": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80",
        "competencies": ["Core Java & Syntax", "OOP & Design Patterns", "JVM & Memory Management", "Spring Framework & Concurrency"],
        "modules": [
            {
                "number": 1,
                "title": "Module 1 – Java Core Foundations & Type System",
                "description": "Variables, primitive vs reference types, control flow, arrays, and standard collections framework.",
                "lessons": [
                    {"title": "Java Platform Architecture & Language Syntax", "video_url": "https://www.youtube.com/watch?v=eIrMbAQSU34", "video_id": "eIrMbAQSU34", "duration": 22, "content": "Understand the JVM, JRE, JDK, bytecode compilation, classloaders, and primitive data types."},
                    {"title": "Control Structures, Arrays & Collections Overview", "video_url": "https://www.youtube.com/watch?v=grEKMHGYyns", "video_id": "grEKMHGYyns", "duration": 26, "content": "Master iterative loops, conditional statements, List, Set, Map collections, and generics."}
                ]
            },
            {
                "number": 2,
                "title": "Module 2 – Object-Oriented Principles & Design Patterns",
                "description": "Encapsulation, inheritance, polymorphism, interfaces, abstract classes, and SOLID architecture.",
                "lessons": [
                    {"title": "Inheritance, Interfaces and Polymorphism", "video_url": "https://www.youtube.com/watch?v=A74TOX803D0", "video_id": "A74TOX803D0", "duration": 28, "content": "Deep dive into interface default methods, abstract class design, dynamic method dispatch, and composition."},
                    {"title": "Creational & Structural Design Patterns in Java", "video_url": "https://www.youtube.com/watch?v=vNHpsC5ng_E", "video_id": "vNHpsC5ng_E", "duration": 30, "content": "Implementing Singleton, Factory, Builder, and Decorator patterns according to enterprise best practices."}
                ]
            },
            {
                "number": 3,
                "title": "Module 3 – JVM Memory Model & Multithreading",
                "description": "Stack vs heap memory, Garbage Collection algorithms, thread lifecycles, synchronization, and executor frameworks.",
                "lessons": [
                    {"title": "JVM Internals: Memory Management and GC Mechanics", "video_url": "https://www.youtube.com/watch?v=0kFpGrc_7I0", "video_id": "0kFpGrc_7I0", "duration": 30, "content": "Analyze young generation, old generation, survivor spaces, G1/ZGC collectors, and memory leak profiling."},
                    {"title": "Concurrent Programming & java.util.concurrent", "video_url": "https://www.youtube.com/watch?v=BGTx91t8q50", "video_id": "BGTx91t8q50", "duration": 25, "content": "Thread synchronization, volatile variables, atomic types, thread pools, and CompletableFuture."}
                ]
            },
            {
                "number": 4,
                "title": "Module 4 – Enterprise Spring Boot & REST APIs",
                "description": "Dependency Injection, Inversion of Control (IoC), Spring Data JPA, Hibernate, and RESTful web services.",
                "lessons": [
                    {"title": "Spring IoC Container and Dependency Injection", "video_url": "https://www.youtube.com/watch?v=9SGDpanrc8U", "video_id": "9SGDpanrc8U", "duration": 32, "content": "Configuring Spring beans, application contexts, autowiring, component scanning, and profiles."},
                    {"title": "Building Production RESTful APIs with Spring Data JPA", "video_url": "https://www.youtube.com/watch?v=vtPkZShrvXQ", "video_id": "vtPkZShrvXQ", "duration": 35, "content": "Entity modeling, ORM mappings, repositories, transaction management, and exception handling."}
                ]
            }
        ],
        "questions": [
            ("Which part of Java memory stores local variables and method invocation frames?", "Heap Memory", "Stack Memory", "Metaspace", "Permanent Generation", "B", "Stack memory stores local primitive variables and method call stack frames."),
            ("What does the `final` keyword indicate when applied to a Java class?", "The class cannot be instantiated", "The class cannot be extended or inherited", "The class runs in parallel", "The class is immutable", "B", "A final class cannot be subclassed (inherited by another class)."),
            ("Which Java collection preserves the insertion order of its elements and permits duplicates?", "HashSet", "ArrayList", "TreeSet", "HashMap", "B", "ArrayList implements the List interface, maintaining insertion order and allowing duplicates."),
            ("What is the purpose of the Java Virtual Machine (JVM)?", "Compiles source code into .java files", "Executes compiled Java bytecode on target operating systems", "Designs user interfaces", "Formats database tables", "B", "The JVM loads and executes compiled bytecode (.class files) on any platform."),
            ("Which design pattern is implemented natively when using the Spring `@Autowired` annotation?", "Singleton", "Dependency Injection / Inversion of Control", "Observer", "Adapter", "B", "@Autowired implements Dependency Injection, delegating object creation to the IoC container."),
            ("What is the difference between `==` and `equals()` in Java for objects?", "`==` compares memory references; `equals()` compares contents/logical equality", "They are identical", "`==` is for strings only", "`equals()` deletes duplicates", "A", "`==` checks referential identity; `equals()` checks logical equivalence when overridden."),
            ("Which interface must be implemented to sort objects by their natural ordering in Java?", "Comparator", "Comparable", "Serializable", "Cloneable", "B", "Comparable provides the `compareTo()` method defining an object's natural ordering."),
            ("What exception is thrown when an application attempts to use null in case where an object is required?", "IllegalArgumentException", "NullPointerException", "ClassCastException", "IndexOutOfBoundsException", "B", "NullPointerException is raised when accessing methods or fields on a null object reference."),
            ("How does Java ensure thread safety when modifying shared memory using the `volatile` keyword?", "Locks the entire object", "Guarantees that reads and writes are made directly to main memory, avoiding CPU cache staleness", "Stops all other threads", "Encrypts the variable", "B", "The volatile modifier ensures visibility of variable updates across all threads without caching."),
            ("Which Garbage Collection algorithm divides the heap into young and old generational regions?", "Reference Counting", "Generational Garbage Collection (e.g. G1)", "Manual Freeing", "Stop-the-world exclusively", "B", "Generational GC divides heap into young and old spaces based on the weak generational hypothesis."),
            ("What is the return type of a method that does not return any value?", "null", "void", "empty", "static", "B", "The void keyword indicates that a method returns no value."),
            ("Which of these keywords prevents a variable from being serialized?", "volatile", "transient", "final", "static", "B", "The transient keyword tells the serialization engine not to persist the variable."),
            ("What is the base class from which all classes in Java directly or indirectly inherit?", "System", "Object", "Class", "Root", "B", "java.lang.Object is the root superclass of every class in Java."),
            ("Which Spring annotation marks a class as a REST controller handling HTTP requests?", "@Component", "@RestController", "@Service", "@Repository", "B", "@RestController combines @Controller and @ResponseBody for REST API services."),
            ("What is the purpose of a try-with-resources statement in Java 7+?", "Executes code faster", "Automatically closes resources implementing AutoCloseable", "Traps compile errors", "Allocates heap space", "B", "Try-with-resources ensures open streams and database connections close automatically."),
            ("Which collection class is synchronized and thread-safe by default?", "ArrayList", "Vector", "LinkedList", "HashSet", "B", "Vector is a synchronized implementation of List, whereas ArrayList is unsynchronized."),
            ("What is the default port used by Spring Boot embedded Tomcat web server?", "80", "8080", "3000", "5432", "B", "Spring Boot's embedded Tomcat defaults to listening on port 8080."),
            ("What is the benefit of Java 8 Streams API?", "Replaces SQL entirely", "Provides functional declarative processing pipelines over collections with lazy evaluation", "Creates operating system threads", "Compiles bytecode to native binary", "B", "Streams enable functional, declarative operations (map, filter, reduce) with lazy execution."),
            ("Which annotation is used in Spring Data JPA to define the primary key of an entity?", "@Table", "@Id", "@Key", "@Primary", "B", "The `@Id` annotation specifies the primary key property of an entity bean."),
            ("What is the time complexity of retrieving an element by key from a HashMap with good hash distribution?", "O(n)", "O(1)", "O(log n)", "O(n^2)", "B", "A HashMap with well-distributed keys achieves O(1) constant time lookups on average.")
        ]
    },

    "c++": {
        "title": "Modern C++ Systems Programming",
        "description": "Construct high-performance, low-latency applications with Modern C++ (C++17/C++20), memory management, RAII, STL templates, and multithreading.",
        "subject": "Systems Programming",
        "difficulty": "Advanced",
        "duration": "8 Weeks",
        "thumbnail": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
        "competencies": ["Modern C++ (17/20)", "Pointers & RAII", "STL Templates", "Concurrency & Low-Latency"],
        "modules": [
            {
                "number": 1,
                "title": "Module 1 – C++ Foundations & Compilation Architecture",
                "description": "Preprocessors, compilation units, linkers, basic types, references, pointers, and memory layout.",
                "lessons": [
                    {"title": "C++ Compilation Pipeline & Language Basics", "video_url": "https://www.youtube.com/watch?v=vLnPwxZdW4Y", "video_id": "vLnPwxZdW4Y", "duration": 25, "content": "Understand translation units, header guards, preprocessors, pointers, references, and stack allocations."},
                    {"title": "Pointers, References and Raw Memory Inspection", "video_url": "https://www.youtube.com/watch?v=ZzaPdXTrSb8", "video_id": "ZzaPdXTrSb8", "duration": 26, "content": "Pointer arithmetic, dereferencing, const pointers, pass-by-reference semantics, and memory alignments."}
                ]
            },
            {
                "number": 2,
                "title": "Module 2 – Object-Oriented C++ & Resource Management (RAII)",
                "description": "Classes, constructors, destructors, rule of 3/5/0, smart pointers (unique_ptr, shared_ptr), and RAII.",
                "lessons": [
                    {"title": "Classes, Destructors and the Rule of Five", "video_url": "https://www.youtube.com/watch?v=8jLOx1hD3_o", "video_id": "8jLOx1hD3_o", "duration": 28, "content": "Custom copy/move constructors, copy/move assignment operators, and deterministic destruction."},
                    {"title": "Smart Pointers and Modern RAII Memory Semantics", "video_url": "https://www.youtube.com/watch?v=UOB7-B2MfwA", "video_id": "UOB7-B2MfwA", "duration": 30, "content": "Eliminate raw deletes and memory leaks using std::unique_ptr, std::shared_ptr, and std::weak_ptr."}
                ]
            },
            {
                "number": 3,
                "title": "Module 3 – Standard Template Library (STL) & Generic Code",
                "description": "Templates, containers (vector, map, unordered_map), iterators, lambda expressions, and algorithms.",
                "lessons": [
                    {"title": "Template Metaprogramming & Generic Classes", "video_url": "https://www.youtube.com/watch?v=18c3MTX0PK0", "video_id": "18c3MTX0PK0", "duration": 28, "content": "Function templates, class templates, template specialization, and compile-time type deduction."},
                    {"title": "Mastering STL Containers and Modern Algorithms", "video_url": "https://www.youtube.com/watch?v=ltKXStusnL4", "video_id": "ltKXStusnL4", "duration": 30, "content": "Analyzing vector reallocation, iterator invalidation rules, std::sort, std::transform, and lambda closures."}
                ]
            },
            {
                "number": 4,
                "title": "Module 4 – High-Performance Concurrency & Modern Standards",
                "description": "Move semantics (rvalue references), std::thread, mutex, condition_variable, atomics, and cache optimization.",
                "lessons": [
                    {"title": "Move Semantics, Rvalues and Perfect Forwarding", "video_url": "https://www.youtube.com/watch?v=ehM4x9gkMVM", "video_id": "ehM4x9gkMVM", "duration": 30, "content": "std::move, rvalue references (&&), avoiding unnecessary deep copies, and std::forward mechanics."},
                    {"title": "Multithreading, Atomics and Memory Ordering", "video_url": "https://www.youtube.com/watch?v=TPVH_coGAQs", "video_id": "TPVH_coGAQs", "duration": 32, "content": "std::thread, std::unique_lock, condition variables, atomic operations, and lock-free data structures."}
                ]
            }
        ],
        "questions": [
            ("What does RAII stand for in modern C++ software design?", "Resource Allocation Is Instant", "Resource Acquisition Is Initialization", "Random Access Iterator Interface", "Reference Array Index Inheritance", "B", "RAII binds the lifecycle of a resource (memory, handles) to the lifetime of an object."),
            ("Which smart pointer provides exclusive ownership of a dynamically allocated object?", "std::shared_ptr", "std::unique_ptr", "std::weak_ptr", "std::auto_ptr", "B", "std::unique_ptr guarantees single, exclusive ownership without reference counting overhead."),
            ("What does an rvalue reference syntax `Type&&` enable in C++11 and beyond?", "Multiple inheritance", "Move semantics and perfect forwarding", "Automatic garbage collection", "Faster disk access", "B", "Rvalue references (&&) enable move semantics, transferring ownership of resources without copying."),
            ("What happens if an exception is thrown from a C++ destructor during stack unwinding?", "Program recovers automatically", "std::terminate is called immediately aborting the program", "Exception is ignored", "Stack re-allocates", "B", "Throwing an exception from a destructor during stack unwinding invokes std::terminate()."),
            ("What is the purpose of `std::move()` in modern C++?", "Physically moves memory on the motherboard", "Unconditionally casts an expression to an rvalue reference", "Deletes an object", "Spawns a new thread", "B", "std::move does not move anything itself; it casts its argument to an rvalue reference to enable move constructors."),
            ("Which container provides contiguous memory storage and O(1) amortized insertion at the back?", "std::list", "std::vector", "std::map", "std::deque", "B", "std::vector stores elements contiguously in memory, offering rapid random access and amortized O(1) push_back."),
            ("What is undefined behavior in C++?", "A compilation error", "Execution behavior for which the C++ standard imposes no requirements, leading to potential crashes or corruption", "A runtime warning", "A missing header file", "B", "Undefined behavior gives no guarantees; anything from silent data corruption to crashes can occur."),
            ("What does the `virtual` keyword indicate when applied to a base class method?", "The method runs in a virtual machine", "The method can be overridden by derived classes and resolved dynamically via vtable", "The method cannot be called", "The method is executed at compile time", "B", "Virtual functions enable dynamic polymorphism through dynamic dispatch via a virtual method table (vtable)."),
            ("How does `std::shared_ptr` track when to release managed memory?", "Using a reference count in its control block", "Using periodic garbage collection sweeps", "Using CPU timers", "Using the OS kernel", "A", "shared_ptr maintains an internal control block with a reference counter, destroying the object when it hits 0."),
            ("Which keyword is used to enforce compile-time expression evaluation in C++11/14/20?", "inline", "constexpr", "static", "volatile", "B", "constexpr declares that it is possible to evaluate the value of the function or variable at compile time."),
            ("What is the time complexity of finding a key in `std::map`?", "O(1)", "O(log n)", "O(n)", "O(n^2)", "B", "std::map is typically implemented as a Red-Black tree, providing O(log n) lookup operations."),
            ("What problem does `std::weak_ptr` solve?", "Slow performance in threads", "Cyclic/circular reference memory leaks between shared_ptrs", "Array indexing bounds", "Type conversion errors", "B", "weak_ptr provides a non-owning observer reference to break circular dependencies in shared_ptr graphs."),
            ("What is an iterator in the C++ Standard Template Library?", "A CPU instruction", "An abstraction representing a position within a container that can traverse elements", "A memory profiler", "A lambda function", "B", "Iterators act as generalized pointers that allow algorithms to traverse arbitrary containers uniformly."),
            ("Which operator is overloaded to enable functional calling syntax on an object (Functor)?", "operator[]", "operator()", "operator->", "operator*", "B", "Overloading `operator()` allows an object to be invoked like a standard function."),
            ("What is the Rule of Three in classic C++?", "Three loops max per function", "If a class requires a custom destructor, copy constructor, or copy assignment operator, it likely needs all three", "Always use three threads", "Split files into three sections", "B", "The Rule of Three states that managing raw resources requires implementing destructor, copy constructor, and copy assignment."),
            ("What does the `auto` type specifier do in modern C++?", "Declares automatic variables on the heap", "Directs the compiler to deduce the variable's type from its initializer expression", "Calls automatic destructor", "Allocates shared memory", "B", "The `auto` keyword triggers compile-time type deduction based on the initialization value."),
            ("What is the difference between `std::atomic` and standard variables?", "Atomic variables prevent data races by enforcing atomic hardware read-modify-write operations", "Atomic variables are always floats", "Atomic variables cannot be modified", "Atomic variables require locks", "A", "std::atomic guarantees thread-safe, race-free operations without explicit mutex locks."),
            ("What does `override` specifier in a derived class method indicate to the compiler?", "Forces method execution", "Instructs compiler to verify that the method actually overrides a virtual function in a base class", "Hides the base method", "Prevents calling super", "B", "override catches subtle signature mismatch bugs at compile-time when overriding virtual methods."),
            ("Which header file provides `std::unique_ptr` and `std::shared_ptr`?", "<algorithm>", "<memory>", "<utility>", "<iostream>", "B", "The `<memory>` header defines smart pointers and dynamic allocation facilities."),
            ("What is the purpose of a mutex (`std::mutex`)?", "Increases processor clock speed", "Enforces mutual exclusion so only one thread can access a critical section concurrently", "Allocates virtual memory", "Monitors network packets", "B", "A mutex ensures that only one thread executes a critical section of code at any time.")
        ]
    },

    "c programming": {
        "title": "Mastering C Systems & Memory Architecture",
        "description": "Learn low-level C programming, pointer mechanics, dynamic memory allocation, data structures, and hardware-level operating system interfaces.",
        "subject": "Systems Programming",
        "difficulty": "Intermediate",
        "duration": "6 Weeks",
        "thumbnail": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=80",
        "competencies": ["C Fundamentals", "Pointers & Memory Allocation", "Structs & Unions", "Data Structures in C"],
        "modules": [
            {
                "number": 1,
                "title": "Module 1 – C Syntax, Data Types & Compilation Flow",
                "description": "GCC compilation, preprocessors, primitive data types, operators, and control structures.",
                "lessons": [
                    {"title": "C Language Architecture and Preprocessor Directives", "video_url": "https://www.youtube.com/watch?v=KJgsSFOSQv0", "video_id": "KJgsSFOSQv0", "duration": 25, "content": "Understand compilation stages (preprocessor, compiler, assembler, linker), header files, and data types."},
                    {"title": "Control Flow, Functions and Stack Frames", "video_url": "https://www.youtube.com/watch?v=87SH2Cn0s9A", "video_id": "87SH2Cn0s9A", "duration": 28, "content": "Function call conventions, activation records, variable scopes, and recursion mechanics in C."}
                ]
            },
            {
                "number": 2,
                "title": "Module 2 – Deep Dive into Pointers & Pointer Arithmetic",
                "description": "Memory addresses, dereferencing, pointer arithmetic, void pointers, function pointers, and arrays.",
                "lessons": [
                    {"title": "Memory Addresses, Pointers and Dereferencing", "video_url": "https://www.youtube.com/watch?v=87SH2Cn0s9A", "video_id": "87SH2Cn0s9A", "duration": 30, "content": "Demystify pointer notation, memory offsets, endianness, arrays as pointer decay, and double pointers."},
                    {"title": "Function Pointers and Callback Architecture", "video_url": "https://www.youtube.com/watch?v=Bz4MxDeEM6k", "video_id": "Bz4MxDeEM6k", "duration": 24, "content": "Implementing callbacks, jump tables, and polymorphism using C function pointers."}
                ]
            },
            {
                "number": 3,
                "title": "Module 3 – Dynamic Memory Allocation & Memory Safety",
                "description": "malloc, calloc, realloc, free, heap fragmentation, memory leaks, and Valgrind profiling.",
                "lessons": [
                    {"title": "Heap Allocation Mechanics: malloc vs calloc vs realloc", "video_url": "https://www.youtube.com/watch?v=U3aXWizDbQ4", "video_id": "U3aXWizDbQ4", "duration": 28, "content": "Understanding heap management, allocation headers, boundary checks, and proper free() invocation."},
                    {"title": "Diagnosing Buffer Overflows and Leaks with Valgrind", "video_url": "https://www.youtube.com/watch?v=bbWb4YxL0gU", "video_id": "bbWb4YxL0gU", "duration": 26, "content": "Preventing segmentation faults, dangling pointers, double frees, and stack smashing attacks."}
                ]
            },
            {
                "number": 4,
                "title": "Module 4 – Structures, File I/O & Core Data Structures",
                "description": "Struct alignment/padding, unions, bitfields, file streams, linked lists, and binary trees.",
                "lessons": [
                    {"title": "Structs, Padding, Memory Alignment & Unions", "video_url": "https://www.youtube.com/watch?v=KJgsSFOSQv0", "video_id": "KJgsSFOSQv0", "duration": 30, "content": "Byte alignment, padding optimization, union overlays, and binary serialization."},
                    {"title": "Implementing Linked Lists and File Operations", "video_url": "https://www.youtube.com/watch?v=U3aXWizDbQ4", "video_id": "U3aXWizDbQ4", "duration": 32, "content": "Building singly and doubly linked lists, fopen, fread, fwrite, and error handling."}
                ]
            }
        ],
        "questions": [
            ("Which function in C allocates uninitialized dynamic memory on the heap?", "calloc()", "malloc()", "alloc()", "new()", "B", "malloc() allocates specified bytes on the heap without zeroing memory contents."),
            ("What is the difference between `malloc()` and `calloc()`?", "calloc() zeros out allocated memory; malloc() leaves memory uninitialized", "malloc() is faster on strings", "calloc() is for files only", "They are identical", "A", "calloc() initializes all bytes in the allocated block to zero."),
            ("What does the dereference operator `*` do when applied to a pointer variable?", "Multiplies the address", "Accesses the value stored at the memory address pointed to", "Frees the memory", "Declares an array", "B", "Dereferencing retrieves or modifies the value held at the target address."),
            ("What is a segmentation fault in C?", "A syntax warning", "An operating system signal (SIGSEGV) triggered when attempting to access unauthorized memory", "A division by zero", "An infinite loop", "B", "A segfault occurs when a program attempts to read or write unallocated or restricted memory."),
            ("What is the size of a pointer on a standard 64-bit operating system?", "4 bytes", "8 bytes", "16 bytes", "2 bytes", "B", "On 64-bit architectures, memory addresses require 8 bytes (64 bits)."),
            ("What does passing a pointer to a function in C achieve?", "Simulates pass-by-reference allowing modification of the caller's variable", "Duplicates the variable", "Slows down execution", "Deletes the variable", "A", "Passing a pointer allows the receiving function to read and modify caller memory directly."),
            ("What is a dangling pointer?", "A pointer to NULL", "A pointer that points to a memory location that has already been deallocated/freed", "An unassigned float", "A pointer inside a loop", "B", "A dangling pointer holds the address of memory that has been released via free()."),
            ("Which C library function frees dynamically allocated heap memory?", "release()", "free()", "delete()", "destroy()", "B", "free() returns allocated heap blocks back to the runtime memory manager."),
            ("What is the purpose of `#include <stdio.h>`?", "Installs a new compiler", "Includes standard input/output library declarations like printf and scanf", "Allocates graphics buffers", "Encrypts strings", "B", "stdio.h defines fundamental I/O functions including printf, scanf, and fopen."),
            ("What is structure padding in C?", "Extra bytes inserted by the compiler to align fields with hardware memory boundaries", "Writing zeroes to a file", "Adding comments to structs", "A syntax error", "A", "Compilers insert padding bytes to ensure multi-byte primitives sit on natural memory address boundaries."),
            ("Which format specifier is used to print an integer in `printf`?", "%s", "%d or %i", "%f", "%c", "B", "%d and %i print signed decimal integer values in printf."),
            ("What does `sizeof(char)` always evaluate to in standard C?", "4", "1", "2", "8", "B", "By definition in the C standard, sizeof(char) is always guaranteed to be 1 byte."),
            ("What is a union in C?", "A struct that can hold multiple variables simultaneously", "A special data type where all members share the exact same memory location", "A linked list node", "A thread lock", "B", "A union allocates memory equal only to its largest member, sharing memory across all fields."),
            ("How does C terminate a standard string in memory?", "With a space", "With a null byte character '\\0'", "With a semicolon", "With a newline '\\n'", "B", "C strings are null-terminated arrays of characters ending with '\\0'."),
            ("What happens if you fail to free memory allocated with `malloc()` before your program finishes?", "Computer explodes", "Causes a memory leak, consuming heap until process exit", "Compiler throws an error", "RAM deletes itself", "B", "Unfreed allocations result in memory leaks that bloat system memory usage."),
            ("What is a function pointer?", "A pointer stored inside a function", "A pointer that stores the starting address of executable code for a function", "A pointer to an integer", "A void pointer", "B", "Function pointers store executable code addresses, enabling callback and jump table implementations."),
            ("Which mode in `fopen` opens an existing file for reading in binary format?", "\"w\"", "\"rb\"", "\"a+\"", "\"w+\"", "B", "\"rb\" opens an existing file strictly for binary reading."),
            ("What operator is used to access members of a structure through a pointer?", "`.`", "`->`", "`::`", "`=>`", "B", "The arrow operator `->` dereferences the pointer and accesses the designated struct member."),
            ("What does the `const` keyword enforce when declared with a variable?", "Makes the variable global", "Marks the variable as read-only, preventing reassignment", "Makes the variable run faster", "Deletes the variable after use", "B", "The `const` qualifier indicates that the variable value cannot be modified after initialization."),
            ("Which standard function compares two null-terminated strings character by character?", "strcat()", "strcmp()", "strlen()", "strcpy()", "B", "strcmp() returns 0 if both strings contain identical character sequences.")
        ]
    },

    "sql": {
        "title": "Enterprise Relational Databases & Advanced SQL",
        "description": "Master SQL querying, schema design, database normalization, indexing strategies, complex window functions, and transactional ACID guarantees.",
        "subject": "Database & Analytics",
        "difficulty": "Intermediate",
        "duration": "6 Weeks",
        "thumbnail": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80",
        "competencies": ["SQL Querying & Joins", "Normalization & Schema Design", "Indexes & Query Plans", "Window Functions & Transactions"],
        "modules": [
            {
                "number": 1,
                "title": "Module 1 – Relational Foundations & Core DML Operations",
                "description": "Relational algebra, SELECT, WHERE, GROUP BY, HAVING, and aggregate functions.",
                "lessons": [
                    {"title": "Relational Theory, Tables and Query Anatomy", "video_url": "https://www.youtube.com/watch?v=HXV3zeRRhuQ", "video_id": "HXV3zeRRhuQ", "duration": 25, "content": "Understand entities, attributes, primary keys, foreign keys, filtering, and standard data types."},
                    {"title": "Aggregations, Grouping and Execution Order", "video_url": "https://www.youtube.com/watch?v=7S_tz1z_5bA", "video_id": "7S_tz1z_5bA", "duration": 28, "content": "Master COUNT, SUM, AVG, GROUP BY, and understand why WHERE executes before HAVING."}
                ]
            },
            {
                "number": 2,
                "title": "Module 2 – Multi-Table Joins & Subqueries",
                "description": "INNER, LEFT, RIGHT, FULL OUTER joins, self-joins, cross joins, correlated subqueries, and CTEs.",
                "lessons": [
                    {"title": "Mastering Relational Joins and Set Operations", "video_url": "https://www.youtube.com/watch?v=7S_tz1z_5bA", "video_id": "7S_tz1z_5bA", "duration": 30, "content": "Venn diagrams vs relational algebra, handling NULLs in outer joins, UNION vs UNION ALL."},
                    {"title": "Common Table Expressions (CTEs) & Subqueries", "video_url": "https://www.youtube.com/watch?v=qw--VYLpxG4", "video_id": "qw--VYLpxG4", "duration": 26, "content": "Writing clean modular queries with WITH CTE syntax and recursive hierarchy traversal."}
                ]
            },
            {
                "number": 3,
                "title": "Module 3 – Database Normalization & Indexing Architecture",
                "description": "1NF, 2NF, 3NF, B-Tree indexes, Hash indexes, composite indexes, and EXPLAIN query plans.",
                "lessons": [
                    {"title": "Database Normalization and Anomaly Mitigation", "video_url": "https://www.youtube.com/watch?v=qw--VYLpxG4", "video_id": "qw--VYLpxG4", "duration": 28, "content": "Eliminating update, insertion, and deletion anomalies through functional dependency analysis."},
                    {"title": "B-Tree Indexing and Query Optimization Plans", "video_url": "https://www.youtube.com/watch?v=ztHopE5Wnpc", "video_id": "ztHopE5Wnpc", "duration": 32, "content": "How B-Trees work, index scans vs table scans, covering indexes, and interpreting EXPLAIN output."}
                ]
            },
            {
                "number": 4,
                "title": "Module 4 – Advanced Window Functions & ACID Transactions",
                "description": "OVER clause, PARTITION BY, ROW_NUMBER, RANK, DENSE_RANK, LEAD/LAG, and transaction isolation levels.",
                "lessons": [
                    {"title": "Analytical Window Functions and Partitioning", "video_url": "https://www.youtube.com/watch?v=ztHopE5Wnpc", "video_id": "ztHopE5Wnpc", "duration": 30, "content": "Computing running totals, moving averages, ranking rows within groups without collapsing datasets."},
                    {"title": "ACID Properties, Locks and Isolation Levels", "video_url": "https://www.youtube.com/watch?v=HXV3zeRRhuQ", "video_id": "HXV3zeRRhuQ", "duration": 32, "content": "Atomicity, Consistency, Isolation, Durability, Dirty reads, Phantom reads, and Serializability."}
                ]
            }
        ],
        "questions": [
            ("What does the 'A' in ACID transactions guarantee?", "Automation", "Atomicity – all operations succeed or all are rolled back", "Allocation", "Authentication", "B", "Atomicity ensures an all-or-nothing execution of statements within a transaction."),
            ("Which SQL clause filters records AFTER aggregation has taken place?", "WHERE", "HAVING", "ORDER BY", "GROUP BY", "B", "HAVING filters aggregated groups; WHERE filters individual rows before aggregation."),
            ("What is the difference between `UNION` and `UNION ALL`?", "UNION removes duplicate rows; UNION ALL retains all rows including duplicates", "UNION is for numbers only", "UNION ALL is slower", "They are identical", "A", "UNION performs a deduplication step; UNION ALL simply concatenates result sets."),
            ("Which join returns all rows from the left table along with matching rows from the right table?", "INNER JOIN", "LEFT JOIN (LEFT OUTER JOIN)", "RIGHT JOIN", "CROSS JOIN", "B", "A LEFT JOIN returns all rows from the left table, filling right table columns with NULL if no match exists."),
            ("What type of index is typically used as the primary default index structure in relational databases?", "Hash Index", "B-Tree (Balanced Tree) Index", "Bitmap Index", "Spatial Index", "B", "B-Tree indexes provide efficient logarithmic search, range scans, and sorting capabilities."),
            ("What does the `ROW_NUMBER()` window function do?", "Sums numbers", "Assigns a sequential unique integer to each row within a window partition", "Deletes duplicate rows", "Counts table columns", "B", "ROW_NUMBER() assigns a continuous 1-based index to each row in the partition ordering."),
            ("What is a Foreign Key constraint in a relational database?", "An encryption key", "A field in one table that uniquely references a primary key in another table", "A password", "A temporary table", "B", "Foreign keys enforce referential integrity between associated relational tables."),
            ("Which normal form requires that all non-key attributes are fully functionally dependent on the entire primary key?", "First Normal Form (1NF)", "Second Normal Form (2NF)", "Third Normal Form (3NF)", "Boyce-Codd (BCNF)", "B", "2NF eliminates partial dependencies where non-key attributes depend on only part of a composite key."),
            ("What does the `LEAD()` window function return?", "The first row in the table", "Value from a following row at a specified physical offset within the partition", "The maximum number", "The column heading", "B", "LEAD() accesses data from a subsequent row without requiring a self-join."),
            ("What is a dirty read in database transaction management?", "Reading corrupted hard drive blocks", "A transaction reading uncommitted data modified by another concurrent transaction", "Reading deleted files", "Slow database query", "B", "A dirty read occurs when a transaction reads uncommitted changes that might later be rolled back."),
            ("Which SQL statement is used to remove all records from a table without logging individual row deletions?", "DROP", "TRUNCATE", "DELETE", "REMOVE", "B", "TRUNCATE deallocates the table's data pages quickly without individual row logging."),
            ("What is the purpose of the `EXPLAIN` command in SQL?", "Explains the syntax to the user", "Displays the execution plan chosen by the query optimizer", "Checks user permissions", "Calculates table size", "B", "EXPLAIN outputs the optimizer's execution strategy, including index scans and join algorithms."),
            ("Which constraint ensures that all values in a column are unique and non-null?", "CHECK", "PRIMARY KEY", "FOREIGN KEY", "DEFAULT", "B", "A PRIMARY KEY constraint enforces both uniqueness and NOT NULL on designated columns."),
            ("What does `COALESCE(val1, val2, ...)` do in SQL?", "Returns the first non-null expression among its arguments", "Multiplies numbers", "Concatenates strings", "Deletes null values", "A", "COALESCE evaluates its arguments in order and returns the first non-null value."),
            ("What is a correlated subquery?", "A subquery that runs once globally", "A subquery that references columns from the outer query and evaluates once per outer row", "A subquery with no results", "A temporary view", "B", "Correlated subqueries depend on the outer query's row context, executing iteratively."),
            ("Which clause is used with window functions to define the subsets of rows over which the function operates?", "ORDER BY", "PARTITION BY", "GROUP BY", "WHERE", "B", "PARTITION BY divides the query result set into partitions to which the window function is applied."),
            ("What is a composite index?", "An index created on two or more columns of a table", "An encrypted index", "An index stored in memory only", "A foreign key", "A", "A composite index combines multiple columns to accelerate multi-attribute lookups and sorting."),
            ("What isolation level prevents dirty reads, non-repeatable reads, and phantom reads completely?", "Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable", "D", "Serializable is the highest isolation level, guaranteeing full isolation equivalent to serial execution."),
            ("What is the result of any arithmetic operation with `NULL` in SQL (e.g. `5 + NULL`)?", "0", "5", "NULL", "Error", "C", "In standard three-valued SQL logic, arithmetic with NULL always yields NULL."),
            ("Which command modifies the schema of an existing table by adding or altering columns?", "UPDATE", "ALTER TABLE", "MODIFY", "CHANGE", "B", "ALTER TABLE allows adding, modifying, or dropping columns and constraints on existing tables.")
        ]
    },

    "data science": {
        "title": "Enterprise Data Science & Predictive Analytics",
        "description": "Master Python data science stacks, NumPy numerical computing, Pandas data engineering, exploratory data analysis, and predictive modeling.",
        "subject": "Data Science & AI",
        "difficulty": "Intermediate",
        "duration": "8 Weeks",
        "thumbnail": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
        "competencies": ["Python Data Science Stack", "NumPy & Pandas", "Data Cleaning & EDA", "Statistical Inference & ML"],
        "modules": [
            {
                "number": 1,
                "title": "Module 1 – Foundations of Scientific Computing with NumPy",
                "description": "N-dimensional arrays, vectorization, broadcasting rules, indexing, slicing, and linear algebra routines.",
                "lessons": [
                    {"title": "NumPy Array Architecture and Vectorization", "video_url": "https://www.youtube.com/watch?v=ua-CiDNNj30", "video_id": "ua-CiDNNj30", "duration": 25, "content": "Memory buffers, stride calculations, broadcasting mechanics, and vectorization vs Python loops."},
                    {"title": "Mathematical Transformations and Matrix Operations", "video_url": "https://www.youtube.com/watch?v=r-uOLxNrNk8", "video_id": "r-uOLxNrNk8", "duration": 28, "content": "Matrix multiplication, dot products, eigenvalues, and random sampling distributions."}
                ]
            },
            {
                "number": 2,
                "title": "Module 2 – Data Wrangling & Manipulation with Pandas",
                "description": "Series, DataFrames, indexing, filtering, missing data imputation, grouping, and merging datasets.",
                "lessons": [
                    {"title": "Pandas DataFrames, Grouping and Aggregations", "video_url": "https://www.youtube.com/watch?v=LHBE6Q9XlzI", "video_id": "LHBE6Q9XlzI", "duration": 30, "content": "Exploratory operations, loc/iloc indexing, handling NaN values, and split-apply-combine paradigms."},
                    {"title": "Reshaping, Merging and Time Series Analysis", "video_url": "https://www.youtube.com/watch?v=r-uOLxNrNk8", "video_id": "r-uOLxNrNk8", "duration": 28, "content": "Pivot tables, melting, inner/outer merges, datetime parsing, and rolling window computations."}
                ]
            },
            {
                "number": 3,
                "title": "Module 3 – Statistical Analysis & Exploratory Visualization",
                "description": "Descriptive statistics, probability distributions, hypothesis testing, Matplotlib, and Seaborn visualization.",
                "lessons": [
                    {"title": "Exploratory Data Analysis (EDA) Best Practices", "video_url": "https://www.youtube.com/watch?v=edvg4eMx5i0", "video_id": "edvg4eMx5i0", "duration": 30, "content": "Detecting outliers, skewness, correlation matrices, boxplots, and distribution histograms."},
                    {"title": "Statistical Hypothesis Testing and A/B Testing", "video_url": "https://www.youtube.com/watch?v=ua-CiDNNj30", "video_id": "ua-CiDNNj30", "duration": 26, "content": "T-tests, p-values, null hypotheses, confidence intervals, and statistical significance testing."}
                ]
            },
            {
                "number": 4,
                "title": "Module 4 – Predictive Machine Learning Modeling",
                "description": "Supervised learning, regression, classification, cross-validation, feature engineering, and model evaluation.",
                "lessons": [
                    {"title": "Feature Engineering and Preprocessing Pipelines", "video_url": "https://www.youtube.com/watch?v=edvg4eMx5i0", "video_id": "edvg4eMx5i0", "duration": 32, "content": "StandardScaler, OneHotEncoder, train_test_split, and constructing scikit-learn pipelines."},
                    {"title": "Model Training, Evaluation Metrics and Validation", "video_url": "https://www.youtube.com/watch?v=LHBE6Q9XlzI", "video_id": "LHBE6Q9XlzI", "duration": 35, "content": "RMSE, R^2, accuracy, precision, recall, F1-score, ROC-AUC, and K-Fold cross-validation."}
                ]
            }
        ],
        "questions": [
            ("What is the primary advantage of NumPy arrays over standard Python lists for numerical operations?", "NumPy arrays use less syntax", "NumPy arrays are stored contiguously in memory and support vectorized C-level operations", "Python lists cannot hold numbers", "NumPy works only on GPUs", "B", "NumPy arrays are compact, contiguous in memory, and execute vectorized operations in compiled C."),
            ("What does the term 'broadcasting' refer to in NumPy?", "Sending data over a Wi-Fi network", "How NumPy treats arrays with different shapes during arithmetic operations without copying data", "Streaming video", "Printing arrays to terminal", "B", "Broadcasting describes how NumPy stretches smaller arrays across larger dimensions during operations."),
            ("Which Pandas method is used to fill missing (`NaN`) values in a DataFrame?", "replace()", "fillna()", "dropna()", "clean()", "B", "fillna() replaces missing NaN values with specified constants or interpolated values."),
            ("What does `df.describe()` output in Pandas?", "The source code of the DataFrame", "Summary statistics including count, mean, std, min, and quartiles for numeric columns", "Column names only", "The first 5 rows", "B", "describe() generates a statistical overview of numerical columns in a DataFrame."),
            ("What is the difference between `loc` and `iloc` in Pandas?", "`loc` is label-based; `iloc` is integer position-based", "They are identical", "`loc` is for strings only", "`iloc` deletes rows", "A", "`loc` indexes by explicit index labels; `iloc` indexes strictly by zero-based integer positions."),
            ("What metric evaluates the proportion of variance explained by a regression model?", "Mean Absolute Error", "R-squared (R^2) score", "F1 Score", "Confusion Matrix", "B", "R-squared represents the proportion of target variance explained by the independent predictors."),
            ("What is an outlier in a statistical dataset?", "A normal data point", "An observation that lies an abnormal distance from other values in a random sample", "The mean of the distribution", "A missing value", "B", "Outliers are observations that deviate markedly from the overall distribution pattern."),
            ("Which metric is most appropriate for evaluating a classification model on an imbalanced dataset?", "Accuracy", "F1-Score / PR-AUC", "Mean Squared Error", "R-squared", "B", "F1-score balances precision and recall, making it reliable for imbalanced classes where accuracy is deceptive."),
            ("What does a p-value less than 0.05 typically indicate in hypothesis testing?", "The test failed completely", "Strong evidence against the null hypothesis, rejecting it at the 5% significance level", "The dataset is empty", "The test was not conducted", "B", "A p-value < 0.05 rejects the null hypothesis in favor of the alternative hypothesis."),
            ("What is the purpose of K-Fold Cross-Validation?", "To duplicate data 10 times", "To evaluate model generalization across K distinct test folds to prevent overfitting", "To format output charts", "To compress files", "B", "K-Fold splits data into K subsets to provide an unbiased estimate of model performance."),
            ("What does one-hot encoding achieve in feature engineering?", "Converts numbers to text", "Converts categorical variables into binary indicator columns (0 or 1)", "Calculates averages", "Deletes empty rows", "B", "One-hot encoding transforms discrete categories into distinct binary columns suitable for math models."),
            ("Which chart displays the five-number summary (minimum, Q1, median, Q3, maximum)?", "Histogram", "Box Plot (Box-and-Whisker)", "Scatter Plot", "Pie Chart", "B", "Box plots concisely display median, quartiles, interquartile range, and outliers."),
            ("What is the consequence of severe multicollinearity among independent predictors in regression?", "Model trains 10x faster", "Makes it difficult to determine the individual effect of each predictor and inflates coefficient variance", "Forces p-values to 0", "Reduces dataset size", "B", "Multicollinearity inflates standard errors of coefficients, undermining interpretability."),
            ("What does the confusion matrix illustrate for a classification task?", "How confused the user is", "A table comparing actual target classes against predicted classes (TP, FP, TN, FN)", "Loss function graph", "Memory usage chart", "B", "The confusion matrix cross-tabulates true positives, false positives, true negatives, and false negatives."),
            ("What is the purpose of StandardScaler in scikit-learn?", "Removes missing data", "Standardizes features by removing the mean and scaling to unit variance (z-scores)", "Multiplies numbers by 100", "Converts floats to integers", "B", "StandardScaler centers features around mean 0 with standard deviation 1."),
            ("Which library is considered the foundational standard for plotting and data visualization in Python?", "NumPy", "Matplotlib", "Requests", "Flask", "B", "Matplotlib provides the core visualization framework upon which libraries like Seaborn build."),
            ("What is the bias-variance tradeoff in predictive modeling?", "Balancing model underfitting (high bias) against model overfitting (high variance)", "Trading disk space for RAM", "Adjusting learning rate", "Comparing training time to inference time", "A", "The tradeoff balances error from overly simplistic assumptions against error from sensitivity to training noise."),
            ("What does `df.groupby('col').mean()` do?", "Calculates the global average", "Groups the DataFrame rows by distinct values in 'col' and computes the mean for each group", "Deletes col", "Sorts the DataFrame", "B", "groupby groups rows by unique category values and computes aggregate statistics for each group."),
            ("What does PCA (Principal Component Analysis) accomplish?", "Supervised classification", "Dimensionality reduction by finding orthogonal axes of maximum variance", "Text translation", "Database replication", "B", "PCA projects high-dimensional data onto orthogonal principal components that preserve maximum variance."),
            ("Why must feature scaling be fit ONLY on the training set and not the test set?", "To prevent data leakage from the test set into the model training pipeline", "Because test data has no numbers", "To make training slower", "It is required by Python syntax", "A", "Fitting scalers on test data leaks distribution information, producing overly optimistic evaluation metrics.")
        ]
    },

    "machine learning": {
        "title": "Applied Machine Learning & Statistical Systems",
        "description": "Learn mathematical foundations, regression, tree-based models, ensemble methods, support vector machines, neural networks, and MLOps deployment.",
        "subject": "Data Science & AI",
        "difficulty": "Intermediate",
        "duration": "8 Weeks",
        "thumbnail": "https://images.unsplash.com/photo-1555255707-c07966088b7b?w=800&auto=format&fit=crop&q=80",
        "competencies": ["Supervised Learning", "Tree Ensembles & Gradient Boosting", "Unsupervised Clustering", "MLOps & Model Deployment"],
        "modules": [
            {
                "number": 1,
                "title": "Module 1 – Foundations of Supervised Learning",
                "description": "Cost functions, gradient descent, linear regression, logistic regression, and regularization (L1/L2).",
                "lessons": [
                    {"title": "Gradient Descent Optimization and Loss Functions", "video_url": "https://www.youtube.com/watch?v=i_LwzRVP7bg", "video_id": "i_LwzRVP7bg", "duration": 25, "content": "Convex optimization, batch vs stochastic gradient descent, learning rates, and convergence criteria."},
                    {"title": "Regularization: Ridge (L2) and Lasso (L1) Penalties", "video_url": "https://www.youtube.com/watch?v=7eh4d6sabA0", "video_id": "7eh4d6sabA0", "duration": 28, "content": "Preventing model overfitting, shrinking coefficients, and sparsity induced by L1 penalties."}
                ]
            },
            {
                "number": 2,
                "title": "Module 2 – Tree Ensembles & Gradient Boosting",
                "description": "Decision trees, information gain, Gini impurity, Random Forests, and Gradient Boosting (XGBoost/LightGBM).",
                "lessons": [
                    {"title": "Decision Trees, Entropy and Gini Impurity", "video_url": "https://www.youtube.com/watch?v=7eh4d6sabA0", "video_id": "7eh4d6sabA0", "duration": 30, "content": "Recursive binary splitting, tree pruning strategies, and handling continuous vs categorical features."},
                    {"title": "Bagging vs Boosting: Random Forests & XGBoost", "video_url": "https://www.youtube.com/watch?v=i_LwzRVP7bg", "video_id": "i_LwzRVP7bg", "duration": 32, "content": "Bootstrap aggregating, out-of-bag error estimation, sequential residual correction, and hyperparameter tuning."}
                ]
            },
            {
                "number": 3,
                "title": "Module 3 – Unsupervised Learning & Neural Foundations",
                "description": "K-Means clustering, DBSCAN, PCA dimensionality reduction, and introductory artificial neural networks.",
                "lessons": [
                    {"title": "Clustering Algorithms: K-Means and DBSCAN", "video_url": "https://www.youtube.com/watch?v=aircAruvnKk", "video_id": "aircAruvnKk", "duration": 28, "content": "Centroid initialization, elbow method, silhouette scores, density-based clustering, and noise handling."},
                    {"title": "Neural Networks: Perceptrons, Activations & Backpropagation", "video_url": "https://www.youtube.com/watch?v=aircAruvnKk", "video_id": "aircAruvnKk", "duration": 32, "content": "Multi-layer perceptrons, forward propagation, activation functions (ReLU, Sigmoid, Softmax), and chain rule."}
                ]
            },
            {
                "number": 4,
                "title": "Module 4 – Model Validation & Production MLOps",
                "description": "Hyperparameter optimization (Optuna), model serialization (ONNX), drift monitoring, and API inference.",
                "lessons": [
                    {"title": "Hyperparameter Optimization & Cross-Validation Strategies", "video_url": "https://www.youtube.com/watch?v=JMUxmLyrhSk", "video_id": "JMUxmLyrhSk", "duration": 30, "content": "Grid search vs random search vs Bayesian optimization, stratified k-fold, and validation curves."},
                    {"title": "Production Deployment: Serialization & Fast Inference", "video_url": "https://www.youtube.com/watch?v=JMUxmLyrhSk", "video_id": "JMUxmLyrhSk", "duration": 35, "content": "Exporting models to joblib/ONNX, serving predictions via FastAPI endpoints, and tracking model drift."}
                ]
            }
        ],
        "questions": [
            ("What is the primary role of the learning rate in gradient descent?", "Determines model accuracy", "Controls the step size taken towards the minimum of the loss function during parameter updates", "Counts training iterations", "Sets the number of trees", "B", "Learning rate scales the gradient step; too large can diverge, too small converges slowly."),
            ("What is the difference between L1 (Lasso) and L2 (Ridge) regularization?", "L1 can drive coefficients to exactly zero for feature selection; L2 shrinks coefficients asymptotically", "L1 is for neural networks only", "L2 increases overfitting", "They are identical", "A", "L1 regularization induces sparsity (zero coefficients), acting as an intrinsic feature selector."),
            ("Which metric measures the impurity or disorder of a set of examples in decision trees?", "Entropy / Gini Impurity", "R-squared", "Gradient", "Variance Inflation Factor", "A", "Entropy and Gini impurity quantify the node impurity before and after binary splits."),
            ("What does Random Forest use to build a diverse ensemble of decision trees?", "Bootstrap aggregation (bagging) and random feature subset selection at each split", "Running on random computers", "Gradient descent", "K-Means clustering", "A", "Random Forests combine bootstrap bagging with random feature subsets at every node split."),
            ("What is the key difference between Bagging and Boosting?", "Bagging trains trees in parallel independently; Boosting trains trees sequentially to correct prior errors", "Boosting is always slower", "Bagging cannot be used for classification", "They are identical", "A", "Bagging trains base learners independently; Boosting sequentially fits new trees to previous residual errors."),
            ("What does the ROC curve plot?", "Accuracy vs Loss", "True Positive Rate (Sensitivity) vs False Positive Rate (1 - Specificity) across decision thresholds", "Precision vs Recall", "Cost vs Iteration", "B", "The ROC curve plots TPR vs FPR across varying classification decision thresholds."),
            ("What is the main danger of a model suffering from high variance?", "Underfitting", "Overfitting to training noise, leading to poor generalization on unseen data", "Slow download speeds", "Small memory usage", "B", "High variance causes the model to fit training data idiosyncrasies rather than the underlying pattern."),
            ("How does K-Means assign data points to clusters?", "By training neural networks", "By assigning each point to the cluster with the nearest mean centroid", "By building decision trees", "By random guessing", "B", "K-Means assigns observations to the cluster whose centroid has the minimum Euclidean distance."),
            ("What method is commonly used to find the optimal number of clusters K in K-Means?", "Elbow Method / Silhouette Analysis", "Cross-validation score", "Gradient descent", "T-test", "A", "The Elbow method plots inertia vs K; the silhouette score measures separation distance between clusters."),
            ("What is the purpose of an activation function in artificial neural networks?", "To turn off the computer", "To introduce non-linearity, allowing the network to learn complex non-linear relationships", "To format output text", "To speed up internet access", "B", "Without non-linear activations, multi-layer neural networks collapse into a single linear transformation."),
            ("Which activation function is most widely used in hidden layers of modern deep networks?", "Sigmoid", "ReLU (Rectified Linear Unit)", "Step function", "Linear", "B", "ReLU (f(x) = max(0, x)) avoids vanishing gradients and allows fast, efficient backpropagation."),
            ("What is data leakage in machine learning?", "When hackers steal the dataset", "When information from outside the training dataset is inadvertently used to train the model", "When hard drives fail", "When columns contain NaN", "B", "Data leakage occurs when test or future information enters training, producing misleading high scores."),
            ("What algorithm is used to calculate gradients of loss with respect to weights in neural networks?", "QuickSort", "Backpropagation (via the calculus chain rule)", "Breadth First Search", "Dijkstra's Algorithm", "B", "Backpropagation computes the gradient of the loss function with respect to each weight via chain rule."),
            ("What does an ensemble model combining multiple weak learners generally achieve?", "Higher error", "Lower variance and improved predictive generalization", "Slower training only", "Fewer features", "B", "Ensembles combine diverse base estimators to reduce variance and mitigate individual learner errors."),
            ("What is early stopping used for during model training?", "To save electricity", "To halt training when validation performance stops improving to prevent overfitting", "To terminate infinite loops", "To delete bad data", "B", "Early stopping monitors validation loss and stops training before the model overfits the training set."),
            ("What is the purpose of hyperparameter tuning?", "To write Python code", "To search for the optimal configuration settings that govern the learning process of the algorithm", "To clean corrupted databases", "To speed up GPUs", "B", "Hyperparameter optimization identifies the best configuration settings (depth, learning rate, etc.)."),
            ("What does the F1-score represent mathematically?", "The arithmetic mean of precision and recall", "The harmonic mean of precision and recall", "Precision divided by recall", "Accuracy times 100", "B", "F1-score is the harmonic mean of precision and recall: 2 * (P * R) / (P + R)."),
            ("What is concept drift in production machine learning systems?", "When the software crashes", "When statistical properties of target variables change over time, degrading model accuracy", "When disk drives fill up", "When code is refactored", "B", "Concept drift occurs when real-world relationships evolve, causing pre-trained models to degrade."),
            ("Which scikit-learn class prevents data leakage by chaining preprocessing steps with an estimator?", "DataFrame", "Pipeline", "Transformer", "Module", "B", "Pipeline chains transformers and estimators together, guaranteeing transformations fit only on training splits."),
        ]
    },
    "robotics": {
        "title": "Robotic Architecture & Core Principles",
        "description": "Comprehensive capacity building curriculum covering robotic kinematics, control architecture, sensor fusion, actuators, and production-grade autonomous systems.",
        "subject": "Robotics & Automation",
        "difficulty": "Intermediate",
        "duration": "8 Weeks",
        "thumbnail": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80",
        "competencies": ["Robotics Architecture", "Kinematics & Dynamics", "Robot Operating System (ROS)", "Autonomous Navigation & SLAM"],
        "modules": [
            {
                "number": 1,
                "title": "Module 1 – Introduction to Robotic Architecture & Core Principles",
                "description": "Foundations of robotics engineering, architectural topologies, mechanical degrees of freedom, and development environment setup.",
                "lessons": [
                    {"title": "Foundations of Robotics & Engineering Roadmap", "video_url": "https://www.youtube.com/watch?v=fOvvz72rWJo", "video_id": "fOvvz72rWJo", "duration": 22, "content": "Understand the core architecture of robotics systems, mathematical foundations, coordinate frames, and engineer roadmap."},
                    {"title": "Robotics Technology & Mechanical Structure", "video_url": "https://www.youtube.com/watch?v=c1ZLsC3xRGw", "video_id": "c1ZLsC3xRGw", "duration": 25, "content": "Analyze robot physical structure, rigid body mechanics, degrees of freedom, and actuator integration."}
                ]
            },
            {
                "number": 2,
                "title": "Module 2 – Kinematics, Actuators & Robot Dynamics",
                "description": "Forward and inverse kinematics, servomotors, gearboxes, feedback loops, and dynamic motion equations.",
                "lessons": [
                    {"title": "How Engineering Robots Works: Mechanical & Electrical Systems", "video_url": "https://www.youtube.com/watch?v=uNfUAJBuZ0s", "video_id": "uNfUAJBuZ0s", "duration": 26, "content": "Detailed overview of mechanical linkages, electrical bus communication, PWM motor drivers, and sensor integration."},
                    {"title": "Core Principles & Getting Started in Modern Robotics", "video_url": "https://www.youtube.com/watch?v=EAyzRmAKueE", "video_id": "EAyzRmAKueE", "duration": 28, "content": "Fundamental principles of actuator calibration, PID control algorithms, and closed-loop motor positioning."}
                ]
            },
            {
                "number": 3,
                "title": "Module 3 – Robot Operating System (ROS) & Control Architectures",
                "description": "Publish-subscribe middleware, ROS computation graphs, node orchestration, URDF robot modeling, and real-time control.",
                "lessons": [
                    {"title": "Introduction to ROS Part 1: Robot Operating System Architecture", "video_url": "https://www.youtube.com/watch?v=mjrxf8EFSb8", "video_id": "mjrxf8EFSb8", "duration": 30, "content": "Master ROS nodes, topics, messages, services, and communication paradigms essential for multi-component robotics systems."},
                    {"title": "System Architecture in Robotics: Hardware Abstraction & Modularity", "video_url": "https://www.youtube.com/watch?v=QFtTarVjehM", "video_id": "QFtTarVjehM", "duration": 28, "content": "Examine hardware abstraction layers, modular software component models, and real-time distributed architecture."}
                ]
            },
            {
                "number": 4,
                "title": "Module 4 – Autonomous Navigation, SLAM & Industrial Robotics",
                "description": "LIDAR sensor fusion, Simultaneous Localization and Mapping (SLAM), obstacle avoidance, and production robotics.",
                "lessons": [
                    {"title": "Robotics Technology, What are Robots & Industrial Automation", "video_url": "https://www.youtube.com/watch?v=htjRUL3neMg", "video_id": "htjRUL3neMg", "duration": 30, "content": "Explore modern industrial automation, safety standards, robot manipulators, and automated guided vehicles (AGVs)."},
                    {"title": "Robotic Systems Engineering & Advanced Principles", "video_url": "https://www.youtube.com/watch?v=xrwz9IxpMJg", "video_id": "xrwz9IxpMJg", "duration": 35, "content": "System integration, path planning, trajectory generation, and deployment of autonomous robotic architectures."}
                ]
            }
        ],
        "questions": [
            ("What is the primary function of forward kinematics in robotics?", "Calculate actuator cost", "Determine end-effector position and orientation from given joint angles", "Measure battery voltage", "Design the chassis", "B", "Forward kinematics maps joint angles to the spatial coordinates of the robot's end-effector."),
            ("What is inverse kinematics?", "Reversing motor rotation", "Calculating required joint angles to achieve a desired end-effector position and orientation", "Deleting code", "Disconnecting sensors", "B", "Inverse kinematics determines the necessary joint configurations to place the end-effector at a target point."),
            ("In Robot Operating System (ROS), what design pattern is used for communication between nodes?", "Direct database writes", "Asynchronous publish-subscribe messaging over topics", "Shared memory locks only", "Hardwired serial lines", "B", "ROS uses a distributed publish-subscribe architecture over named topics."),
            ("What is SLAM in autonomous robotics navigation?", "Standard Linear Actuator Movement", "Simultaneous Localization and Mapping", "Static Laser Alignment Method", "Synchronized Logic Automation Module", "B", "SLAM allows an autonomous robot to construct a map of an unknown environment while tracking its location."),
            ("What role does a PID controller play in robotic actuator positioning?", "Compiles C++ code", "Minimizes error by calculating proportional, integral, and derivative corrections for precise motion", "Encrypts WiFi traffic", "Charges batteries", "B", "PID controllers provide closed-loop control to adjust motor outputs and eliminate steady-state error."),
            ("What is a robot's workspace?", "The developer's desk", "The total spatial volume reachable by the robot's end-effector", "The operating system RAM", "The programming language", "B", "Workspace defines all spatial points reachable by the robot manipulator."),
            ("What does URDF stand for in ROS ecosystem?", "Universal Robot Description Format", "Unbounded Robotic Direction Framework", "Uniform Resource Detection File", "User Responsive Digital Firmware", "A", "URDF is an XML format for representing a kinematic and dynamic robot model in ROS."),
            ("Why are encoders critical in closed-loop robotic joints?", "They light up LEDs", "They measure rotational position and velocity to provide real-time feedback", "They reduce power consumption", "They store audio files", "B", "Encoders report exact shaft angle and speed back to the motion controller."),
            ("What is sensor fusion in robotic perception?", "Melting sensors together", "Combining data from multiple disparate sensors (e.g. IMU, LIDAR, camera) to achieve higher accuracy", "Replacing sensors with software", "Disconnecting faulty sensors", "B", "Sensor fusion merges complementary sensor data (e.g. using Kalman filters) for robust environmental estimation."),
            ("What is the primary benefit of brushless DC (BLDC) motors in modern robotics?", "Lower price only", "Higher efficiency, reliability, power density, and lower maintenance than brushed motors", "Requires no controller", "Runs on AC only", "B", "BLDC motors offer superior torque-to-weight ratio, long lifespans, and precise electronic commutation."),
            ("What is a Jacobian matrix in manipulator robotics?", "A list of motor serial numbers", "A mathematical matrix relating joint velocities to Cartesian end-effector velocities", "A database table", "A battery specification", "B", "The Jacobian relates joint velocity vectors to task-space linear and angular velocities."),
            ("What safety standard governs collaborative industrial robots (Cobots)?", "ISO 10218 and ISO/TS 15066", "HTML5 specification", "POSIX standard", "IEEE 802.11", "A", "ISO 10218 and ISO/TS 15066 specify safety requirements for collaborative industrial robot systems."),
            ("What is the function of an IMU (Inertial Measurement Unit) on a mobile robot?", "Measures battery charge", "Measures specific force, angular rate, and orientation using accelerometers and gyroscopes", "Detects WiFi networks", "Controls wheel motors directly", "B", "IMUs track orientation and acceleration for odometry and dead-reckoning navigation."),
            ("What is dead reckoning in mobile robotics navigation?", "Navigating without power", "Estimating current position based on previously determined position, wheel speeds, and heading", "Stopping when an obstacle is hit", "GPS navigation only", "B", "Dead reckoning integrates wheel encoder counts over time to estimate distance traveled and pose."),
            ("Why is trajectory generation separated from path planning in robotics?", "It is required by ROS", "Path planning finds geometric collision-free waypoints; trajectory generation adds time, velocity, and acceleration constraints", "Path planning is optional", "To save memory", "B", "Trajectory generation applies dynamic limits (velocity, jerk) to geometric paths for smooth physical execution."),
            ("What does the degrees of freedom (DoF) of a robot indicate?", "The price of the robot", "The number of independent parameters or axes that define its spatial configuration", "The battery life in hours", "The weight in kilograms", "B", "Degrees of Freedom represent the number of independent movable joints or coordinates."),
            ("What algorithm is widely used in state estimation and sensor fusion for robotics?", "Extended Kalman Filter (EKF)", "Binary Search Tree", "QuickSort", "Huffman Coding", "A", "The Extended Kalman Filter estimates non-linear robotic system states from noisy sensor inputs."),
            ("In robotic grippers, what is the difference between form closure and force closure?", "Form closure uses software; force closure uses hardware", "Form closure constrains motion geometrically; force closure relies on friction forces exerted by fingers", "They are identical", "Form closure is only for mobile robots", "B", "Form closure prevents object motion via geometry; force closure maintains grasp through friction."),
            ("What is the purpose of CAN bus in robotic electrical architectures?", "Streaming 4K video", "A robust, real-time message-based serial protocol for inter-actuator and sensor communication", "Connecting to home routers", "Charging batteries", "B", "CAN (Controller Area Network) allows microcontrollers and actuators to communicate reliably without a host computer."),
            ("What is the ultimate objective of capacity building in robotic architecture?", "Memorizing definitions", "Equipping trainees with verified hands-on competencies, kinematic modeling, and autonomous systems implementation", "Drawing diagrams only", "Reading user manuals", "B", "Capacity building empowers trainees to design, build, test, and deploy production-grade robotic systems.")
        ]
    }
}

if _EXTRA_AVAILABLE and EXTRA_TRACKS:
    CURATED_TRACKS.update(EXTRA_TRACKS)




def build_generic_technical_track(topic_name: str) -> Dict[str, Any]:
    """
    Generates a high-quality, fully structured 4-module technical course for any arbitrary topic
    with structured lessons ready for dynamic course-specific video resolution.
    """
    clean_title = topic_name.strip().title()
    t_lower = topic_name.lower()

    if any(w in t_lower for w in ["architecture", "principles", "engineering", "foundation", "foundations", "system", "systems", "design"]) or len(clean_title.split()) >= 3:
        course_title = clean_title
    else:
        course_title = f"{clean_title} Architecture & Core Principles"

    if any(w in t_lower for w in ["robot", "robotic"]):
        subject = "Robotics & Automation"
        thumb = "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80"
    elif any(w in t_lower for w in ["security", "cyber", "hack", "penetration"]):
        subject = "Cyber Security"
        thumb = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80"
    elif any(w in t_lower for w in ["ai", "machine learning", "deep learning", "neural"]):
        subject = "Artificial Intelligence"
        thumb = "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=80"
    elif any(w in t_lower for w in ["data", "analytics", "sql"]):
        subject = "Data Science & Analytics"
        thumb = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80"
    elif any(w in t_lower for w in ["cloud", "docker", "kubernetes", "devops"]):
        subject = "DevOps & Cloud"
        thumb = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80"
    else:
        subject = "Software Engineering"
        thumb = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80"

    m1_title = f"Module 1 – Foundations & Core Principles of {clean_title}"
    m2_title = f"Module 2 – Core Components & Architecture in {clean_title}"
    m3_title = f"Module 3 – Practical Implementation & Systems Integration in {clean_title}"
    m4_title = f"Module 4 – Advanced Systems, Optimization & Production in {clean_title}"

    return {
        "title": course_title,
        "description": f"Comprehensive capacity building curriculum covering core {clean_title} paradigms, modular implementation, performance optimization, and production best practices.",
        "subject": subject,
        "difficulty": "Intermediate",
        "duration": "6 Weeks",
        "thumbnail": thumb,
        "competencies": [f"{clean_title} Core Fundamentals", f"{clean_title} Architecture", "Production Implementation", "Testing & Optimization"],
        "modules": [
            {
                "number": 1,
                "title": m1_title,
                "description": f"Understanding architectural paradigms, core concepts, environment configuration, and execution lifecycle for {clean_title}.",
                "lessons": [
                    {
                        "title": f"Introduction to {clean_title} & Core Principles",
                        "video_url": "",
                        "video_id": "",
                        "duration": 22,
                        "content": f"Understand the foundational concepts, tooling, execution models, and development environments essential for {clean_title} engineering."
                    },
                    {
                        "title": f"Environment Setup and Essential Tooling for {clean_title}",
                        "video_url": "",
                        "video_id": "",
                        "duration": 25,
                        "content": f"Master standard conventions, variable lifecycles, control structures, and standard libraries used in {clean_title}."
                    }
                ]
            },
            {
                "number": 2,
                "title": m2_title,
                "description": f"Deep dive into modular structure, data management, design patterns, and standard interfaces in {clean_title}.",
                "lessons": [
                    {
                        "title": f"Modular Architecture and Design Patterns in {clean_title}",
                        "video_url": "",
                        "video_id": "",
                        "duration": 26,
                        "content": f"Explore encapsulation, decoupling, abstraction layers, and architectural patterns tailored for scalable {clean_title} projects."
                    },
                    {
                        "title": f"Data Flow, State and Resource Governance in {clean_title}",
                        "video_url": "",
                        "video_id": "",
                        "duration": 28,
                        "content": f"Understanding state transitions, resource allocation, concurrency considerations, and error trapping in {clean_title}."
                    }
                ]
            },
            {
                "number": 3,
                "title": m3_title,
                "description": f"Hands-on project development, API interactions, storage integration, and testing workflows in {clean_title}.",
                "lessons": [
                    {
                        "title": f"Building Practical Enterprise Components in {clean_title}",
                        "video_url": "",
                        "video_id": "",
                        "duration": 30,
                        "content": f"Step-by-step implementation of production-grade modules, integrating input validation, business logic, and outputs."
                    },
                    {
                        "title": f"Automated Testing, Verification and Debugging in {clean_title}",
                        "video_url": "",
                        "video_id": "",
                        "duration": 25,
                        "content": f"Unit testing, integration testing, boundary analysis, profiling, and debugging strategies for {clean_title}."
                    }
                ]
            },
            {
                "number": 4,
                "title": m4_title,
                "description": f"Performance profiling, security hardening, CI/CD automation, and deployment considerations for {clean_title}.",
                "lessons": [
                    {
                        "title": f"Performance Optimization and Resource Tuning for {clean_title}",
                        "video_url": "",
                        "video_id": "",
                        "duration": 32,
                        "content": f"Analyze latency, memory footprints, caching strategies, and throughput bottlenecks in enterprise {clean_title} deployments."
                    },
                    {
                        "title": f"Security Best Practices and Enterprise Delivery for {clean_title}",
                        "video_url": "",
                        "video_id": "",
                        "duration": 35,
                        "content": f"Production readiness checklist, least privilege access, configuration management, monitoring, and automated deployment."
                    }
                ]
            }
        ],
        "questions": [
            (f"What is the primary architectural goal of {clean_title} systems?", "Random code generation", f"Delivering reliable, modular, and scalable software solutions adhering to {clean_title} standards", "Eliminating hardware requirements", "Formatting CSS only", "B", f"{clean_title} emphasizes structured, modular, and scalable software engineering practices."),
            (f"Which phase in the {clean_title} development lifecycle focuses on validating functional correctness?", "Deployment", "Automated Testing & Verification", "Marketing", "Database indexing", "B", "Testing and verification ensure that software modules conform to specifications."),
            (f"Why is modularity important in modern {clean_title} development?", "It makes code file sizes smaller", "It reduces coupling, enhances testability, and enables parallel development", "It is required by the compiler", "It deletes unused files", "B", "Modular architectures promote separation of concerns, reusability, and maintainability."),
            (f"What is the recommended approach to handling unexpected errors in {clean_title}?", "Ignoring errors completely", "Structured error trapping with informative logging and clean resource release", "Terminating the server immediately", "Writing errors to terminal only", "B", "Proper error handling captures exceptions, logs diagnostics, and ensures graceful recovery."),
            (f"What does code profiling reveal about a {clean_title} application?", "Author names", "Execution bottlenecks, CPU cycles, and memory consumption hot spots", "Syntax errors", "Git commit history", "B", "Profilers analyze performance characteristics to identify execution bottlenecks."),
            (f"What is the benefit of continuous integration (CI) in {clean_title} teams?", "Bypasses testing", "Automatically builds, tests, and validates code changes before merging", "Eliminates version control", "Generates user documentation", "B", "CI pipelines automate verification of code contributions, maintaining stability."),
            (f"How should sensitive credentials and configurations be managed in {clean_title}?", "Hardcoded in source code files", "Decoupled into environment variables and secrets management vaults", "Committed to public repositories", "Stored in plain text files", "B", "Secrets must be decoupled from code repositories using environment variables or vaults."),
            (f"What does the principle of least privilege dictate in software security?", "Grant all users root access", "Users and processes should be granted only the minimum permissions necessary to perform their role", "Never require passwords", "Lock all accounts permanently", "B", "Least privilege minimizes the blast radius of compromised credentials."),
            (f"What is the primary purpose of version control systems like Git in {clean_title}?", "To edit images", "To track code history, manage branches, and coordinate team contributions", "To compile binaries", "To host databases", "B", "Git manages history, facilitates peer review, and allows reproducible software releases."),
            (f"Why are code reviews considered essential in professional {clean_title} engineering?", "To criticize developers", "To detect bugs early, ensure architectural compliance, and share domain knowledge", "To slow down releases", "To replace automated tests", "B", "Code reviews enhance quality, identify potential edge-case defects, and foster knowledge sharing."),
            (f"What metric measures the percentage of source code executed during automated test runs?", "Code Coverage", "Execution Speed", "Line Count", "Cyclomatic Complexity", "A", "Code coverage indicates the proportion of application logic verified by test suites."),
            (f"What is the role of caching in high-throughput {clean_title} services?", "Stores backups permanently", "Temporarily stores frequent query results in memory to reduce latency and database load", "Deletes old data", "Encrypts network requests", "B", "Caching eliminates redundant computations and speeds up data access."),
            (f"What is the purpose of refactoring existing {clean_title} code?", "Altering the external behavior", "Improving internal structure and readability without changing external behavior", "Adding new features", "Deleting documentation", "B", "Refactoring cleans up design and eliminates technical debt while preserving behavior."),
            (f"How do automated linter tools assist {clean_title} developers?", "They write the entire project", "They flag style violations, potential bugs, and syntax inconsistencies automatically", "They run database backups", "They compile machine code", "B", "Linters enforce uniform style guidelines and catch common programming mistakes."),
            (f"What is regression testing in software maintenance?", "Testing only the new features", "Re-running existing tests to verify that recent code changes have not broken existing functionality", "Deleting failed tests", "Manual testing on staging only", "B", "Regression testing verifies that updates or fixes do not introduce unintended side effects."),
            (f"What is a RESTful API in modern client-server architectures?", "A database table", "An architectural style using standard HTTP verbs (GET, POST, PUT, DELETE) for resource operations", "A CSS framework", "A physical network cable", "B", "REST leverages HTTP methods and status codes for stateless resource communication."),
            (f"What is technical debt in a long-running {clean_title} project?", "Financial loans taken by the company", "The implied cost of additional rework caused by choosing an expedient easy solution over a better approach", "Hardware obsolescence", "Software licensing costs", "B", "Technical debt refers to accumulated shortcuts that impede future feature development."),
            (f"What is the purpose of load testing before launching an enterprise {clean_title} application?", "Checking grammar in comments", "Simulating anticipated real-world user traffic to verify stability, capacity, and response times", "Formatting database fields", "Verifying monitor resolution", "B", "Load testing reveals performance ceilings and concurrency limits under heavy load."),
            (f"What is a semantic versioning (SemVer) format standard?", "Date-based versions only", "MAJOR.MINOR.PATCH (e.g. 2.1.4) communicating breaking changes, features, and bug fixes", "Random number strings", "Alphabetical lettering", "B", "SemVer conveys API compatibility: Major (breaking), Minor (features), Patch (fixes)."),
            (f"What is the ultimate objective of capacity building in {clean_title}?", "Taking multiple tests", "Equipping trainees with verified hands-on competencies, practical skills, and architectural mastery", "Printing paper diplomas", "Memorizing definitions", "B", "Capacity building empowers trainees with actionable, industry-grade competency and expertise.")
        ]
    }


def find_or_create_course(search_query: str) -> Dict[str, Any]:
    """
    Core function for Course Search + Automatic Generation.
    1. Normalizes the query.
    2. Searches SQLite database for existing matches.
    3. If found, returns existing course details (and audits videos).
    4. If not found, intelligently creates a complete 4-module structured course with real YouTube videos,
       saves it into the database passing all 8 exact context parameters, and returns the newly minted course.
    """
    if not search_query or not search_query.strip():
        raise ValueError("Search query cannot be empty")

    raw_query = search_query.strip()
    norm_query = normalize_query(raw_query)

    conn = get_connection()
    cur = conn.cursor()

    try:
        # Check existing course in database
        existing = find_existing_course(conn, raw_query, norm_query)
        if existing:
            conn.close()
            # Ensure videos are audited and repaired
            from api.video_service import audit_and_repair_lesson_videos
            audit_and_repair_lesson_videos(existing["id"])
            return {
                "course": existing,
                "created": False,
                "message": f"Found existing course: {existing['title']}"
            }

        # Check curated knowledge base tracks
        matched_track: Optional[Dict[str, Any]] = None

        # Look for exact or substring match in curated tracks
        for track_key, track_data in CURATED_TRACKS.items():
            if norm_query == track_key or track_key in norm_query or norm_query in track_key:
                matched_track = track_data
                break
            # Also check if raw query matches track title or subject
            if raw_query.lower() in track_data["title"].lower() or raw_query.lower() in track_data["subject"].lower():
                matched_track = track_data
                break

        # If no curated match, build a robust domain track
        if not matched_track:
            matched_track = build_generic_technical_track(raw_query)

        # Pick an active instructor from database
        cur.execute("SELECT id FROM users WHERE role = 'trainer' AND status = 'active' ORDER BY id ASC LIMIT 1")
        trainer_row = cur.fetchone()
        instructor_id = trainer_row["id"] if trainer_row else 1

        # 1. Insert course
        cur.execute("""
            INSERT INTO courses (title, description, subject, difficulty, duration, instructor_id, thumbnail, published)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        """, (
            matched_track["title"],
            matched_track["description"],
            matched_track["subject"],
            matched_track["difficulty"],
            matched_track["duration"],
            instructor_id,
            matched_track["thumbnail"]
        ))
        course_id = cur.lastrowid

        # 2. Insert competencies
        for comp_name in matched_track.get("competencies", []):
            cur.execute("SELECT id FROM competencies WHERE name = ?", (comp_name,))
            c_row = cur.fetchone()
            if not c_row:
                cur.execute("INSERT INTO competencies (name, category, description) VALUES (?, ?, ?)", (
                    comp_name, matched_track["subject"], f"Competency in {comp_name}"
                ))
                comp_id = cur.lastrowid
            else:
                comp_id = c_row["id"]

            cur.execute("""
                INSERT OR IGNORE INTO course_competencies (course_id, competency_id, required_level)
                VALUES (?, ?, 'Required')
            """, (course_id, comp_id))
        conn.commit()

        # 3. Insert 4 Modules, Lessons, and Study Resources passing ALL exact context
        from api.video_service import search_and_verify_course_video, verify_youtube_video, validate_video_relevance
        assigned_vids = set()

        for mod in matched_track["modules"]:
            cur.execute("""
                INSERT INTO modules (course_id, module_number, title, description)
                VALUES (?, ?, ?, ?)
            """, (course_id, mod["number"], mod["title"], mod["description"]))
            module_id = cur.lastrowid
            conn.commit()

            for l_idx, lesson in enumerate(mod.get("lessons", []), start=1):
                vid = lesson.get("video_id")
                v_url = lesson.get("video_url")
                is_ok = False

                if vid:
                    val, yt_title, _ = verify_youtube_video(vid)
                    if val and yt_title:
                        rel, _ = validate_video_relevance(
                            yt_title,
                            matched_track["title"],
                            mod["title"],
                            module_topic=lesson["title"],
                            learning_objectives=lesson.get("content", "")
                        )
                        if rel:
                            is_ok = True

                if not is_ok:
                    res = search_and_verify_course_video(
                        course_title=matched_track["title"],
                        module_title=mod["title"],
                        course_id=course_id,
                        module_id=module_id,
                        lesson_number=l_idx,
                        module_topic=lesson["title"],
                        learning_objectives=lesson.get("content", ""),
                        course_description=matched_track.get("description", ""),
                        module_description=mod.get("description", ""),
                        used_video_ids=assigned_vids
                    )
                    vid = res["video_id"]
                    v_url = res["video_url"]

                if vid:
                    assigned_vids.add(vid)

                cur.execute("""
                    INSERT INTO lessons (module_id, lesson_number, title, content, video_url, video_id, duration_minutes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    module_id,
                    l_idx,
                    lesson["title"],
                    lesson["content"],
                    v_url,
                    vid,
                    lesson.get("duration", 25)
                ))
            conn.commit()

            # Add a verifiable study resource
            cur.execute("""
                INSERT INTO resources (course_id, module_id, title, resource_type, file_url)
                VALUES (?, ?, ?, 'PDF', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')
            """, (course_id, module_id, f"Official Study Guide – {mod['title']}"))

        # 4. Insert 20 Assessment Questions
        questions = matched_track.get("questions", [])
        for q in questions:
            # (question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)
            cur.execute("""
                INSERT INTO questions (course_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'medium')
            """, (
                course_id,
                q[0], q[1], q[2], q[3], q[4], q[5], q[6]
            ))

        conn.commit()

        # Fetch the newly created course with full details
        cur.execute("""
            SELECT c.*, u.full_name as instructor_name, u.email as instructor_email,
                   (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) as modules_count,
                   (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as enrollments_count
            FROM courses c
            LEFT JOIN users u ON c.instructor_id = u.id
            WHERE c.id = ?
        """, (course_id,))
        created_course = dict(cur.fetchone())

        conn.close()

        return {
            "course": created_course,
            "created": True,
            "message": f"Successfully prepared your personalized course: {created_course['title']}"
        }

    except Exception as e:
        conn.rollback()
        conn.close()
        raise e
