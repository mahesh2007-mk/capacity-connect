import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Users, BookOpen, Award, CheckCircle2, Clock } from 'lucide-react';

export const TrainerTraineesPage: React.FC = () => {
  const [trainees, setTrainees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTrainees();
  }, []);

  const loadTrainees = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTrainerTrainees();
      setTrainees(res || []);
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
          Student Roster & Tracking
        </span>
        <h1 className="text-2xl font-black text-gray-950">Assigned Course Trainees</h1>
        <p className="text-xs text-gray-500">
          Monitor trainee learning path module completion, assessment scores, and certificate status.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-gray-500">Loading student roster...</div>
      ) : trainees.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-bold text-base text-gray-900">No Trainees Currently Enrolled</h3>
          <p className="text-xs text-gray-500">
            Trainees who enroll in your assigned courses will appear in this roster.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Trainee Name</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Module Progress</th>
                  <th className="px-6 py-4">Best Assessment</th>
                  <th className="px-6 py-4">Certificate</th>
                  <th className="px-6 py-4">Enrolled On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {trainees.map((t, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{t.full_name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{t.email}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {t.course_title}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand-600">
                          {t.completed_modules} / 4 Modules
                        </span>
                        {t.completed_modules >= 4 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold">
                      {t.best_score !== null ? (
                        <span className={t.best_score >= 70 ? 'text-emerald-700' : 'text-amber-700'}>
                          {t.best_score.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-400 font-normal">Not Attempted</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {t.certificate_id ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          <Award className="w-3 h-3" /> Issued
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Pending Mastery</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(t.enrolled_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
