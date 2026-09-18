import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Resource } from '@/types';
import { useToast } from '@/context/ToastContext';
import { FileText, ExternalLink, Download, BookOpen, AlertCircle } from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  const { showToast } = useToast();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await api.getTraineeDashboard();
      const courses = res.enrolled_courses || [];
      setEnrolledCourses(courses);
      if (courses.length > 0) {
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
      loadResources(selectedCourseId);
    }
  }, [selectedCourseId]);

  const loadResources = async (cId: number) => {
    setIsLoading(true);
    try {
      const res = await api.getCourseResources(cId);
      setResources(res || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load resources', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Study Materials & Documents
          </span>
          <h1 className="text-2xl font-black text-gray-950 mt-1">Course Learning Resources</h1>
          <p className="text-xs text-gray-500">
            Access curated study guides, slide presentations, and technical documentation.
          </p>
        </div>

        {enrolledCourses.length > 1 && (
          <div className="w-full sm:w-72">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Select Enrolled Course
            </label>
            <select
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
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
        <div className="py-20 text-center text-xs text-gray-500">Loading resources...</div>
      ) : resources.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-bold text-base text-gray-900">No Resources Found</h3>
          <p className="text-xs text-gray-500">
            Reference materials will appear here once published by your course instructor.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res) => (
            <div
              key={res.id}
              className="p-6 rounded-3xl bg-white border border-gray-200 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700">
                    {res.resource_type}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {res.created_at ? new Date(res.created_at).toLocaleDateString() : 'Active'}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-gray-900 line-clamp-2">{res.title}</h4>
                {res.module_title && (
                  <p className="text-[11px] text-gray-500 line-clamp-1">Module: {res.module_title}</p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <a
                  href={res.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-800"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open / View Document
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
