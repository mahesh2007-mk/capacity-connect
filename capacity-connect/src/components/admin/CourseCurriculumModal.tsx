import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { YouTubePlayer, extractYouTubeId } from '@/components/common/YouTubePlayer';
import {
  BookOpen, Video, Plus, Edit2, Trash2, FileText,
  Save, Play, CheckCircle2, AlertCircle, ExternalLink, Layers
} from 'lucide-react';

interface CourseCurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  courseTitle: string;
}

export const CourseCurriculumModal: React.FC<CourseCurriculumModalProps> = ({
  isOpen,
  onClose,
  courseId,
  courseTitle,
}) => {
  const { showToast } = useToast();
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Selected module
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);

  // Lesson editing / creation state
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState(20);

  // Resource creation state
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceType, setResourceType] = useState('PDF');
  const [resourceFileUrl, setResourceFileUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadContent();
    }
  }, [isOpen, courseId]);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminCourseContent(courseId);
      setData(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load course curriculum', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
    setIsAddingLesson(false);
    setLessonTitle(lesson.title);
    setLessonContent(lesson.content || '');
    setLessonVideoUrl(lesson.video_url || '');
    setLessonDuration(lesson.duration_minutes || 20);
  };

  const handleStartAddLesson = () => {
    setEditingLesson(null);
    setIsAddingLesson(true);
    setLessonTitle('');
    setLessonContent('');
    setLessonVideoUrl('https://www.youtube.com/watch?v=kqtD5dpn9C8');
    setLessonDuration(20);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle || !lessonVideoUrl) {
      showToast('Title and YouTube Video URL are required', 'warning');
      return;
    }

    const currentModule = data?.modules?.[activeModuleIndex];
    if (!currentModule) return;

    try {
      if (editingLesson) {
        await api.updateLesson(editingLesson.id, {
          title: lessonTitle,
          content: lessonContent,
          video_url: lessonVideoUrl,
          duration_minutes: lessonDuration,
        });
        showToast('Lesson & YouTube video updated successfully', 'success');
      } else {
        await api.createModuleLesson(currentModule.id, {
          title: lessonTitle,
          content: lessonContent,
          video_url: lessonVideoUrl,
          duration_minutes: lessonDuration,
        });
        showToast('New lesson & video added to module', 'success');
      }
      setEditingLesson(null);
      setIsAddingLesson(false);
      await loadContent();
    } catch (err: any) {
      showToast(err.message || 'Failed to save lesson', 'error');
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!window.confirm('Delete this lesson and associated video?')) return;
    try {
      await api.deleteLesson(lessonId);
      showToast('Lesson deleted', 'success');
      if (editingLesson?.id === lessonId) {
        setEditingLesson(null);
      }
      await loadContent();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete lesson', 'error');
    }
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceTitle || !resourceFileUrl) {
      showToast('Title and resource URL are required', 'warning');
      return;
    }
    const currentModule = data?.modules?.[activeModuleIndex];
    if (!currentModule) return;

    try {
      await api.addModuleResource(currentModule.id, {
        title: resourceTitle,
        resource_type: resourceType,
        file_url: resourceFileUrl,
      });
      showToast('Study resource added to module successfully', 'success');
      setIsAddingResource(false);
      setResourceTitle('');
      setResourceFileUrl('');
      await loadContent();
    } catch (err: any) {
      showToast(err.message || 'Failed to add resource', 'error');
    }
  };

  const currentModule = data?.modules?.[activeModuleIndex];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Curriculum, Lessons & Videos: ${courseTitle}`}
      maxWidth="4xl"
    >
      {isLoading ? (
        <div className="py-20 text-center text-xs text-gray-500">
          <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
          Loading course curriculum, modules, lessons & videos...
        </div>
      ) : !data ? (
        <div className="py-12 text-center text-xs text-gray-500">Failed to load curriculum data.</div>
      ) : (
        <div className="space-y-6">
          {/* Module Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-gray-100 border border-gray-200">
            {data.modules?.map((m: any, idx: number) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setActiveModuleIndex(idx);
                  setEditingLesson(null);
                  setIsAddingLesson(false);
                  setIsAddingResource(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeModuleIndex === idx
                    ? 'bg-white text-gray-950 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Module {m.module_number || idx + 1}</span>
              </button>
            ))}
          </div>

          {currentModule && (
            <div className="space-y-6">
              {/* Active Module Header */}
              <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider block">
                    Module {currentModule.module_number}
                  </span>
                  <h3 className="font-bold text-base text-brand-950 mt-0.5">{currentModule.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{currentModule.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleStartAddLesson}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Lesson
                  </button>
                  <button
                    onClick={() => setIsAddingResource(!isAddingResource)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-black text-white text-xs font-bold shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Resource
                  </button>
                </div>
              </div>

              {/* Lesson Form (Create / Edit) */}
              {(isAddingLesson || editingLesson) && (
                <form
                  onSubmit={handleSaveLesson}
                  className="p-5 rounded-2xl bg-white border-2 border-brand-500 shadow-md space-y-4 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h4 className="font-bold text-xs text-gray-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-brand-600" />
                      {editingLesson ? 'Edit Lesson & YouTube Video' : 'Add New Lesson to Module'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLesson(null);
                        setIsAddingLesson(false);
                      }}
                      className="text-xs text-gray-400 hover:text-gray-600 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                        Lesson Title
                      </label>
                      <input
                        type="text"
                        required
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                        placeholder="e.g. Asynchronous I/O and Event Loops"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                        YouTube Video URL (supports youtube.com/watch?v=... and youtu.be/...)
                      </label>
                      <input
                        type="text"
                        required
                        value={lessonVideoUrl}
                        onChange={(e) => setLessonVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                      {lessonVideoUrl && (
                        <div className="mt-1 text-[11px] text-gray-500 flex items-center gap-1">
                          <span>Detected Video ID:</span>
                          <strong className="font-mono text-brand-600">
                            {extractYouTubeId(lessonVideoUrl) || 'Invalid URL'}
                          </strong>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                        Duration (Minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={lessonDuration}
                        onChange={(e) => setLessonDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                        Lesson Lecture Notes / Content
                      </label>
                      <textarea
                        rows={2}
                        value={lessonContent}
                        onChange={(e) => setLessonContent(e.target.value)}
                        placeholder="Overview of core concepts, key architecture diagrams and instructions..."
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Live YouTube Preview in modal */}
                  {extractYouTubeId(lessonVideoUrl) && (
                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Embedded Video Live Preview
                      </span>
                      <div className="max-w-md mx-auto">
                        <YouTubePlayer url={lessonVideoUrl} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Lesson & Video
                    </button>
                  </div>
                </form>
              )}

              {/* Resource Form (Add Study Material) */}
              {isAddingResource && (
                <form
                  onSubmit={handleSaveResource}
                  className="p-5 rounded-2xl bg-gray-50 border border-gray-300 space-y-4 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h4 className="font-bold text-xs text-gray-950 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      Attach Study Resource to Module
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingResource(false)}
                      className="text-xs text-gray-400 hover:text-gray-600 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                        Resource Title
                      </label>
                      <input
                        type="text"
                        required
                        value={resourceTitle}
                        onChange={(e) => setResourceTitle(e.target.value)}
                        placeholder="e.g. Architectural Reference Cheatsheet"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                        Resource Type
                      </label>
                      <select
                        value={resourceType}
                        onChange={(e) => setResourceType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      >
                        <option value="PDF">PDF Document</option>
                        <option value="PPT">PPT Presentation</option>
                        <option value="PPTX">PPTX Presentation</option>
                        <option value="DOC">Document</option>
                        <option value="LINK">Reference Link</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                        File Download URL or Document Link
                      </label>
                      <input
                        type="url"
                        required
                        value={resourceFileUrl}
                        onChange={(e) => setResourceFileUrl(e.target.value)}
                        placeholder="https://... (PDF, PPT, or Document URL)"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow"
                    >
                      <Save className="w-3.5 h-3.5" /> Attach Resource
                    </button>
                  </div>
                </form>
              )}

              {/* Module Lessons List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Module Lessons ({currentModule.lessons?.length || 0})</span>
                  <span className="text-[10px] text-gray-400 font-normal">Real YouTube Video Integration</span>
                </h4>

                {currentModule.lessons?.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-500">
                    No lessons registered under this module yet. Click Add Lesson to add one.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentModule.lessons?.map((les: any, lIdx: number) => (
                      <div
                        key={les.id}
                        className="p-4 rounded-2xl bg-white border border-gray-200 shadow-subtle hover:border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-gray-100 text-gray-700 font-black text-[10px] flex items-center justify-center">
                              {les.lesson_number || lIdx + 1}
                            </span>
                            <h5 className="font-bold text-xs text-gray-900">{les.title}</h5>
                            <span className="text-[10px] text-gray-400 font-medium">
                              ({les.duration_minutes || 20} mins)
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-gray-500 pl-7 font-mono">
                            <span className="text-brand-600 flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              {les.video_url || 'No video assigned'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleStartEditLesson(les)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
                          >
                            <Edit2 className="w-3 h-3" /> Edit Video
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(les.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                            title="Delete lesson"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Module Resources List */}
              {currentModule.resources && currentModule.resources.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Module Resources ({currentModule.resources.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentModule.resources.map((res: any) => (
                      <div
                        key={res.id}
                        className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-brand-600" />
                          <div>
                            <div className="font-bold text-gray-900">{res.title}</div>
                            <span className="text-[10px] text-gray-400">{res.resource_type}</span>
                          </div>
                        </div>
                        <a
                          href={res.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
