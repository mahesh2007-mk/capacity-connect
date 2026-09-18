from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any

# Authentication
class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    confirm_password: str
    phone: Optional[str] = None
    role: str = "trainee"  # Default trainee; admin creation via signup is strictly forbidden

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

# Profiles
class TraineeProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    institution: Optional[str] = None
    department: Optional[str] = None
    year_of_study: Optional[str] = None
    qualification: Optional[str] = None
    work_experience: Optional[str] = None
    interests: Optional[str] = None
    skills: Optional[str] = None
    certificates: Optional[str] = None

class TrainerProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    qualifications: Optional[str] = None
    work_experience: Optional[str] = None
    skills: List[str] = []
    subjects: List[str] = []
    specializations: List[str] = []
    certifications: List[str] = []

# Course & Modules
class LessonCreate(BaseModel):
    title: str
    content: str
    video_url: Optional[str] = None
    video_id: Optional[str] = None
    duration_minutes: int = 15

class ModuleCreate(BaseModel):
    title: str
    description: str
    lessons: List[LessonCreate] = []

class CourseCreate(BaseModel):
    title: str
    description: str
    subject: str
    difficulty: str
    duration: str
    instructor_id: Optional[int] = None
    thumbnail: Optional[str] = None
    competencies: List[str] = []
    modules: Optional[List[ModuleCreate]] = None

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    difficulty: Optional[str] = None
    duration: Optional[str] = None
    instructor_id: Optional[int] = None
    thumbnail: Optional[str] = None
    published: Optional[int] = None

# Assessment
class AssessmentSubmission(BaseModel):
    course_id: int
    answers: Dict[str, str]  # question_id (str): selected_option ("A", "B", "C", "D")
    time_taken_seconds: int

class QuestionCreate(BaseModel):
    course_id: int
    module_id: Optional[int] = None
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    explanation: Optional[str] = None
    difficulty: str = "medium"
    topic: Optional[str] = None

# Questionnaires
class QuestionnaireQuestionInput(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str

class QuestionnaireCreate(BaseModel):
    course_id: int
    title: str
    description: str
    subject: str
    deadline: str
    questions: List[QuestionnaireQuestionInput]

class QuestionnaireUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[str] = None
    questions: Optional[List[QuestionnaireQuestionInput]] = None

class QuestionnaireResponseSubmit(BaseModel):
    answers: Dict[str, str]  # question_id: option

# Feedback
class FeedbackCreate(BaseModel):
    course_id: int
    overall_rating: int = Field(..., ge=1, le=5)
    content_quality: int = Field(..., ge=1, le=5)
    trainer_quality: int = Field(..., ge=1, le=5)
    learning_resources: int = Field(..., ge=1, le=5)
    assessment_quality: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None

# Announcements & Achievements
class AnnouncementCreate(BaseModel):
    title: str
    description: str
    status: str = "published"
    target_audience: str = "all"

class AchievementCreate(BaseModel):
    title: str
    description: str
    metric: str
    recipient: str

class LearningContentCreate(BaseModel):
    title: str
    category: str
    description: str
    media_url: Optional[str] = None

# Trainer Library Resource
class LibraryResourceCreate(BaseModel):
    course_id: Optional[int] = None
    module_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    resource_type: str
    file_url: str

# Admin Action
class UserStatusUpdate(BaseModel):
    status: str  # 'active', 'pending', 'deactivated'
    role: Optional[str] = None

class TrainerAssignRequest(BaseModel):
    course_id: int
    trainer_id: int
