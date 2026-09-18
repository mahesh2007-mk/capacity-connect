import sys
import os
import re
import json
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

# Ensure the project root and current directory are on sys.path
_current_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(_current_dir)
if _parent_dir not in sys.path:
    sys.path.insert(0, _parent_dir)
if _current_dir not in sys.path:
    sys.path.insert(0, _current_dir)

from fastapi import FastAPI, Depends, HTTPException, status, Query, Response
from fastapi.middleware.cors import CORSMiddleware

from api.database import (
    init_db, get_connection, hash_password, verify_password
)
from api.models import (
    SignupRequest, LoginRequest, TokenResponse,
    TraineeProfileUpdate, TrainerProfileUpdate,
    CourseCreate, CourseUpdate, LessonCreate, ModuleCreate,
    AssessmentSubmission, QuestionCreate,
    QuestionnaireCreate, QuestionnaireUpdate, QuestionnaireResponseSubmit,
    FeedbackCreate, AnnouncementCreate, AchievementCreate,
    LearningContentCreate, LibraryResourceCreate,
    UserStatusUpdate, TrainerAssignRequest
)
from api.auth import create_access_token, get_current_user, require_role
from api.competency_engine import calculate_course_competencies_matching
from api.ai_bot import get_assessment_question_set, seed_course_questions
from api.course_generator import find_or_create_course

# Initialize DB on module import
init_db()

