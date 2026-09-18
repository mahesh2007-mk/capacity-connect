import React from 'react';
import { Certificate } from '@/types';
import { Award, ShieldCheck, Download, Printer } from 'lucide-react';

interface CertificateCardProps {
  certificate: Certificate;
  onClose?: () => void;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({ certificate, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(certificate.issue_date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col items-center">
      {/* Printable Certificate Frame */}
      <div
        id="printable-certificate"
        className="relative w-full max-w-3xl bg-white border-8 border-double border-brand-900 rounded-3xl p-8 sm:p-12 shadow-2xl text-center overflow-hidden my-4"
        style={{ minHeight: '520px' }}
      >
        {/* Subtle Background Watermark */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
          <Award className="w-96 h-96 text-brand-900" />
        </div>

        {/* Outer Corner Ornaments */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-amber-600 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-amber-600 rounded-tr-xl pointer-events-none" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-amber-600 rounded-bl-xl pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-amber-600 rounded-br-xl pointer-events-none" />

        {/* Certificate Header */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-800 to-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-700/30 mb-3">
            <Award className="w-9 h-9 text-amber-300" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-widest text-brand-950 uppercase font-serif">
            CAPACITY <span className="text-brand-600">CONNECT</span>
          </h2>
          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent my-2" />
          <p className="text-[11px] uppercase tracking-widest font-semibold text-gray-500">
            Certificate of Competency Mastery & Professional Achievement
          </p>
        </div>

        {/* Body */}
        <div className="relative z-10 my-6 sm:my-8 space-y-3">
          <p className="text-xs sm:text-sm italic text-gray-600">This certifies that</p>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-950 font-serif border-b-2 border-gray-200 pb-2 inline-block px-8">
            {certificate.trainee_name}
          </div>
          <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto leading-relaxed pt-2">
            has successfully completed all required curriculum modules and passed the rigorous competency assessment for
          </p>
          <div className="text-lg sm:text-xl font-bold text-brand-800 tracking-tight">
            {certificate.course_title}
          </div>
        </div>

        {/* Signatures and Footer Details */}
        <div className="relative z-10 grid grid-cols-3 gap-4 pt-6 sm:pt-8 border-t border-gray-200 text-left items-end">
          <div>
            <div className="font-serif italic text-base text-gray-800 border-b border-gray-300 pb-1">
              {certificate.instructor_name || 'Dr. Sarah Jenkins'}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 pt-1">
              Lead Faculty Instructor
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full border-2 border-amber-500/80 bg-amber-50 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-7 h-7 text-amber-600" />
            </div>
            <span className="text-[9px] uppercase font-extrabold tracking-widest text-amber-700 mt-1">
              VERIFIED CREDENTIAL
            </span>
          </div>

          <div className="text-right">
            <div className="font-mono text-xs font-semibold text-gray-800 border-b border-gray-300 pb-1">
              {formattedDate}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 pt-1">
              Date of Issuance
            </div>
          </div>
        </div>

        {/* Credential Metadata */}
        <div className="relative z-10 mt-6 pt-3 flex items-center justify-between text-[10px] font-mono text-gray-500 border-t border-gray-100">
          <span>ID: <strong className="text-gray-900">{certificate.certificate_id}</strong></span>
          <span className="hidden sm:inline">Verification Hash: {certificate.verification_hash.substring(0, 16)}...</span>
          <span className="text-emerald-700 font-bold">STATUS: AUTHENTICATED</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mt-4 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};
