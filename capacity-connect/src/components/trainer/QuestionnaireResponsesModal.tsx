import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { Users, Award, Clock, CheckCircle2, XCircle, AlertCircle, BarChart3 } from 'lucide-react';

interface QuestionnaireResponsesModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionnaireId: number;
  questionnaireTitle: string;
}

export const QuestionnaireResponsesModal: React.FC<QuestionnaireResponsesModalProps> = ({
  isOpen,
  onClose,
  questionnaireId,
  questionnaireTitle,
}) => {
  const { showToast } = useToast();
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadResponses();
    }
  }, [isOpen, questionnaireId]);

  const loadResponses = async () => {
    setIsLoading(true);
    try {
      const res = await api.getQuestionnaireResponses(questionnaireId);
      setData(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load questionnaire responses', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Responses & Participation: ${questionnaireTitle}`}
      maxWidth="3xl"
    >
      {isLoading ? (
        <div className="py-20 text-center text-xs text-gray-500">
          <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2" />
          Loading response metrics & participant submissions...
        </div>
      ) : !data ? (
        <div className="py-12 text-center text-xs text-gray-500">No response data found.</div>
      ) : (
        <div className="space-y-6">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Submissions
              </span>
              <span className="text-2xl font-black text-emerald-950 mt-1 block">
                {data.total_responses}
              </span>
              <span className="text-[10px] text-emerald-700">of {data.total_enrolled} enrolled</span>
            </div>

            <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 text-center">
              <span className="text-[10px] font-bold text-brand-800 uppercase tracking-wider block">
                Participation
              </span>
              <span className="text-2xl font-black text-brand-950 mt-1 block">
                {data.participation_rate}%
              </span>
              <span className="text-[10px] text-brand-700">Cohort Turnout</span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-center">
              <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                Average Score
              </span>
              <span className="text-2xl font-black text-purple-950 mt-1 block">
                {data.average_score}%
              </span>
              <span className="text-[10px] text-purple-700">Cohort Average</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Questions
              </span>
              <span className="text-2xl font-black text-amber-950 mt-1 block">
                {data.questions?.length || 0}
              </span>
              <span className="text-[10px] text-amber-700">Evaluated</span>
            </div>
          </div>

          {/* Participant Submissions List */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" /> Trainee Submissions ({data.responses?.length || 0})
            </h4>

            {data.responses?.length === 0 ? (
              <div className="p-8 rounded-2xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-500">
                No trainees have submitted responses for this questionnaire yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Trainee</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {data.responses.map((r: any) => (
                      <tr key={r.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-900">{r.trainee_name}</div>
                          <div className="text-[10px] text-gray-400">{r.trainee_email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-black ${
                            r.score_percentage >= 70 ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {r.score_percentage}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.score_percentage >= 70
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {r.score_percentage >= 70 ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Passed
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3" /> Needs Review
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-[11px]">
                          {new Date(r.submitted_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Questionnaire Questions Overview */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-600" /> Questions Key
            </h4>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {data.questions?.map((q: any, idx: number) => (
                <div key={q.id} className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                  <div className="font-bold text-gray-900">
                    Q{idx + 1}: {q.question_text}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-600">
                    <span>Correct Answer: <strong className="text-emerald-700 font-bold">{q.correct_answer}</strong></span>
                    <span className="text-gray-400">|</span>
                    <span>A: {q.option_a}</span>
                    <span className="text-gray-400">|</span>
                    <span>B: {q.option_b}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
