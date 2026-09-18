import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Announcement, Achievement } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Megaphone, Trophy, Plus, Trash2, Calendar, Sparkles } from 'lucide-react';
import { Modal } from '@/components/common/Modal';

export const AnnouncementsManagementPage: React.FC = () => {
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Announcement Modal
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annDesc, setAnnDesc] = useState('');
  const [annAudience, setAnnAudience] = useState('all');

  // Achievement Modal
  const [isAchModalOpen, setIsAchModalOpen] = useState(false);
  const [achTitle, setAchTitle] = useState('');
  const [achDesc, setAchDesc] = useState('');
  const [achMetric, setAchMetric] = useState('');
  const [achRecipient, setAchRecipient] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getLandingData();
      setAnnouncements(res.announcements || []);
      setAchievements(res.achievements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAnnouncement({
        title: annTitle,
        description: annDesc,
        status: 'published',
        target_audience: annAudience,
      });
      showToast('Announcement published to homepage', 'success');
      setIsAnnModalOpen(false);
      setAnnTitle('');
      setAnnDesc('');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create announcement', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    try {
      await api.deleteAnnouncement(id);
      showToast('Announcement deleted', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete announcement', 'error');
    }
  };

  const handleCreateAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAchievement({
        title: achTitle,
        description: achDesc,
        metric: achMetric,
        recipient: achRecipient,
      });
      showToast('Achievement metric added to landing page', 'success');
      setIsAchModalOpen(false);
      setAchTitle('');
      setAchDesc('');
      setAchMetric('');
      setAchRecipient('');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add achievement', 'error');
    }
  };

  const handleDeleteAchievement = async (id: number) => {
    try {
      await api.deleteAchievement(id);
      showToast('Achievement removed', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete achievement', 'error');
    }
  };

  return (
    <div className="space-y-12">
      {/* 1. Announcements Section */}
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 uppercase tracking-wider">
              Public Announcements
            </span>
            <h1 className="text-2xl font-black text-gray-950 mt-1">Platform Announcements</h1>
            <p className="text-xs text-gray-500">
              Announcements published here are showcased immediately on the public landing page.
            </p>
          </div>

          <button
            onClick={() => setIsAnnModalOpen(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Publish Announcement
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-6 rounded-3xl bg-white border border-gray-200 shadow-card flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700">
                    {ann.target_audience}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-bold text-base text-gray-950">{ann.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{ann.description}</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => handleDeleteAnnouncement(ann.id)}
                  className="text-gray-400 hover:text-rose-600 text-xs font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Achievements Section */}
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 uppercase tracking-wider">
              Cohort Recognition
            </span>
            <h2 className="text-2xl font-black text-gray-950 mt-1">Platform Achievements</h2>
            <p className="text-xs text-gray-500">
              Celebrate key milestones and cohort performance highlights on the public homepage.
            </p>
          </div>

          <button
            onClick={() => setIsAchModalOpen(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Achievement
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="p-6 rounded-3xl bg-white border border-gray-200 shadow-card flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="text-3xl font-black text-amber-500">{ach.metric}</div>
                <h3 className="font-bold text-base text-gray-950">{ach.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{ach.description}</p>
                <div className="text-[10px] text-gray-400 uppercase font-bold pt-1">
                  Recipient: {ach.recipient}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => handleDeleteAchievement(ach.id)}
                  className="text-gray-400 hover:text-rose-600 text-xs font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Announcement Modal */}
      {isAnnModalOpen && (
        <Modal
          isOpen={isAnnModalOpen}
          onClose={() => setIsAnnModalOpen(false)}
          title="Publish Platform Announcement"
          maxWidth="md"
        >
          <form onSubmit={handleCreateAnnouncement} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Announcement Title
              </label>
              <input
                type="text"
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="e.g. Fall 2026 Upskilling Cohort Open"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Target Audience
              </label>
              <select
                value={annAudience}
                onChange={(e) => setAnnAudience(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
              >
                <option value="all">All Users & Public</option>
                <option value="trainees">Trainees Only</option>
                <option value="trainers">Trainers Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Message Description
              </label>
              <textarea
                rows={4}
                required
                value={annDesc}
                onChange={(e) => setAnnDesc(e.target.value)}
                placeholder="Details of the announcement..."
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAnnModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"
              >
                Publish
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Achievement Modal */}
      {isAchModalOpen && (
        <Modal
          isOpen={isAchModalOpen}
          onClose={() => setIsAchModalOpen(false)}
          title="Add Platform Achievement Metric"
          maxWidth="md"
        >
          <form onSubmit={handleCreateAchievement} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Metric Highlight
              </label>
              <input
                type="text"
                required
                value={achMetric}
                onChange={(e) => setAchMetric(e.target.value)}
                placeholder="e.g. 500+ or 98.4%"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Achievement Title
              </label>
              <input
                type="text"
                required
                value={achTitle}
                onChange={(e) => setAchTitle(e.target.value)}
                placeholder="e.g. Certified Engineers Milestone"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Cohort / Recipient Group
              </label>
              <input
                type="text"
                required
                value={achRecipient}
                onChange={(e) => setAchRecipient(e.target.value)}
                placeholder="e.g. Enterprise Engineering Cohort"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Contextual Description
              </label>
              <textarea
                rows={3}
                required
                value={achDesc}
                onChange={(e) => setAchDesc(e.target.value)}
                placeholder="Short summary of this achievement..."
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAchModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
              >
                Add Achievement
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
