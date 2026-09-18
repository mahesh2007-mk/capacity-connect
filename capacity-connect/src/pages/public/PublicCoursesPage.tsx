import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Course } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, BookOpen, Clock, Users, CheckCircle,
  ArrowRight, Sparkles, Layers, Loader2
} from 'lucide-react';

export const PublicCoursesPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [subject, setSubject] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  useEffect(() => {
    loadCourses();
  }, [activeSearch, subject, difficulty]);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCourses({
        search: activeSearch || undefined,
        subject: subject !== 'all' ? subject : undefined,
        difficulty: difficulty !== 'all' ? difficulty : undefined,
      });
      setCourses(res || []);
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
      const res = await api.searchOrGenerateCourse(query);
      if (res.created) {
        showToast(`Personalized curriculum prepared: ${res.course.title}`, 'success');
      }
      setActiveSearch(query);
      await loadCourses();
    } catch (err: any) {
      console.error('Search error:', err);
      setActiveSearch(query);
      await loadCourses();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnroll = async (courseId: number) => {
    if (!isAuthenticated) {
      showToast('Please sign in or register to enroll in courses', 'info');
      navigate('/login');
      return;
    }

    if (user?.role !== 'trainee') {
      showToast(`Logged in as ${user?.role}. Only Trainees can enroll in student curricula.`, 'warning');
      return;
    }

    setEnrollingId(courseId);
    try {
      const res = await api.enrollCourse(courseId);
      showToast(res.message, 'success');
      navigate(`/trainee/learning-paths?course_id=${courseId}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to enroll', 'error');
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Comprehensive Curriculum Catalog
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-950">
          Explore Capacity Building Tracks
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          Every curriculum features exactly 4 structured learning path modules, verified educational video lessons, and verifiable certification upon assessment completion.
        </p>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-card flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search or enter any technology (e.g. Python, Docker)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isGenerating}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-all shadow flex items-center gap-1.5 shrink-0"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Find / Create
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
            <Filter className="w-3.5 h-3.5 text-brand-600" /> Filters:
          </div>

          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          >
            <option value="all">All Disciplines</option>
            <option value="Backend Development">Backend Development</option>
            <option value="Frontend Development">Frontend Development</option>
            <option value="DevOps & Cloud">DevOps & Cloud</option>
            <option value="Cyber Security">Cyber Security</option>
            <option value="Data Science & AI">Data Science & AI</option>
            <option value="Software Engineering">Software Engineering</option>
          </select>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          >
            <option value="all">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Courses Grid or Loading States */}
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
      ) : courses.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-gray-200 p-8 shadow-card space-y-3">
          <BookOpen className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">No courses match this filter</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Use the search box above to find or automatically generate a curriculum for any technology.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative overflow-hidden h-48 bg-gray-100">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e: any) => {
                      e.target.src = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-brand-700 shadow-sm">
                      {course.subject}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-gray-950/70 text-white backdrop-blur">
                      {course.difficulty || 'Intermediate'}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-gray-400" /> {course.duration || '6 Weeks'}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">
                      <Layers className="w-3.5 h-3.5" /> 4 Modules
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-gray-950 line-clamp-1 group-hover:text-brand-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                  <p className="text-[11px] text-gray-400 pt-1 border-t border-gray-100">
                    Lead Trainer: <span className="text-gray-700 font-medium">{course.instructor_name || 'Faculty Trainer'}</span>
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => handleEnroll(course.id)}
                  disabled={enrollingId === course.id}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {enrollingId === course.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Enrolling...
                    </>
                  ) : (
                    <>
                      Enroll in Course <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
