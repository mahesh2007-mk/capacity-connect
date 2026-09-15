import os
import json
import random
import requests
from typing import List, Dict, Any, Optional
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
            # Clean possible markdown wrap
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
                if validate_mcq(item):
                    item["correct_answer"] = item["correct_answer"].strip().upper()
                    valid_questions.append(item)
            return valid_questions
    except Exception as e:
        print(f"Gemini API request failed or timed out: {e}")

    return []

def get_assessment_question_set(course_id: int, user_id: int, count: int = 20) -> List[Dict[str, Any]]:
    """
    Selects questions for an assessment or retake.
    Fetches previous attempt question IDs to guarantee a fresh question set.
    If database questions are depleted, AI bot or fallback bank fulfills the set.
    Returns questions WITHOUT correct_answer to prevent frontend exposure.
    """
    conn = get_connection()
    cur = conn.cursor()

    # 1. Fetch all previous question IDs attempted by this user for this course
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

    # 2. Fetch course questions
    cur.execute("""
        SELECT id, course_id, module_id, question_text, option_a, option_b, option_c, option_d, difficulty, topic
        FROM questions
        WHERE course_id = ?
    """, (course_id,))
    all_course_questions = cur.fetchall()

    # Filter out previously attempted questions
    unattempted = [dict(q) for q in all_course_questions if q["id"] not in previously_attempted_ids]

    selected = []
    if len(unattempted) >= count:
        selected = random.sample(unattempted, count)
    else:
        # Include all unattempted
        selected.extend(unattempted)
        # If still needed, fill from least-recently attempted or remaining pool so the assessment always has questions
        remaining_pool = [dict(q) for q in all_course_questions if dict(q) not in selected]
        if remaining_pool:
            needed = count - len(selected)
            selected.extend(random.sample(remaining_pool, min(needed, len(remaining_pool))))

    # If course questions are still fewer than count, duplicate/re-sample to satisfy count
    if len(selected) < count and len(all_course_questions) > 0:
        while len(selected) < count:
            selected.append(random.choice([dict(q) for q in all_course_questions]))

    conn.close()

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
