import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Award, ShieldCheck, Mail, Phone, MapPin, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-950 text-gray-300 pt-16 pb-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-gray-800">
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                CAPACITY <span className="text-brand-400">CONNECT</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              Building Skills. Connecting Capacity. Creating Impact. Modern competency-based learning architecture empowering enterprise professionals and trainers worldwide.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1 text-xs text-brand-400 font-medium bg-brand-950/60 px-2.5 py-1 rounded-md border border-brand-800/60">
                <ShieldCheck className="w-3.5 h-3.5" /> SOC2 & ISO Compliant
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/60">
                <Award className="w-3.5 h-3.5" /> Certified Curricula
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/courses" className="hover:text-brand-400 transition-colors">Course Catalog</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-brand-400 transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-brand-400 transition-colors">Help & Support</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-400 transition-colors">Sign In</Link>
              </li>
            </ul>
          </div>

          {/* Roles */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Modules</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/login" className="hover:text-brand-400 transition-colors">Trainee Learning Paths</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-400 transition-colors">Trainer Portal</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-400 transition-colors">Competency Mapping</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-400 transition-colors">Admin Governance</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Connect</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <a href="mailto:mahesh676755@gmail.com" className="hover:text-brand-400 transition-colors">
                  mahesh676755@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                <a href="tel:+916374227040" className="hover:text-brand-400 transition-colors">
                  +91 6374227040
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
                <span>Global Education Network</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <div>
            &copy; {new Date().getFullYear()} CAPACITY CONNECT. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-400 cursor-pointer">Security Safeguards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