app = FastAPI(title="CAPACITY CONNECT API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "platform": "CAPACITY CONNECT", "timestamp": datetime.utcnow().isoformat()}

# ==========================================
# PUBLIC ENDPOINTS
# ==========================================

@app.get("/api/public/landing")
def get_landing_data():
    conn = get_connection()
    cur = conn.cursor()

    # Announcements
    cur.execute("SELECT id, title, description, status, target_audience, created_at FROM announcements WHERE status = 'published' ORDER BY created_at DESC LIMIT 5")
    announcements = [dict(r) for r in cur.fetchall()]

    # Achievements
    cur.execute("SELECT id, title, description, metric, recipient, created_at FROM achievements ORDER BY created_at DESC LIMIT 4")
    achievements = [dict(r) for r in cur.fetchall()]

    # Learning Content
    cur.execute("SELECT id, title, category, description, media_url, created_at FROM learning_content ORDER BY created_at DESC LIMIT 6")
    learning_content = [dict(r) for r in cur.fetchall()]

    # Featured Courses
    cur.execute("""
        SELECT c.id, c.title, c.description, c.subject, c.difficulty, c.duration, c.thumbnail,
               u.full_name as instructor_name,
               (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) as modules_count,
               (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as enrollments_count
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE c.published = 1
        ORDER BY c.created_at DESC
        LIMIT 6
    """)
    courses = [dict(r) for r in cur.fetchall()]

    # Platform Stats
    cur.execute("SELECT COUNT(*) FROM users WHERE role = 'trainee'")
    trainees_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM users WHERE role = 'trainer'")
    trainers_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM courses WHERE published = 1")
    courses_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM certificates")
    certs_count = cur.fetchone()[0]

    conn.close()

    return {
        "announcements": announcements,
        "achievements": achievements,
        "learning_content": learning_content,
        "courses": courses,
        "stats": {
            "total_trainees": trainees_count,
            "total_trainers": trainers_count,
            "total_courses": courses_count,
            "certificates_issued": certs_count
        }
    }

# ==========================================
# AUTHENTICATION
# ==========================================

@app.post("/api/auth/signup")
def signup(req: SignupRequest):
    # Enforce rules:
    # 1. Trainee is default role.
    # 2. Block public admin account creation.
    role = req.role.strip().lower() if req.role else "trainee"
    if role == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin accounts cannot be registered publicly. Please contact system administrators."
        )
    if role not in ["trainee", "trainer"]:
        role = "trainee"

    if req.password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    if len(req.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )

    conn = get_connection()
    cur = conn.cursor()

    # Check duplicate email
    cur.execute("SELECT id FROM users WHERE email = ?", (req.email.lower().strip(),))
    if cur.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )

    # Trainer registrations require admin approval; Trainees are active by default
    user_status = "pending" if role == "trainer" else "active"
    hashed_pw = hash_password(req.password)

    cur.execute("""
        INSERT INTO users (full_name, email, password_hash, phone, role, status)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (req.full_name.strip(), req.email.lower().strip(), hashed_pw, req.phone, role, user_status))
    user_id = cur.lastrowid

    # Create associated profile
    if role == "trainee":
        cur.execute("""
            INSERT INTO trainee_profiles (user_id, phone, skills, interests)
            VALUES (?, ?, '', '')
        """, (user_id, req.phone))
    elif role == "trainer":
        cur.execute("""
            INSERT INTO trainer_profiles (user_id, phone, skills, subjects, specializations, certifications)
            VALUES (?, ?, '[]', '[]', '[]', '[]')
        """, (user_id, req.phone))

    conn.commit()

    # If pending approval, inform user
    if user_status == "pending":
        conn.close()
        return {
            "message": "Trainer registration submitted successfully. Your account is pending Administrator approval.",
            "status": "pending",
            "role": role
        }

    # Generate token for active trainee
    token = create_access_token({"id": user_id, "email": req.email.lower().strip(), "role": role, "full_name": req.full_name.strip()})
    
    cur.execute("SELECT id, full_name, email, role, phone, status FROM users WHERE id = ?", (user_id,))
    created_user = dict(cur.fetchone())
    conn.close()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": created_user
    }

@app.post("/api/auth/login")
def login(req: LoginRequest):
    email = req.email.lower().strip()
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, full_name, email, password_hash, phone, role, status FROM users WHERE email = ?", (email,))
    user = cur.fetchone()

    # Strict prompt requirement:
    # If email/user does not exist: Show exactly "User does not exist"
    if not user:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User does not exist"
        )

    # If password incorrect: Show "Incorrect password"
    if not verify_password(req.password, user["password_hash"]):
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )

    if user["status"] == "deactivated":
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact an administrator."
        )

    if user["status"] == "pending":
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending administrator approval."
        )

    conn.close()

    token = create_access_token({
        "id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "full_name": user["full_name"]
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
            "phone": user["phone"],
            "status": user["status"]
        }
    }

@app.get("/api/auth/me")
def get_current_user_profile(user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, full_name, email, role, phone, status, created_at FROM users WHERE id = ?", (user["id"],))
    user_info = dict(cur.fetchone())

    profile_data = {}
    if user["role"] == "trainee":
        cur.execute("SELECT * FROM trainee_profiles WHERE user_id = ?", (user["id"],))
        p = cur.fetchone()
        if p:
            profile_data = dict(p)
    elif user["role"] == "trainer":
        cur.execute("SELECT * FROM trainer_profiles WHERE user_id = ?", (user["id"],))
        p = cur.fetchone()
        if p:
            profile_data = dict(p)

    conn.close()
    return {"user": user_info, "profile": profile_data}

# ==========================================
# COURSES (PUBLIC & SHARED)
# ==========================================

@app.get("/api/courses")
def get_courses(
    search: Optional[str] = None,
    subject: Optional[str] = None,
    difficulty: Optional[str] = None,
    auto_generate: bool = True
):
    conn = get_connection()
    cur = conn.cursor()

    query = """
        SELECT c.id, c.title, c.description, c.subject, c.difficulty, c.duration, c.thumbnail, c.published, c.created_at,
               u.full_name as instructor_name, u.email as instructor_email,
               (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) as modules_count,
               (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as enrollments_count
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE c.published = 1
    """
    params = []

    if search:
        query += " AND (c.title LIKE ? OR c.description LIKE ? OR c.subject LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s])
    if subject and subject != "all":
        query += " AND c.subject = ?"
        params.append(subject)
    if difficulty and difficulty != "all":
        query += " AND c.difficulty = ?"
        params.append(difficulty)

    query += " ORDER BY c.created_at DESC"
    cur.execute(query, params)
    courses = [dict(r) for r in cur.fetchall()]
    conn.close()

    # Intelligent Course Search & Not-Found Handling:
    # If a search term was provided and no courses were found, automatically find or generate it
    if search and not courses and auto_generate:
        try:
            gen_res = find_or_create_course(search)
            if gen_res.get("course"):
                courses = [gen_res["course"]]
        except Exception as e:
            print(f"Error in auto-generating course for query '{search}': {e}")

    return courses

@app.post("/api/courses/search-or-generate")
def search_or_generate_course(payload: Dict[str, Any]):
    query = payload.get("query", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Search query is required")
    try:
        result = find_or_create_course(query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate course: {str(e)}")


@app.get("/api/courses/{course_id}")
def get_course_detail(course_id: int):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT c.*, u.full_name as instructor_name, u.email as instructor_email,
               tp.qualifications as instructor_qualifications
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.id
        LEFT JOIN trainer_profiles tp ON u.id = tp.user_id
        WHERE c.id = ?
    """, (course_id,))
    course = cur.fetchone()
    if not course:
        conn.close()
        raise HTTPException(status_code=404, detail="Course not found")

    conn.close()

    # Ensure all lessons in this course have verified, relevant videos
    from api.video_service import audit_and_repair_lesson_videos
    audit_and_repair_lesson_videos(course_id)

    conn = get_connection()
    cur = conn.cursor()

    # Fetch 4 modules with lessons
    cur.execute("SELECT * FROM modules WHERE course_id = ? ORDER BY module_number ASC", (course_id,))
    modules = [dict(m) for m in cur.fetchall()]

    for mod in modules:
        cur.execute("SELECT * FROM lessons WHERE module_id = ? ORDER BY lesson_number ASC", (mod["id"],))
        mod["lessons"] = [dict(l) for l in cur.fetchall()]

    # Fetch resources
    cur.execute("SELECT * FROM resources WHERE course_id = ? ORDER BY created_at DESC", (course_id,))
    resources = [dict(r) for r in cur.fetchall()]

    # Fetch required competencies
    cur.execute("""
        SELECT c.name, c.category, cc.required_level
        FROM course_competencies cc
        JOIN competencies c ON cc.competency_id = c.id
        WHERE cc.course_id = ?
    """, (course_id,))
    competencies = [dict(c) for c in cur.fetchall()]

    conn.close()
    return {
        "course": dict(course),
        "modules": modules,
        "resources": resources,
        "competencies": competencies
    }

# ==========================================
# TRAINEE MODULE
# ==========================================

@app.get("/api/trainee/profile")
def get_trainee_profile(user: dict = Depends(require_role(["trainee"]))):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT full_name, email, phone, created_at FROM users WHERE id = ?", (user["id"],))
    user_info = dict(cur.fetchone())

    cur.execute("SELECT * FROM trainee_profiles WHERE user_id = ?", (user["id"],))
    profile_row = cur.fetchone()
    profile = dict(profile_row) if profile_row else {}

    # Also list enrolled courses
    cur.execute("""
        SELECT c.id, c.title, c.subject, c.thumbnail, e.enrolled_at, e.status
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.user_id = ?
    """, (user["id"],))
    enrolled_courses = [dict(r) for r in cur.fetchall()]

    conn.close()
    return {
        "user": user_info,
        "profile": profile,
        "enrolled_courses": enrolled_courses
    }

@app.put("/api/trainee/profile")
def update_trainee_profile(req: TraineeProfileUpdate, user: dict = Depends(require_role(["trainee"]))):
    conn = get_connection()
    cur = conn.cursor()

    if req.full_name or req.phone:
        cur.execute("""
            UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone)
            WHERE id = ?
        """, (req.full_name, req.phone, user["id"]))

    cur.execute("""
        INSERT INTO trainee_profiles (
            user_id, phone, dob, gender, institution, department, year_of_study,
            qualification, work_experience, interests, skills, certificates, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
            phone = COALESCE(excluded.phone, trainee_profiles.phone),
            dob = COALESCE(excluded.dob, trainee_profiles.dob),
            gender = COALESCE(excluded.gender, trainee_profiles.gender),
            institution = COALESCE(excluded.institution, trainee_profiles.institution),
            department = COALESCE(excluded.department, trainee_profiles.department),
            year_of_study = COALESCE(excluded.year_of_study, trainee_profiles.year_of_study),
            qualification = COALESCE(excluded.qualification, trainee_profiles.qualification),
            work_experience = COALESCE(excluded.work_experience, trainee_profiles.work_experience),
            interests = COALESCE(excluded.interests, trainee_profiles.interests),
            skills = COALESCE(excluded.skills, trainee_profiles.skills),
            certificates = COALESCE(excluded.certificates, trainee_profiles.certificates),
            updated_at = CURRENT_TIMESTAMP
    """, (
        user["id"], req.phone, req.dob, req.gender, req.institution,
        req.department, req.year_of_study, req.qualification,
        req.work_experience, req.interests, req.skills, req.certificates
    ))

    conn.commit()
    conn.close()
    return {"message": "Profile updated successfully"}

@app.get("/api/trainee/dashboard")
def get_trainee_dashboard(user: dict = Depends(require_role(["trainee"]))):
    """
    CRITICAL REQUIREMENT:
    Dashboard must show ONLY courses selected/enrolled by the logged-in trainee.
    Do not show all courses as enrolled.
    For every enrolled course show:
    - Course name
    - Progress
    - Learning Path status
    - Assessment status
    - Score (Before assessment: Score: 0.0%, Status: Not Attempted)
    - Certificate status
    Only update the score after the trainee actually submits an assessment.
    """
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT e.course_id, e.enrolled_at,
               c.title, c.subject, c.difficulty, c.duration, c.thumbnail,
               u.full_name as instructor_name
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE e.user_id = ?
        ORDER BY e.enrolled_at DESC
    """, (user["id"],))
    enrolled_courses = cur.fetchall()

    dashboard_courses = []

    for ec in enrolled_courses:
        c_id = ec["course_id"]

        # 1. Total modules in course (default 4)
        cur.execute("SELECT id FROM modules WHERE course_id = ?", (c_id,))
        course_modules = cur.fetchall()
        total_modules = len(course_modules)

        # 2. Completed modules for this trainee
        cur.execute("""
            SELECT COUNT(*) FROM learning_path_progress
            WHERE user_id = ? AND course_id = ? AND completed = 1
        """, (user["id"], c_id))
        completed_modules = cur.fetchone()[0]

        learning_path_pct = round((completed_modules / total_modules * 100), 1) if total_modules > 0 else 0.0
        learning_path_status = "Completed" if (total_modules > 0 and completed_modules >= total_modules) else f"{completed_modules}/{total_modules} Modules Completed"

        # 3. Assessment status & score
        cur.execute("""
            SELECT score_percentage, completed_at, attempt_number
            FROM assessment_attempts
            WHERE user_id = ? AND course_id = ?
            ORDER BY score_percentage DESC, completed_at DESC
            LIMIT 1
        """, (user["id"], c_id))
        best_attempt = cur.fetchone()

        if best_attempt:
            score_display = f"{best_attempt['score_percentage']:.1f}%"
            score_val = best_attempt['score_percentage']
            assessment_status = "Passed" if score_val >= 70.0 else "Needs Retake"
        else:
            score_display = "0.0%"
            score_val = 0.0
            assessment_status = "Not Attempted"

        # 4. Certificate status
        cur.execute("SELECT certificate_id, issue_date FROM certificates WHERE user_id = ? AND course_id = ?", (user["id"], c_id))
        cert = cur.fetchone()
        certificate_status = "Available" if cert else "Locked"

        dashboard_courses.append({
            "course_id": c_id,
            "course_name": ec["title"],
            "subject": ec["subject"],
            "difficulty": ec["difficulty"],
            "duration": ec["duration"],
            "thumbnail": ec["thumbnail"],
            "instructor_name": ec["instructor_name"] or "Faculty Trainer",
            "progress": learning_path_pct,
            "learning_path_status": learning_path_status,
            "learning_path_completed": (total_modules > 0 and completed_modules >= total_modules),
            "assessment_status": assessment_status,
            "score": score_display,
            "score_numeric": score_val,
            "certificate_status": certificate_status,
            "certificate_id": cert["certificate_id"] if cert else None
        })

    # Trainee overall stats
    total_enrolled = len(dashboard_courses)
    completed_courses = sum(1 for c in dashboard_courses if c["learning_path_completed"])
    certificates_count = sum(1 for c in dashboard_courses if c["certificate_status"] == "Available")

    conn.close()
    return {
        "enrolled_courses": dashboard_courses,
        "stats": {
            "total_enrolled": total_enrolled,
            "completed_courses": completed_courses,
            "certificates_count": certificates_count
        }
    }

@app.post("/api/trainee/enroll/{course_id}")
def enroll_in_course(course_id: int, user: dict = Depends(require_role(["trainee"]))):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, title FROM courses WHERE id = ? AND published = 1", (course_id,))
    course = cur.fetchone()
    if not course:
        conn.close()
        raise HTTPException(status_code=404, detail="Course not found or unavailable")

    cur.execute("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?", (user["id"], course_id))
    if cur.fetchone():
        conn.close()
        return {"message": f"Already enrolled in {course['title']}", "already_enrolled": True}

    cur.execute("INSERT INTO enrollments (user_id, course_id, status) VALUES (?, ?, 'active')", (user["id"], course_id))
    conn.commit()
    conn.close()
    return {"message": f"Successfully enrolled in {course['title']}", "already_enrolled": False}

@app.get("/api/trainee/learning-path/{course_id}")
def get_trainee_learning_path(course_id: int, user: dict = Depends(require_role(["trainee"]))):
    conn = get_connection()
    cur = conn.cursor()

    # Verify enrollment
    cur.execute("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?", (user["id"], course_id))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=403, detail="You must be enrolled in this course to view the Learning Path")

    cur.execute("SELECT id, title, description, thumbnail FROM courses WHERE id = ?", (course_id,))
    course = cur.fetchone()
    conn.close()

    # Ensure all lessons in this course have verified, relevant videos
    from api.video_service import audit_and_repair_lesson_videos
    audit_and_repair_lesson_videos(course_id)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM modules WHERE course_id = ? ORDER BY module_number ASC", (course_id,))
    modules = [dict(m) for m in cur.fetchall()]

    completed_count = 0
    for mod in modules:
        # Check completion
        cur.execute("SELECT completed FROM learning_path_progress WHERE user_id = ? AND module_id = ?", (user["id"], mod["id"]))
        prog = cur.fetchone()
        mod["completed"] = bool(prog["completed"]) if prog else False
        if mod["completed"]:
            completed_count += 1

        # Fetch lessons with YouTube video IDs and verified titles
        cur.execute("SELECT * FROM lessons WHERE module_id = ? ORDER BY lesson_number ASC", (mod["id"],))
        lessons_list = []
        for l in cur.fetchall():
            l_dict = dict(l)
            if l_dict.get("video_id"):
                cur.execute("SELECT video_title, author FROM video_cache WHERE video_id = ? ORDER BY id DESC LIMIT 1", (l_dict["video_id"],))
                v_cache = cur.fetchone()
                if v_cache:
                    l_dict["yt_video_title"] = v_cache["video_title"]
                    l_dict["author"] = v_cache["author"]
            lessons_list.append(l_dict)
        mod["lessons"] = lessons_list

        # Fetch module resources
        cur.execute("SELECT * FROM resources WHERE module_id = ?", (mod["id"],))
        mod["resources"] = [dict(r) for r in cur.fetchall()]

    all_completed = (len(modules) > 0 and completed_count == len(modules))

    conn.close()
    return {
        "course": dict(course),
        "modules": modules,
        "completed_modules": completed_count,
        "total_modules": len(modules),
        "progress_percentage": round((completed_count / len(modules)) * 100, 1) if modules else 0.0,
        "all_modules_completed": all_completed,
        "assessment_unlocked": all_completed
    }

@app.get("/api/trainee/courses/{course_id}/study-material")
def get_course_study_material(course_id: int, user: dict = Depends(get_current_user)):
    """
    Generates and returns a complete, publication-grade study material PDF handbook
    covering the entire curriculum, all 4 modules, technical explanations, examples,
    and assessment review questions specifically for the requested course.
    """
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM courses WHERE id = ?", (course_id,))
    course_row = cur.fetchone()
    if not course_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Course not found")

    course_data = dict(course_row)

    # Fetch modules and lessons
    cur.execute("SELECT * FROM modules WHERE course_id = ? ORDER BY module_number ASC", (course_id,))
    modules = [dict(m) for m in cur.fetchall()]

    for m in modules:
        cur.execute("SELECT * FROM lessons WHERE module_id = ? ORDER BY lesson_number ASC", (m["id"],))
        m["lessons"] = [dict(l) for l in cur.fetchall()]

    conn.close()

    from api.study_material_pdf import generate_study_material_pdf
    pdf_io = generate_study_material_pdf(course_data, modules)
    pdf_bytes = pdf_io.getvalue()

    safe_title = re.sub(r"[^\w\s-]", "", course_data.get("title", "Course")).strip().replace(" ", "_")
    filename = f"{safe_title}_Study_Material.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@app.post("/api/trainee/learning-path/complete-module")
def complete_module(payload: Dict[str, int], user: dict = Depends(require_role(["trainee"]))):
    course_id = payload.get("course_id")
    module_id = payload.get("module_id")
    if not course_id or not module_id:
        raise HTTPException(status_code=400, detail="course_id and module_id are required")

    conn = get_connection()
    cur = conn.cursor()

    # Verify enrollment
    cur.execute("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?", (user["id"], course_id))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    cur.execute("""
        INSERT INTO learning_path_progress (user_id, course_id, module_id, completed, completed_at)
        VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, module_id) DO UPDATE SET
            completed = 1,
            completed_at = CURRENT_TIMESTAMP
    """, (user["id"], course_id, module_id))
    conn.commit()

    # Check if all modules are now completed
    cur.execute("SELECT id FROM modules WHERE course_id = ?", (course_id,))
    all_mods = cur.fetchall()
    total_mods = len(all_mods)

    cur.execute("SELECT COUNT(*) FROM learning_path_progress WHERE user_id = ? AND course_id = ? AND completed = 1", (user["id"], course_id))
    completed_mods = cur.fetchone()[0]

    all_completed = (total_mods > 0 and completed_mods >= total_mods)
    conn.close()

    return {
        "message": "Module marked as completed",
        "completed_count": completed_mods,
        "total_count": total_mods,
        "all_modules_completed": all_completed,
        "assessment_unlocked": all_completed
    }

# ==========================================
# ASSESSMENT SYSTEM
# ==========================================

@app.get("/api/trainee/assessment/{course_id}")
def get_assessment(course_id: int, count: int = 20, user: dict = Depends(require_role(["trainee"]))):
    """
    CRITICAL REQUIREMENTS:
    - Assessment is available ONLY for:
      1. Logged-in trainee
      2. Enrolled course
      3. Completed required Learning Path (all modules)
    - Question count: 20 to 50 questions.
    - Timing:
      20 questions = 30 minutes (1800s)
      30 questions = 45 minutes (2700s)
      40 questions = 50 minutes (3000s)
      50 questions = 60 minutes (3600s)
    - Correct answers must NEVER be exposed to frontend before submission.
    """
    conn = get_connection()
    cur = conn.cursor()

    # 1. Enrolled check
    cur.execute("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?", (user["id"], course_id))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=403, detail="You must be enrolled in this course to take the assessment")

    # 2. Learning path completed check
    cur.execute("SELECT id FROM modules WHERE course_id = ?", (course_id,))
    total_mods = len(cur.fetchall())

    cur.execute("SELECT COUNT(*) FROM learning_path_progress WHERE user_id = ? AND course_id = ? AND completed = 1", (user["id"], course_id))
    completed_mods = cur.fetchone()[0]

    if total_mods == 0 or completed_mods < total_mods:
        conn.close()
        raise HTTPException(
            status_code=403,
            detail="Assessment locked. You must complete all required modules of the Learning Path first."
        )

    # Calculate timing
    if count >= 50:
        time_seconds = 3600  # 60 minutes
        question_count = 50
    elif count >= 40:
        time_seconds = 3000  # 50 minutes
        question_count = 40
    elif count >= 30:
        time_seconds = 2700  # 45 minutes
        question_count = 30
    else:
        time_seconds = 1800  # 30 minutes
        question_count = 20

    # Check attempt number
    cur.execute("SELECT COUNT(*) FROM assessment_attempts WHERE user_id = ? AND course_id = ?", (user["id"], course_id))
    attempt_count = cur.fetchone()[0]
    next_attempt = attempt_count + 1

    cur.execute("SELECT title, subject FROM courses WHERE id = ?", (course_id,))
    course_info = dict(cur.fetchone())
    conn.close()

    # Fetch fresh questions (filtering out past attempted questions)
    questions = get_assessment_question_set(course_id, user["id"], question_count)

    return {
        "course_id": course_id,
        "course_title": course_info["title"],
        "subject": course_info["subject"],
        "attempt_number": next_attempt,
        "total_questions": len(questions),
        "duration_seconds": time_seconds,
        "questions": questions
    }

@app.post("/api/trainee/assessment/submit")
def submit_assessment(submission: AssessmentSubmission, user: dict = Depends(require_role(["trainee"]))):
    course_id = submission.course_id
    conn = get_connection()
    cur = conn.cursor()

    # Fetch course & instructor info
    cur.execute("""
        SELECT c.id, c.title, u.full_name as instructor_name
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE c.id = ?
    """, (course_id,))
    course = cur.fetchone()
    if not course:
        conn.close()
        raise HTTPException(status_code=404, detail="Course not found")

    user_answers = submission.answers
    submitted_q_ids = list(user_answers.keys())

    if not submitted_q_ids:
        conn.close()
        raise HTTPException(status_code=400, detail="No answers submitted")

    # Fetch correct answers strictly from database
    placeholders = ",".join("?" * len(submitted_q_ids))
    cur.execute(f"SELECT id, correct_answer, explanation FROM questions WHERE id IN ({placeholders})", submitted_q_ids)
    q_data = {str(r["id"]): {"correct": r["correct_answer"].strip().upper(), "explanation": r["explanation"]} for r in cur.fetchall()}

    correct_count = 0
    detailed_results = []

    for q_id_str, user_ans in user_answers.items():
        corr = q_data.get(q_id_str, {}).get("correct")
        is_corr = (user_ans.strip().upper() == corr) if corr else False
        if is_corr:
            correct_count += 1
        detailed_results.append({
            "question_id": int(q_id_str),
            "user_answer": user_ans,
            "correct_answer": corr,
            "is_correct": is_corr,
            "explanation": q_data.get(q_id_str, {}).get("explanation")
        })

    total_questions = len(submitted_q_ids)
    # Backend calculates: percentage = (correct answers / total questions) * 100
    percentage = round((correct_count / total_questions) * 100, 1) if total_questions > 0 else 0.0

    # Determine attempt number
    cur.execute("SELECT COUNT(*) FROM assessment_attempts WHERE user_id = ? AND course_id = ?", (user["id"], course_id))
    past_attempts = cur.fetchone()[0]
    attempt_num = past_attempts + 1

    cur.execute("""
        INSERT INTO assessment_attempts (
            user_id, course_id, attempt_number, total_questions, correct_answers,
            score_percentage, time_taken_seconds, question_ids, completed_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    """, (
        user["id"], course_id, attempt_num, total_questions, correct_count,
        percentage, submission.time_taken_seconds, json.dumps([int(qid) for qid in submitted_q_ids])
    ))

    # If passed (>= 70%), generate Certificate if not already present
    certificate_id = None
    if percentage >= 70.0:
        cur.execute("SELECT certificate_id FROM certificates WHERE user_id = ? AND course_id = ?", (user["id"], course_id))
        existing_cert = cur.fetchone()
        if existing_cert:
            certificate_id = existing_cert["certificate_id"]
        else:
            # Generate unique Certificate ID
            date_str = datetime.utcnow().strftime("%Y%m%d")
            unique_hash = uuid.uuid4().hex[:8].upper()
            certificate_id = f"CC-{date_str}-{unique_hash}"
            verification_hash = hash_password(f"{certificate_id}_{user['id']}_{course_id}")

            cur.execute("""
                INSERT INTO certificates (certificate_id, user_id, course_id, instructor_name, verification_hash)
                VALUES (?, ?, ?, ?, ?)
            """, (certificate_id, user["id"], course_id, course["instructor_name"] or "Lead Faculty", verification_hash))

    conn.commit()
    conn.close()

    return {
        "attempt_number": attempt_num,
        "total_questions": total_questions,
        "correct_answers": correct_count,
        "score_percentage": percentage,
        "time_taken_seconds": submission.time_taken_seconds,
        "passed": percentage >= 70.0,
        "certificate_id": certificate_id,
        "detailed_results": detailed_results
    }

@app.get("/api/trainee/assessment/history/{course_id}")
def get_assessment_history(course_id: int, user: dict = Depends(require_role(["trainee"]))):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT attempt_number, total_questions, correct_answers, score_percentage, time_taken_seconds, completed_at
        FROM assessment_attempts
        WHERE user_id = ? AND course_id = ?
        ORDER BY attempt_number ASC
    """, (user["id"], course_id))
    attempts = [dict(r) for r in cur.fetchall()]

    conn.close()
    return {"course_id": course_id, "attempts": attempts}

