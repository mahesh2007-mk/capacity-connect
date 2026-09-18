import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { Star, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export const FeedbackPage: React.FC = () => {
  const { showToast } = useToast();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  const [overallRating, setOverallRating] = useState(5);
  const [contentQuality, setContentQuality] = useState(5);
  const [trainerQuality, setTrainerQuality] = useState(5);
  const [resourcesQuality, setResourcesQuality] = useState(5);
  const [assessmentQuality, setAssessmentQuality] = useState(5);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await api.getTraineeDashboard();
      const courses = res.enrolled_courses || [];
      setEnrolledCourses(courses);
      if (courses.length > 0) {
        setSelectedCourseId(courses[0].course_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      showToast('Please select a course to review', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitFeedback({
        course_id: Number(selectedCourseId),
        overall_rating: overallRating,
        content_quality: contentQuality,
        trainer_quality: trainerQuality,
        learning_resources: resourcesQuality,
        assessment_quality: assessmentQuality,
        comments,
      });
      setSubmittedSuccess(true);
      showToast('Feedback submitted successfully. Thank you for your review!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit feedback', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarPicker = (val: number, setVal: (n: number) => void, label: string) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
      <span className="text-xs font-bold text-gray-800">{label}</span>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setVal(star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`w-5 h-5 ${
                star <= val ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="text-xs font-bold text-gray-700 ml-2">{val} / 5</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-2">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
          Curriculum Evaluation
        </span>
        <h1 className="text-2xl font-black text-gray-950">Course & Instructor Feedback</h1>
        <p className="text-xs text-gray-500">
          Share your evaluation regarding lesson quality, study resources, and assessment rigor.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card">
        {submittedSuccess ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-950">Feedback Recorded</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Your evaluation has been saved to the database. The curriculum coordinator and faculty will review your insights.
            </p>
            <button
              onClick={() => {
                setSubmittedSuccess(false);
                setComments('');
              }}
              className="px-6 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700"
            >
              Submit Additional Feedback
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Select Course
              </label>
              <select
                value={selectedCourseId || ''}
                onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {enrolledCourses.map((c) => (
                  <option key={c.course_id} value={c.course_id}>
                    {c.course_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              {renderStarPicker(overallRating, setOverallRating, '1. Overall Course Quality')}
              {renderStarPicker(contentQuality, setContentQuality, '2. Curriculum Content & Depth')}
              {renderStarPicker(trainerQuality, setTrainerQuality, '3. Faculty Trainer Instruction')}
              {renderStarPicker(resourcesQuality, setResourcesQuality, '4. Study Guides & Resources')}
              {renderStarPicker(assessmentQuality, setAssessmentQuality, '5. Assessment Rigor & Clarity')}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Constructive Comments & Suggestions
              </label>
              <textarea
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="What did you like most? Where can this curriculum improve?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
            >
              <Send className="w-4 h-4" /> {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
