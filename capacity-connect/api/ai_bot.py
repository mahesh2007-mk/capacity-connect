import sys
import os
import json
import random
import requests
from typing import List, Dict, Any, Optional

_current_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(_current_dir)
if _parent_dir not in sys.path:
    sys.path.insert(0, _parent_dir)

from api.database import get_connection

def validate_mcq(q: Dict[str, Any]) -> bool:
    required_keys = ["question", "option_a", "option_b", "option_c", "option_d", "correct_answer"]
    for k in required_keys:
        if k not in q or not str(q[k]).strip():
            return False
    if q["correct_answer"].strip().upper() not in ["A", "B", "C", "D"]:
        return False
    if len(str(q["question"]).strip()) < 10:
        return False
    # Check that options are distinct
    options = [str(q[f"option_{opt}"]).strip().lower() for opt in ["a", "b", "c", "d"]]
    if len(set(options)) < 4:
        return False
    return True


def validate_course_question(q: Dict[str, Any], course_title: str) -> bool:
    """
    Validates that a question is genuinely relevant to the specified course curriculum
    and rejects generic template questions or cross-domain contamination.
    """
    q_text = str(q.get("question") or q.get("question_text") or "").strip().lower()
    if not q_text or len(q_text) < 10:
        return False

    # 1. Reject generic template patterns
    generic_patterns = [
        "what is a primary architectural principle taught in",
        "which method improves resilience and reliability in",
        "how do we achieve scalability according to",
        "what is the recommended testing approach for",
        "what is the primary architectural goal of",
        "which phase in the",
        "why is modularity important in modern",
        "how do automated linter tools assist",
        "what is the recommended approach to handling unexpected errors",
        "what does code profiling reveal about",
        "how should sensitive credentials and configurations be managed",
        "what is the primary purpose of version control systems like git in",
        "why are code reviews considered essential in professional",
        "what metric measures the percentage of source code executed",
        "what is the role of caching in high-throughput",
        "what is the purpose of refactoring existing",
        "what is regression testing in software maintenance",
        "what is technical debt in a long-running",
        "what is the purpose of load testing before launching an enterprise",
        "what is a semantic versioning (semver) format standard",
        "what is the ultimate objective of capacity building in"
    ]
    for pattern in generic_patterns:
        if pattern in q_text:
            return False

    all_opts = " ".join([str(q.get(f"option_{opt}", "")).lower() for opt in ["a", "b", "c", "d"]])
    full_text = f"{q_text} {all_opts}"

    ct_lower = course_title.lower()

    # 2. Strict domain boundary rules
    if "full stack" in ct_lower or "web dev" in ct_lower:
        # Full stack must not contain robotics, ROS, kinematics, or deep learning weights
        forbidden = [
            "forward kinematics", "inverse kinematics", "denavit-hartenberg", "jacobian matrix",
            "ros topic", "ros action", "gradient descent", "backpropagation", "k-means clustering",
            "lidar", "servomotor position", "pwm duty cycle", "inertia matrix"
        ]
        for f in forbidden:
            if f in full_text:
                return False

    elif "robot" in ct_lower:
        # Robotics must not contain web frontend, react hooks, css properties
        forbidden = [
            "react hooks", "virtual dom", "css box-sizing", "flexbox", "express.json()",
            "usememo", "usecallback", "cross-origin resource sharing", "html5 semantic",
            "django orm", "spring boot starter"
        ]
        for f in forbidden:
            if f in full_text:
                return False

    elif "machine learning" in ct_lower or "deep learning" in ct_lower:
        # ML must not contain robotics kinematics or web layout CSS
        forbidden = [
            "flexbox", "css grid", "react components", "virtual dom", "express middleware",
            "html5", "denavit-hartenberg", "can bus", "pwm signal", "servomotor position"
        ]
        for f in forbidden:
            if f in full_text:
                return False

    return True


