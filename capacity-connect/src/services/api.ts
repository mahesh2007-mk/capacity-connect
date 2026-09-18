const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data: any = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let errorMessage = '';
    if (typeof data?.detail === 'string') {
      errorMessage = data.detail;
    } else if (Array.isArray(data?.detail) && data.detail.length > 0) {
      errorMessage = data.detail.map((d: any) => d.msg || (typeof d === 'string' ? d : JSON.stringify(d))).join(', ');
    } else if (data?.message && typeof data.message === 'string') {
      errorMessage = data.message;
    } else if (typeof data === 'string' && data.trim()) {
      errorMessage = data.trim();
    } else if (response.status === 503 || response.status === 502 || response.status === 504) {
      errorMessage = 'Backend server is unreachable. Please verify the Python API server is running on port 8000.';
    } else {
      errorMessage = response.statusText || 'An unexpected error occurred';
    }
    const error: any = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export const api = {
  // Public
  getLandingData: () => apiRequest('/api/public/landing'),
  getCourses: (params?: { search?: string; subject?: string; difficulty?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.subject) query.set('subject', params.subject);
    if (params?.difficulty) query.set('difficulty', params.difficulty);
    const qs = query.toString();
    return apiRequest(`/api/courses${qs ? `?${qs}` : ''}`);
  },
  getCourseDetail: (courseId: number) => apiRequest(`/api/courses/${courseId}`),
  searchOrGenerateCourse: (query: string) =>
    apiRequest('/api/courses/search-or-generate', { method: 'POST', body: JSON.stringify({ query }) }),
  verifyCertificate: (certId: string) => apiRequest(`/api/certificates/verify/${certId}`),

  // Auth
  signup: (payload: any) => apiRequest('/api/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => apiRequest('/api/auth/me'),

  // Trainee
  getTraineeProfile: () => apiRequest('/api/trainee/profile'),
  updateTraineeProfile: (payload: any) => apiRequest('/api/trainee/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  getTraineeDashboard: () => apiRequest('/api/trainee/dashboard'),
  enrollCourse: (courseId: number) => apiRequest(`/api/trainee/enroll/${courseId}`, { method: 'POST' }),
  getLearningPath: (courseId: number) => apiRequest(`/api/trainee/learning-path/${courseId}`),
  downloadCourseStudyMaterial: async (courseId: number, courseTitle: string) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/api/trainee/courses/${courseId}/study-material`, {
      headers,
    });
    if (!res.ok) {
      throw new Error('Failed to generate course study material PDF');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanTitle = courseTitle.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    a.download = `${cleanTitle}_Study_Material.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  completeModule: (courseId: number, moduleId: number) =>
    apiRequest('/api/trainee/learning-path/complete-module', { method: 'POST', body: JSON.stringify({ course_id: courseId, module_id: moduleId }) }),
  getAssessment: (courseId: number, count: number = 20) => apiRequest(`/api/trainee/assessment/${courseId}?count=${count}`),
  submitAssessment: (payload: any) => apiRequest('/api/trainee/assessment/submit', { method: 'POST', body: JSON.stringify(payload) }),
  getAssessmentHistory: (courseId: number) => apiRequest(`/api/trainee/assessment/history/${courseId}`),
  getTraineeCertificates: () => apiRequest('/api/trainee/certificates'),
  getCourseResources: (courseId: number) => apiRequest(`/api/trainee/resources/${courseId}`),
  submitFeedback: (payload: any) => apiRequest('/api/trainee/feedback', { method: 'POST', body: JSON.stringify(payload) }),
  getTraineeQuestionnaires: () => apiRequest('/api/trainee/questionnaires'),
  getTraineeQuestionnaireDetail: (id: number) => apiRequest(`/api/trainee/questionnaires/${id}`),
  submitTraineeQuestionnaire: (id: number, answers: Record<string, string>) =>
    apiRequest(`/api/trainee/questionnaires/${id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),

  // Trainer
  getTrainerProfile: () => apiRequest('/api/trainer/profile'),
  updateTrainerProfile: (payload: any) => apiRequest('/api/trainer/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  getTrainerDashboard: () => apiRequest('/api/trainer/dashboard'),
  getTrainerTrainees: () => apiRequest('/api/trainer/trainees'),
  getTrainerQuestionnaires: () => apiRequest('/api/trainer/questionnaires'),
  createQuestionnaire: (payload: any) => apiRequest('/api/trainer/questionnaires', { method: 'POST', body: JSON.stringify(payload) }),
  updateQuestionnaire: (id: number, payload: any) =>
    apiRequest(`/api/trainer/questionnaires/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  getQuestionnaireResponses: (id: number) => apiRequest(`/api/trainer/questionnaires/${id}/responses`),
  deleteQuestionnaire: (id: number) => apiRequest(`/api/trainer/questionnaires/${id}`, { method: 'DELETE' }),
  getTrainerLibrary: () => apiRequest('/api/trainer/library'),
  addLibraryResource: (payload: any) => apiRequest('/api/trainer/library', { method: 'POST', body: JSON.stringify(payload) }),
  deleteLibraryResource: (id: number) => apiRequest(`/api/trainer/library/${id}`, { method: 'DELETE' }),

  // Admin
  getAdminDashboard: () => apiRequest('/api/admin/dashboard'),
  getAdminUsers: (role?: string, statusFilter?: string) => {
    const query = new URLSearchParams();
    if (role) query.set('role', role);
    if (statusFilter) query.set('status_filter', statusFilter);
    const qs = query.toString();
    return apiRequest(`/api/admin/users${qs ? `?${qs}` : ''}`);
  },
  updateUserStatus: (userId: number, payload: { status: string; role?: string }) =>
    apiRequest(`/api/admin/users/${userId}/status`, { method: 'PUT', body: JSON.stringify(payload) }),
  createCourse: (payload: any) => apiRequest('/api/admin/courses', { method: 'POST', body: JSON.stringify(payload) }),
  updateCourse: (courseId: number, payload: any) => apiRequest(`/api/admin/courses/${courseId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCourse: (courseId: number) => apiRequest(`/api/admin/courses/${courseId}`, { method: 'DELETE' }),
  getAdminCourseContent: (courseId: number) => apiRequest(`/api/admin/courses/${courseId}/content`),
  createModuleLesson: (moduleId: number, payload: any) =>
    apiRequest(`/api/admin/modules/${moduleId}/lessons`, { method: 'POST', body: JSON.stringify(payload) }),
  updateLesson: (lessonId: number, payload: any) =>
    apiRequest(`/api/admin/lessons/${lessonId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteLesson: (lessonId: number) => apiRequest(`/api/admin/lessons/${lessonId}`, { method: 'DELETE' }),
  addModuleResource: (moduleId: number, payload: any) =>
    apiRequest(`/api/admin/modules/${moduleId}/resources`, { method: 'POST', body: JSON.stringify(payload) }),
  getCompetencyMapping: (courseId: number) => apiRequest(`/api/admin/competency-mapping/${courseId}`),
  assignTrainerToCourse: (courseId: number, trainerId: number) =>
    apiRequest('/api/admin/competency-mapping/assign', { method: 'POST', body: JSON.stringify({ course_id: courseId, trainer_id: trainerId }) }),
  getAdminAssessments: () => apiRequest('/api/admin/assessments'),
  getAdminCertifications: () => apiRequest('/api/admin/certifications'),
  createAnnouncement: (payload: any) => apiRequest('/api/admin/announcements', { method: 'POST', body: JSON.stringify(payload) }),
  deleteAnnouncement: (id: number) => apiRequest(`/api/admin/announcements/${id}`, { method: 'DELETE' }),
  createAchievement: (payload: any) => apiRequest('/api/admin/achievements', { method: 'POST', body: JSON.stringify(payload) }),
  deleteAchievement: (id: number) => apiRequest(`/api/admin/achievements/${id}`, { method: 'DELETE' }),
  createLearningContent: (payload: any) => apiRequest('/api/admin/learning-content', { method: 'POST', body: JSON.stringify(payload) }),
  deleteLearningContent: (id: number) => apiRequest(`/api/admin/learning-content/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: () => apiRequest('/api/notifications'),
  markNotificationRead: (id: number) => apiRequest(`/api/notifications/${id}/read`, { method: 'PUT' }),
};
