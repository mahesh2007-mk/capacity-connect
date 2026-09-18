import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import {
  User, Mail, Phone, Calendar, School, Building,
  GraduationCap, Briefcase, Heart, Cpu, Award, Save, CheckCircle2
} from 'lucide-react';

export const TraineeProfilePage: React.FC = () => {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Prefer not to say');
  const [institution, setInstitution] = useState('');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [qualification, setQualification] = useState('');
  const [workExperience, setWorkExperience] = useState('');
  const [interests, setInterests] = useState('');
  const [skills, setSkills] = useState('');
  const [certificates, setCertificates] = useState('');
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTraineeProfile();
      const u = res.user || {};
      const p = res.profile || {};

      setFullName(u.full_name || '');
      setEmail(u.email || '');
      setPhone(u.phone || p.phone || '');
      setDob(p.dob || '');
      setGender(p.gender || 'Prefer not to say');
      setInstitution(p.institution || '');
      setDepartment(p.department || '');
      setYearOfStudy(p.year_of_study || '');
      setQualification(p.qualification || '');
      setWorkExperience(p.work_experience || '');
      setInterests(p.interests || '');
      setSkills(p.skills || '');
      setCertificates(p.certificates || '');
      setEnrolledCourses(res.enrolled_courses || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateTraineeProfile({
        full_name: fullName,
        phone,
        dob,
        gender,
        institution,
        department,
        year_of_study: yearOfStudy,
        qualification,
        work_experience: workExperience,
        interests,
        skills,
        certificates,
      });
      await refreshUser();
      showToast('Profile updated and saved to database successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-gray-500">Loading your profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Personal & Academic Information
          </span>
          <h1 className="text-2xl font-black text-gray-950 mt-1">Trainee Profile Management</h1>
          <p className="text-xs text-gray-500">
            Keep your credentials up to date. Only you and authorized faculty can access this profile.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-700 font-extrabold flex items-center justify-center text-base">
            {fullName.charAt(0) || 'T'}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* 1. Personal Details */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-600" /> Personal Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Email Address (System Registered)
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-xs cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                College / Institution
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. Stanford University / Tech Institute"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Department / Major
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Year of Study
              </label>
              <input
                type="text"
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                placeholder="e.g. 3rd Year / Senior"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Professional & Educational Details */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-600" /> Professional & Technical Credentials
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Highest Academic Qualification
              </label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g. Bachelor of Science in Information Technology"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Prior Work Experience / Internships
              </label>
              <textarea
                rows={2}
                value={workExperience}
                onChange={(e) => setWorkExperience(e.target.value)}
                placeholder="Summarize relevant industry internships or project roles..."
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Skills & Languages (Comma-separated)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Python, React, TypeScript, SQL, Git"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Learning Interests
                </label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="Cloud Systems, Cyber Defense, AI Pipelines"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                External Certificates & Badges
              </label>
              <input
                type="text"
                value={certificates}
                onChange={(e) => setCertificates(e.target.value)}
                placeholder="e.g. AWS Certified Cloud Practitioner, GitHub Foundations"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. Enrolled Courses List */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-4">
          <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-2">
            <School className="w-4 h-4 text-purple-600" /> Active Course Enrollments
          </h3>
          {enrolledCourses.length === 0 ? (
            <p className="text-xs text-gray-500">You are not enrolled in any courses yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {enrolledCourses.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-gray-900 block">{c.title}</span>
                    <span className="text-[10px] text-gray-500">{c.subject}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Enrolled
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md shadow-brand-500/20 transition-all hover:scale-105"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