def generate_questions_with_gemini(course_title: str, module_title: str, difficulty: str, count: int = 5) -> List[Dict[str, Any]]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return []

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    prompt = f"""
Generate {count} multiple choice questions (MCQs) for the technical course '{course_title}', topic '{module_title}', difficulty level '{difficulty}'.
You must return ONLY a JSON array of objects conforming exactly to this structure without markdown wraps:
[
  {{
    "question": "A concise, clear technical question",
    "option_a": "First distinct option",
    "option_b": "Second distinct option",
    "option_c": "Third distinct option",
    "option_d": "Fourth distinct option",
    "correct_answer": "A",
    "explanation": "Clear explanation of why this answer is correct",
    "difficulty": "{difficulty}",
    "course": "{course_title}",
    "module": "{module_title}",
    "topic": "{module_title}"
  }}
]
"""
    try:
        response = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.4,
                    "responseMimeType": "application/json"
                }
            },
            timeout=10
        )
        if response.status_code == 200:
            res_json = response.json()
            raw_text = res_json["candidates"][0]["content"]["parts"][0]["text"]
            cleaned = raw_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            parsed = json.loads(cleaned.strip())
            valid_questions = []
            for item in parsed:
                if validate_mcq(item) and validate_course_question(item, course_title):
                    item["correct_answer"] = item["correct_answer"].strip().upper()
                    valid_questions.append(item)
            return valid_questions
    except Exception as e:
        print(f"Gemini API request failed or timed out: {e}")

    return []


def seed_course_questions(course_id: int):
    """
    Seeds a rich, course-specific assessment question pool into the database.
    Removes any old generic template questions and ensures only verified, domain-relevant
    questions are saved for the course.
    """
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, title, subject, description FROM courses WHERE id = ?", (course_id,))
    course = cur.fetchone()
    if not course:
        conn.close()
        return

    course_title = course["title"]
    cur.execute("SELECT id, module_number, title, description FROM modules WHERE course_id = ? ORDER BY module_number ASC", (course_id,))
    modules = cur.fetchall()

    # 1. Purge generic template questions
    cur.execute("""
        DELETE FROM questions 
        WHERE course_id = ? AND (
            question_text LIKE 'Question %: What is a primary architectural principle taught in%'
            OR question_text LIKE 'Question %: Which method improves resilience and reliability in%'
            OR question_text LIKE 'Question %: How do we achieve scalability according to%'
            OR question_text LIKE 'Question %: What is the recommended testing approach for%'
            OR question_text LIKE '%What is the primary architectural goal of%'
            OR question_text LIKE '%Which phase in the%'
            OR question_text LIKE '%Why is modularity important in modern%'
            OR question_text LIKE '%How do automated linter tools assist%'
            OR question_text LIKE '%What is the recommended approach to handling unexpected errors%'
            OR question_text LIKE '%What does code profiling reveal about%'
            OR question_text LIKE '%How should sensitive credentials and configurations be managed%'
            OR question_text LIKE '%What is the primary purpose of version control systems like Git in%'
            OR question_text LIKE '%Why are code reviews considered essential in professional%'
            OR question_text LIKE '%What metric measures the percentage of source code executed%'
            OR question_text LIKE '%What is the role of caching in high-throughput%'
            OR question_text LIKE '%What is the purpose of refactoring existing%'
            OR question_text LIKE '%What is regression testing in software maintenance%'
            OR question_text LIKE '%What is technical debt in a long-running%'
            OR question_text LIKE '%What is the purpose of load testing before launching an enterprise%'
            OR question_text LIKE '%What is a semantic versioning (SemVer) format standard%'
            OR question_text LIKE '%What is the ultimate objective of capacity building in%'
        )
    """, (course_id,))
    conn.commit()

    # 2. Check curated bank questions
    try:
        from api.course_questions_bank import get_bank_questions_for_domain
        bank_questions = get_bank_questions_for_domain(course_title)
    except Exception:
        bank_questions = []

    # Insert bank questions if available
    for idx, item in enumerate(bank_questions):
        mod_id = modules[idx % len(modules)]["id"] if modules else None
        cur.execute("SELECT id FROM questions WHERE course_id = ? AND question_text = ?", (course_id, item[0]))
        if not cur.fetchone():
            cur.execute("""
                INSERT INTO questions (course_id, module_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, topic)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                course_id,
                mod_id,
                item[0],
                item[1],
                item[2],
                item[3],
                item[4],
                item[5],
                item[6],
                item[7],
                item[8]
            ))
    conn.commit()

    # If still fewer than 20 questions, attempt Gemini generation for each module
    cur.execute("SELECT COUNT(*) FROM questions WHERE course_id = ?", (course_id,))
    current_count = cur.fetchone()[0]
    if current_count < 20 and os.environ.get("GEMINI_API_KEY"):
        for mod in modules:
            try:
                gen_qs = generate_questions_with_gemini(course_title, mod["title"], "medium", count=5)
                for q in gen_qs:
                    cur.execute("SELECT id FROM questions WHERE course_id = ? AND question_text = ?", (course_id, q["question"]))
                    if not cur.fetchone():
                        cur.execute("""
                            INSERT INTO questions (course_id, module_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, topic)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            course_id,
                            mod["id"],
                            q["question"],
                            q["option_a"],
                            q["option_b"],
                            q["option_c"],
                            q["option_d"],
                            q["correct_answer"],
                            q.get("explanation", ""),
                            q.get("difficulty", "medium"),
                            mod["title"]
                        ))
                conn.commit()
            except Exception as e:
                print(f"[seed_course_questions] Gemini gen error: {e}")

    conn.close()


