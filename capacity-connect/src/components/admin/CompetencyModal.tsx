import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { CompetencyMappingResult, TrainerRecommendation } from '@/types';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import {
  BrainCircuit, CheckCircle2, XCircle, UserCheck,
  TrendingUp, Award, ArrowRight, ShieldAlert, Sparkles
} from 'lucide-react';

interface CompetencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  courseTitle: string;
  onTrainerAssigned: () => void;
}

export const CompetencyModal: React.FC<CompetencyModalProps> = ({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  onTrainerAssigned,
}) => {
  const { showToast } = useToast();
  const [data, setData] = useState<CompetencyMappingResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [assigningId, setAssigningId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && courseId) {
      loadCompetencyData();
    }
  }, [isOpen, courseId]);

  const loadCompetencyData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCompetencyMapping(courseId);
      setData(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to calculate competency matching', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTrainer = async (trainerId: number, trainerName: string) => {
    setAssigningId(trainerId);
    try {
      await api.assignTrainerToCourse(courseId, trainerId);
      showToast(`Successfully assigned ${trainerName} as Lead Instructor!`, 'success');
      await loadCompetencyData();
      onTrainerAssigned();
    } catch (err: any) {
      showToast(err.message || 'Failed to assign trainer', 'error');
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Intelligent Competency Mapping & Trainer Matching"
      maxWidth="3xl"
    >
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-medium">
            Analyzing curriculum competencies and evaluating trainer skill vectors...
          </p>
        </div>
      ) : !data ? (
        <div className="p-8 text-center text-xs text-gray-500">
          No competency matrix available for this course.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Course Competency Header */}
          <div className="p-5 rounded-2xl bg-brand-50/70 border border-brand-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
                Course: {data.course_title}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800">
                {data.subject}
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-gray-800">Required Core Competencies:</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {data.required_competencies.map((comp) => (
                  <span
                    key={comp}
                    className="text-xs font-semibold px-3 py-1 rounded-lg bg-white border border-brand-200 text-brand-900 shadow-subtle flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" /> {comp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Trainer Recommendations List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-gray-950 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-brand-600" />
                Algorithm Suitability Ranking
              </h4>
              <span className="text-[11px] text-gray-500">
                Based on verified certifications & trainer profile competencies
              </span>
            </div>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {data.trainer_recommendations.map((trainer: TrainerRecommendation) => {
                const isHigh = trainer.suitability_percentage >= 90;
                const isMed = trainer.suitability_percentage >= 50 && trainer.suitability_percentage < 90;

                const badgeStyle = isHigh
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : isMed
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300';

                return (
                  <div
                    key={trainer.trainer_id}
                    className={`p-5 rounded-2xl border transition-all ${
                      trainer.is_currently_assigned
                        ? 'border-brand-500 bg-brand-50/30 ring-2 ring-brand-500/20 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Trainer Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-base text-gray-950">
                            {trainer.trainer_name}
                          </h5>
                          {trainer.is_currently_assigned && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-600 text-white shadow-sm">
                              Currently Assigned
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{trainer.qualifications}</p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">{trainer.trainer_email}</p>
                      </div>

                      {/* Suitability Score & Assign Button */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-black text-gray-950 leading-none">
                            {trainer.suitability_percentage}%
                          </div>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border inline-block mt-1 ${badgeStyle}`}>
                            {trainer.recommendation}
                          </span>
                        </div>

                        <button
                          onClick={() => handleAssignTrainer(trainer.trainer_id, trainer.trainer_name)}
                          disabled={trainer.is_currently_assigned || assigningId === trainer.trainer_id}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            trainer.is_currently_assigned
                              ? 'bg-gray-100 text-gray-400 cursor-default border border-gray-200'
                              : 'bg-brand-600 hover:bg-brand-700 text-white shadow shadow-brand-500/20'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          {trainer.is_currently_assigned
                            ? 'Assigned'
                            : assigningId === trainer.trainer_id
                            ? 'Assigning...'
                            : 'Assign Trainer'}
                        </button>
                      </div>
                    </div>

                    {/* Skill Breakdown */}
                    <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Matching Skills ({trainer.matching_count}/{trainer.total_required}):
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {trainer.matching_skills.length > 0 ? (
                            trainer.matching_skills.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-medium"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">None</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Missing Required Skills:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {trainer.missing_skills.length > 0 ? (
                            trainer.missing_skills.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-900 border border-rose-200 text-[11px] font-medium"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-emerald-700 font-semibold text-[11px]">All skills matched (0 missing)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recommendation Reason */}
                    <div className="mt-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-gray-600 leading-relaxed">
                      <strong>Recommendation Reason:</strong> {trainer.recommendation_reason}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
