import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import {
  UserCheck, Mail, Phone, Award, Briefcase,
  BookOpen, BrainCircuit, Shield, Save, Plus, X
} from 'lucide-react';

export const TrainerProfilePage: React.FC = () => {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [workExperience, setWorkExperience] = useState('');

  // Array fields used for competency matching
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState('');

  const [specializations, setSpecializations] = useState<string[]>([]);
  const [newSpec, setNewSpec] = useState('');

  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCert, setNewCert] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTrainerProfile();
      const u = res.user || {};
      const p = res.profile || {};

      setFullName(u.full_name || '');
      setEmail(u.email || '');
      setPhone(u.phone || p.phone || '');
      setQualifications(p.qualifications || '');
      setWorkExperience(p.work_experience || '');
      setSkills(Array.isArray(p.skills) ? p.skills : []);
      setSubjects(Array.isArray(p.subjects) ? p.subjects : []);
      setSpecializations(Array.isArray(p.specializations) ? p.specializations : []);
      setCertifications(Array.isArray(p.certifications) ? p.certifications : []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load trainer profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = (list: string[], setList: (l: string[]) => void, item: string, setItem: (s: string) => void) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    if (!list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
    setItem('');
  };

  const removeItem = (list: string[], setList: (l: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateTrainerProfile({
        full_name: fullName,
        phone,
        qualifications,
        work_experience: workExperience,
        skills,
        subjects,
        specializations,
        certifications,
      });
      await refreshUser();
      showToast('Trainer profile and competency skills updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-gray-500">Loading profile data...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 uppercase tracking-wider">
            Competency & Instruction Profile
          </span>
          <h1 className="text-2xl font-black text-gray-950 mt-1">Trainer Credentials & Skills</h1>
          <p className="text-xs text-gray-500">
            These qualifications and verified competencies drive the platform's automated Competency Mapping algorithm.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Personal & Academic Background */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-6">
          <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-2 border-b border-gray-100 pb-3">
            <UserCheck className="w-4 h-4 text-emerald-600" /> Instructor Core Information
          </h3>

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
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-xs font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0100"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Academic Qualifications / Degrees
              </label>
              <input
                type="text"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                placeholder="e.g. Ph.D. in Computer Science, M.S. in Cybersecurity"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Work Experience & Pedagogical Background
            </label>
            <textarea
              rows={3}
              value={workExperience}
              onChange={(e) => setWorkExperience(e.target.value)}
              placeholder="10+ years enterprise software architecture, faculty lead at..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Competency Skills & Specializations for Algorithm */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-emerald-600" /> Competencies & Skills (Used for Matching)
            </h3>
            <p className="text-[11px] text-gray-500 mt-1">
              Add individual skills (e.g. <em>Python basics, Functions, OOP, Data structures, React, TypeScript</em>). The Competency Mapping engine calculates course suitability from these.
            </p>
          </div>

          {/* 1. Verified Skills */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Technical Competencies & Skills ({skills.length})
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem(skills, setSkills, newSkill, setNewSkill);
                  }
                }}
                placeholder="Type skill name and press enter (e.g. Python basics)"
                className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => addItem(skills, setSkills, newSkill, setNewSkill)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Add Skill
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {skills.map((s, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeItem(skills, setSkills, idx)}
                    className="text-emerald-700 hover:text-rose-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 2. Subjects */}
          <div className="space-y-2 pt-4 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Teaching Subject Areas
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g. Backend Development, Cyber Security"
                className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => addItem(subjects, setSubjects, newSubject, setNewSubject)}
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs"
              >
                Add Subject
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {subjects.map((s, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-100 text-gray-800 text-xs font-semibold"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeItem(subjects, setSubjects, idx)}
                    className="text-gray-500 hover:text-rose-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 3. Specializations & Certifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Specializations
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSpec}
                  onChange={(e) => setNewSpec(e.target.value)}
                  placeholder="e.g. Distributed Systems"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 text-xs"
                />
                <button
                  type="button"
                  onClick={() => addItem(specializations, setSpecializations, newSpec, setNewSpec)}
                  className="px-3 py-2 rounded-xl bg-gray-200 text-gray-800 text-xs font-bold"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {specializations.map((s, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gray-100 text-[11px] font-medium text-gray-700"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeItem(specializations, setSpecializations, idx)}
                      className="text-gray-400 hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Industry Certifications
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCert}
                  onChange={(e) => setNewCert(e.target.value)}
                  placeholder="e.g. AWS Solutions Architect"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 text-xs"
                />
                <button
                  type="button"
                  onClick={() => addItem(certifications, setCertifications, newCert, setNewCert)}
                  className="px-3 py-2 rounded-xl bg-gray-200 text-gray-800 text-xs font-bold"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {certifications.map((c, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gray-100 text-[11px] font-medium text-gray-700"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => removeItem(certifications, setCertifications, idx)}
                      className="text-gray-400 hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Updating Profile...' : 'Save Trainer Credentials'}
          </button>
        </div>
      </form>
    </div>
  );
};