# ==========================================
# CERTIFICATES
# ==========================================

@app.get("/api/trainee/certificates")
def get_trainee_certificates(user: dict = Depends(require_role(["trainee"]))):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT cert.certificate_id, cert.issue_date, cert.instructor_name, cert.verification_hash,
               c.id as course_id, c.title as course_title, c.subject as course_subject,
               u.full_name as trainee_name
        FROM certificates cert
        JOIN courses c ON cert.course_id = c.id
        JOIN users u ON cert.user_id = u.id
        WHERE cert.user_id = ?
        ORDER BY cert.issue_date DESC
    """, (user["id"],))
    certs = [dict(r) for r in cur.fetchall()]

    conn.close()
    return certs

@app.get("/api/certificates/verify/{certificate_id}")
def verify_certificate(certificate_id: str):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT cert.certificate_id, cert.issue_date, cert.instructor_name, cert.verification_hash,
               c.title as course_title, c.subject as course_subject, c.duration,
               u.full_name as trainee_name, u.email as trainee_email
        FROM certificates cert
        JOIN courses c ON cert.course_id = c.id
        JOIN users u ON cert.user_id = u.id
        WHERE cert.certificate_id = ?
    """, (certificate_id,))
    cert = cur.fetchone()
    conn.close()

    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found or invalid ID")

    response_dict = dict(cert)
    response_dict["platform"] = "CAPACITY CONNECT"
    return response_dict

