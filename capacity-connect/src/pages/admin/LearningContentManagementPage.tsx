import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { LearningContent } from '@/types';
import { useToast } from '@/context/ToastContext';
import { BookMarked, Plus, Trash2, ExternalLink } from 'lucide-react';
import { Modal } from '@/components/common/Modal';

export const LearningContentManagementPage: React.FC = () => {
  const { showToast } = useToast();
  const [contentList, setContentList] = useState<LearningContent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Development');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const res = await api.getLandingData();
      setContentList(res.learning_content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLearningContent({
        title,
        category,
        description,
        media_url: mediaUrl,
      });
      showToast('Learning content published successfully', 'success');
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setMediaUrl('');
      await loadContent();
    } catch (err: any) {
      showToast(err.message || 'Failed to publish content', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteLearningContent(id);
      showToast('Content removed', 'success');
      await loadContent();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete content', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200 uppercase tracking-wider">
            Curriculum Updates
          </span>
          <h1 className="text-2xl font-black text-gray-950 mt-1">Learning Content Publications</h1>
          <p className="text-xs text-gray-500">
            Publish educational articles, architectural guides, and whitepapers to the public landing page.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Publish New Content
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {contentList.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-3xl bg-white border border-gray-200 shadow-card flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-800">
                {item.category}
              </span>
              <h3 className="font-bold text-base text-gray-950">{item.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">{item.description}</p>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              {item.media_url ? (
                <a
                  href={item.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Resource
                </a>
              ) : (
                <span className="text-[11px] text-gray-400">Internal Reference</span>
              )}

              <button
                onClick={() => handleDelete(item.id)}
                className="text-gray-400 hover:text-rose-600 text-xs font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Publish Learning Content"
          maxWidth="md"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Article / Content Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Consensus in Cloud Architecture"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Content Category
              </label>
              <input
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Engineering, Architecture, Security"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Resource / Cover Image Link
              </label>
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Executive Summary / Description
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Overview of the technical publication..."
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"
              >
                Publish Content
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
