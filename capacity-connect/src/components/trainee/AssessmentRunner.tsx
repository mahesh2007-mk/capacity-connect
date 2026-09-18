import React, { useState, useEffect, useRef } from 'react';
import { Question, AssessmentAttempt } from '@/types';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import {
  Clock, CheckCircle, AlertCircle, Award, RotateCcw,
  ChevronLeft, ChevronRight, Send, HelpCircle, History, Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AssessmentRunnerProps {
  courseId: number;
  courseTitle: string;
  initialQuestions: Question[];
  durationSeconds: number;
  attemptNumber: number;
  onAssessmentCompleted: (result: any) => void;
  onRetake: () => void;
  onViewCertificate?: (certificateId: string) => void;
}

export const AssessmentRunner: React.FC<AssessmentRunnerProps> = ({
  courseId,
  courseTitle,
  initialQuestions,
  durationSeconds,
  attemptNumber,
  onAssessmentCompleted,
  onRetake,
  onViewCertificate,
}) => {
  const { showToast } = useToast();

  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(durationSeconds);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [history, setHistory] = useState<AssessmentAttempt[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);

  // Synchronize when initialQuestions change
  useEffect(() => {
    setQuestions(initialQuestions);
    setAnswers({});
    setCurrentIndex(0);
    setTimeLeft(durationSeconds);
    setResult(null);
    startTimeRef.current = Date.now();
  }, [initialQuestions, durationSeconds]);

  // Fetch past attempts history
  useEffect(() => {
    loadHistory();
  }, [courseId]);

  const loadHistory = async () => {
    try {
      const res = await api.getAssessmentHistory(courseId);
      setHistory(res.attempts || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  // Countdown timer with auto-submit
  useEffect(() => {
    if (result) return; // Stop timer if already submitted

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [result]);

  const handleSelectAnswer = (option: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id.toString()]: option,
    }));
  };

  const handleAutoSubmit = () => {
    showToast('Time expired! Automatically submitting your assessment.', 'warning');
    submitAssessment();
  };

  const submitAssessment = async () => {
    if (isSubmitting || result) return;
    setIsSubmitting(true);
    clearInterval(timerRef.current);

    const timeSpentSeconds = Math.min(
      durationSeconds,
      Math.round((Date.now() - startTimeRef.current) / 1000)
    );

    // Ensure all questions are represented (unanswered mapped to empty)
    const finalAnswers: Record<string, string> = {};
    questions.forEach((q) => {
      finalAnswers[q.id.toString()] = answers[q.id.toString()] || '';
    });

    try {
      const submissionResult = await api.submitAssessment({
        course_id: courseId,
        answers: finalAnswers,
        time_taken_seconds: timeSpentSeconds,
      });

      setResult(submissionResult);
      onAssessmentCompleted(submissionResult);
      await loadHistory();

      if (submissionResult.passed) {
        showToast(`Congratulations! You passed with ${submissionResult.score_percentage}%!`, 'success');
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
      } else {
        showToast(`Assessment completed. Score: ${submissionResult.score_percentage}%. You can retake to earn your certificate.`, 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit assessment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).filter((k) => answers[k]).length;
  const currentQuestion = questions[currentIndex];

  // =====================================
  // RESULT VIEW
  // =====================================
  if (result) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Result Header Card */}
        <div className={`p-8 rounded-3xl border shadow-xl text-center space-y-4 ${
          result.passed
            ? 'bg-gradient-to-b from-emerald-50 to-white border-emerald-200'
            : 'bg-gradient-to-b from-amber-50 to-white border-amber-200'
        }`}>
          <div className="inline-flex p-4 rounded-3xl bg-white shadow-md border border-gray-100">
            {result.passed ? (
              <Award className="w-16 h-16 text-amber-500" />
            ) : (
              <RotateCcw className="w-16 h-16 text-amber-600" />
            )}
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Attempt {result.attempt_number} Result
            </span>
            <h2 className="text-3xl font-black text-gray-950 mt-1">
              {result.passed ? 'Assessment Passed with Mastery!' : 'Assessment Complete — Retake Available'}
            </h2>
          </div>

          <div className="flex items-center justify-center gap-6 py-4">
            <div className="text-center px-6 py-3 rounded-2xl bg-white border border-gray-200 shadow-subtle">
              <div className="text-3xl font-black text-gray-900">{result.score_percentage}%</div>
              <div className="text-[11px] uppercase font-bold text-gray-400">Calculated Score</div>
            </div>
            <div className="text-center px-6 py-3 rounded-2xl bg-white border border-gray-200 shadow-subtle">
              <div className="text-3xl font-black text-gray-900">
                {result.correct_answers} / {result.total_questions}
              </div>
              <div className="text-[11px] uppercase font-bold text-gray-400">Correct Answers</div>
            </div>
          </div>

          <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
            {result.passed
              ? 'You have satisfied the competency passing criteria (≥ 70%). Your official verifiable certificate has been automatically issued and registered in the database.'
              : 'The passing score for this course assessment is 70.0%. You may take a retake with a newly generated question set to achieve certification.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {result.passed && result.certificate_id && onViewCertificate && (
              <button
                onClick={() => onViewCertificate(result.certificate_id)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all hover:scale-105"
              >
                <Award className="w-4 h-4 text-amber-300" /> View & Download Certificate
              </button>
            )}

            <button
              onClick={onRetake}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-black shadow transition-all hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" /> Start Fresh Retake (New Questions)
            </button>
          </div>
        </div>

        {/* Detailed Question Review */}
        {result.detailed_results && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="font-extrabold text-lg text-gray-950">Detailed Submission Review</h3>
              <span className="text-xs text-gray-500 font-medium">All answers server-verified</span>
            </div>

            <div className="space-y-4">
              {result.detailed_results.map((qRes: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border ${
                    qRes.is_correct
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : 'border-rose-200 bg-rose-50/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-xs font-bold uppercase text-gray-500">Question {idx + 1}</span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      qRes.is_correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {qRes.is_correct ? 'Correct (+1)' : 'Incorrect (0)'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-medium text-gray-700">
                    Your Selection: <strong className="uppercase">{qRes.user_answer || 'None'}</strong> | Correct Answer:{' '}
                    <strong className="uppercase text-emerald-800">{qRes.correct_answer}</strong>
                  </div>
                  {qRes.explanation && (
                    <p className="mt-2 text-xs text-gray-600 bg-white/80 p-3 rounded-xl border border-gray-100">
                      <strong>Explanation:</strong> {qRes.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Attempts History */}
        {history.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-4">
            <h3 className="font-extrabold text-base text-gray-950 flex items-center gap-2">
              <History className="w-5 h-5 text-brand-600" /> Recorded Attempts History
            </h3>
            <div className="divide-y divide-gray-100">
              {history.map((att) => (
                <div key={att.attempt_number} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-900">Attempt {att.attempt_number}</span>
                    <span className="text-gray-400 ml-2">
                      {new Date(att.completed_at).toLocaleDateString()} at {new Date(att.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">{att.correct_answers}/{att.total_questions} correct</span>
                    <span className={`font-bold px-2 py-0.5 rounded-md ${
                      att.score_percentage >= 70
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {att.score_percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =====================================
  // ACTIVE TEST RUNNER
  // =====================================
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner: Course Title, Attempt Badge, Countdown Timer */}
      <div className="sticky top-20 z-30 bg-white/95 backdrop-blur rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-brand-100 text-brand-800 font-bold text-xs">
              Attempt {attemptNumber}
            </span>
            <span className="text-xs text-gray-500 font-medium">Anti-Cheat Answer Protection Active</span>
          </div>
          <h2 className="font-extrabold text-lg text-gray-950 mt-1">{courseTitle}</h2>
        </div>

        {/* Countdown Timer Display */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-base font-bold shadow-inner ${
            timeLeft <= 300
              ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse'
              : 'bg-gray-100 text-gray-900 border border-gray-200'
          }`}>
            <Clock className="w-5 h-5 text-brand-600" />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <button
            onClick={submitAssessment}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-sm shadow-brand-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmitting ? 'Submitting...' : 'Submit Now'}
          </button>
        </div>
      </div>

      {/* Main Question Container */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-8">
        {/* Question Header & Progress */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 font-bold text-sm flex items-center justify-center">
              {currentIndex + 1}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              of {questions.length} Questions
            </span>
          </div>

          <div className="text-xs font-medium text-gray-600">
            Progress: <strong className="text-brand-600">{answeredCount}</strong> / {questions.length} Answered
          </div>
        </div>

        {/* Question Text */}
        {currentQuestion ? (
          <div className="space-y-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-950 leading-relaxed">
              {currentQuestion.question_text}
            </h3>

            {/* MCQ Options A, B, C, D */}
            <div className="space-y-3">
              {[
                { key: 'A', text: currentQuestion.option_a },
                { key: 'B', text: currentQuestion.option_b },
                { key: 'C', text: currentQuestion.option_c },
                { key: 'D', text: currentQuestion.option_d },
              ].map((opt) => {
                const isSelected = answers[currentQuestion.id.toString()] === opt.key;

                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSelectAnswer(opt.key)}
                    className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/80 ring-2 ring-brand-500/20 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {opt.key}
                    </div>
                    <span className="text-sm font-medium text-gray-800 pt-1 leading-relaxed">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">Loading questions...</div>
        )}

        {/* Navigation Buttons (Prev / Next) */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <button
            onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((idx) => Math.min(questions.length - 1, idx + 1))}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-black transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={submitAssessment}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow"
            >
              <Send className="w-4 h-4" /> Finish & Submit Assessment
            </button>
          )}
        </div>
      </div>

      {/* Question Quick Jump Matrix */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-card space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Question Matrix
        </h4>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => {
            const isAnswered = !!answers[q.id.toString()];
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-9 h-9 rounded-xl font-bold text-xs transition-all ${
                  isCurrent
                    ? 'ring-2 ring-brand-600 bg-brand-600 text-white shadow'
                    : isAnswered
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