# ==========================================
# RESOURCES & FEEDBACK
# ==========================================

@app.get("/api/trainee/resources/{course_id}")
def get_course_resources(course_id: int, user: dict = Depends(require_role(["trainee"]))):
    conn = get_connection()
    cur = conn.cursor()

    # Verify enrollment
    cur.execute("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?", (user["id"], course_id))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=403, detail="Access denied. Must be enrolled in this course to view resources.")

    cur.execute("""
        SELECT r.*, m.title as module_title
        FROM resources r
        LEFT JOIN modules m ON r.module_id = m.id
        WHERE r.course_id = ?
        ORDER BY r.created_at DESC
    """, (course_id,))
    resources = [dict(r) for r in cur.fetchall()]
    conn.close()
    return resources

@app.post("/api/trainee/feedback")
def submit_feedback(fb: FeedbackCreate, user: dict = Depends(require_role(["trainee"]))):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO feedback (
            user_id, course_id, overall_rating, content_quality,
            trainer_quality, learning_resources, assessment_quality, comments, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, course_id) DO UPDATE SET
            overall_rating = excluded.overall_rating,
            content_quality = excluded.content_quality,
            trainer_quality = excluded.trainer_quality,
            learning_resources = excluded.learning_resources,
            assessment_quality = excluded.assessment_quality,
            comments = excluded.comments,
            created_at = CURRENT_TIMESTAMP
    """, (
        user["id"], fb.course_id, fb.overall_rating, fb.content_quality,
        fb.trainer_quality, fb.learning_resources, fb.assessment_quality, fb.comments
    ))
    conn.commit()
    conn.close()
    return {"message": "Feedback submitted successfully. Thank you for your review!"}

# ==========================================
# TRAINER MODULE
# ==========================================

@app.get("/api/trainer/profile")
def get_trainer_profile(user: dict = Depends(require_role(["trainer"]))):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT full_name, email, phone FROM users WHERE id = ?", (user["id"],))
    u = dict(cur.fetchone())

    cur.execute("SELECT * FROM trainer_profiles WHERE user_id = ?", (user["id"],))
    p_row = cur.fetchone()
    p = dict(p_row) if p_row else {}

    # parse JSON fields
    for field in ["skills", "subjects", "specializations", "certifications"]:
        if p.get(field):
            try:
                p[field] = json.loads(p[field])
            except Exception:
                p[field] = [s.strip() for s in p[field].split(",") if s.strip()]
        else:
            p[field] = []

    conn.close()
    return {"user": u, "profile": p}

@app.put("/api/trainer/profile")
def update_trainer_profile(req: TrainerProfileUpdate, user: dict = Depends(require_role(["trainer"]))):
    conn = get_connection()
    cur = conn.cursor()

    if req.full_name or req.phone:
        cur.execute("UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone) WHERE id = ?", (req.full_name, req.phone, user["id"]))

    cur.execute("""
        INSERT INTO trainer_profiles (
            user_id, phone, qualifications, work_experience, skills, subjects, specializations, certifications, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
            phone = COALESCE(excluded.phone, trainer_profiles.phone),
            qualifications = COALESCE(excluded.qualifications, trainer_profiles.qualifications),
            work_experience = COALESCE(excluded.work_experience, trainer_profiles.work_experience),
            skills = excluded.skills,
            subjects = excluded.subjects,
            specializations = excluded.specializations,
            certifications = excluded.certifications,
            updated_at = CURRENT_TIMESTAMP
    """, (
        user["id"], req.phone, req.qualifications, req.work_experience,
        json.dumps(req.skills), json.dumps(req.subjects),
        json.dumps(req.specializations), json.dumps(req.certifications)
    ))

    # Also sync into trainer_competencies table for real matching
    for skill in req.skills:
        skill_clean = skill.strip()
        cur.execute("SELECT id FROM competencies WHERE LOWER(name) = LOWER(?)", (skill_clean,))
        comp_row = cur.fetchone()
        if comp_row:
            cur.execute("""
                INSERT INTO trainer_competencies (trainer_id, competency_id, proficiency_level)
                VALUES (?, ?, 'Advanced')
                ON CONFLICT(trainer_id, competency_id) DO NOTHING
            """, (user["id"], comp_row["id"]))

    conn.commit()
    conn.close()
    return {"message": "Trainer profile updated successfully"}

@app.get("/api/trainer/dashboard")
def get_trainer_dashboard(user: dict = Depends(require_role(["trainer"]))):
    conn = get_connection()
    cur = conn.cursor()

    # Courses assigned to this trainer
    cur.execute("SELECT id, title FROM courses WHERE instructor_id = ?", (user["id"],))
    assigned_courses = [dict(r) for r in cur.fetchall()]
    course_ids = [c["id"] for c in assigned_courses]

    if not course_ids:
        conn.close()
        return {
            "assigned_courses": [],
            "stats": {
                "assigned_trainees": 0,
                "course_enrollments": 0,
                "participation_rate": 0.0,
                "assessment_attempts": 0,
                "average_score": 0.0,
                "completion_rate": 0.0,
                "average_feedback_rating": 0.0
            }
        }

    placeholders = ",".join("?" * len(course_ids))

    # Enrolled trainees
    cur.execute(f"SELECT COUNT(DISTINCT user_id) FROM enrollments WHERE course_id IN ({placeholders})", course_ids)
    assigned_trainees = cur.fetchone()[0]

    # Total enrollments
    cur.execute(f"SELECT COUNT(*) FROM enrollments WHERE course_id IN ({placeholders})", course_ids)
    total_enrollments = cur.fetchone()[0]

    # Assessment attempts & average score
    cur.execute(f"""
        SELECT COUNT(*), AVG(score_percentage)
        FROM assessment_attempts
        WHERE course_id IN ({placeholders})
    """, course_ids)
    att_count, avg_score = cur.fetchone()
    avg_score = round(avg_score, 1) if avg_score else 0.0

    # Certificates issued
    cur.execute(f"SELECT COUNT(*) FROM certificates WHERE course_id IN ({placeholders})", course_ids)
    completed_certs = cur.fetchone()[0]
    completion_rate = round((completed_certs / total_enrollments * 100), 1) if total_enrollments > 0 else 0.0

    # Feedback ratings
    cur.execute(f"SELECT AVG(overall_rating), AVG(trainer_quality) FROM feedback WHERE course_id IN ({placeholders})", course_ids)
    avg_overall, avg_trainer_q = cur.fetchone()
    avg_rating = round(avg_overall, 1) if avg_overall else 5.0

    conn.close()
    return {
        "assigned_courses": assigned_courses,
        "stats": {
            "assigned_trainees": assigned_trainees,
            "course_enrollments": total_enrollments,
            "participation_rate": round(min(100.0, (att_count / total_enrollments * 100)), 1) if total_enrollments > 0 else 0.0,
            "assessment_attempts": att_count,
            "average_score": avg_score,
            "completion_rate": completion_rate,
            "average_feedback_rating": avg_rating
        }
    }

@app.get("/api/trainer/trainees")
def get_trainer_trainees(user: dict = Depends(require_role(["trainer"]))):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT u.id, u.full_name, u.email, u.phone,
               c.id as course_id, c.title as course_title,
               e.enrolled_at,
               (SELECT COUNT(*) FROM learning_path_progress lpp WHERE lpp.user_id = u.id AND lpp.course_id = c.id AND lpp.completed = 1) as completed_modules,
               (SELECT MAX(score_percentage) FROM assessment_attempts aa WHERE aa.user_id = u.id AND aa.course_id = c.id) as best_score,
               (SELECT certificate_id FROM certificates cert WHERE cert.user_id = u.id AND cert.course_id = c.id) as certificate_id
        FROM enrollments e
        JOIN users u ON e.user_id = u.id
        JOIN courses c ON e.course_id = c.id
        WHERE c.instructor_id = ?
        ORDER BY e.enrolled_at DESC
    """, (user["id"],))
    trainees = [dict(r) for r in cur.fetchall()]
    conn.close()
    return trainees

