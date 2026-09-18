import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { FileQuestion, Clock, CheckCircle2, AlertCircle, Send, Award } from 'lucide-react';

interface TraineeQuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionnaireId: number;
  onSubmitted: () => void;
}

export const TraineeQuestionnaireModal: React.FC<TraineeQuestionnaireModalProps> = ({
  isOpen,
  onClose,
  questionnaireId,
  onSubmitted,
}) => {
  const { showToast } = useToast();
  const [data, setData] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDetail();
    }
  }, [isOpen, questionnaireId]);

  const loadDetail = async () => {
    setIsLoading(true);
    setSubmissionResult(null);
    try {
      const res = await api.getTraineeQuestionnaireDetail(questionnaireId);
      setData(res);
      if (res.my_response) {
        setSubmissionResult({
          score_percentage: res.my_response.score_percentage,
          submitted_at: res.my_response.submitted_at,
          alreadySubmitted: true,
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load questionnaire', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (qId: number, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qId.toString()]: option,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    const unanswered = data.questions.filter((q: any) => !answers[q.id.toString()]);
    if (unanswered.length > 0) {
      if (!window.confirm(`You have ${unanswered.length} unanswered questions. Submit anyway?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitTraineeQuestionnaire(questionnaireId, answers);
      setSubmissionResult(res);
      showToast(`Questionnaire submitted! Score: ${res.score_percentage}%`, 'success');
      onSubmitted();
    } catch (err: any) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isExpired = data ? new Date(data.deadline) < new Date() : false;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data ? data.title : 'Course Diagnostic Questionnaire'}
      maxWidth="3xl"
    >
      {isLoading ? (
        <div className="py-20 text-center text-xs text-gray-500">
          <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
          Loading questionnaire questions...
        </div>
      ) : !data ? (
        <div className="py-12 text-center text-xs text-gray-500">Unable to load questionnaire.</div>
      ) : submissionResult ? (
        <div className="py-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-gray-950">Questionnaire Completed!</h3>
          <p className="text-xs text-gray-500">Your response has been officially recorded in the database.</p>
          <div className="inline-block p-6 rounded-2xl bg-gray-50 border border-gray-200 shadow-sm">
            <div className="text-4xl font-black text-brand-600">{submissionResult.score_percentage}%</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
              Final Calculated Score
            </div>
          </div>
          <div className="pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 shadow"
            >
              Close Questionnaire
            </button>
          </div>
        </div>
      ) : isExpired ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-gray-950">Questionnaire Deadline Passed</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            The deadline for this questionnaire was {new Date(data.deadline).toLocaleString()}. New submissions are closed.
          </p>
          <div className="pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-brand-900 block">{data.course_title}</span>
              <span className="text-gray-500 text-[11px]">{data.description}</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-800 font-bold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span>Deadline: {new Date(data.deadline).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {data.questions.map((q: any, idx: number) => {
              const selectedOpt = answers[q.id.toString()];

              return (
                <div key={q.id} className="p-5 rounded-2xl bg-white border border-gray-200 shadow-subtle space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-lg bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h4 className="font-bold text-xs text-gray-900 leading-relaxed pt-0.5">
                      {q.question_text}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-8">
                    {[
                      { key: 'A', text: q.option_a },
                      { key: 'B', text: q.option_b },
                      { key: 'C', text: q.option_c },
                      { key: 'D', text: q.option_d },
                    ].map((opt) => {
                      const isChosen = selectedOpt === opt.key;

                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => handleSelect(q.id, opt.key)}
                          className={`p-3 rounded-xl text-left text-xs border transition-all flex items-start gap-2.5 ${
                            isChosen
                              ? 'bg-brand-50 border-brand-500 text-brand-950 font-bold ring-2 ring-brand-500/20'
                              : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                            isChosen ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {opt.key}
                          </span>
                          <span className="leading-snug">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">
              Answered: {Object.keys(answers).length} / {data.questions.length} questions
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Submitting...' : 'Submit Questionnaire'}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
