import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Course } from '@/types';
import { useToast } from '@/context/ToastContext';
import { UploadCloud, FileText, AlertCircle } from 'lucide-react';

interface LibraryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  onSubmit: (data: any) => Promise<void>;
}

export const LibraryUploadModal: React.FC<LibraryUploadModalProps> = ({
  isOpen,
  onClose,
  courses,
  onSubmit,
}) => {
  const { showToast } = useToast();
  const [courseId, setCourseId] = useState<number>(courses[0]?.id || 1);
  const [moduleNumber, setModuleNumber] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resourceType, setResourceType] = useState('PDF');
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileUrl) {
      showToast('Please provide a title and file/video URL', 'warning');
      return;
    }

    // Prohibit dangerous extensions
    const dangerous = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.vbs'];
    if (dangerous.some((ext) => fileUrl.toLowerCase().endsWith(ext))) {
      showToast('Uploaded file type is strictly prohibited for security reasons.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        course_id: Number(courseId),
        module_id: Number(moduleNumber),
        title,
        description,
        resource_type: resourceType,
        file_url: fileUrl,
      });
      showToast('Resource added to library and published to course', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to upload resource', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Publish Learning Resource to Library" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Associated Course
          </label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Course Module Target
            </label>
            <select
              value={moduleNumber}
              onChange={(e) => setModuleNumber(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value={1}>Module 1: Foundations</option>
              <option value={2}>Module 2: In-Depth</option>
              <option value={3}>Module 3: Advanced</option>
              <option value={4}>Module 4: Enterprise</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Resource Format / Type
            </label>
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="PDF">PDF Document</option>
              <option value="PPT">PPT / PPTX Slide Deck</option>
              <option value="Recorded Lecture">Recorded Lecture Video</option>
              <option value="Source Code / Study Guide">Study Guide / Code</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Resource Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Enterprise Architecture Reference Handbook"
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Secure Resource URL / YouTube Link
          </label>
          <input
            type="url"
            required
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://... or https://youtube.com/watch?v=..."
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Description & Context
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key concepts covered in this study resource..."
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
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
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow"
          >
            {isSubmitting ? 'Uploading...' : 'Publish to Library'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
