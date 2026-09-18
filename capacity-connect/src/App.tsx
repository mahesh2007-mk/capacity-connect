import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';

// Layouts
import { PublicLayout } from '@/layouts/PublicLayout';
import { TraineeLayout } from '@/layouts/TraineeLayout';
import { TrainerLayout } from '@/layouts/TrainerLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

// Public Pages
import { LandingPage } from '@/pages/public/LandingPage';
import { AboutPage } from '@/pages/public/AboutPage';
import { PublicCoursesPage } from '@/pages/public/PublicCoursesPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { LoginPage } from '@/pages/public/LoginPage';
import { SignupPage } from '@/pages/public/SignupPage';

// Trainee Pages
import { TraineeDashboard } from '@/pages/trainee/TraineeDashboard';
import { TraineeProfilePage } from '@/pages/trainee/TraineeProfilePage';
import { TraineeCoursesPage } from '@/pages/trainee/TraineeCoursesPage';
import { LearningPathPage } from '@/pages/trainee/LearningPathPage';
import { AssessmentPage } from '@/pages/trainee/AssessmentPage';
import { ResourcesPage } from '@/pages/trainee/ResourcesPage';
import { CertificatesPage } from '@/pages/trainee/CertificatesPage';
import { FeedbackPage } from '@/pages/trainee/FeedbackPage';

// Trainer Pages
import { TrainerDashboard } from '@/pages/trainer/TrainerDashboard';
import { TrainerProfilePage } from '@/pages/trainer/TrainerProfilePage';
import { TrainerCoursesPage } from '@/pages/trainer/TrainerCoursesPage';
import { TrainerQuestionnairesPage } from '@/pages/trainer/TrainerQuestionnairesPage';
import { TrainerTraineesPage } from '@/pages/trainer/TrainerTraineesPage';
import { TrainerLibraryPage } from '@/pages/trainer/TrainerLibraryPage';
import { TrainerPerformancePage } from '@/pages/trainer/TrainerPerformancePage';

// Admin Pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import { CourseManagementPage } from '@/pages/admin/CourseManagementPage';
import { CompetencyMappingPage } from '@/pages/admin/CompetencyMappingPage';
import { AssessmentsLogPage } from '@/pages/admin/AssessmentsLogPage';
import { CertificationsMonitoringPage } from '@/pages/admin/CertificationsMonitoringPage';
import { AnnouncementsManagementPage } from '@/pages/admin/AnnouncementsManagementPage';
import { LearningContentManagementPage } from '@/pages/admin/LearningContentManagementPage';

// Protected Route Guard
const RequireRole: React.FC<{ allowedRoles: string[]; children: React.ReactNode }> = ({
  allowedRoles,
  children,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'trainer') return <Navigate to="/trainer" replace />;
    return <Navigate to="/trainee" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/courses" element={<PublicCoursesPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>

            {/* Trainee Routes */}
            <Route
              path="/trainee"
              element={
                <RequireRole allowedRoles={['trainee']}>
                  <TraineeLayout />
                </RequireRole>
              }
            >
              <Route index element={<TraineeDashboard />} />
              <Route path="profile" element={<TraineeProfilePage />} />
              <Route path="courses" element={<TraineeCoursesPage />} />
              <Route path="learning-paths" element={<LearningPathPage />} />
              <Route path="assessment" element={<AssessmentPage />} />
              <Route path="resources" element={<ResourcesPage />} />
              <Route path="certificates" element={<CertificatesPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
            </Route>

            {/* Trainer Routes */}
            <Route
              path="/trainer"
              element={
                <RequireRole allowedRoles={['trainer']}>
                  <TrainerLayout />
                </RequireRole>
              }
            >
              <Route index element={<TrainerDashboard />} />
              <Route path="profile" element={<TrainerProfilePage />} />
              <Route path="courses" element={<TrainerCoursesPage />} />
              <Route path="questionnaires" element={<TrainerQuestionnairesPage />} />
              <Route path="trainees" element={<TrainerTraineesPage />} />
              <Route path="performance" element={<TrainerPerformancePage />} />
              <Route path="library" element={<TrainerLibraryPage />} />
              <Route path="resources" element={<TrainerLibraryPage />} />
            </Route>

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <RequireRole allowedRoles={['admin']}>
                  <AdminLayout />
                </RequireRole>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="courses" element={<CourseManagementPage />} />
              <Route path="competency-mapping" element={<CompetencyMappingPage />} />
              <Route path="assessments" element={<AssessmentsLogPage />} />
              <Route path="certifications" element={<CertificationsMonitoringPage />} />
              <Route path="announcements" element={<AnnouncementsManagementPage />} />
              <Route path="achievements" element={<AnnouncementsManagementPage />} />
              <Route path="learning-content" element={<LearningContentManagementPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