def get_assessment_question_set(course_id: int, user_id: int, count: int = 20) -> List[Dict[str, Any]]:
    """
    Selects questions for an assessment or retake.
    Guarantees questions are course-specific, rejecting any generic template questions.
    Returns questions WITHOUT correct_answer or explanation to prevent frontend exposure.
    """
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT title FROM courses WHERE id = ?", (course_id,))
    course_row = cur.fetchone()
    course_title = course_row["title"] if course_row else ""

    # Check existing questions: if generic or fewer than count, seed them first
    cur.execute("""
        SELECT COUNT(*) FROM questions 
        WHERE course_id = ? AND (
            question_text LIKE 'Question %: What is a primary architectural principle taught in%'
            OR question_text LIKE '%What is the primary architectural goal of%'
        )
    """, (course_id,))
    generic_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM questions WHERE course_id = ?", (course_id,))
    total_db_questions = cur.fetchone()[0]

    conn.close()

    if generic_count > 0 or total_db_questions < count:
        seed_course_questions(course_id)

    conn = get_connection()
    cur = conn.cursor()

    # 1. Fetch previous question IDs attempted by this user for this course
    cur.execute("""
        SELECT question_ids FROM assessment_attempts
        WHERE user_id = ? AND course_id = ?
        ORDER BY attempt_number ASC
    """, (user_id, course_id))
    past_attempts = cur.fetchall()

    previously_attempted_ids = set()
    for row in past_attempts:
        try:
            ids = json.loads(row["question_ids"])
            if isinstance(ids, list):
                previously_attempted_ids.update(ids)
        except Exception:
            pass

    # 2. Fetch all questions for this course
    cur.execute("""
        SELECT id, course_id, module_id, question_text, option_a, option_b, option_c, option_d, difficulty, topic
        FROM questions
        WHERE course_id = ?
    """, (course_id,))
    all_raw = cur.fetchall()
    conn.close()

    # Filter strictly for relevance
    all_course_questions = []
    for q in all_raw:
        q_dict = dict(q)
        if validate_course_question(q_dict, course_title):
            all_course_questions.append(q_dict)

    # Filter unattempted questions
    unattempted = [q for q in all_course_questions if q["id"] not in previously_attempted_ids]

    selected = []
    if len(unattempted) >= count:
        selected = random.sample(unattempted, count)
    else:
        selected.extend(unattempted)
        remaining_pool = [q for q in all_course_questions if q not in selected]
        if remaining_pool:
            needed = count - len(selected)
            selected.extend(random.sample(remaining_pool, min(needed, len(remaining_pool))))

    # If still fewer than count, sample from domain bank directly
    if len(selected) < count:
        try:
            from api.course_questions_bank import get_bank_questions_for_domain
            bank_qs = get_bank_questions_for_domain(course_title)
            fake_id = 900000
            for b in bank_qs:
                if len(selected) >= count:
                    break
                selected.append({
                    "id": fake_id,
                    "course_id": course_id,
                    "module_id": None,
                    "question_text": b[0],
                    "option_a": b[1],
                    "option_b": b[2],
                    "option_c": b[3],
                    "option_d": b[4],
                    "difficulty": b[7],
                    "topic": b[8]
                })
                fake_id += 1
        except Exception:
            pass

    # Format questions: NEVER include correct_answer or explanation
    safe_questions = []
    for q in selected:
        safe_questions.append({
            "id": q["id"],
            "course_id": q["course_id"],
            "module_id": q.get("module_id"),
            "question_text": q["question_text"],
            "option_a": q["option_a"],
            "option_b": q["option_b"],
            "option_c": q["option_c"],
            "option_d": q["option_d"],
            "difficulty": q.get("difficulty", "medium"),
            "topic": q.get("topic")
        })

    return safe_questions

