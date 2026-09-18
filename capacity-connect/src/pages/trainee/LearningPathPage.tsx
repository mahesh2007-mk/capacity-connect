import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { LearningPathViewer } from '@/components/trainee/LearningPathViewer';
import { BookOpen, Route, AlertCircle } from 'lucide-react';

export const LearningPathPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [learningPathData, setLearningPathData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      loadLearningPath(selectedCourseId);
    }
  }, [selectedCourseId]);

  const loadLearningPath = async (cId: number) => {
    setIsLoading(true);
    try {
      const res = await api.getLearningPath(cId);
      setLearningPathData(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load learning path', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteModule = async (moduleId: number) => {
    if (!selectedCourseId) return;
    try {
      const res = await api.completeModule(selectedCourseId, moduleId);
      showToast(res.message, 'success');
      await loadLearningPath(selectedCourseId);
    } catch (err: any) {
      showToast(err.message || 'Failed to complete module', 'error');
    }
  };

  const handleStartAssessment = () => {
    if (selectedCourseId) {
      navigate(`/trainee/assessment?course_id=${selectedCourseId}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header and Course Switcher */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Curriculum Progression
          </span>
          <h1 className="text-2xl font-black text-gray-950 mt-1">
            {learningPathData?.course?.title || 'Structured Learning Path'}
          </h1>
          <p className="text-xs text-gray-500">
            {learningPathData?.course?.title ? (
              <>Curriculum: <strong className="text-brand-700 font-bold">{learningPathData.course.title}</strong> &bull; Complete all 4 modules to unlock official certification.</>
            ) : (
              'Complete all 4 required modules to unlock the official assessment track.'
            )}
          </p>
        </div>

        {enrolledCourses.length > 1 && (
          <div className="w-full sm:w-72">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Switch Enrolled Course
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

      {isLoading ? (
        <div className="py-20 text-center text-xs text-gray-500">
          Loading learning path modules & lesson materials...
        </div>
      ) : !learningPathData ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-bold text-base text-gray-900">No Learning Path Found</h3>
          <p className="text-xs text-gray-500">Please enroll in a course to start your learning path.</p>
        </div>
      ) : (
        <LearningPathViewer
          courseId={learningPathData.course.id}
          courseTitle={learningPathData.course.title}
          modules={learningPathData.modules}
          allModulesCompleted={learningPathData.all_modules_completed}
          onCompleteModule={handleCompleteModule}
          onStartAssessment={handleStartAssessment}
        />
      )}
    </div>
  );
};
