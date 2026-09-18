import React from 'react';
import { BookOpen, ShieldCheck, Target, Award, Users, CheckCircle } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
          About Capacity Connect
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-950 tracking-tight">
          Connecting Capability with Real Industry Need
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          CAPACITY CONNECT is built to modernize enterprise upskilling. By uniting structured 4-module learning paths, algorithmic trainer-to-course competency matching, and rigorous anti-cheat evaluations, we provide a trustworthy benchmark for talent readiness.
        </p>
      </div>

      {/* Mission & Vision Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-gray-200 shadow-subtle space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-gray-950">Our Mission</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            To eliminate the workforce readiness gap through transparent, verifiable, and competency-driven education. Every trainee is given equal access to high-caliber instructors and verified credentials.
          </p>
        </div>

        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-gray-200 shadow-subtle space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-gray-950">Our Quality Standard</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            No fake credentials or inflated metrics. Assessments enforce a minimum 70% passing bar, question pools rotate between retakes, and certificates are cryptographically verifiable.
          </p>
        </div>
      </div>

      {/* Core Principles */}
      <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 shadow-card space-y-8">
        <h3 className="text-2xl font-black text-gray-950 text-center">
          Three Pillars of the Platform
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3 text-left">
            <div className="text-brand-600 font-extrabold text-lg">01. Algorithmic Matching</div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Courses define required competencies. Our backend matching engine evaluates trainer qualifications and calculates suitability percentages to ensure optimal instruction quality.
            </p>
          </div>

          <div className="space-y-3 text-left">
            <div className="text-brand-600 font-extrabold text-lg">02. Structured Pathways</div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Every course provides an orderly 4-module progression with video lessons and reference documentation. Module completion unlocks the official assessment track.
            </p>
          </div>

          <div className="space-y-3 text-left">
            <div className="text-brand-600 font-extrabold text-lg">03. Secure Governance</div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Strict role isolation between Trainees, Trainers, and Administrators guarantees privacy, prevents unauthorized role escalation, and maintains academic integrity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
