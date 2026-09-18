import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Certificate } from '@/types';
import { CertificateCard } from '@/components/common/CertificateCard';
import { Modal } from '@/components/common/Modal';
import { Award, Eye, ShieldCheck, Search } from 'lucide-react';

export const CertificationsMonitoringPage: React.FC = () => {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCerts();
  }, []);

  const loadCerts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminCertifications();
      setCerts(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCerts = certs.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.certificate_id.toLowerCase().includes(q) ||
      c.trainee_name.toLowerCase().includes(q) ||
      c.course_title.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 uppercase tracking-wider">
            Credential Governance
          </span>
          <h1 className="text-2xl font-black text-gray-950 mt-1">Certificate Registry & Audit</h1>
          <p className="text-xs text-gray-500">
            Audit cryptographic credentials issued to students upon verified competency mastery.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by ID or student name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-gray-500">Loading certificate registry...</div>
      ) : filteredCerts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-xs text-gray-500">
          No certificates found.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Certificate ID</th>
                  <th className="px-6 py-4">Trainee Name</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Instructor</th>
                  <th className="px-6 py-4">Issue Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredCerts.map((c) => (
                  <tr key={c.certificate_id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-brand-700">
                      {c.certificate_id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{c.trainee_name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{c.trainee_email}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {c.course_title}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {c.instructor_name}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(c.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedCert(c)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[11px] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect Credential
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedCert && (
        <Modal
          isOpen={!!selectedCert}
          onClose={() => setSelectedCert(null)}
          title="Official Verified Credential"
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
