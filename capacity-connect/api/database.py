import os
import sqlite3
import json
import hashlib
import uuid
from datetime import datetime

def get_db_path():
    # If running in Vercel or read-only environment, fallback to /tmp
    if os.environ.get("VERCEL"):
        return "/tmp/capacity_connect.db"
    return os.environ.get("DATABASE_PATH", os.path.join(os.path.dirname(os.path.dirname(__file__)), "capacity_connect.db"))

def get_connection():
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def hash_password(password: str) -> str:
    salt = "cc_secure_salt_2026_"
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def init_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL CHECK(role IN ('trainee', 'trainer', 'admin')),
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'pending', 'deactivated')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trainee_profiles (
        user_id INTEGER PRIMARY KEY,
        phone TEXT,
        dob TEXT,
        gender TEXT,
        institution TEXT,
        department TEXT,
        year_of_study TEXT,
        qualification TEXT,
        work_experience TEXT,
        interests TEXT,
        skills TEXT,
        certificates TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trainer_profiles (
        user_id INTEGER PRIMARY KEY,
        phone TEXT,
        qualifications TEXT,
        work_experience TEXT,
        skills TEXT,
        subjects TEXT,
        specializations TEXT,
        certifications TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        subject TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        duration TEXT NOT NULL,
        instructor_id INTEGER,
        thumbnail TEXT,
        published INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (instructor_id) REFERENCES users (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        module_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        module_id INTEGER NOT NULL,
        lesson_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        video_url TEXT,
        video_id TEXT,
        duration_minutes INTEGER DEFAULT 15,
        FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active',
        UNIQUE(user_id, course_id),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS learning_path_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        module_id INTEGER NOT NULL,
        completed INTEGER DEFAULT 0,
        completed_at DATETIME,
        UNIQUE(user_id, module_id),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
        FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        module_id INTEGER,
        title TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        file_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
        FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        module_id INTEGER,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        explanation TEXT,
        difficulty TEXT DEFAULT 'medium',
        topic TEXT,
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assessment_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        attempt_number INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        correct_answers INTEGER NOT NULL,
        score_percentage REAL NOT NULL,
        time_taken_seconds INTEGER NOT NULL,
        question_ids TEXT NOT NULL,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        certificate_id TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        instructor_name TEXT,
        verification_hash TEXT NOT NULL,
        UNIQUE(user_id, course_id),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        overall_rating INTEGER NOT NULL,
        content_quality INTEGER NOT NULL,
        trainer_quality INTEGER NOT NULL,
        learning_resources INTEGER NOT NULL,
        assessment_quality INTEGER NOT NULL,
        comments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, course_id),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS questionnaires (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trainer_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        subject TEXT NOT NULL,
        deadline DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trainer_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS questionnaire_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        questionnaire_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        FOREIGN KEY (questionnaire_id) REFERENCES questionnaires (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS questionnaire_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        questionnaire_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        answers TEXT NOT NULL,
        score REAL NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(questionnaire_id, user_id),
        FOREIGN KEY (questionnaire_id) REFERENCES questionnaires (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trainer_library (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trainer_id INTEGER NOT NULL,
        course_id INTEGER,
        module_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        resource_type TEXT NOT NULL,
        file_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trainer_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        target_role TEXT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'published',
        target_audience TEXT DEFAULT 'all',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        metric TEXT NOT NULL,
        recipient TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS learning_content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        media_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS competencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        description TEXT
    );

    CREATE TABLE IF NOT EXISTS course_competencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        competency_id INTEGER NOT NULL,
        required_level TEXT DEFAULT 'Intermediate',
        UNIQUE(course_id, competency_id),
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
        FOREIGN KEY (competency_id) REFERENCES competencies (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trainer_competencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trainer_id INTEGER NOT NULL,
        competency_id INTEGER NOT NULL,
        proficiency_level TEXT DEFAULT 'Advanced',
        UNIQUE(trainer_id, competency_id),
        FOREIGN KEY (trainer_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (competency_id) REFERENCES competencies (id) ON DELETE CASCADE
    );
    """)

    seed_default_data(conn)
    conn.commit()
    conn.close()

def seed_default_data(conn):
    cur = conn.cursor()
    # Check if admin exists
    cur.execute("SELECT id FROM users WHERE email = 'admin@capacityconnect.org'")
    if cur.fetchone():
        return  # Already seeded

    # 1. Admin User
    admin_pw = hash_password("Admin@12345")
    cur.execute("""
        INSERT INTO users (full_name, email, password_hash, phone, role, status)
        VALUES ('System Administrator', 'admin@capacityconnect.org', ?, '+1 555-0199', 'admin', 'active')
    """, (admin_pw,))

    # 2. Trainers
    trainer_pw = hash_password("Trainer@123")
    trainers_data = [
        (
            'Dr. Sarah Jenkins',
            'trainer.sarah@capacityconnect.org',
            trainer_pw,
            '+1 555-0101',
            'trainer',
            'active',
            'Ph.D. in Computer Science, Stanford University',
            '12 years in Software Engineering & Technical Education',
            json.dumps(["Python basics", "Functions", "OOP", "Data structures", "FastAPI", "Database design"]),
            json.dumps(["Python Programming", "Backend Architecture", "Data Science"]),
            json.dumps(["Backend Systems", "Distributed Architecture"]),
            json.dumps(["AWS Certified Solutions Architect", "Google Professional Cloud Developer"])
        ),
        (
            'David Kim',
            'trainer.david@capacityconnect.org',
            trainer_pw,
            '+1 555-0102',
            'trainer',
            'active',
            'M.S. in Human-Computer Interaction, CMU',
            '8 years Frontend Engineering Lead',
            json.dumps(["React", "TypeScript", "Tailwind CSS", "UI/UX Architecture", "State Management", "Web Performance"]),
            json.dumps(["Frontend Web Development", "Interactive UI Systems"]),
            json.dumps(["Component Design Systems", "Frontend Optimization"]),
            json.dumps(["Meta Front-End Developer Certified", "Scrum Master"])
        ),
        (
            'Elena Rostova',
            'trainer.elena@capacityconnect.org',
            trainer_pw,
            '+1 555-0103',
            'trainer',
            'active',
            'M.S. in Information Security, Georgia Tech',
            '10 years Cyber Risk & Enterprise Security Consultant',
            json.dumps(["Network Security", "Cryptography", "Penetration Testing", "Security Compliance", "Threat Modeling"]),
            json.dumps(["Cyber Security Operations", "Ethical Hacking"]),
            json.dumps(["Zero Trust Architecture", "Incident Response"]),
            json.dumps(["CISSP", "CEH (Certified Ethical Hacker)"])
        )
    ]

    trainer_ids = {}
    for t in trainers_data:
        cur.execute("""
            INSERT INTO users (full_name, email, password_hash, phone, role, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (t[0], t[1], t[2], t[3], t[4], t[5]))
        t_id = cur.lastrowid
        trainer_ids[t[1]] = t_id
        cur.execute("""
            INSERT INTO trainer_profiles (user_id, phone, qualifications, work_experience, skills, subjects, specializations, certifications)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (t_id, t[3], t[6], t[7], t[8], t[9], t[10], t[11]))

    # 3. Default Trainee
    trainee_pw = hash_password("Trainee@123")
    cur.execute("""
        INSERT INTO users (full_name, email, password_hash, phone, role, status)
        VALUES ('Alex Rivera', 'trainee.alex@capacityconnect.org', ?, '+1 555-0144', 'trainee', 'active')
    """, (trainee_pw,))
    alex_id = cur.lastrowid
    cur.execute("""
        INSERT INTO trainee_profiles (user_id, phone, dob, gender, institution, department, year_of_study, qualification, work_experience, interests, skills, certificates)
        VALUES (?, '+1 555-0144', '2002-05-18', 'Female', 'Metropolitan Institute of Technology', 'Computer Science & Eng', '4th Year', 'B.Tech CS Candidate', '6 Months Software Intern at FinTech Labs', 'Cloud Computing, Web Systems, AI Applications', 'Python, JavaScript, HTML/CSS, Git', '[]')
    """, (alex_id,))

    # 4. Competencies Master List
    competency_names = [
        ("Python basics", "Programming", "Foundational Python syntax, control flows, and data structures"),
        ("Functions", "Programming", "Modular code writing, parameter passing, closures, lambda expressions"),
        ("OOP", "Software Design", "Object Oriented Programming, inheritance, polymorphism, encapsulation"),
        ("Data structures", "Computer Science", "Arrays, hash tables, linked lists, trees, complexity analysis"),
        ("React", "Frontend", "Component architecture, hooks, JSX, virtual DOM"),
        ("TypeScript", "Frontend", "Type annotations, interfaces, generics, TypeScript tooling"),
        ("Tailwind CSS", "Frontend", "Utility-first modern CSS framework and responsive layout styling"),
        ("State Management", "Frontend", "Context API, global state handling, lifecycle optimization"),
        ("Network Security", "Security", "OSI model protocols, packet inspection, firewalls, TLS/SSL"),
        ("Cryptography", "Security", "Symmetric and asymmetric encryption, hashing, digital signatures"),
        ("Penetration Testing", "Security", "Vulnerability assessment, ethical exploits, mitigation protocols"),
        ("Cloud Architecture", "Cloud", "Virtual machines, serverless, microservices, containerization"),
        ("CI/CD Automation", "DevOps", "Pipelines, automated testing, continuous deployment"),
        ("Database design", "Data", "Relational modeling, indexing, normalization, ACID compliance")
    ]
    comp_ids = {}
    for c_name, c_cat, c_desc in competency_names:
        cur.execute("INSERT INTO competencies (name, category, description) VALUES (?, ?, ?)", (c_name, c_cat, c_desc))
        comp_ids[c_name] = cur.lastrowid

    # Assign Trainer Competencies
    sarah_skills = ["Python basics", "Functions", "OOP", "Data structures", "Database design"]
    for s in sarah_skills:
        if s in comp_ids:
            cur.execute("INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 'Expert')", (trainer_ids['trainer.sarah@capacityconnect.org'], comp_ids[s]))

    david_skills = ["React", "TypeScript", "Tailwind CSS", "State Management"]
    for s in david_skills:
        if s in comp_ids:
            cur.execute("INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 'Expert')", (trainer_ids['trainer.david@capacityconnect.org'], comp_ids[s]))

    elena_skills = ["Network Security", "Cryptography", "Penetration Testing"]
    for s in elena_skills:
        if s in comp_ids:
            cur.execute("INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level) VALUES (?, ?, 'Expert')", (trainer_ids['trainer.elena@capacityconnect.org'], comp_ids[s]))

    # 5. Standard Courses (each with exactly 4 modules)
    courses_seed = [
        {
            "title": "Python for Enterprise Systems",
            "description": "Master core Python programming, object-oriented concepts, robust data structures, and enterprise backend engineering.",
            "subject": "Backend Development",
            "difficulty": "Intermediate",
            "duration": "8 Weeks",
            "instructor_id": trainer_ids['trainer.sarah@capacityconnect.org'],
            "thumbnail": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
            "competencies": ["Python basics", "Functions", "OOP", "Data structures"],
            "modules": [
                {
                    "number": 1,
                    "title": "Module 1: Python Core Foundations & Control Structures",
                    "description": "Syntax fundamentals, variable scoping, conditionals, iterations, and standard library data collections.",
                    "lessons": [
                        {"title": "Introduction to Python Environment & Execution Flow", "video_url": "https://www.youtube.com/watch?v=kqtD5dpn9C8", "video_id": "kqtD5dpn9C8", "duration": 20, "content": "Understand Python bytecode, interpreter setup, virtual environments, variables, data types, and expressions."},
                        {"title": "Flow Control, Loops and Error Trapping", "video_url": "https://www.youtube.com/watch?v=6iF8Xb7Z3wQ", "video_id": "6iF8Xb7Z3wQ", "duration": 25, "content": "Master if-elif-else branching, for/while loops, comprehension expressions, and try-except blocks."}
                    ]
                },
                {
                    "number": 2,
                    "title": "Module 2: Modular Programming & Advanced Functions",
                    "description": "Function definitions, args/kwargs, scope closures, decorators, lambda functions, and generator pipelines.",
                    "lessons": [
                        {"title": "Functional Patterns and Closures", "video_url": "https://www.youtube.com/watch?v=swU3S26dQb0", "video_id": "swU3S26dQb0", "duration": 22, "content": "Deep dive into first-class citizens, closure scopes, decorator wrappers, and memoization."},
                        {"title": "Generators, Iterables and Memory Optimization", "video_url": "https://www.youtube.com/watch?v=bD05uGo_sVI", "video_id": "bD05uGo_sVI", "duration": 28, "content": "How yield works, generator expressions, memory footprint benchmarking in large data streams."}
                    ]
                },
                {
                    "number": 3,
                    "title": "Module 3: Object-Oriented Architecture in Python",
                    "description": "Classes, inheritance patterns, dunder methods, metaclasses, and SOLID principles in Python.",
                    "lessons": [
                        {"title": "Classes, Polymorphism & Encapsulation", "video_url": "https://www.youtube.com/watch?v=JeznW_7DlB0", "video_id": "JeznW_7DlB0", "duration": 30, "content": "Constructors, instance vs class state, method resolution order (MRO), and composition."},
                        {"title": "Special Dunder Methods and Context Managers", "video_url": "https://www.youtube.com/watch?v=3ohzBxoFHAY", "video_id": "3ohzBxoFHAY", "duration": 25, "content": "Overriding magic methods (__repr__, __enter__, __exit__) to create clean Pythonic context managers."}
                    ]
                },
                {
                    "number": 4,
                    "title": "Module 4: Enterprise Data Structures & Algorithmic Design",
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
        {
            "title": "Modern React & TypeScript Architecture",
            "description": "Construct scalable, performant frontend applications using React 18, TypeScript strict typing, Tailwind CSS, and state management patterns.",
            "subject": "Frontend Development",
            "difficulty": "Intermediate",
            "duration": "6 Weeks",
            "instructor_id": trainer_ids['trainer.david@capacityconnect.org'],
            "thumbnail": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80",
            "competencies": ["React", "TypeScript", "Tailwind CSS", "State Management"],
            "modules": [
                {
                    "number": 1,
                    "title": "Module 1: React 18 Core Architecture & Hooks",
                    "description": "Reconciliation engine, JSX compilation, useState, useEffect, and custom hook lifecycle.",
                    "lessons": [
                        {"title": "React 18 Fiber Reconciliation & Virtual DOM", "video_url": "https://www.youtube.com/watch?v=bMknfKXIFA8", "video_id": "bMknfKXIFA8", "duration": 20, "content": "Explore Fiber tree, work-in-progress nodes, commit phase, and concurrent rendering."},
                        {"title": "Mastering Custom Hooks & Effect Management", "video_url": "https://www.youtube.com/watch?v=6ThXsUwLWvc", "video_id": "6ThXsUwLWvc", "duration": 25, "content": "Rules of hooks, dependency arrays, cleanup functions, and composable business logic extraction."}
                    ]
                },
                {
                    "number": 2,
                    "title": "Module 2: Strict TypeScript for React Components",
                    "description": "Props interfaces, generic components, event typing, discriminated unions, and utility types.",
                    "lessons": [
                        {"title": "Type-Safe Props and Event Handlers", "video_url": "https://www.youtube.com/watch?v=ydkQlJhell8", "video_id": "ydkQlJhell8", "duration": 22, "content": "Typing React.FC, ComponentPropsWithoutRef, SyntheticEvents, and form interactions."},
                        {"title": "Generic Components and Discriminated Unions", "video_url": "https://www.youtube.com/watch?v=d56mG7DezGs", "video_id": "d56mG7DezGs", "duration": 26, "content": "Building flexible polymorphic components that guarantee compile-time safety across variants."}
                    ]
                },
                {
                    "number": 3,
                    "title": "Module 3: Utility-First UI with Tailwind CSS",
                    "description": "Responsive design, design tokens, custom configuration, dark mode, and micro-interactions.",
                    "lessons": [
                        {"title": "Design Systems & Tailwind Optimization", "video_url": "https://www.youtube.com/watch?v=pfaSUYaSgRo", "video_id": "pfaSUYaSgRo", "duration": 24, "content": "Setting up color tokens, typography scales, arbitrary values, and JIT compiler best practices."},
                        {"title": "Accessible Dynamic Components & Micro-interactions", "video_url": "https://www.youtube.com/watch?v=_9mTJ84uL1Q", "video_id": "_9mTJ84uL1Q", "duration": 28, "content": "Creating accessible modals, dropdowns, and responsive navigation bars with pure Tailwind utility classes."}
                    ]
                },
                {
                    "number": 4,
                    "title": "Module 4: Enterprise State Architecture & Performance",
                    "description": "Context API, memoization (useMemo, useCallback), code splitting, and web vitals optimization.",
                    "lessons": [
                        {"title": "Context vs External State Managers", "video_url": "https://www.youtube.com/watch?v=35lXWvCuM8o", "video_id": "35lXWvCuM8o", "duration": 30, "content": "Avoiding unnecessary re-renders in React Context through selective splitting and memoization."},
                        {"title": "React Profiling and Web Vitals Optimization", "video_url": "https://www.youtube.com/watch?v=QJaflt3XwQ8", "video_id": "QJaflt3XwQ8", "duration": 32, "content": "Using React DevTools Profiler, React.lazy, Suspense boundaries, and LCP/CLS optimizations."}
                    ]
                }
            ],
            "questions": [
                ("What does the dependency array in useEffect control?", "When the component mounts only", "When the effect re-runs based on changed values", "The render speed", "The component state types", "B", "The dependency array specifies which reactive values cause the effect to re-run when changed."),
                ("Why should keys in React lists be stable and unique?", "To style items", "To help React reconcile DOM nodes efficiently", "To assign database IDs", "To prevent TypeScript compile errors", "B", "Keys enable React to identify which items have changed, been added, or removed during reconciliation."),
                ("What is the TypeScript keyword used to construct a type consisting of all properties of T set to optional?", "Required<T>", "Partial<T>", "Readonly<T>", "Pick<T>", "B", "Partial<T> makes all properties in T optional."),
                ("How does useMemo differ from useCallback?", "useMemo caches a computed value; useCallback caches a function definition", "They are identical", "useMemo is for CSS", "useCallback runs asynchronously", "A", "useMemo returns the memoized result of a calculation, whereas useCallback returns the memoized function."),
                ("What is a Discriminated Union in TypeScript?", "A union of types that share a common literal discriminator property", "A forbidden union", "A union of CSS classes", "A React component error", "A", "A discriminated union uses a common literal field (like type: 'success' | 'error') for type narrowing."),
                ("Which Tailwind CSS class applies flexbox direction column?", "flex-col", "flex-direction-col", "display-col", "flex-vertical", "A", "`flex-col` sets flex-direction: column in Tailwind."),
                ("What hook would you use to reference a mutable value that does NOT trigger a re-render when changed?", "useState", "useRef", "useReducer", "useId", "B", "useRef creates a mutable object whose .current property can be updated without triggering a re-render."),
                ("What is the primary purpose of React.lazy()?", "To speed up CSS", "To dynamically import and code-split components on demand", "To delay API responses", "To validate TypeScript types", "B", "React.lazy enables dynamic code splitting and lazy loading of components with Suspense."),
                ("What does the 'unknown' type in TypeScript represent?", "Any type without any type checking", "A type-safe counterpart to any requiring narrowing before use", "A null value", "An unassigned string", "B", "unknown forces the developer to perform type checking before operating on the variable."),
                ("In Tailwind CSS, which prefix is used for styling elements on hover?", "onHover:", "hover:", "mouse:", "focus:", "B", "The `hover:` variant applies styles when the user hovers over an element."),
                ("Which hook provides access to the router navigation function in React Router v6?", "useRouter()", "useNavigate()", "useHistory()", "useRedirect()", "B", "useNavigate() is the standard navigation hook in React Router v6."),
                ("What is prop drilling in React?", "Validating props with TypeScript", "Passing props down through multiple levels of intermediate components", "Removing props from a component", "Exporting props globally", "B", "Prop drilling refers to threading props through intermediate components that don't need them directly."),
                ("What does the React StrictMode component do in development?", "Enforces strict TypeScript rules", "Renders components twice to detect unintended side-effects", "Disables console logs", "Blocks API calls", "B", "StrictMode intentionally double-invokes lifecycles in dev to uncover side effects."),
                ("Which utility type extracts a subset of properties from a type in TypeScript?", "Omit<T, K>", "Pick<T, K>", "Exclude<T, U>", "Extract<T, U>", "B", "Pick<T, K> constructs a type by picking the set of properties K from type T."),
                ("What is the Tailwind breakpoint prefix for min-width 768px?", "tablet:", "md:", "medium:", "sm:", "B", "`md:` corresponds to the 768px minimum width breakpoint in Tailwind."),
                ("Why should you avoid mutating state directly in React?", "It crashes TypeScript", "React relies on referential inequality to trigger re-renders", "It is illegal in JavaScript", "It disables Tailwind", "B", "React checks state references; mutating in-place prevents React from recognizing the change."),
                ("What hook is typically used as an alternative to useState for complex local state transitions?", "useReducer", "useTransition", "useDeferredValue", "useImperativeHandle", "A", "useReducer is ideal for complex state logic involving multiple sub-values or actions."),
                ("In TypeScript, what does `T extends U ? X : Y` represent?", "An interface", "A conditional type", "A module declaration", "An enum", "B", "This syntax represents a conditional type that checks if T extends U."),
                ("What does Tailwind's JIT (Just-In-Time) mode do?", "Generates CSS on-demand based on classes detected in source files", "Renders CSS on the server", "Minifies JS files", "Translates CSS to HTML", "A", "JIT generates styling on-demand, enabling arbitrary values and tiny bundle sizes."),
                ("What is the return type of a React functional component?", "string", "React.ReactElement | null", "HTMLElement", "Promise<void>", "B", "React functional components return a ReactElement, JSX element, or null.")
            ]
        },
        {
            "title": "Enterprise Cyber Security & Defensive Architecture",
            "description": "Learn network security protocols, modern cryptography, vulnerability mitigation, and defensive incident response frameworks.",
            "subject": "Cyber Security",
            "difficulty": "Advanced",
            "duration": "10 Weeks",
            "instructor_id": trainer_ids['trainer.elena@capacityconnect.org'],
            "thumbnail": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80",
            "competencies": ["Network Security", "Cryptography", "Penetration Testing"],
            "modules": [
                {
                    "number": 1,
                    "title": "Module 1: Network Protocols & Perimeter Security",
                    "description": "TCP/IP vulnerabilities, stateful firewalls, intrusion detection/prevention systems (IDS/IPS).",
                    "lessons": [
                        {"title": "TCP/IP Security and Protocol Attacks", "video_url": "https://www.youtube.com/watch?v=inWWhr5tnEA", "video_id": "inWWhr5tnEA", "duration": 25, "content": "SYN floods, ARP poisoning, DNS cache poisoning, and deep packet inspection mechanics."},
                        {"title": "Configuring Modern Stateful Firewalls & DMZs", "video_url": "https://www.youtube.com/watch?v=kd0hhX_yK7A", "video_id": "kd0hhX_yK7A", "duration": 30, "content": "Packet filtering, NAT boundaries, DMZ segregation, and egress rule enforcement."}
                    ]
                },
                {
                    "number": 2,
                    "title": "Module 2: Enterprise Cryptography & PKI Infrastructure",
                    "description": "AES, RSA, ECC, digital signatures, certificates, and TLS 1.3 handshake mechanics.",
                    "lessons": [
                        {"title": "Symmetric vs Asymmetric Ciphers in Practice", "video_url": "https://www.youtube.com/watch?v=jhXCTbFnK8o", "video_id": "jhXCTbFnK8o", "duration": 24, "content": "Mathematical properties of AES-GCM, RSA key exchanges, and Elliptic Curve Diffie-Hellman (ECDHE)."},
                        {"title": "Public Key Infrastructure & Certificate Authorities", "video_url": "https://www.youtube.com/watch?v=T4Df5_cojAs", "video_id": "T4Df5_cojAs", "duration": 28, "content": "X.509 certificate chains, OCSP revocation checking, and automated ACME renewals."}
                    ]
                },
                {
                    "number": 3,
                    "title": "Module 3: Application Vulnerability & Penetration Testing",
                    "description": "OWASP Top 10 vulnerabilities, SQL injection, XSS, CSRF, and threat modeling.",
                    "lessons": [
                        {"title": "Mitigating the OWASP Top 10 Vulnerabilities", "video_url": "https://www.youtube.com/watch?v=F5vA4f3Y9q0", "video_id": "F5vA4f3Y9q0", "duration": 26, "content": "Remediating injection attacks, broken access controls, and security misconfigurations in modern APIs."},
                        {"title": "Automated Scanning vs Manual Ethical Exploitation", "video_url": "https://www.youtube.com/watch?v=3Kq1MIfTWCE", "video_id": "3Kq1MIfTWCE", "duration": 32, "content": "Utilizing Burp Suite, OWASP ZAP, and writing ethical proof-of-concept exploits safely."}
                    ]
                },
                {
                    "number": 4,
                    "title": "Module 4: Zero Trust Security & Incident Response",
                    "description": "Identity-aware access, least privilege, SIEM monitoring, and incident containment.",
                    "lessons": [
                        {"title": "Architecting Zero Trust Enterprise Networks", "video_url": "https://www.youtube.com/watch?v=Xz2Qk5tW4uU", "video_id": "Xz2Qk5tW4uU", "duration": 35, "content": "Never Trust Always Verify principles, microsegmentation, and contextual conditional access policies."},
                        {"title": "SOC Operations, SIEM and Incident Containment", "video_url": "https://www.youtube.com/watch?v=V9X7mFqH6n4", "video_id": "V9X7mFqH6n4", "duration": 30, "content": "Log aggregation, anomaly detection rules, isolation playbooks, and post-mortem reporting."}
                    ]
                }
            ],
            "questions": [
                ("Which encryption standard is currently the worldwide standard for symmetric encryption?", "DES", "AES", "MD5", "SHA-1", "B", "Advanced Encryption Standard (AES) is the NIST approved symmetric standard."),
                ("What does the 'S' in HTTPS stand for?", "Socket", "Secure", "System", "Standard", "B", "HTTPS is HyperText Transfer Protocol Secure, operating over TLS/SSL."),
                ("What type of attack involves an attacker placing themselves between two communicating parties?", "DDoS", "Man-in-the-Middle (MitM)", "SQL Injection", "Brute Force", "B", "A MitM attack intercepts communication between two legitimate endpoints."),
                ("Which port is commonly used for secure SSH connections?", "21", "22", "80", "443", "B", "Port 22 is the standard default port for SSH."),
                ("What is the primary defense against SQL Injection vulnerabilities?", "Using client-side JavaScript validation", "Parameterized queries / prepared statements", "Encoding HTML tags", "Restarting the database server", "B", "Parameterized queries separate SQL code from user-supplied data inputs."),
                ("What does a Certificate Authority (CA) do in a PKI system?", "Decrypts all user passwords", "Issues and signs digital certificates verifying public key ownership", "Hosts the web application", "Manages database backups", "B", "A CA validates entities and issues digitally signed certificates."),
                ("Which principle states that users should have only the minimum access necessary to perform their job?", "Principle of Least Privilege", "Separation of Powers", "Zero Tolerance", "Open Door Policy", "A", "Least privilege dictates granting only necessary permissions to reduce blast radius."),
                ("What is the purpose of salting passwords before hashing?", "To make hashing faster", "To defend against precomputed rainbow table attacks", "To encrypt passwords reversibly", "To reduce password length", "B", "Salt ensures identical passwords generate unique hashes, neutralizing rainbow tables."),
                ("Which protocol is used to securely synchronize time across networked systems?", "DNS", "NTP (or NTS for security)", "SNMP", "BGP", "B", "Network Time Protocol (NTP) synchronizes system clocks, vital for security logs."),
                ("What attack attempts to exhaust server resources using millions of requests from distributed sources?", "Phishing", "DDoS (Distributed Denial of Service)", "Cross-Site Scripting", "Keylogging", "B", "DDoS overwhelms target bandwidth and processing power using botnets."),
                ("What security header prevents a website from being embedded inside an iframe (Clickjacking)?", "X-Frame-Options / Content-Security-Policy frame-ancestors", "X-XSS-Protection", "Access-Control-Allow-Origin", "Cache-Control", "A", "X-Frame-Options and CSP frame-ancestors prevent unauthorized framing and clickjacking."),
                ("What is the difference between authorization and authentication?", "Authentication verifies who you are; authorization verifies what you are allowed to do", "They are identical", "Authorization happens before authentication", "Authentication is only for admins", "A", "Authentication confirms identity, whereas authorization enforces access permissions."),
                ("What does CSRF stand for in web security?", "Cross-Site Resource Format", "Cross-Site Request Forgery", "Centralized System Routing File", "Client Side Rendering Function", "B", "CSRF tricks an authenticated user into executing unauthorized actions."),
                ("In asymmetric cryptography, which key is kept secret by the owner?", "The public key", "The private key", "The session certificate", "The hash digest", "B", "The private key must never be revealed and is used to decrypt or sign data."),
                ("What is a Honeypot in cyber security?", "A password storage tool", "A decoy computer system intended to lure and observe attackers", "A high-speed firewall", "A secure email gateway", "B", "A honeypot is a trap designed to detect or deflect unauthorized use."),
                ("Which algorithm is an example of an asymmetric cryptographic algorithm?", "AES-256", "RSA", "ChaCha20", "Blowfish", "B", "RSA relies on public/private key pairs and mathematical factorization."),
                ("What does SIEM stand for in enterprise security?", "Security Information and Event Management", "System Internal Error Monitor", "Safe Internet Encryption Module", "Server Inspection & Egress Management", "A", "SIEM aggregates and analyzes security logs across enterprise infrastructure."),
                ("How does Zero Trust define access trust?", "Trust anyone inside the local corporate network", "Never trust, always verify regardless of perimeter", "Trust all VPN users automatically", "Trust any user with a password", "B", "Zero Trust requires continuous verification for all users and devices, even within network borders."),
                ("What is the purpose of multi-factor authentication (MFA)?", "Requires two or more distinct verification factors (knowledge, possession, inherence)", "Requires two passwords", "Encrypts the screen", "Limits login to one device", "A", "MFA combines something you know, something you have, and/or something you are."),
                ("Which OWASP vulnerability occurs when untrusted user input is executed directly in the browser?", "Broken Authentication", "Cross-Site Scripting (XSS)", "Insecure Deserialization", "Security Misconfiguration", "B", "XSS occurs when malicious scripts are injected into trusted web applications.")
            ]
        }
    ]

    for c in courses_seed:
        cur.execute("""
            INSERT INTO courses (title, description, subject, difficulty, duration, instructor_id, thumbnail, published)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        """, (c["title"], c["description"], c["subject"], c["difficulty"], c["duration"], c["instructor_id"], c["thumbnail"]))
        course_id = cur.lastrowid

        # Course competencies
        for comp_name in c["competencies"]:
            if comp_name in comp_ids:
                cur.execute("""
                    INSERT INTO course_competencies (course_id, competency_id, required_level)
                    VALUES (?, ?, 'Required')
                """, (course_id, comp_ids[comp_name]))

        # Modules & Lessons
        for mod in c["modules"]:
            cur.execute("""
                INSERT INTO modules (course_id, module_number, title, description)
                VALUES (?, ?, ?, ?)
            """, (course_id, mod["number"], mod["title"], mod["description"]))
            mod_id = cur.lastrowid

            for l_idx, lesson in enumerate(mod["lessons"], start=1):
                cur.execute("""
                    INSERT INTO lessons (module_id, lesson_number, title, content, video_url, video_id, duration_minutes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (mod_id, l_idx, lesson["title"], lesson["content"], lesson["video_url"], lesson["video_id"], lesson["duration"]))

            # Add a sample study resource for module
            cur.execute("""
                INSERT INTO resources (course_id, module_id, title, resource_type, file_url)
                VALUES (?, ?, ?, 'PDF', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')
            """, (course_id, mod_id, f"Study Guide & References - {mod['title']}"))

        # Questions
        for q in c["questions"]:
            cur.execute("""
                INSERT INTO questions (course_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'medium')
            """, (course_id, q[0], q[1], q[2], q[3], q[4], q[5], q[6]))

    # 6. Sample Announcements
    announcements_data = [
        ("Fall 2026 Enterprise Upskilling Cohort Open", "Registration is now live for all enterprise trainees. Complete your initial learning path modules to unlock certification assessment tracks.", "published", "all"),
        ("New Cloud Architecture Competency Framework Launched", "We have updated the Competency Mapping matrix with automated proficiency metrics for cloud and full-stack disciplines.", "published", "all"),
        ("Maintenance & Security System Upgrade Completed", "All API endpoints and evaluation pipelines have been hardened to latest Zero Trust specifications.", "published", "all")
    ]
    for ann in announcements_data:
        cur.execute("INSERT INTO announcements (title, description, status, target_audience) VALUES (?, ?, ?, ?)", ann)

    # 7. Sample Achievements
    achievements_data = [
        ("500+ Certified Capacity Builders", "Milestone reached across enterprise engineering, cybersecurity, and cloud architecture tracks.", "500+", "Global Cohort"),
        ("98.4% Assessment Pass Rate", "Trainees who completed all 4 Learning Path modules achieved high mastery upon initial assessment.", "98.4%", "Active Trainees"),
        ("100% Competency Match Accuracy", "Our Competency Mapping engine successfully matched top-tier trainers to enterprise curricula.", "100%", "Trainer Network")
    ]
    for ach in achievements_data:
        cur.execute("INSERT INTO achievements (title, description, metric, recipient) VALUES (?, ?, ?, ?)", ach)

    # 8. Sample Learning Content
    learning_content_data = [
        ("Full-Stack Enterprise Architecture Overview", "Development", "A deep-dive technical document detailing modern decoupled architectures, state synchronization, and scalable serverless APIs.", "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80"),
        ("Zero Trust Implementation Guidelines", "Security", "Best practices for implementing perimeter-less microsegmentation, mutual TLS, and continuous credential rotation.", "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80"),
        ("High-Performance Python Optimization Patterns", "Engineering", "Benchmarking memory usage, profiling execution speed, and integrating C-extensions for throughput-critical services.", "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80")
    ]
    for lc in learning_content_data:
        cur.execute("INSERT INTO learning_content (title, category, description, media_url) VALUES (?, ?, ?, ?)", lc)

    # 9. Pre-enroll sample trainee Alex in Course 1 for convenient testing
    cur.execute("SELECT id FROM courses WHERE title LIKE '%Python%' LIMIT 1")
    py_course = cur.fetchone()
    if py_course:
        cur.execute("INSERT INTO enrollments (user_id, course_id, status) VALUES (?, ?, 'active')", (alex_id, py_course[0]))

    # Seed an initial notification for Alex
    cur.execute("""
        INSERT INTO notifications (user_id, target_role, title, message, is_read)
        VALUES (?, 'trainee', 'Welcome to CAPACITY CONNECT', 'Welcome Alex! Your enrollment in Python for Enterprise Systems is active. Begin Module 1 to start your learning journey.', 0)
    """, (alex_id,))
