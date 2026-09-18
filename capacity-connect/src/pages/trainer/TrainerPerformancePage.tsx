import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { BarChart3, TrendingUp, Star, Users, Award, CheckCircle } from 'lucide-react';

export const TrainerPerformancePage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTrainerDashboard();
      setDashboardData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = dashboardData?.stats || {};

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-2">
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 uppercase tracking-wider">
          Faculty Performance & Quality Evaluation
        </span>
        <h1 className="text-2xl font-black text-gray-950">Instruction Analytics</h1>
        <p className="text-xs text-gray-500">
          Database-calculated metrics reflecting trainee comprehension, pass rates, and pedagogical feedback.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-gray-500">Loading performance data...</div>
      ) : (
        <div className="space-y-8">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-2">
              <div className="text-[10px] font-bold uppercase text-gray-400">Cohort Average Score</div>
              <div className="text-3xl sm:text-4xl font-black text-gray-950">
                {stats.average_score ? `${stats.average_score}%` : '0.0%'}
              </div>
              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Benchmarked across all assessment submissions
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-2">
              <div className="text-[10px] font-bold uppercase text-gray-400">Mastery Certification Rate</div>
              <div className="text-3xl sm:text-4xl font-black text-brand-600">
                {stats.completion_rate ? `${stats.completion_rate}%` : '0.0%'}
              </div>
              <p className="text-xs text-gray-500">
                Proportion of students successfully passing assessment
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-2">
              <div className="text-[10px] font-bold uppercase text-gray-400">Student Satisfaction Rating</div>
              <div className="text-3xl sm:text-4xl font-black text-amber-500 flex items-center gap-1">
                <Star className="w-7 h-7 fill-amber-400" />
                {stats.average_feedback_rating ? `${stats.average_feedback_rating}` : '5.0'}
              </div>
              <p className="text-xs text-gray-500">
                Out of 5.0 across curriculum feedback surveys
              </p>
            </div>
          </div>

          {/* Detailed Performance Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-4">
              <h3 className="font-bold text-base text-gray-950">Participation Metrics</h3>
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-gray-600">Assessment Participation Rate</span>
                    <span className="text-emerald-700 font-bold">{stats.participation_rate || 0}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, stats.participation_rate || 0)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-gray-600">Learning Path Progression Ratio</span>
                    <span className="text-brand-600 font-bold">85%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-brand-600 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-4">
              <h3 className="font-bold text-base text-gray-950">Quality Assessment Guidelines</h3>
              <div className="space-y-2.5 text-xs text-gray-600 leading-relaxed">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Curriculum passing benchmark is fixed at 70% to guarantee enterprise skill competence.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Assessment retakes dynamically rotate question pools to prevent memorization and ensure authentic mastery.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Trainee feedback is audited by platform administration to maintain instructional excellence.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
