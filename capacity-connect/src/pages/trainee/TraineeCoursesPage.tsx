import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Course } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Route, CheckCircle, PlusCircle, Search, Clock,
  Award, Sparkles, Layers, ArrowRight, Loader2, RefreshCw
} from 'lucide-react';

export const TraineeCoursesPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [activeSearch]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [coursesRes, dashRes] = await Promise.all([
        api.getCourses({ search: activeSearch || undefined }),
        api.getTraineeDashboard(),
      ]);
      setAllCourses(coursesRes || []);
      const enrolled = (dashRes?.enrolled_courses || []).map((c: any) => c.course_id);
      setEnrolledCourseIds(enrolled);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = search.trim();
    if (!query) {
      setActiveSearch('');
      return;
    }

    setIsGenerating(true);
    try {
      // Direct call to search-or-generate to intelligently find or create
      const res = await api.searchOrGenerateCourse(query);
      if (res.created) {
        showToast(res.message || `Prepared personalized course: ${res.course.title}`, 'success');
      }
      setActiveSearch(query);
      await loadData();
    } catch (err: any) {
      console.error('Search or generate failed:', err);
      showToast(err.message || 'Error searching courses', 'error');
      setActiveSearch(query);
      await loadData();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnroll = async (courseId: number) => {
    setEnrollingId(courseId);
    try {
      const res = await api.enrollCourse(courseId);
      showToast(res.message, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Enrollment failed', 'error');
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Search */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Intelligent Curriculum Catalog
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950 mt-1">
            Course Catalog & Enrollments
          </h1>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Search for any technical curriculum (Python, Java, Docker, Kubernetes, SQL, AI, Cloud, etc.).
            If a topic is not already listed, CAPACITY CONNECT will automatically prepare and structure a 4-module learning path for you.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search or enter any course topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isGenerating}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-all shadow-md flex items-center gap-1.5 shrink-0"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Preparing...
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" /> Find / Create
              </>
            )}
          </button>
        </form>
      </div>

      {/* Loading States */}
      {isGenerating ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-gray-200 p-8 shadow-card flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shadow-inner">
            <Sparkles className="w-7 h-7 animate-pulse text-brand-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Preparing your personalized course...</h3>
          <p className="text-xs text-gray-500 max-w-md">
            Synthesizing 4 structured learning modules, verified educational video lessons, study resources, and competency assessments.
          </p>
        </div>
      ) : isLoading ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-gray-200 p-8 shadow-card flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <h3 className="text-sm font-semibold text-gray-700">Finding your course...</h3>
        </div>
      ) : allCourses.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-gray-200 p-8 shadow-card space-y-4">
          <BookOpen className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">No courses match this query</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Click Find / Create above or search a specific technology like Python, Docker, SQL, Kubernetes, or React.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Available Curricula ({allCourses.length})
            </span>
            {activeSearch && (
              <button
                onClick={() => {
                  setSearch('');
                  setActiveSearch('');
                }}
                className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allCourses.map((c) => {
              const isEnrolled = enrolledCourseIds.includes(c.id);

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative overflow-hidden h-44 bg-gray-100">
                      <img
                        src={c.thumbnail}
                        alt={c.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e: any) => {
                          e.target.src = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-brand-700 shadow-sm">
                          {c.subject}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-950/70 text-white backdrop-blur">
                          {c.difficulty || 'Intermediate'}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-gray-400" /> {c.duration || '6 Weeks'}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">
                          <Layers className="w-3.5 h-3.5" /> 4 Modules
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-gray-950 line-clamp-1 group-hover:text-brand-600 transition-colors">
                        {c.title}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                      <p className="text-[11px] text-gray-400 pt-1 border-t border-gray-100">
                        Trainer: <span className="text-gray-600 font-medium">{c.instructor_name || 'Faculty Trainer'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    {isEnrolled ? (
                      <button
                        onClick={() => navigate(`/trainee/learning-paths?course_id=${c.id}`)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
                      >
                        <Route className="w-4 h-4" /> Open Learning Path
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(c.id)}
                        disabled={enrollingId === c.id}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {enrollingId === c.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Enrolling...
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-4 h-4" /> Enroll in Course
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
