import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { BarChart2, Clock, CheckCircle2, XCircle } from 'lucide-react';

export const AssessmentsLogPage: React.FC = () => {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAttempts();
  }, []);

  const loadAttempts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminAssessments();
      setAttempts(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-2">
        <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 uppercase tracking-wider">
          Audit & Evaluation Log
        </span>
        <h1 className="text-2xl font-black text-gray-950">Assessment Attempts Audit</h1>
        <p className="text-xs text-gray-500">
          Chronological record of all student assessment submissions, retakes, and calculated scores.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-gray-500">Loading assessment records...</div>
      ) : attempts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-xs text-gray-500">
          No assessment attempts recorded yet.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Trainee</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Attempt #</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Time Taken</th>
                  <th className="px-6 py-4">Date Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {attempts.map((att, idx) => {
                  const isPassed = att.score_percentage >= 70;

                  return (
                    <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{att.trainee_name}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{att.trainee_email}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {att.course_title}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-700">
                        Attempt {att.attempt_number}
                      </td>
                      <td className="px-6 py-4 font-black text-sm">
                        <span className={isPassed ? 'text-emerald-700' : 'text-amber-700'}>
                          {att.score_percentage.toFixed(1)}%
                        </span>
                        <span className="text-gray-400 font-normal text-xs ml-1.5">
                          ({att.correct_answers}/{att.total_questions})
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            isPassed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isPassed ? 'Passed' : 'Needs Retake'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-[11px]">
                        {Math.floor(att.time_taken_seconds / 60)}m {att.time_taken_seconds % 60}s
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(att.completed_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
