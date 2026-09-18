import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Questionnaire, Course } from '@/types';
import { QuestionnaireModal } from '@/components/trainer/QuestionnaireModal';
import { QuestionnaireResponsesModal } from '@/components/trainer/QuestionnaireResponsesModal';
import { useToast } from '@/context/ToastContext';
import { Plus, Trash2, Calendar, FileQuestion, Users, CheckCircle2, Clock, BarChart3 } from 'lucide-react';

export const TrainerQuestionnairesPage: React.FC = () => {
  const { showToast } = useToast();
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQForResponses, setSelectedQForResponses] = useState<Questionnaire | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [qList, coursesList] = await Promise.all([
        api.getTrainerQuestionnaires(),
        api.getCourses(),
      ]);
      setQuestionnaires(qList || []);
      setCourses(coursesList || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (payload: any) => {
    await api.createQuestionnaire(payload);
    await loadData();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this questionnaire?')) return;
    try {
      await api.deleteQuestionnaire(id);
      showToast('Questionnaire deleted successfully', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete questionnaire', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 uppercase tracking-wider">
            Diagnostic & Midterm Assessments
          </span>
          <h1 className="text-2xl font-black text-gray-950 mt-1">Questionnaire System</h1>
          <p className="text-xs text-gray-500">
            Create targeted diagnostic questionnaires with enforced deadlines and monitor trainee responses.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Create New Questionnaire
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-gray-500">Loading questionnaires...</div>
      ) : questionnaires.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3">
          <FileQuestion className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-bold text-base text-gray-900">No Questionnaires Published Yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Create your first targeted quiz or diagnostic questionnaire to evaluate cohort mastery.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {questionnaires.map((q) => {
            const isExpired = new Date(q.deadline) < new Date();

            return (
              <div
                key={q.id}
                className="bg-white rounded-3xl border border-gray-200 p-6 shadow-card space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800">
                      {q.subject}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        isExpired
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isExpired ? 'Deadline Passed' : 'Active Submissions'}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-gray-950">{q.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {q.description || 'Targeted diagnostic questionnaire.'}
                  </p>

                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-gray-400 block font-medium">Questions:</span>
                      <strong className="text-gray-900">{q.question_count || q.questions?.length || 0} Questions</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Responses:</span>
                      <strong className="text-emerald-700">{q.response_count || 0} Submissions</strong>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-gray-200/60 flex items-center gap-1 text-gray-600">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>Deadline: {new Date(q.deadline).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedQForResponses(q)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors shadow-sm"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                    View Responses & Performance
                  </button>

                  <button
                    onClick={() => handleDelete(q.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <QuestionnaireModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          courses={courses}
          onSubmit={handleCreate}
        />
      )}

      {/* Responses & Performance Analytics Modal */}
      {selectedQForResponses && (
        <QuestionnaireResponsesModal
          isOpen={!!selectedQForResponses}
          onClose={() => setSelectedQForResponses(null)}
          questionnaireId={selectedQForResponses.id}
          questionnaireTitle={selectedQForResponses.title}
        />
      )}
    </div>
  );
};