@app.get("/api/trainer/questionnaires")
def get_trainer_questionnaires(user: dict = Depends(require_role(["trainer"]))):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT q.*, c.title as course_title,
               (SELECT COUNT(*) FROM questionnaire_questions qq WHERE qq.questionnaire_id = q.id) as question_count,
               (SELECT COUNT(*) FROM questionnaire_responses qr WHERE qr.questionnaire_id = q.id) as response_count
        FROM questionnaires q
        JOIN courses c ON q.course_id = c.id
        WHERE q.trainer_id = ?
        ORDER BY q.created_at DESC
    """, (user["id"],))
    questionnaires = [dict(r) for r in cur.fetchall()]

    for item in questionnaires:
        cur.execute("SELECT * FROM questionnaire_questions WHERE questionnaire_id = ?", (item["id"],))
        item["questions"] = [dict(q) for q in cur.fetchall()]

    conn.close()
    return questionnaires

@app.post("/api/trainer/questionnaires")
def create_questionnaire(req: QuestionnaireCreate, user: dict = Depends(require_role(["trainer"]))):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO questionnaires (trainer_id, course_id, title, description, subject, deadline)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user["id"], req.course_id, req.title, req.description, req.subject, req.deadline))
    q_id = cur.lastrowid

    for q in req.questions:
        cur.execute("""
            INSERT INTO questionnaire_questions (questionnaire_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (q_id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer.upper()))

    conn.commit()
    conn.close()
    return {"message": "Questionnaire created successfully", "questionnaire_id": q_id}

@app.delete("/api/trainer/questionnaires/{questionnaire_id}")
def delete_questionnaire(questionnaire_id: int, user: dict = Depends(require_role(["trainer", "admin"]))):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM questionnaires WHERE id = ?", (questionnaire_id,))
    conn.commit()
    conn.close()
    return {"message": "Questionnaire deleted successfully"}

@app.put("/api/trainer/questionnaires/{questionnaire_id}")
def update_questionnaire(questionnaire_id: int, req: QuestionnaireUpdate, user: dict = Depends(require_role(["trainer", "admin"]))):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, trainer_id FROM questionnaires WHERE id = ?", (questionnaire_id,))
    q = cur.fetchone()
    if not q:
        conn.close()
        raise HTTPException(status_code=404, detail="Questionnaire not found")
    if user["role"] == "trainer" and q["trainer_id"] != user["id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized to edit this questionnaire")

    cur.execute("""
        UPDATE questionnaires SET
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            deadline = COALESCE(?, deadline)
        WHERE id = ?
    """, (req.title, req.description, req.deadline, questionnaire_id))

    if req.questions is not None:
        cur.execute("DELETE FROM questionnaire_questions WHERE questionnaire_id = ?", (questionnaire_id,))
        for q_item in req.questions:
            cur.execute("""
                INSERT INTO questionnaire_questions (questionnaire_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (questionnaire_id, q_item.question_text, q_item.option_a, q_item.option_b, q_item.option_c, q_item.option_d, q_item.correct_answer.upper()))

    conn.commit()
    conn.close()
    return {"message": "Questionnaire updated successfully"}

@app.get("/api/trainer/questionnaires/{questionnaire_id}/responses")
def get_questionnaire_responses(questionnaire_id: int, user: dict = Depends(require_role(["trainer", "admin"]))):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT q.*, c.title as course_title,
               (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = q.course_id) as total_enrolled
        FROM questionnaires q
        JOIN courses c ON q.course_id = c.id
        WHERE q.id = ?
    """, (questionnaire_id,))
    q = cur.fetchone()
    if not q:
        conn.close()
        raise HTTPException(status_code=404, detail="Questionnaire not found")

    q_dict = dict(q)

    # Fetch questions
    cur.execute("SELECT * FROM questionnaire_questions WHERE questionnaire_id = ?", (questionnaire_id,))
    questions = [dict(row) for row in cur.fetchall()]

    # Fetch trainee responses
    cur.execute("""
        SELECT qr.id, qr.questionnaire_id, qr.user_id, qr.answers, qr.score as score_percentage, qr.submitted_at,
               u.full_name as trainee_name, u.email as trainee_email
        FROM questionnaire_responses qr
        JOIN users u ON qr.user_id = u.id
        WHERE qr.questionnaire_id = ?
        ORDER BY qr.submitted_at DESC
    """, (questionnaire_id,))
    responses = [dict(r) for r in cur.fetchall()]

    # Parse scores
    scores = [r["score_percentage"] for r in responses]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    total_enrolled = q_dict.get("total_enrolled", 0)
    participation_rate = round(len(responses) / total_enrolled * 100, 1) if total_enrolled > 0 else 0.0

    conn.close()
    return {
        "questionnaire": q_dict,
        "questions": questions,
        "responses": responses,
        "total_responses": len(responses),
        "total_enrolled": total_enrolled,
        "participation_rate": participation_rate,
        "average_score": avg_score
    }

