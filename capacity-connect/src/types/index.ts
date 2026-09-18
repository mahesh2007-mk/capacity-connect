export type UserRole = 'trainee' | 'trainer' | 'admin';
export type UserStatus = 'active' | 'pending' | 'deactivated';

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  created_at?: string;
}

export interface TraineeProfile {
  user_id: number;
  phone?: string;
  dob?: string;
  gender?: string;
  institution?: string;
  department?: string;
  year_of_study?: string;
  qualification?: string;
  work_experience?: string;
  interests?: string;
  skills?: string;
  certificates?: string;
  updated_at?: string;
}

export interface TrainerProfile {
  user_id: number;
  phone?: string;
  qualifications?: string;
  work_experience?: string;
  skills: string[];
  subjects: string[];
  specializations: string[];
  certifications: string[];
  updated_at?: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  subject: string;
  difficulty: string;
  duration: string;
  instructor_id?: number;
  instructor_name?: string;
  instructor_email?: string;
  thumbnail?: string;
  published: number;
  created_at?: string;
  modules_count?: number;
  enrollments_count?: number;
}

export interface Lesson {
  id: number;
  module_id: number;
  lesson_number: number;
  title: string;
  content: string;
  video_url?: string;
  video_id?: string;
  duration_minutes: number;
  yt_video_title?: string;
  author?: string;
}

export interface Module {
  id: number;
  course_id: number;
  module_number: number;
  title: string;
  description: string;
  completed?: boolean;
  lessons?: Lesson[];
  resources?: Resource[];
}

export interface Resource {
  id: number;
  course_id: number;
  module_id?: number;
  module_title?: string;
  title: string;
  resource_type: string;
  file_url: string;
  created_at?: string;
}

export interface Question {
  id: number;
  course_id: number;
  module_id?: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  difficulty?: string;
  topic?: string;
}

export interface AssessmentAttempt {
  attempt_number: number;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  time_taken_seconds: number;
  completed_at: string;
}

export interface Certificate {
  certificate_id: string;
  issue_date: string;
  instructor_name: string;
  verification_hash: string;
  course_id: number;
  course_title: string;
  course_subject?: string;
  trainee_name: string;
  trainee_email?: string;
}

export interface Feedback {
  course_id: number;
  overall_rating: number;
  content_quality: number;
  trainer_quality: number;
  learning_resources: number;
  assessment_quality: number;
  comments?: string;
}

export interface QuestionnaireQuestion {
  id?: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

export interface Questionnaire {
  id: number;
  trainer_id: number;
  course_id: number;
  course_title?: string;
  title: string;
  description: string;
  subject: string;
  deadline: string;
  created_at: string;
  question_count?: number;
  response_count?: number;
  questions?: QuestionnaireQuestion[];
}

export interface TrainerRecommendation {
  trainer_id: number;
  trainer_name: string;
  trainer_email: string;
  trainer_phone?: string;
  qualifications: string;
  is_currently_assigned: boolean;
  suitability_percentage: number;
  matching_count: number;
  total_required: number;
  matching_skills: string[];
  missing_skills: string[];
  all_trainer_skills: string[];
  recommendation: string;
  recommendation_reason: string;
}

export interface CompetencyMappingResult {
  course_id: number;
  course_title: string;
  subject: string;
  current_instructor_id?: number;
  required_competencies: string[];
  trainer_recommendations: TrainerRecommendation[];
}

export interface Announcement {
  id: number;
  title: string;
  description: string;
  status: string;
  target_audience: string;
  created_at: string;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  metric: string;
  recipient: string;
  created_at: string;
}

export interface LearningContent {
  id: number;
  title: string;
  category: string;
  description: string;
  media_url?: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  user_id?: number;
  target_role?: string;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}
