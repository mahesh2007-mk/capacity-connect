import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Course } from '@/types';
import { BookOpen, Clock, Users, Award, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TrainerCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTrainerDashboard();
      // Fetch full details of assigned courses
      const all = await api.getCourses();
      const assignedIds = (res.assigned_courses || []).map((c: any) => c.id);
      setCourses(all.filter((c: Course) => assignedIds.includes(c.id)));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-2">
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 uppercase tracking-wider">
          Faculty Teaching Load
        </span>
        <h1 className="text-2xl font-black text-gray-950">Assigned Courses & Curricula</h1>
        <p className="text-xs text-gray-500">
          Courses assigned to you through the automated Competency Mapping engine or Admin allocation.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-gray-500">Loading assigned courses...</div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-bold text-base text-gray-900">No Courses Currently Assigned</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Once an administrator assigns your profile to a curriculum based on competency suitability, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-card flex flex-col justify-between"
            >
              <div>
                <img src={c.thumbnail} alt={c.title} className="w-full h-44 object-cover" />
                <div className="p-6 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {c.subject}
                  </span>
                  <h3 className="font-bold text-base text-gray-950">{c.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                    {c.description}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                    <span>Duration: {c.duration}</span>
                    <span>Level: {c.difficulty}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 flex gap-2">
                <Link
                  to={`/trainer/trainees?course_id=${c.id}`}
                  className="flex-1 text-center py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow"
                >
                  Manage Trainees
                </Link>
                <Link
                  to="/trainer/questionnaires"
                  className="px-3 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-xs"
                >
                  Questionnaires
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