@app.get("/api/trainee/questionnaires")
def get_trainee_questionnaires(user: dict = Depends(require_role(["trainee"]))):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT q.id, q.course_id, q.title, q.description, q.subject, q.deadline, q.created_at,
               c.title as course_title, u.full_name as trainer_name,
               (SELECT COUNT(*) FROM questionnaire_questions qq WHERE qq.questionnaire_id = q.id) as question_count,
               qr.score as my_score,
               qr.submitted_at as my_submitted_at
        FROM questionnaires q
        JOIN courses c ON q.course_id = c.id
        JOIN enrollments e ON e.course_id = q.course_id AND e.user_id = ?
        LEFT JOIN users u ON q.trainer_id = u.id
        LEFT JOIN questionnaire_responses qr ON qr.questionnaire_id = q.id AND qr.user_id = ?
        ORDER BY q.created_at DESC
    """, (user["id"], user["id"]))
    rows = cur.fetchall()

    items = []
    now_iso = datetime.utcnow().isoformat()
    for r in rows:
        d = dict(r)
        d["has_submitted"] = (d["my_score"] is not None)
        try:
            deadline_clean = d["deadline"].replace("Z", "+00:00")
            deadline_dt = datetime.fromisoformat(deadline_clean)
            if deadline_dt.tzinfo is not None:
                d["is_expired"] = (deadline_dt < datetime.now(deadline_dt.tzinfo))
            else:
                d["is_expired"] = (deadline_dt < datetime.utcnow())
        except Exception:
            d["is_expired"] = (d["deadline"] < now_iso)
        items.append(d)

    conn.close()
    return items

@app.get("/api/trainee/questionnaires/{questionnaire_id}")
def get_trainee_questionnaire_detail(questionnaire_id: int, user: dict = Depends(require_role(["trainee"]))):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT q.*, c.title as course_title
        FROM questionnaires q
        JOIN courses c ON q.course_id = c.id
        JOIN enrollments e ON e.course_id = q.course_id AND e.user_id = ?
        WHERE q.id = ?
    """, (user["id"], questionnaire_id))
    q = cur.fetchone()
    if not q:
        conn.close()
        raise HTTPException(status_code=403, detail="You are not enrolled in the course for this questionnaire")

    q_dict = dict(q)

    # Check if already submitted
    cur.execute("SELECT score as score_percentage, submitted_at, answers FROM questionnaire_responses WHERE questionnaire_id = ? AND user_id = ?", (questionnaire_id, user["id"]))
    existing = cur.fetchone()
    q_dict["my_response"] = dict(existing) if existing else None

    # Return questions (without correct_answer to prevent premature cheating)
    cur.execute("SELECT id, question_text, option_a, option_b, option_c, option_d FROM questionnaire_questions WHERE questionnaire_id = ?", (questionnaire_id,))
    q_dict["questions"] = [dict(row) for row in cur.fetchall()]

    conn.close()
    return q_dict

@app.post("/api/trainee/questionnaires/{questionnaire_id}/submit")
def submit_trainee_questionnaire(questionnaire_id: int, req: QuestionnaireResponseSubmit, user: dict = Depends(require_role(["trainee"]))):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM questionnaires WHERE id = ?", (questionnaire_id,))
    q = cur.fetchone()
    if not q:
        conn.close()
        raise HTTPException(status_code=404, detail="Questionnaire not found")

    # Verify enrollment
    cur.execute("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?", (user["id"], q["course_id"]))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=403, detail="You are not enrolled in this questionnaire's course")

    # Check deadline strictly
    now_utc = datetime.utcnow()
    try:
        deadline_clean = q["deadline"].replace("Z", "+00:00")
        deadline_dt = datetime.fromisoformat(deadline_clean)
        if deadline_dt.tzinfo is not None:
            now_utc = datetime.now(deadline_dt.tzinfo)
        if deadline_dt < now_utc:
            conn.close()
            raise HTTPException(status_code=400, detail="Questionnaire deadline has passed. Submissions are closed.")
    except HTTPException:
        raise
    except Exception:
        if q["deadline"] < now_utc.isoformat():
            conn.close()
            raise HTTPException(status_code=400, detail="Questionnaire deadline has passed. Submissions are closed.")

    cur.execute("SELECT id, correct_answer FROM questionnaire_questions WHERE questionnaire_id = ?", (questionnaire_id,))
    questions = cur.fetchall()
    if not questions:
        conn.close()
        raise HTTPException(status_code=400, detail="This questionnaire has no questions")

    correct_count = 0
    total = len(questions)
    for q_item in questions:
        q_id_str = str(q_item["id"])
        submitted = req.answers.get(q_id_str, "").strip().upper()
        if submitted and submitted == q_item["correct_answer"].strip().upper():
            correct_count += 1

    score_pct = round((correct_count / total) * 100, 1)

    cur.execute("""
        INSERT INTO questionnaire_responses (questionnaire_id, user_id, answers, score, submitted_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(questionnaire_id, user_id) DO UPDATE SET
            answers = excluded.answers,
            score = excluded.score,
            submitted_at = CURRENT_TIMESTAMP
    """, (questionnaire_id, user["id"], json.dumps(req.answers), score_pct))

    conn.commit()
    conn.close()
    return {
        "message": "Questionnaire submitted successfully",
        "score_percentage": score_pct,
        "correct_answers": correct_count,
        "total_questions": total
    }

def extract_yt_id(url_or_id: Optional[str]) -> Optional[str]:
    if not url_or_id:
        return None
    trimmed = url_or_id.strip()
    if re.match(r'^[a-zA-Z0-9_-]{11}$', trimmed):
        return trimmed
    m = re.search(r'youtu\.be/([a-zA-Z0-9_-]{11})', trimmed)
    if m:
        return m.group(1)
    m = re.search(r'[?&]v=([a-zA-Z0-9_-]{11})', trimmed)
    if m:
        return m.group(1)
    m = re.search(r'youtube\.com/embed/([a-zA-Z0-9_-]{11})', trimmed)
    if m:
        return m.group(1)
    return None

@app.get("/api/admin/courses/{course_id}/content")
def get_admin_course_content(course_id: int, user: dict = Depends(require_role(["admin", "trainer"]))):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM courses WHERE id = ?", (course_id,))
    course = cur.fetchone()
    if not course:
        conn.close()
        raise HTTPException(status_code=404, detail="Course not found")
    
    cur.execute("SELECT * FROM modules WHERE course_id = ? ORDER BY module_number ASC", (course_id,))
    modules = [dict(m) for m in cur.fetchall()]
    for mod in modules:
        cur.execute("SELECT * FROM lessons WHERE module_id = ? ORDER BY lesson_number ASC", (mod["id"],))
        mod["lessons"] = [dict(l) for l in cur.fetchall()]
        cur.execute("SELECT * FROM resources WHERE module_id = ?", (mod["id"],))
        mod["resources"] = [dict(r) for r in cur.fetchall()]

    conn.close()
    return {"course": dict(course), "modules": modules}

