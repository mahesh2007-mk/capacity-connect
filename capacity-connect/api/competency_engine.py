import sys
import os
import json

_current_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(_current_dir)
if _parent_dir not in sys.path:
    sys.path.insert(0, _parent_dir)

from api.database import get_connection

def calculate_course_competencies_matching(course_id: int):
    conn = get_connection()
    cur = conn.cursor()

    # 1. Fetch course details
    cur.execute("SELECT id, title, subject, instructor_id FROM courses WHERE id = ?", (course_id,))
    course = cur.fetchone()
    if not course:
        conn.close()
        return None

    # 2. Fetch required competencies for this course
    cur.execute("""
        SELECT c.id, c.name, c.category, cc.required_level
        FROM course_competencies cc
        JOIN competencies c ON cc.competency_id = c.id
        WHERE cc.course_id = ?
    """, (course_id,))
    required_comps = cur.fetchall()
    required_names = [rc["name"] for rc in required_comps]
    required_set_norm = {name.strip().lower(): name for name in required_names}

    # 3. Fetch all active trainers
    cur.execute("""
        SELECT u.id, u.full_name, u.email, u.phone, tp.qualifications, tp.work_experience, tp.skills, tp.specializations
        FROM users u
        LEFT JOIN trainer_profiles tp ON u.id = tp.user_id
        WHERE u.role = 'trainer' AND u.status = 'active'
    """)
    trainers = cur.fetchall()

    results = []

    for t in trainers:
        t_id = t["id"]
        # Fetch competencies from trainer_competencies table
        cur.execute("""
            SELECT c.name
            FROM trainer_competencies tc
            JOIN competencies c ON tc.competency_id = c.id
            WHERE tc.trainer_id = ?
        """, (t_id,))
        direct_comps = [r["name"] for r in cur.fetchall()]

        # Also parse skills from trainer_profile json
        profile_skills = []
        if t["skills"]:
            try:
                parsed = json.loads(t["skills"])
                if isinstance(parsed, list):
                    profile_skills = parsed
            except Exception:
                profile_skills = [s.strip() for s in t["skills"].split(",") if s.strip()]

        # Combine all trainer known competencies/skills
        combined_trainer_skills = set(direct_comps + profile_skills)
        combined_norm = {s.strip().lower() for s in combined_trainer_skills}

        # Calculate matches
        matching = []
        missing = []

        for norm_name, original_name in required_set_norm.items():
            if norm_name in combined_norm:
                matching.append(original_name)
            else:
                missing.append(original_name)

        total_req = len(required_names)
        if total_req > 0:
            suitability_pct = round((len(matching) / total_req) * 100, 1)
        else:
            suitability_pct = 100.0

        # Recommendation logic
        if suitability_pct == 100.0:
            recommendation = "Highly Suitable"
            reason = f"Trainer possesses 100% ({len(matching)}/{total_req}) of all required course competencies with proven domain alignment."
        elif suitability_pct >= 75.0:
            recommendation = "Suitable"
            reason = f"Trainer matches {len(matching)} of {total_req} competencies. Missing only: {', '.join(missing)}."
        elif suitability_pct >= 50.0:
            recommendation = "Moderately Suitable"
            reason = f"Trainer has foundational skills ({len(matching)}/{total_req}) but lacks {len(missing)} key modules ({', '.join(missing)})."
        else:
            recommendation = "Upskilling Recommended"
            reason = f"Substantial competency gap detected ({len(missing)}/{total_req} missing: {', '.join(missing)}). Prior upskilling suggested."

        results.append({
            "trainer_id": t_id,
            "trainer_name": t["full_name"],
            "trainer_email": t["email"],
            "trainer_phone": t["phone"],
            "qualifications": t["qualifications"] or "Certified Instructor",
            "is_currently_assigned": (course["instructor_id"] == t_id),
            "suitability_percentage": suitability_pct,
            "matching_count": len(matching),
            "total_required": total_req,
            "matching_skills": matching,
            "missing_skills": missing,
            "all_trainer_skills": list(combined_trainer_skills),
            "recommendation": recommendation,
            "recommendation_reason": reason
        })

    # Sort descending by suitability percentage, then by matching_count
    results.sort(key=lambda x: (x["suitability_percentage"], x["matching_count"]), reverse=True)

    conn.close()

    return {
        "course_id": course["id"],
        "course_title": course["title"],
        "subject": course["subject"],
        "current_instructor_id": course["instructor_id"],
        "required_competencies": required_names,
        "trainer_recommendations": results
    }
