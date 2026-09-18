import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Certificate } from '@/types';
import { CertificateCard } from '@/components/common/CertificateCard';
import { Modal } from '@/components/common/Modal';
import { Award, ShieldCheck, Download, Eye, Calendar, BookOpen } from 'lucide-react';

export const CertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTraineeCertificates();
      setCertificates(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Verified Credentials
          </span>
          <h1 className="text-2xl font-black text-gray-950 mt-1">Earned Digital Certificates</h1>
          <p className="text-xs text-gray-500">
            Authenticated certificates issued upon passing the official course competency assessment.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-gray-500">Loading certificates...</div>
      ) : certificates.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-lg text-gray-900">No Certificates Earned Yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Complete all 4 learning path modules for an enrolled course and achieve a score of 70%+ on the assessment to unlock your official credential.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.certificate_id}
              className="p-6 rounded-3xl bg-white border border-gray-200 shadow-card hover:shadow-card-hover transition-all space-y-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                    <Award className="w-6 h-6 text-brand-950" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Verified
                    </span>
                    <h3 className="font-bold text-base text-gray-950 mt-1">{cert.course_title}</h3>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-400">Certificate ID:</span>
                  <span className="font-bold text-gray-900">{cert.certificate_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date Issued:</span>
                  <span>{new Date(cert.issue_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Lead Faculty:</span>
                  <span>{cert.instructor_name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setSelectedCert(cert)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow transition-all"
                >
                  <Eye className="w-4 h-4" /> View & Print Certificate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificate Modal */}
      {selectedCert && (
        <Modal
          isOpen={!!selectedCert}
          onClose={() => setSelectedCert(null)}
          title="Official Verified Certificate"
          maxWidth="4xl"
        >
          <CertificateCard
            certificate={selectedCert}
            onClose={() => setSelectedCert(null)}
          />
        </Modal>
      )}
    </div>
  );
};