@app.post("/api/admin/modules/{module_id}/lessons")
def create_module_lesson(module_id: int, req: LessonCreate, user: dict = Depends(require_role(["admin", "trainer"]))):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM lessons WHERE module_id = ?", (module_id,))
    cnt = cur.fetchone()[0]
    next_num = cnt + 1
    video_id = req.video_id or extract_yt_id(req.video_url)
    cur.execute("""
        INSERT INTO lessons (module_id, lesson_number, title, content, video_url, video_id, duration_minutes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (module_id, next_num, req.title, req.content, req.video_url, video_id, req.duration_minutes))
    lesson_id = cur.lastrowid
    conn.commit()
    conn.close()
    return {"message": "Lesson added successfully", "lesson_id": lesson_id}

@app.put("/api/admin/lessons/{lesson_id}")
def update_lesson(lesson_id: int, req: LessonCreate, user: dict = Depends(require_role(["admin", "trainer"]))):
    conn = get_connection()
    cur = conn.cursor()
    video_id = req.video_id or extract_yt_id(req.video_url)
    cur.execute("""
        UPDATE lessons SET
            title = ?,
            content = ?,
            video_url = ?,
            video_id = ?,
            duration_minutes = ?
        WHERE id = ?
    """, (req.title, req.content, req.video_url, video_id, req.duration_minutes, lesson_id))
    conn.commit()
    conn.close()
    return {"message": "Lesson updated successfully"}

@app.delete("/api/admin/lessons/{lesson_id}")
def delete_lesson(lesson_id: int, user: dict = Depends(require_role(["admin", "trainer"]))):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM lessons WHERE id = ?", (lesson_id,))
    conn.commit()
    conn.close()
    return {"message": "Lesson deleted successfully"}

@app.post("/api/admin/modules/{module_id}/resources")
def add_module_resource(module_id: int, req: LibraryResourceCreate, user: dict = Depends(require_role(["admin", "trainer"]))):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT course_id FROM modules WHERE id = ?", (module_id,))
    mod = cur.fetchone()
    if not mod:
        conn.close()
        raise HTTPException(status_code=404, detail="Module not found")
    c_id = mod["course_id"]
    cur.execute("""
        INSERT INTO resources (course_id, module_id, title, resource_type, file_url)
        VALUES (?, ?, ?, ?, ?)
    """, (c_id, module_id, req.title, req.resource_type, req.file_url))
    conn.commit()
    conn.close()
    return {"message": "Study resource attached to module successfully"}

@app.get("/api/trainer/library")
def get_trainer_library(user: dict = Depends(require_role(["trainer"]))):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT tl.*, c.title as course_title, m.title as module_title
        FROM trainer_library tl
        LEFT JOIN courses c ON tl.course_id = c.id
        LEFT JOIN modules m ON tl.module_id = m.id
        WHERE tl.trainer_id = ?
        ORDER BY tl.created_at DESC
    """, (user["id"],))
    resources = [dict(r) for r in cur.fetchall()]
    conn.close()
    return resources

@app.post("/api/trainer/library")
def add_trainer_library_resource(req: LibraryResourceCreate, user: dict = Depends(require_role(["trainer"]))):
    # Validate dangerous file types
    prohibited_exts = [".exe", ".bat", ".cmd", ".sh", ".vbs", ".msi"]
    for ext in prohibited_exts:
        if req.file_url.lower().endswith(ext):
            raise HTTPException(status_code=400, detail="Prohibited file type uploaded.")

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO trainer_library (trainer_id, course_id, module_id, title, description, resource_type, file_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user["id"], req.course_id, req.module_id, req.title, req.description, req.resource_type, req.file_url))

    # Also insert into resources table so enrolled trainees can view it!
    if req.course_id:
        cur.execute("""
            INSERT INTO resources (course_id, module_id, title, resource_type, file_url)
            VALUES (?, ?, ?, ?, ?)
        """, (req.course_id, req.module_id, req.title, req.resource_type, req.file_url))

    conn.commit()
    conn.close()
    return {"message": "Resource published to library successfully"}

@app.delete("/api/trainer/library/{resource_id}")
def delete_trainer_library_resource(resource_id: int, user: dict = Depends(require_role(["trainer"]))):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM trainer_library WHERE id = ? AND trainer_id = ?", (resource_id, user["id"]))
    conn.commit()
    conn.close()
    return {"message": "Resource deleted from library"}

# ==========================================
# ADMIN MODULE
# ==========================================

@app.get("/api/admin/dashboard")
def get_admin_dashboard(user: dict = Depends(require_role(["admin"]))):
    """
    Real database statistics:
    - Total users
    - Total trainees
    - Total trainers
    - Pending approvals
    - Total courses
    - Total enrollments
    - Assessment attempts
    - Average score
    - Certificates
    - Participation
    - Completion rate
    """
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM users")
    total_users = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM users WHERE role = 'trainee'")
    total_trainees = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM users WHERE role = 'trainer'")
    total_trainers = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM users WHERE status = 'pending'")
    pending_approvals = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM courses")
    total_courses = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM enrollments")
    total_enrollments = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*), AVG(score_percentage) FROM assessment_attempts")
    attempts_count, avg_score = cur.fetchone()
    avg_score = round(avg_score, 1) if avg_score else 0.0

    cur.execute("SELECT COUNT(*) FROM certificates")
    total_certificates = cur.fetchone()[0]

    completion_rate = round((total_certificates / total_enrollments * 100), 1) if total_enrollments > 0 else 0.0
    participation_rate = round(min(100.0, (attempts_count / total_enrollments * 100)), 1) if total_enrollments > 0 else 0.0

    conn.close()
    return {
        "total_users": total_users,
        "total_trainees": total_trainees,
        "total_trainers": total_trainers,
        "pending_approvals": pending_approvals,
        "total_courses": total_courses,
        "total_enrollments": total_enrollments,
        "assessment_attempts": attempts_count,
        "average_score": avg_score,
        "certificates": total_certificates,
        "participation_rate": participation_rate,
        "completion_rate": completion_rate
    }

@app.get("/api/admin/users")
def get_all_users(role: Optional[str] = None, status_filter: Optional[str] = None, user: dict = Depends(require_role(["admin"]))):
    conn = get_connection()
    cur = conn.cursor()

    query = "SELECT id, full_name, email, phone, role, status, created_at FROM users WHERE 1=1"
    params = []
    if role and role != "all":
        query += " AND role = ?"
        params.append(role)
    if status_filter and status_filter != "all":
        query += " AND status = ?"
        params.append(status_filter)

    query += " ORDER BY created_at DESC"
    cur.execute(query, params)
    users = [dict(r) for r in cur.fetchall()]

    conn.close()
    return users

