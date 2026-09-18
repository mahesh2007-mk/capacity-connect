import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { TraineeQuestionnaireModal } from '@/components/trainee/TraineeQuestionnaireModal';
import {
  BookOpen, Route, Award, FileText, CheckCircle2,
  Clock, ArrowRight, Lock, PlusCircle, AlertCircle, FileQuestion
} from 'lucide-react';

export const TraineeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [activeQId, setActiveQId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [res, qList] = await Promise.all([
        api.getTraineeDashboard(),
        api.getTraineeQuestionnaires().catch(() => []),
      ]);
      setDashboardData(res);
      setQuestionnaires(qList || []);
    } catch (err) {
      console.error('Failed to load trainee dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200">
              Trainee Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl">
            Track your enrolled courses, complete learning path modules, unlock timed assessments, and earn verified credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/trainee/courses"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all hover:scale-105"
          >
            <PlusCircle className="w-4 h-4" /> Browse & Enroll Courses
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-950">
              {dashboardData?.stats?.total_enrolled || 0}
            </div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Enrolled Courses
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Route className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-950">
              {dashboardData?.stats?.completed_courses || 0}
            </div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Learning Paths Finished
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-950">
              {dashboardData?.stats?.certificates_count || 0}
            </div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Verified Certificates
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-950 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-600" />
            My Enrolled Curricula
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            Strictly showing only courses selected by you
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-gray-500">Loading enrolled curricula...</div>
        ) : !dashboardData?.enrolled_courses || dashboardData.enrolled_courses.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">No Courses Enrolled Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Select your first technical curriculum to unlock 4-module progressive learning paths and assessment tracks.
            </p>
            <Link
              to="/trainee/courses"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dashboardData.enrolled_courses.map((c: any) => (
              <div
                key={c.course_id}
                className="bg-white rounded-3xl border border-gray-200 p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-6"
              >
                {/* Course Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                      {c.subject}
                    </span>
                    <span className="text-xs text-gray-400">{c.duration}</span>
                  </div>

                  <h3 className="font-bold text-lg text-gray-950">{c.course_name}</h3>
                  <p className="text-xs text-gray-500">Lead Faculty: {c.instructor_name}</p>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-gray-600">Learning Path Progress</span>
                      <span className="text-brand-600">{c.progress}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-600 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Required Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 text-xs">
                    <div className="p-3 rounded-2xl bg-gray-50">
                      <span className="text-[10px] font-bold uppercase text-gray-400 block">
                        Learning Path
                      </span>
                      <span className="font-bold text-gray-800 flex items-center gap-1 mt-0.5">
                        {c.learning_path_completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        {c.learning_path_status}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-gray-50">
                      <span className="text-[10px] font-bold uppercase text-gray-400 block">
                        Assessment Status
                      </span>
                      <span className={`font-bold block mt-0.5 ${
                        c.assessment_status === 'Passed'
                          ? 'text-emerald-700'
                          : c.assessment_status === 'Not Attempted'
                          ? 'text-gray-600'
                          : 'text-amber-700'
                      }`}>
                        {c.assessment_status}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-gray-50">
                      <span className="text-[10px] font-bold uppercase text-gray-400 block">
                        Assessment Score
                      </span>
                      <span className="font-bold text-gray-900 block mt-0.5">
                        {c.score}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-gray-50">
                      <span className="text-[10px] font-bold uppercase text-gray-400 block">
                        Certificate
                      </span>
                      <span className={`font-bold block mt-0.5 ${
                        c.certificate_status === 'Available' ? 'text-emerald-700' : 'text-gray-500'
                      }`}>
                        {c.certificate_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => navigate(`/trainee/learning-paths?course_id=${c.course_id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow transition-all"
                  >
                    <Route className="w-4 h-4" /> Open Learning Path
                  </button>

                  {c.learning_path_completed ? (
                    <button
                      onClick={() => navigate(`/trainee/assessment?course_id=${c.course_id}`)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-all"
                    >
                      <Award className="w-4 h-4" /> Assessment
                    </button>
                  ) : (
                    <button
                      disabled
                      title="Complete all 4 modules to unlock assessment"
                      className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-400 font-bold text-xs cursor-not-allowed flex items-center gap-1 border border-gray-200"
                    >
                      <Lock className="w-3.5 h-3.5" /> Locked
                    </button>
                  )}

                  {c.certificate_status === 'Available' && (
                    <Link
                      to="/trainee/certificates"
                      className="px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100"
                    >
                      Certificate
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Course Questionnaires Section */}
      {questionnaires.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-950 flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-emerald-600" />
              Course Questionnaires & Diagnostic Evaluations
            </h2>
            <span className="text-xs text-gray-500 font-medium">
              Assigned by course trainers with enforced deadlines
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {questionnaires.map((q: any) => (
              <div
                key={q.id}
                className="bg-white rounded-3xl border border-gray-200 p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {q.course_title}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      q.has_submitted
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : q.is_expired
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {q.has_submitted
                        ? `Score: ${q.my_score}%`
                        : q.is_expired
                        ? 'Deadline Passed'
                        : 'Active'}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-gray-950">{q.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {q.description || 'Targeted diagnostic questionnaire for your enrolled curriculum.'}
                  </p>

                  <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span>{q.question_count} Questions</span>
                    <span className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(q.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveQId(q.id)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                      q.has_submitted
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                        : q.is_expired
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                    }`}
                  >
                    <FileQuestion className="w-3.5 h-3.5" />
                    {q.has_submitted ? 'View Your Submission' : q.is_expired ? 'Deadline Passed' : 'Take Questionnaire'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trainee Questionnaire Modal */}
      {activeQId && (
        <TraineeQuestionnaireModal
          isOpen={!!activeQId}
          onClose={() => setActiveQId(null)}
          questionnaireId={activeQId}
          onSubmitted={loadDashboard}
        />
      )}
    </div>
  );
};
