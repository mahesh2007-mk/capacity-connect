import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Course } from '@/types';
import { Plus, Trash2, Calendar, FileQuestion } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface QuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  onSubmit: (data: any) => Promise<void>;
}

export const QuestionnaireModal: React.FC<QuestionnaireModalProps> = ({
  isOpen,
  onClose,
  courses,
  onSubmit,
}) => {
  const { showToast } = useToast();
  const [courseId, setCourseId] = useState<number>(courses[0]?.id || 1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [questions, setQuestions] = useState<Array<{
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
  }>>([
    {
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
    },
  ]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      showToast('Questionnaire must have at least one question', 'warning');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !deadline) {
      showToast('Please fill in all questionnaire header fields', 'warning');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d) {
        showToast(`Please complete all fields for Question ${i + 1}`, 'warning');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        course_id: Number(courseId),
        title,
        description,
        subject,
        deadline,
        questions,
      });
      showToast('Questionnaire created successfully', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to create questionnaire', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Trainer Questionnaire" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Course and Subject */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Target Course
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Subject Focus
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Data Structures & Algorithms"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Title and Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Questionnaire Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Midterm Competency Diagnostic"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Enforced Deadline
            </label>
            <input
              type="datetime-local"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Description & Instructions
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide guidance to trainees regarding instructions and objectives..."
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        {/* Questions Editor */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-brand-600" /> Questions List ({questions.length})
            </h4>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-bold hover:bg-brand-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Question
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {questions.map((q, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Question {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(idx)}
                    className="text-gray-400 hover:text-rose-600 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  required
                  value={q.question_text}
                  onChange={(e) => updateQuestion(idx, 'question_text', e.target.value)}
                  placeholder="Enter question text..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={q.option_a}
                    onChange={(e) => updateQuestion(idx, 'option_a', e.target.value)}
                    placeholder="Option A"
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white"
                  />
                  <input
                    type="text"
                    required
                    value={q.option_b}
                    onChange={(e) => updateQuestion(idx, 'option_b', e.target.value)}
                    placeholder="Option B"
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white"
                  />
                  <input
                    type="text"
                    required
                    value={q.option_c}
                    onChange={(e) => updateQuestion(idx, 'option_c', e.target.value)}
                    placeholder="Option C"
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white"
                  />
                  <input
                    type="text"
                    required
                    value={q.option_d}
                    onChange={(e) => updateQuestion(idx, 'option_d', e.target.value)}
                    placeholder="Option D"
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white"
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs font-bold text-gray-600">Correct Answer:</span>
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <label key={opt} className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name={`correct_answer_${idx}`}
                        value={opt}
                        checked={q.correct_answer === opt}
                        onChange={() => updateQuestion(idx, 'correct_answer', opt)}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <span>Option {opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Questionnaire'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