@app.put("/api/admin/users/{user_id}/status")
def update_user_status(user_id: int, req: UserStatusUpdate, user: dict = Depends(require_role(["admin"]))):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, role, email FROM users WHERE id = ?", (user_id,))
    target = cur.fetchone()
    if not target:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent deactivating self
    if target["id"] == user["id"] and req.status == "deactivated":
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot deactivate your own administrator account")

    update_fields = ["status = ?"]
    params = [req.status]

    if req.role and req.role in ["trainee", "trainer", "admin"]:
        update_fields.append("role = ?")
        params.append(req.role)

    params.append(user_id)
    cur.execute(f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?", params)
    conn.commit()
    conn.close()

    return {"message": f"User status updated to {req.status}"}

@app.get("/api/admin/competency-mapping/{course_id}")
def get_competency_mapping(course_id: int, user: dict = Depends(require_role(["admin"]))):
    """
    CRITICAL FEATURE:
    Runs real competency matching algorithm between course required competencies and trainer profiles.
    Returns:
    - Trainer name
    - Matching skills
    - Missing skills
    - Suitability percentage
    - Recommendation reason
    """
    result = calculate_course_competencies_matching(course_id)
    if not result:
        raise HTTPException(status_code=404, detail="Course not found")
    return result

@app.post("/api/admin/competency-mapping/assign")
def assign_trainer_to_course(req: TrainerAssignRequest, user: dict = Depends(require_role(["admin"]))):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, title FROM courses WHERE id = ?", (req.course_id,))
    course = cur.fetchone()
    if not course:
        conn.close()
        raise HTTPException(status_code=404, detail="Course not found")

    cur.execute("SELECT id, full_name, role, status FROM users WHERE id = ? AND role = 'trainer'", (req.trainer_id,))
    trainer = cur.fetchone()
    if not trainer:
        conn.close()
        raise HTTPException(status_code=404, detail="Trainer not found or user is not a trainer")

    cur.execute("UPDATE courses SET instructor_id = ? WHERE id = ?", (req.trainer_id, req.course_id))

    # Send notification to assigned trainer
    cur.execute("""
        INSERT INTO notifications (user_id, target_role, title, message)
        VALUES (?, 'trainer', 'Course Assignment Updated', ?)
    """, (req.trainer_id, f"You have been successfully assigned as the lead instructor for course: {course['title']}."))

    conn.commit()
    conn.close()

    return {
        "message": f"Successfully assigned {trainer['full_name']} to {course['title']}",
        "course_id": req.course_id,
        "trainer_id": req.trainer_id,
        "trainer_name": trainer["full_name"]
    }

@app.post("/api/admin/courses")
def create_course(req: CourseCreate, user: dict = Depends(require_role(["admin"]))):
    conn = get_connection()
    cur = conn.cursor()

    thumbnail = req.thumbnail or "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80"

    cur.execute("""
        INSERT INTO courses (title, description, subject, difficulty, duration, instructor_id, thumbnail, published)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    """, (req.title, req.description, req.subject, req.difficulty, req.duration, req.instructor_id, thumbnail))
    course_id = cur.lastrowid

    # Add required competencies
    for comp_name in req.competencies:
        comp_name_clean = comp_name.strip()
        cur.execute("SELECT id FROM competencies WHERE LOWER(name) = LOWER(?)", (comp_name_clean,))
        row = cur.fetchone()
        if not row:
            cur.execute("INSERT INTO competencies (name, category) VALUES (?, 'Technical')", (comp_name_clean,))
            comp_id = cur.lastrowid
        else:
            comp_id = row["id"]
        cur.execute("INSERT INTO course_competencies (course_id, competency_id, required_level) VALUES (?, ?, 'Required')", (course_id, comp_id))

    # Default 4 modules if none supplied
    from api.video_service import search_and_verify_course_video
    assigned_vids = set()

    if req.modules:
        modules_to_create = req.modules
    else:
        modules_to_create = [
            ModuleCreate(title="Module 1: Foundations & Architecture", description=f"Core introductory concepts and architectural primitives for {req.title}", lessons=[
                LessonCreate(title=f"Introduction to {req.title} Foundations", content="Foundational overview of concepts, architecture, and principles.")
            ]),
            ModuleCreate(title="Module 2: In-Depth Implementation", description=f"Hands-on implementation, patterns, and practical configurations for {req.title}", lessons=[
                LessonCreate(title=f"Applied Techniques in {req.title}", content="Practical implementation techniques, workflows, and configurations.")
            ]),
            ModuleCreate(title="Module 3: Advanced Optimization", description=f"Performance profiling, system optimization, and design constraints for {req.title}", lessons=[
                LessonCreate(title=f"Optimization Strategies in {req.title}", content="Optimization strategies, resource tuning, and profiling.")
            ]),
            ModuleCreate(title="Module 4: Enterprise Production Deployment", description=f"Real-world system integration, security, and verification for {req.title}", lessons=[
                LessonCreate(title=f"Production Delivery for {req.title}", content="Production hardening, security best practices, and deployment.")
            ])
        ]

    for m_idx, mod in enumerate(modules_to_create, start=1):
        cur.execute("INSERT INTO modules (course_id, module_number, title, description) VALUES (?, ?, ?, ?)", (course_id, m_idx, mod.title, mod.description))
        mod_id = cur.lastrowid
        for l_idx, les in enumerate(mod.lessons, start=1):
            vid = les.video_id
            v_url = les.video_url
            if not vid or not v_url:
                res = search_and_verify_course_video(
                    course_title=req.title,
                    module_title=mod.title,
                    course_id=course_id,
                    module_id=mod_id,
                    lesson_number=l_idx,
                    module_topic=les.title,
                    learning_objectives=les.content or "",
                    course_description=req.description or "",
                    module_description=mod.description or "",
                    used_video_ids=assigned_vids
                )
                vid = res["video_id"]
                v_url = res["video_url"]
            if vid:
                assigned_vids.add(vid)

            cur.execute("""
                INSERT INTO lessons (module_id, lesson_number, title, content, video_url, video_id, duration_minutes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (mod_id, l_idx, les.title, les.content, v_url, vid, les.duration_minutes))

    # Seed domain-specific, course-relevant assessment questions
    conn.commit()
    conn.close()
    seed_course_questions(course_id)

    return {"message": "Course created successfully with 4 structured modules and question pool", "course_id": course_id}

@app.post("/api/admin/courses/{course_id}/regenerate-questions")
def regenerate_course_questions(course_id: int, user: dict = Depends(require_role(["admin"]))):
    seed_course_questions(course_id)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM questions WHERE course_id = ?", (course_id,))
    total = cur.fetchone()[0]
    conn.close()
    return {"message": f"Successfully regenerated {total} course-specific questions", "course_id": course_id, "questions_count": total}

@app.put("/api/admin/courses/{course_id}")
def update_course(course_id: int, req: CourseUpdate, user: dict = Depends(require_role(["admin"]))):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE courses SET
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            subject = COALESCE(?, subject),
            difficulty = COALESCE(?, difficulty),
            duration = COALESCE(?, duration),
            instructor_id = COALESCE(?, instructor_id),
            thumbnail = COALESCE(?, thumbnail),
            published = COALESCE(?, published)
        WHERE id = ?
    """, (req.title, req.description, req.subject, req.difficulty, req.duration, req.instructor_id, req.thumbnail, req.published, course_id))

    conn.commit()
    conn.close()
    return {"message": "Course updated successfully"}

@app.delete("/api/admin/courses/{course_id}")
def delete_course(course_id: int, user: dict = Depends(require_role(["admin"]))):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM courses WHERE id = ?", (course_id,))
    conn.commit()
    conn.close()
    return {"message": "Course deleted successfully"}

@app.get("/api/admin/assessments")
def get_all_assessments(user: dict = Depends(require_role(["admin"]))):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT aa.*, u.full_name as trainee_name, u.email as trainee_email,
               c.title as course_title
        FROM assessment_attempts aa
        JOIN users u ON aa.user_id = u.id
        JOIN courses c ON aa.course_id = c.id
        ORDER BY aa.completed_at DESC
        LIMIT 50
    """)
    attempts = [dict(r) for r in cur.fetchall()]
    conn.close()
    return attempts

@app.get("/api/admin/certifications")
def get_all_certifications(user: dict = Depends(require_role(["admin"]))):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT cert.*, u.full_name as trainee_name, u.email as trainee_email,
               c.title as course_title, c.subject as course_subject
        FROM certificates cert
        JOIN users u ON cert.user_id = u.id
        JOIN courses c ON cert.course_id = c.id
        ORDER BY cert.issue_date DESC
    """)
    certs = [dict(r) for r in cur.fetchall()]
    conn.close()
    return certs

# Announcements
@app.post("/api/admin/announcements")
def create_announcement(req: AnnouncementCreate, user: dict = Depends(require_role(["admin"]))):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO announcements (title, description, status, target_audience) VALUES (?, ?, ?, ?)",
                (req.title, req.description, req.status, req.target_audience))
    conn.commit()
    conn.close()
    return {"message": "Announcement published successfully"}

@app.delete("/api/admin/announcements/{announcement_id}")
def delete_announcement(announcement_id: int, user: dict = Depends(require_role(["admin"]))):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM announcements WHERE id = ?", (announcement_id,))
    conn.commit()
    conn.close()
    return {"message": "Announcement deleted"}

# Achievements
@app.post("/api/admin/achievements")
def create_achievement(req: AchievementCreate, user: dict = Depends(require_role(["admin"]))):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO achievements (title, description, metric, recipient) VALUES (?, ?, ?, ?)",
                (req.title, req.description, req.metric, req.recipient))
    conn.commit()
    conn.close()
    return {"message": "Achievement added successfully"}

@app.delete("/api/admin/achievements/{achievement_id}")
def delete_achievement(achievement_id: int, user: dict = Depends(require_role(["admin"]))):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM achievements WHERE id = ?", (achievement_id,))
    conn.commit()
    conn.close()
    return {"message": "Achievement deleted"}

# Learning Content
@app.post("/api/admin/learning-content")
def create_learning_content(req: LearningContentCreate, user: dict = Depends(require_role(["admin"]))):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO learning_content (title, category, description, media_url) VALUES (?, ?, ?, ?)",
                (req.title, req.category, req.description, req.media_url))
    conn.commit()
    conn.close()
    return {"message": "Learning content published"}

@app.delete("/api/admin/learning-content/{content_id}")
def delete_learning_content(content_id: int, user: dict = Depends(require_role(["admin"]))):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM learning_content WHERE id = ?", (content_id,))
    conn.commit()
    conn.close()
    return {"message": "Learning content removed"}

# Notifications
@app.get("/api/notifications")
def get_user_notifications(user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT * FROM notifications
        WHERE (user_id = ? OR target_role = ? OR target_role = 'all')
        ORDER BY created_at DESC
        LIMIT 20
    """, (user["id"], user["role"]))
    notes = [dict(r) for r in cur.fetchall()]

    unread_count = sum(1 for n in notes if not n["is_read"])
    conn.close()
    return {"notifications": notes, "unread_count": unread_count}

@app.put("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", (notification_id,))
    conn.commit()
    conn.close()
    return {"message": "Notification marked as read"}
