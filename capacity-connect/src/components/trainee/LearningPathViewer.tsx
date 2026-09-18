import React, { useState } from 'react';
import { Module, Lesson } from '@/types';
import { YouTubePlayer } from '@/components/common/YouTubePlayer';
import {
  CheckCircle2, Circle, PlayCircle, FileText, Lock,
  ChevronRight, ArrowRight, Award, Sparkles, BookOpen,
  Download, Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';

interface LearningPathViewerProps {
  courseId: number;
  courseTitle: string;
  modules: Module[];
  allModulesCompleted: boolean;
  onCompleteModule: (moduleId: number) => Promise<void>;
  onStartAssessment: () => void;
}

export const LearningPathViewer: React.FC<LearningPathViewerProps> = ({
  courseId,
  courseTitle,
  modules,
  allModulesCompleted,
  onCompleteModule,
  onStartAssessment,
}) => {
  const { showToast } = useToast();
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [completingModuleId, setCompletingModuleId] = useState<number | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await api.downloadCourseStudyMaterial(courseId, courseTitle);
      showToast(`Study Material PDF for ${courseTitle} downloaded successfully`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to download Course Study Material PDF', 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const currentModule = modules[activeModuleIndex] || modules[0];
  const currentLesson: Lesson | undefined = currentModule?.lessons?.[activeLessonIndex] || currentModule?.lessons?.[0];

  const handleMarkComplete = async (modId: number) => {
    setCompletingModuleId(modId);
    try {
      await onCompleteModule(modId);
      // If this was the last incomplete module and now completing makes all complete:
      const remaining = modules.filter(m => !m.completed && m.id !== modId).length;
      if (remaining === 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } finally {
      setCompletingModuleId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Learning Path Completion Banner (if all completed) */}
      {allModulesCompleted && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-brand-600 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <Sparkles className="w-9 h-9 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-gray-950 uppercase tracking-wide">
                  Assessment Unlocked
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black mt-1">
                Congratulations! You have completed the Learning Path.
              </h3>
              <p className="text-sm text-emerald-100 mt-1 max-w-xl">
                You have satisfied all 4 module competency requirements. You are now authorized to take the official course assessment.
              </p>
            </div>
          </div>
          <button
            onClick={onStartAssessment}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-emerald-900 font-extrabold text-sm hover:bg-emerald-50 hover:scale-105 transition-all shadow-lg shrink-0"
          >
            <Award className="w-5 h-5 text-amber-500" /> Start Assessment <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Module Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((mod, idx) => {
          const isActive = idx === activeModuleIndex;
          const isDone = mod.completed;

          return (
            <button
              key={mod.id}
              onClick={() => {
                setActiveModuleIndex(idx);
                setActiveLessonIndex(0);
              }}
              className={`p-5 rounded-2xl text-left border transition-all relative overflow-hidden ${
                isActive
                  ? 'bg-brand-50/90 border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-subtle'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Module {mod.module_number || idx + 1}
                </span>
                {isDone ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Done
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
                    <Circle className="w-3.5 h-3.5" /> Incomplete
                  </span>
                )}
              </div>
              <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{mod.title}</h4>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                {mod.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Module Details & Lesson Content */}
      {currentModule && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area (Video & Text) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                    {courseTitle}
                  </div>
                  <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                    Module {currentModule.module_number}: {currentModule.title} &bull; Lesson {activeLessonIndex + 1} of {currentModule.lessons?.length || 1}
                  </span>
                  <h3 className="text-xl font-black text-gray-950 mt-1">
                    {currentLesson?.title || currentModule.title}
                  </h3>
                </div>

                <button
                  onClick={() => handleMarkComplete(currentModule.id)}
                  disabled={currentModule.completed || completingModuleId === currentModule.id}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    currentModule.completed
                      ? 'bg-emerald-100 text-emerald-800 cursor-default border border-emerald-200'
                      : 'bg-brand-600 hover:bg-brand-700 text-white hover:shadow'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {currentModule.completed
                    ? 'Module Completed'
                    : completingModuleId === currentModule.id
                    ? 'Marking Complete...'
                    : 'Mark Module Complete'}
                </button>
              </div>

              {/* YouTube Video Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4 text-brand-600" /> Lesson Video: {currentLesson?.title || currentModule.title}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    Duration: {currentLesson?.duration_minutes || 25}m
                  </span>
                </div>
                {currentLesson?.yt_video_title && (
                  <div className="text-xs text-brand-900 bg-brand-50/90 px-3.5 py-2 rounded-xl border border-brand-200/80 flex items-center justify-between gap-2 shadow-xs">
                    <span className="font-semibold truncate">
                      <strong className="text-brand-700 font-bold mr-1.5">Verified Video:</strong>
                      {currentLesson.yt_video_title}
                    </span>
                    {currentLesson.author && (
                      <span className="text-[11px] text-gray-500 font-medium shrink-0 bg-white/80 px-2 py-0.5 rounded-md border border-gray-200">
                        {currentLesson.author}
                      </span>
                    )}
                  </div>
                )}
                <YouTubePlayer
                  key={`${currentModule.id}-${currentLesson?.id || activeLessonIndex}`}
                  url={currentLesson?.video_url}
                  videoId={currentLesson?.video_id}
                  title={currentLesson?.yt_video_title || currentLesson?.title || currentModule.title}
                />
              </div>


              {/* Lesson Text Overview */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wide">
                  Lesson Objective & Curricular Content
                </h4>
                <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50/80 p-5 rounded-2xl border border-gray-100 leading-relaxed">
                  {currentLesson?.content || currentModule.description}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: Lessons List & Downloadable Resources */}
          <div className="space-y-6">
            {/* Lessons List */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-card space-y-4">
              <h4 className="font-bold text-sm text-gray-950 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-600" /> Module Lessons
              </h4>
              <div className="space-y-2">
                {currentModule.lessons && currentModule.lessons.length > 0 ? (
                  currentModule.lessons.map((lesson, lIdx) => (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLessonIndex(lIdx)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all text-xs ${
                        lIdx === activeLessonIndex
                          ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
                      }`}
                    >
                      <PlayCircle className={`w-4 h-4 shrink-0 ${lIdx === activeLessonIndex ? 'text-white' : 'text-brand-600'}`} />
                      <div className="flex-1 line-clamp-1">{lesson.title}</div>
                      <span className="text-[10px] opacity-75 shrink-0">{lesson.duration_minutes}m</span>
                    </button>
                  ))
                ) : (
                  <div className="text-xs text-gray-500 py-4 text-center">No additional lessons listed.</div>
                )}
              </div>
            </div>

            {/* Complete Course Study Material PDF Download Card */}
            <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 rounded-3xl p-6 shadow-card text-white space-y-3">
              <div className="flex items-center gap-2 text-brand-200 text-xs font-bold uppercase tracking-wider">
                <FileText className="w-4 h-4 text-amber-300" /> Course Study Material
              </div>
              <h4 className="font-black text-base leading-snug">
                Official Study Handbook &amp; Syllabus (PDF)
              </h4>
              <p className="text-xs text-blue-100 leading-relaxed">
                Download the complete A-to-Z course study guide for <strong className="text-white">{courseTitle}</strong>, including all 4 learning path modules, detailed explanations, practical code examples, and assessment prep.
              </p>
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white text-brand-900 font-extrabold text-xs hover:bg-brand-50 hover:shadow-lg transition-all disabled:opacity-75 disabled:cursor-not-allowed mt-2 shadow"
              >
                {isDownloadingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-brand-600" /> Generating PDF Handbook...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-brand-600" /> Download Study Material PDF
                  </>
                )}
              </button>
            </div>

            {/* Study Resources */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-gray-950 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" /> Module Study Materials
                </h4>
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="text-[11px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Get PDF
                </button>
              </div>
              <div className="space-y-2.5">
                {currentModule.resources && currentModule.resources.length > 0 ? (
                  currentModule.resources.map((res) => (
                    <button
                      key={res.id}
                      onClick={handleDownloadPdf}
                      disabled={isDownloadingPdf}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all text-xs group text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                        <span className="font-semibold text-gray-800 group-hover:text-brand-700">{res.title}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        Official PDF
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-xs text-gray-500 py-2 text-center">
                    Reference materials available in primary lesson notes.
                  </div>
                )}
              </div>
            </div>

            {/* Assessment Status Box */}
            <div className={`p-6 rounded-3xl border ${
              allModulesCompleted
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {allModulesCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-400" />
                )}
                <span className="font-bold text-sm">
                  {allModulesCompleted ? 'Assessment Unlocked' : 'Assessment Locked'}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-gray-600">
                {allModulesCompleted
                  ? 'Ready to test your knowledge! Passing score: 70%+. Achieving passing score generates your verified credential.'
                  : 'Complete all 4 module requirements above to unlock the official timed assessment and earn your certification.'}
              </p>
              {allModulesCompleted && (
                <button
                  onClick={onStartAssessment}
                  className="w-full mt-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow"
                >
                  Start Assessment Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
