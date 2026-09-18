import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { AssessmentRunner } from '@/components/trainee/AssessmentRunner';
import { CertificateCard } from '@/components/common/CertificateCard';
import { Modal } from '@/components/common/Modal';
import { Award, Lock, Route, ArrowRight, AlertCircle, Clock } from 'lucide-react';

export const AssessmentPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [assessmentData, setAssessmentData] = useState<any | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockReason, setLockReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewingCertificate, setViewingCertificate] = useState<any | null>(null);

  useEffect(() => {
    loadEnrolledCourses();
  }, []);

  const loadEnrolledCourses = async () => {
    try {
      const res = await api.getTraineeDashboard();
      const courses = res.enrolled_courses || [];
      setEnrolledCourses(courses);

      const requestedId = searchParams.get('course_id');
      if (requestedId) {
        setSelectedCourseId(Number(requestedId));
      } else if (courses.length > 0) {
        setSelectedCourseId(courses[0].course_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      loadAssessment(selectedCourseId, questionCount);
    }
  }, [selectedCourseId, questionCount]);

  const loadAssessment = async (cId: number, count: number = 20) => {
    setIsLoading(true);
    setIsLocked(false);
    try {
      const res = await api.getAssessment(cId, count);
      setAssessmentData(res);
    } catch (err: any) {
      if (err.status === 403) {
        setIsLocked(true);
        setLockReason(err.message || 'Assessment is locked until all required Learning Path modules are completed.');
      } else {
        showToast(err.message || 'Failed to load assessment', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetake = () => {
    if (selectedCourseId) {
      loadAssessment(selectedCourseId, questionCount);
    }
  };

  const handleViewCertificate = async (certificateId: string) => {
    try {
      const cert = await api.verifyCertificate(certificateId);
      setViewingCertificate(cert);
    } catch (err: any) {
      showToast(err.message || 'Failed to load certificate', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Switcher */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Timed Competency Evaluation
          </span>
          <h1 className="text-2xl font-black text-gray-950 mt-1">Official Course Assessment</h1>
          <p className="text-xs text-gray-500 mt-1">
            Passing threshold: 70.0%+. Automatic digital certificate issuance upon passing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Question Count & Timing Selector */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Assessment Length & Timing
            </label>
            <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-2xl border border-gray-200">
              {[
                { count: 20, time: '30m' },
                { count: 30, time: '45m' },
                { count: 40, time: '50m' },
                { count: 50, time: '60m' },
              ].map((item) => (
                <button
                  key={item.count}
                  type="button"
                  onClick={() => setQuestionCount(item.count)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    questionCount === item.count
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  {item.count}Q ({item.time})
                </button>
              ))}
            </div>
          </div>

          {enrolledCourses.length > 1 && (
            <div className="w-full sm:w-64">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Select Assessment Course
              </label>
              <select
                value={selectedCourseId || ''}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedCourseId(id);
                  setSearchParams({ course_id: id.toString() });
                }}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {enrolledCourses.map((c) => (
                  <option key={c.course_id} value={c.course_id}>
                    {c.course_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500">Preparing fresh question set and initializing anti-cheat session...</p>
        </div>
      ) : isLocked ? (
        /* Locked View */
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-gray-200 p-10 sm:p-12 shadow-card text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-gray-950">Assessment Currently Locked</h2>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
            {lockReason}
          </p>
          <div className="pt-4">
            <Link
              to={`/trainee/learning-paths?course_id=${selectedCourseId}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-md shadow-brand-500/20"
            >
              <Route className="w-4 h-4" /> Go to Learning Path & Complete Modules
            </Link>
          </div>
        </div>
      ) : assessmentData ? (
        <AssessmentRunner
          courseId={assessmentData.course_id}
          courseTitle={assessmentData.course_title}
          initialQuestions={assessmentData.questions}
          durationSeconds={assessmentData.duration_seconds}
          attemptNumber={assessmentData.attempt_number}
          onAssessmentCompleted={() => {}}
          onRetake={handleRetake}
          onViewCertificate={handleViewCertificate}
        />
      ) : (
        <div className="py-20 text-center text-xs text-gray-500">
          Please select an enrolled course to begin assessment.
        </div>
      )}

      {/* Certificate Viewer Modal */}
      {viewingCertificate && (
        <Modal
          isOpen={!!viewingCertificate}
          onClose={() => setViewingCertificate(null)}
          title="Verified Course Completion Certificate"
          maxWidth="4xl"
        >
          <CertificateCard
            certificate={viewingCertificate}
            onClose={() => setViewingCertificate(null)}
          />
        </Modal>
      )}
    </div>
  );
};
