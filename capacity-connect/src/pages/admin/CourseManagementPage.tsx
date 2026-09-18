import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Course } from '@/types';
import { CourseModal } from '@/components/admin/CourseModal';
import { CompetencyModal } from '@/components/admin/CompetencyModal';
import { CourseCurriculumModal } from '@/components/admin/CourseCurriculumModal';
import { useToast } from '@/context/ToastContext';
import {
  BookOpen, Plus, Edit2, Trash2, BrainCircuit,
  Eye, EyeOff, Clock, UserCheck, Search, Video
} from 'lucide-react';

export const CourseManagementPage: React.FC = () => {
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);

  const [matchingCourse, setMatchingCourse] = useState<{ id: number; title: string } | null>(null);
  const [curriculumCourse, setCurriculumCourse] = useState<{ id: number; title: string } | null>(null);

  useEffect(() => {
    loadCourses();
  }, [search]);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCourses({ search: search || undefined });
      setCourses(res || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load courses', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCourse = async (payload: any) => {
    if (courseToEdit) {
      await api.updateCourse(courseToEdit.id, payload);
    } else {
      await api.createCourse(payload);
    }
    await loadCourses();
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!window.confirm('Delete this course and all associated modules?')) return;
    try {
      await api.deleteCourse(courseId);
      showToast('Course removed successfully', 'success');
      await loadCourses();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete course', 'error');
    }
  };

  const handleTogglePublish = async (course: Course) => {
    const nextState = course.published ? 0 : 1;
    try {
      await api.updateCourse(course.id, { published: nextState });
      showToast(`Course ${nextState ? 'published' : 'unpublished'} successfully`, 'success');
      await loadCourses();
    } catch (err: any) {
      showToast(err.message || 'Failed to update course status', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 uppercase tracking-wider">
            Curriculum Administration
          </span>
          <h1 className="text-2xl font-black text-gray-950 mt-1">Course Catalog Management</h1>
          <p className="text-xs text-gray-500">
            Create technical tracks, manage 4-module progressive paths, and trigger competency matching.
          </p>
        </div>

        <button
          onClick={() => {
            setCourseToEdit(null);
            setIsCourseModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Create New Curriculum Track
        </button>
      </div>

      {/* Courses List */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-gray-500">Loading courses catalog...</div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-xs text-gray-500">
          No courses currently registered. Click Create to add your first curriculum.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
            >
              <div>
                <img src={c.thumbnail} alt={c.title} className="w-full h-44 object-cover" />
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                      {c.subject}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      c.published ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {c.published ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-gray-950 line-clamp-1">{c.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>

                  <div className="pt-2 text-[11px] text-gray-500 border-t border-gray-100 space-y-1">
                    <div className="flex justify-between">
                      <span>Assigned Trainer:</span>
                      <strong className="text-gray-900">{c.instructor_name || 'Unassigned'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Curriculum Duration:</span>
                      <span>{c.duration}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 pt-0 space-y-2">
                <div className="space-y-2">
                  <button
                    onClick={() => setCurriculumCourse({ id: c.id, title: c.title })}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <Video className="w-3.5 h-3.5 text-amber-400" />
                    Manage Lessons & Videos
                  </button>

                  <button
                    onClick={() => setMatchingCourse({ id: c.id, title: c.title })}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-900 font-bold text-xs border border-brand-200 transition-colors shadow-sm"
                  >
                    <BrainCircuit className="w-4 h-4 text-brand-600" />
                    Run Competency Matcher
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCourseToEdit(c);
                      setIsCourseModalOpen(true);
                    }}
                    className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>

                  <button
                    onClick={() => handleTogglePublish(c)}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600"
                    title={c.published ? 'Unpublish' : 'Publish'}
                  >
                    {c.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleDeleteCourse(c.id)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                    title="Delete course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Edit/Create Modal */}
      {isCourseModalOpen && (
        <CourseModal
          isOpen={isCourseModalOpen}
          onClose={() => setIsCourseModalOpen(false)}
          courseToEdit={courseToEdit}
          onSubmit={handleSaveCourse}
        />
      )}

      {/* Competency Mapping Modal */}
      {matchingCourse && (
        <CompetencyModal
          isOpen={!!matchingCourse}
          onClose={() => setMatchingCourse(null)}
          courseId={matchingCourse.id}
          courseTitle={matchingCourse.title}
          onTrainerAssigned={loadCourses}
        />
      )}

      {/* Course Curriculum, Lessons & Videos Modal */}
      {curriculumCourse && (
        <CourseCurriculumModal
          isOpen={!!curriculumCourse}
          onClose={() => setCurriculumCourse(null)}
          courseId={curriculumCourse.id}
          courseTitle={curriculumCourse.title}
        />
      )}
    </div>
  );
};
