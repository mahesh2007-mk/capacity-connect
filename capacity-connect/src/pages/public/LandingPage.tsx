import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Announcement, Achievement, LearningContent, Course } from '@/types';
import {
  BrainCircuit, Users, Award, BookOpen, BarChart3, ShieldCheck,
  ArrowRight, CheckCircle2, Megaphone, Trophy, Sparkles, ExternalLink
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [data, setData] = useState<{
    announcements: Announcement[];
    achievements: Achievement[];
    learning_content: LearningContent[];
    courses: Course[];
    stats: {
      total_trainees: number;
      total_trainers: number;
      total_courses: number;
      certificates_issued: number;
    };
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLandingData();
  }, []);

  const loadLandingData = async () => {
    try {
      const res = await api.getLandingData();
      setData(res);
    } catch (err) {
      console.error('Failed to load landing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-20 pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-gray-50 pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100/80 border border-brand-200 text-brand-800 text-xs font-bold uppercase tracking-wider mb-6 shadow-subtle">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" /> Next-Generation Workforce Capacity Platform
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-gray-950 tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Building Skills. <br className="hidden sm:inline" />
            Connecting Capacity. <br className="hidden sm:inline" />
            <span className="text-brand-600">Creating Impact.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            CAPACITY CONNECT is an enterprise-grade capacity building ecosystem that unifies structured learning paths, algorithmic competency mapping, timed assessments, and verifiable credentials.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              to="/signup"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-base shadow-lg shadow-brand-500/25 transition-all hover:scale-105"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/courses"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white hover:bg-gray-50 text-gray-800 font-bold text-base border border-gray-300 shadow-sm transition-all"
            >
              Explore Courses
            </Link>
          </div>

          {/* Quick Credential Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Free Trainee Enrollment</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Algorithmic Competency Matching</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Verifiable Digital Certificates</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Platform Real Statistics Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 sm:p-10 rounded-3xl bg-gray-950 text-white shadow-2xl">
          <div className="text-center space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-brand-400">
              {data?.stats?.total_trainees || '500+'}
            </div>
            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">Active Trainees</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400">
              {data?.stats?.total_trainers || '24'}
            </div>
            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">Vetted Instructors</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-amber-400">
              {data?.stats?.total_courses || '12'}
            </div>
            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">Specialized Tracks</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-white">
              {data?.stats?.certificates_issued || '380+'}
            </div>
            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">Certificates Issued</div>
          </div>
        </div>
      </section>

      {/* 3. Published Announcements (if published by Admin) */}
      {data?.announcements && data.announcements.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Official Updates</span>
              <h2 className="text-2xl font-black text-gray-950 mt-1 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-brand-600" /> Platform Announcements
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-6 rounded-3xl bg-white border border-gray-200 hover:border-brand-300 hover:shadow-card transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700">
                    {ann.target_audience.toUpperCase()}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-bold text-base text-gray-900 line-clamp-1">{ann.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                  {ann.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Six Core Platform Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Integrated Capabilities</span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-950 mt-2">
            Engineered for High-Impact Capacity Building
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Every feature works harmoniously to bridge skill gaps between academia and enterprise needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <BrainCircuit className="w-6 h-6 text-brand-600" />,
              title: 'Competency-Based Learning',
              desc: 'Structured 4-module progressive learning pathways tied to industry-verified capabilities.',
            },
            {
              icon: <Users className="w-6 h-6 text-emerald-600" />,
              title: 'Trainer Expertise & Matching',
              desc: 'Algorithmic matching calculates trainer suitability percentages and pairs qualified instructors with courses.',
            },
            {
              icon: <Award className="w-6 h-6 text-amber-600" />,
              title: 'Timed Assessments & Retakes',
              desc: 'Rigorous anti-cheat timed question evaluations with varied question pools generated for every retake.',
            },
            {
              icon: <BookOpen className="w-6 h-6 text-purple-600" />,
              title: 'Rich Learning Resources',
              desc: 'Curated PDF study guides, interactive code notebooks, and embedded YouTube lecture materials.',
            },
            {
              icon: <BarChart3 className="w-6 h-6 text-indigo-600" />,
              title: 'Performance Tracking',
              desc: 'Real-time database analytics measuring participation, module progress, and average scores.',
            },
            {
              icon: <ShieldCheck className="w-6 h-6 text-rose-600" />,
              title: 'Verifiable Certification',
              desc: 'Cryptographically hashed and uniquely identified digital certificates issued only upon mastery.',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-white border border-gray-200 hover:border-brand-500/50 hover:shadow-card-hover transition-all space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">
                {feature.icon}
              </div>
              <h3 className="font-bold text-lg text-gray-950">{feature.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Published Achievements (if published by Admin) */}
      {data?.achievements && data.achievements.length > 0 && (
        <section className="bg-gradient-to-r from-gray-900 to-navy-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Trophy className="w-4 h-4" /> Platform Milestones
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mb-8">Recognizing Cohort Excellence</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.achievements.map((ach) => (
                <div
                  key={ach.id}
                  className="p-6 rounded-3xl bg-white/5 backdrop-blur border border-white/10 space-y-3"
                >
                  <div className="text-3xl font-black text-amber-400">{ach.metric}</div>
                  <h3 className="font-bold text-base text-white">{ach.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{ach.description}</p>
                  <div className="text-[10px] text-gray-500 uppercase font-bold pt-2 border-t border-white/5">
                    Cohort: {ach.recipient}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Featured Courses Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Curriculum Catalog</span>
            <h2 className="text-3xl font-black text-gray-950 mt-1">Featured Capacity Programs</h2>
          </div>
          <Link
            to="/courses"
            className="flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-800"
          >
            View All Courses <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data?.courses && data.courses.slice(0, 3).map((course) => (
            <div
              key={course.id}
              className="rounded-3xl bg-white border border-gray-200 overflow-hidden shadow-subtle hover:shadow-card-hover transition-all flex flex-col justify-between"
            >
              <div>
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                      {course.subject}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">{course.duration}</span>
                  </div>

                  <h3 className="font-bold text-lg text-gray-950 line-clamp-1">{course.title}</h3>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">
                  {course.modules_count || 4} Structured Modules
                </span>
                <Link
                  to="/courses"
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-sm"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Newly Published Learning Content (Admin updates) */}
      {data?.learning_content && data.learning_content.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Educational Knowledge</span>
              <h2 className="text-2xl font-black text-gray-950 mt-1">Newly Published Learning Content</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.learning_content.map((lc) => (
              <div
                key={lc.id}
                className="p-6 rounded-3xl bg-white border border-gray-200 hover:shadow-card transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                    {lc.category}
                  </span>
                  <h3 className="font-bold text-base text-gray-950">{lc.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                    {lc.description}
                  </p>
                </div>
                {lc.media_url && (
                  <a
                    href={lc.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-800 pt-2"
                  >
                    Read Publication <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 text-white text-center space-y-6 shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight max-w-2xl mx-auto">
            Ready to Accelerate Your Organization’s Competency?
          </h2>
          <p className="text-sm sm:text-base text-brand-100 max-w-xl mx-auto leading-relaxed">
            Join thousands of trainees and top industry trainers on CAPACITY CONNECT. Free registration with verified completion certificates.
          </p>
          <div className="pt-2">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-brand-900 font-extrabold text-sm hover:bg-gray-50 shadow-lg transition-transform hover:scale-105"
            >
              Start Free Learning Journey <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
