import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  Users, BookOpen, BarChart3, Award, Star, CheckCircle,
  FileQuestion, Library, ArrowRight, TrendingUp
} from 'lucide-react';

export const TrainerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTrainerData();
  }, []);

  const loadTrainerData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTrainerDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load trainer dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = data?.stats || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 uppercase tracking-wider">
            Faculty Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950 mt-1">
            Instructor Overview: {user?.full_name}
          </h1>
          <p className="text-xs text-gray-500">
            Real-time analytics across your assigned curricula, student engagement, and competency metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/trainer/questionnaires"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
          >
            <FileQuestion className="w-4 h-4" /> Create Questionnaire
          </Link>
          <Link
            to="/trainer/library"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs shadow transition-all"
          >
            <Library className="w-4 h-4" /> Upload Resource
          </Link>
        </div>
      </div>

      {/* Real Database KPI Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-card space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-gray-400">Assigned Trainees</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-950">
            {stats.assigned_trainees || 0}
          </div>
          <p className="text-[11px] text-gray-500 font-medium">Distinct enrolled students</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-card space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-gray-400">Course Enrollments</span>
            <BookOpen className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-950">
            {stats.course_enrollments || 0}
          </div>
          <p className="text-[11px] text-gray-500 font-medium">Total course seats</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-card space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-gray-400">Average Score</span>
            <BarChart3 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-950">
            {stats.average_score ? `${stats.average_score}%` : '0.0%'}
          </div>
          <p className="text-[11px] text-gray-500 font-medium">Across all assessment attempts</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-card space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-gray-400">Feedback Rating</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-950">
            {stats.average_feedback_rating ? `${stats.average_feedback_rating} / 5` : '5.0 / 5'}
          </div>
          <p className="text-[11px] text-gray-500 font-medium">Trainee evaluation rating</p>
        </div>
      </div>

      {/* Secondary Metrics: Participation & Completion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Assessment Participation Rate
            </span>
            <span className="text-sm font-black text-emerald-600">{stats.participation_rate || 0}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.participation_rate || 0)}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-500">
            {stats.assessment_attempts || 0} total assessment attempts recorded in database.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Cohort Completion Rate
            </span>
            <span className="text-sm font-black text-brand-600">{stats.completion_rate || 0}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.completion_rate || 0)}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-500">
            Percentage of enrolled trainees who completed requirements and earned verified certificates.
          </p>
        </div>
      </div>

      {/* Assigned Curricula List */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="font-black text-lg text-gray-950 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" /> Assigned Courses
          </h3>
          <Link
            to="/trainer/courses"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
          >
            View All Courses
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading assigned courses...</div>
        ) : !data?.assigned_courses || data.assigned_courses.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">
            No courses assigned to your profile yet. Administrators can assign curricula through the Competency Mapping console.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.assigned_courses.map((c: any) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-700">Course #{c.id}</span>
                  <h4 className="font-bold text-sm text-gray-900 mt-1">{c.title}</h4>
                </div>
                <Link
                  to={`/trainer/trainees?course_id=${c.id}`}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                >
                  View Enrolled Trainees <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
