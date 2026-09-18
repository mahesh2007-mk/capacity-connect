import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Resource, Course } from '@/types';
import { LibraryUploadModal } from '@/components/trainer/LibraryUploadModal';
import { useToast } from '@/context/ToastContext';
import { Library, Plus, Trash2, ExternalLink, FileText, Video } from 'lucide-react';

export const TrainerLibraryPage: React.FC = () => {
  const { showToast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [libRes, coursesRes] = await Promise.all([
        api.getTrainerLibrary(),
        api.getCourses(),
      ]);
      setResources(libRes || []);
      setCourses(coursesRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (payload: any) => {
    await api.addLibraryResource(payload);
    await loadData();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this resource from the library?')) return;
    try {
      await api.deleteLibraryResource(id);
      showToast('Resource removed', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete resource', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 uppercase tracking-wider">
            Faculty Knowledge Repository
          </span>
          <h1 className="text-2xl font-black text-gray-950 mt-1">Trainer Resource Library</h1>
          <p className="text-xs text-gray-500">
            Publish recorded lectures, study documents, and presentation slide decks for enrolled cohorts.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Publish Resource
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-gray-500">Loading library repository...</div>
      ) : resources.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3">
          <Library className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-bold text-base text-gray-900">Repository Currently Empty</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Upload course reference manuals, recorded video lectures, or presentation decks to assist your cohorts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((r) => (
            <div
              key={r.id}
              className="p-6 rounded-3xl bg-white border border-gray-200 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800">
                    {r.resource_type}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Active'}
                  </span>
                </div>
                <h4 className="font-bold text-base text-gray-950 line-clamp-1">{r.title}</h4>
                {r.module_title && (
                  <p className="text-xs text-gray-500 line-clamp-1">Module: {r.module_title}</p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <a
                  href={r.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open / Download
                </a>

                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-gray-400 hover:text-rose-600 p-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <LibraryUploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          courses={courses}
          onSubmit={handleUpload}
        />
      )}
    </div>
  );
};
