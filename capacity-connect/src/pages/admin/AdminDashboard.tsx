import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, BookOpen, Award, BarChart3,
  TrendingUp, Shield, AlertTriangle, BrainCircuit,
  Megaphone, Plus, ArrowRight
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminDashboard();
      setStats(res);
    } catch (err) {
      console.error('Failed to load admin dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Actions */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 uppercase tracking-wider">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950 mt-1">
            CAPACITY CONNECT Platform Operations
          </h1>
          <p className="text-xs text-gray-500">
            Real-time infrastructure governance, curriculum matching, and certification metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/competency-mapping"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
          >
            <BrainCircuit className="w-4 h-4" /> Competency Matching Engine
          </Link>
          <Link
            to="/admin/courses"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs shadow transition-all"
          >
            <BookOpen className="w-4 h-4" /> Manage Courses
          </Link>
        </div>
      </div>

      {/* Pending Approvals Notification Alert */}
      {stats?.pending_approvals > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs font-medium">
              <strong>{stats.pending_approvals} Trainer Registration(s)</strong> awaiting administrator review and approval.
            </div>
          </div>
          <Link
            to="/admin/users?status=pending"
            className="text-xs font-bold text-amber-800 hover:text-amber-950 underline shrink-0"
          >
            Review Approvals &rarr;
          </Link>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-card space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-gray-400">Total Users</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-950">
            {stats?.total_users || 0}
          </div>
          <p className="text-[11px] text-gray-500 font-medium">
            {stats?.total_trainees || 0} Trainees &bull; {stats?.total_trainers || 0} Trainers
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-card space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-gray-400">Active Curricula</span>
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-950">
            {stats?.total_courses || 0}
          </div>
          <p className="text-[11px] text-gray-500 font-medium">
            {stats?.total_enrollments || 0} Total Enrollments
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-card space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-gray-400">Assessment Attempts</span>
            <BarChart3 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-950">
            {stats?.assessment_attempts || 0}
          </div>
          <p className="text-[11px] text-gray-500 font-medium">
            Avg Score: {stats?.average_score || 0}%
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-card space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-gray-400">Certificates Issued</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-950">
            {stats?.certificates || 0}
          </div>
          <p className="text-[11px] text-gray-500 font-medium">
            Completion: {stats?.completion_rate || 0}%
          </p>
        </div>
      </div>

      {/* Cohort Performance Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-4">
          <h3 className="font-extrabold text-base text-gray-950">Platform Health & Governance</h3>
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-gray-600">Cohort Completion Rate</span>
                <span className="text-brand-600 font-bold">{stats?.completion_rate || 0}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-brand-600 rounded-full"
                  style={{ width: `${Math.min(100, stats?.completion_rate || 0)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-gray-600">Assessment Participation Rate</span>
                <span className="text-emerald-700 font-bold">{stats?.participation_rate || 0}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, stats?.participation_rate || 0)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-4">
          <h3 className="font-extrabold text-base text-gray-950">Quick Administration Links</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Link
              to="/admin/users"
              className="p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-brand-50 hover:border-brand-200 font-bold text-gray-800 transition-all flex items-center justify-between"
            >
              <span>User Governance</span>
              <ArrowRight className="w-3.5 h-3.5 text-brand-600" />
            </Link>

            <Link
              to="/admin/competency-mapping"
              className="p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-brand-50 hover:border-brand-200 font-bold text-gray-800 transition-all flex items-center justify-between"
            >
              <span>Competency Engine</span>
              <ArrowRight className="w-3.5 h-3.5 text-brand-600" />
            </Link>

            <Link
              to="/admin/announcements"
              className="p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-brand-50 hover:border-brand-200 font-bold text-gray-800 transition-all flex items-center justify-between"
            >
              <span>Announcements</span>
              <ArrowRight className="w-3.5 h-3.5 text-brand-600" />
            </Link>

            <Link
              to="/admin/certifications"
              className="p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-brand-50 hover:border-brand-200 font-bold text-gray-800 transition-all flex items-center justify-between"
            >
              <span>Certifications</span>
              <ArrowRight className="w-3.5 h-3.5 text-brand-600" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
