import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Course, CompetencyMappingResult, TrainerRecommendation } from '@/types';
import { useToast } from '@/context/ToastContext';
import {
  BrainCircuit, CheckCircle2, XCircle, UserCheck,
  Award, TrendingUp, Sparkles, AlertCircle, BookOpen
} from 'lucide-react';

export const CompetencyMappingPage: React.FC = () => {
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [mappingData, setMappingData] = useState<CompetencyMappingResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [assigningId, setAssigningId] = useState<number | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await api.getCourses();
      setCourses(res || []);
      if (res && res.length > 0) {
        setSelectedCourseId(res[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      runCompetencyEngine(selectedCourseId);
    }
  }, [selectedCourseId]);

  const runCompetencyEngine = async (cId: number) => {
    setIsLoading(true);
    try {
      const res = await api.getCompetencyMapping(cId);
      setMappingData(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to calculate competency matching', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTrainer = async (trainerId: number, trainerName: string) => {
    if (!selectedCourseId) return;
    setAssigningId(trainerId);
    try {
      await api.assignTrainerToCourse(selectedCourseId, trainerId);
      showToast(`Successfully assigned ${trainerName} to this course curriculum!`, 'success');
      await runCompetencyEngine(selectedCourseId);
      await loadCourses();
    } catch (err: any) {
      showToast(err.message || 'Failed to assign trainer', 'error');
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Core Platform Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950">
            Algorithmic Competency Mapping
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-2xl mt-1">
            Automated backend engine calculating mathematical suitability percentages between course-mandated competencies and faculty skill matrices.
          </p>
        </div>

        {courses.length > 0 && (
          <div className="w-full md:w-80">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Select Curriculum Course
            </label>
            <select
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-24 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-medium">
            Computing trainer competency scores, gap analysis, and recommendation categories...
          </p>
        </div>
      ) : !mappingData ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-xs text-gray-500">
          No competency matrix available for the selected course.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Course Competency Breakdown Card */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                  {mappingData.subject}
                </span>
                <h3 className="text-xl font-black text-gray-950 mt-1">{mappingData.course_title}</h3>
              </div>

              <div className="text-xs font-medium text-gray-500">
                Course ID: <strong className="text-gray-900">#{mappingData.course_id}</strong>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-gray-800 block mb-2">
                Mandatory Curricular Competencies ({mappingData.required_competencies.length}):
              </span>
              <div className="flex flex-wrap gap-2">
                {mappingData.required_competencies.map((comp, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-50/70 border border-brand-200 text-brand-900 text-xs font-bold shadow-subtle"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" /> {comp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Trainer Ranking Matrix */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-gray-950 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-brand-600" />
                Evaluated Faculty Recommendations ({mappingData.trainer_recommendations.length})
              </h3>
              <span className="text-xs text-gray-500">
                Sorted by suitability percentage descending
              </span>
            </div>

            <div className="space-y-4">
              {mappingData.trainer_recommendations.map((trainer: TrainerRecommendation) => {
                const isHigh = trainer.suitability_percentage >= 90;
                const isMed = trainer.suitability_percentage >= 50 && trainer.suitability_percentage < 90;

                const badgeColor = isHigh
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : isMed
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300';

                return (
                  <div
                    key={trainer.trainer_id}
                    className={`p-6 rounded-3xl border transition-all ${
                      trainer.is_currently_assigned
                        ? 'border-brand-500 bg-brand-50/20 ring-2 ring-brand-500/20 shadow-card'
                        : 'border-gray-200 bg-white hover:border-gray-300 shadow-subtle'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Trainer Bio */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-lg text-gray-950">
                            {trainer.trainer_name}
                          </h4>
                          {trainer.is_currently_assigned && (
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-600 text-white shadow-sm">
                              Currently Assigned Lead
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{trainer.qualifications}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{trainer.trainer_email}</p>
                      </div>

                      {/* Suitability Score & Assign Action */}
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right">
                          <div className="text-3xl font-black text-gray-950 leading-none">
                            {trainer.suitability_percentage}%
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border inline-block mt-1 ${badgeColor}`}>
                            {trainer.recommendation}
                          </span>
                        </div>

                        <button
                          onClick={() => handleAssignTrainer(trainer.trainer_id, trainer.trainer_name)}
                          disabled={trainer.is_currently_assigned || assigningId === trainer.trainer_id}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow ${
                            trainer.is_currently_assigned
                              ? 'bg-gray-100 text-gray-400 cursor-default border border-gray-200'
                              : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20 hover:scale-105'
                          }`}
                        >
                          <UserCheck className="w-4 h-4" />
                          {trainer.is_currently_assigned
                            ? 'Assigned Instructor'
                            : assigningId === trainer.trainer_id
                            ? 'Assigning...'
                            : 'Assign to Course'}
                        </button>
                      </div>
                    </div>

                    {/* Skill Breakdown: Matching vs Missing */}
                    <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Matching Required Skills ({trainer.matching_count}/{trainer.total_required}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {trainer.matching_skills.length > 0 ? (
                            trainer.matching_skills.map((s) => (
                              <span
                                key={s}
                                className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-950 border border-emerald-200 text-xs font-semibold"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 italic">No matching competencies</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1 mb-1">
                          <XCircle className="w-3.5 h-3.5" /> Missing Curriculum Skills:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {trainer.missing_skills.length > 0 ? (
                            trainer.missing_skills.map((s) => (
                              <span
                                key={s}
                                className="px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-950 border border-rose-200 text-xs font-semibold"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-emerald-700 font-bold text-xs">
                              Complete Curriculum Match (0 Missing)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Algorithmic Reason */}
                    <div className="mt-4 p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-700 leading-relaxed">
                      <strong>Recommendation Reason:</strong> {trainer.recommendation_reason}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
