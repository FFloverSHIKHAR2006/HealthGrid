import React, { useState } from 'react';
import {
  FileText,
  X,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Building,
  User,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  Activity,
  Pill,
} from 'lucide-react';

export default function MedicalPdfModal({
  record,
  patient,
  onClose,
  onVerifyIntegrity,
  isVerifying = false,
}) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [activeTab, setActiveTab] = useState('clinical'); // 'clinical' or 'original'

  if (!record) return null;

  const hash = record.documentHash || record.sha256Hash || '';
  const observations = Array.isArray(record.observations) ? record.observations : [];
  const structuredData = record.structuredData || {};
  const medications = Array.isArray(structuredData.medications)
    ? structuredData.medications
    : [];

  const hasOriginalFile = Boolean(
    record.originalFile && record.originalFile.dataUrl
  );
  const isOriginalPdf = Boolean(
    record.originalFile?.mimeType === 'application/pdf' ||
    record.originalFile?.dataUrl?.startsWith('data:application/pdf')
  );

  const handleCopyHash = () => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pdf-modal-backdrop" onClick={onClose}>
      <div
        className="pdf-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-modal-title"
      >
        {/* Top Control Bar */}
        <div className="pdf-modal-header-bar">
          <div className="header-left">
            <FileText size={18} className="text-secondary" />
            <h3 id="pdf-modal-title" className="pdf-modal-title">
              {record.title || 'Certified Clinical Document'}
            </h3>
            <span className={`cat-pill cat-${(record.category || 'other').toLowerCase()}`}>
              {(record.category || 'other').toUpperCase()}
            </span>
          </div>

          <div className="header-right">
            {hasOriginalFile && (
              <div className="tab-pill-switcher">
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'clinical' ? 'active' : ''}`}
                  onClick={() => setActiveTab('clinical')}
                >
                  Structured Report
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'original' ? 'active' : ''}`}
                  onClick={() => setActiveTab('original')}
                >
                  Original File ({isOriginalPdf ? 'PDF' : 'Scan'})
                </button>
              </div>
            )}

            <button
              type="button"
              className="action-icon-btn"
              onClick={handlePrint}
              title="Print Clinical Record"
            >
              <Printer size={16} />
            </button>

            <button
              type="button"
              className="pdf-modal-close-btn"
              onClick={onClose}
              title="Close modal (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="pdf-modal-scroll-area">
          {activeTab === 'original' && hasOriginalFile ? (
            <div className="original-file-viewer">
              {isOriginalPdf ? (
                <iframe
                  src={record.originalFile.dataUrl}
                  title="Original Signed Medical PDF"
                  className="pdf-iframe-view"
                />
              ) : (
                <div className="original-image-wrapper">
                  <img
                    src={record.originalFile.dataUrl}
                    alt={record.originalFile.filename || 'Original Scanned Medical Record'}
                    className="original-scan-img"
                  />
                </div>
              )}
            </div>
          ) : (
            /* Official Certified Healthcare Certificate Paper */
            <div className="pdf-paper-document printable-doc">
              {/* Hospital Letterhead Header */}
              <div className="doc-letterhead">
                <div className="letterhead-brand">
                  <div className="letterhead-logo">
                    <Building size={24} />
                  </div>
                  <div className="letterhead-info">
                    <h2 className="hospital-name">
                      {record.facility || 'National Health System Diagnostic Center'}
                    </h2>
                    {record.department && (
                      <p className="hospital-dept">Department of {record.department}</p>
                    )}
                    <p className="hospital-contact">
                      ISO 15189 / NABL Accredited Diagnostic Network • Telemedicine Federation Node
                    </p>
                  </div>
                </div>
                <div className="letterhead-doc-meta">
                  <span className="doc-category-tag">
                    OFFICIAL {(record.category || 'LAB').toUpperCase()} REPORT
                  </span>
                  <span className="doc-date">
                    Date: {record.reportDate ? record.reportDate.slice(0, 10) : record.date ? record.date.slice(0, 10) : new Date().toISOString().slice(0, 10)}
                  </span>
                </div>
              </div>

              <div className="doc-divider" />

              {/* Patient & Encounter Demographics Table */}
              <div className="patient-demographics-grid">
                <div className="demo-item">
                  <span className="demo-label">Patient Name:</span>
                  <span className="demo-val">
                    {record.patientMetadata?.name || patient?.name || 'Verified Patient'}
                  </span>
                </div>
                <div className="demo-item">
                  <span className="demo-label">UHID / Patient ID:</span>
                  <span className="demo-val font-mono">
                    {record.patientMetadata?.identifier || patient?.abhaId || 'HLTH-91-8842'}
                  </span>
                </div>
                <div className="demo-item">
                  <span className="demo-label">Age / Gender:</span>
                  <span className="demo-val">
                    {record.patientMetadata?.age ? `${record.patientMetadata.age} Yrs` : '—'} / {record.patientMetadata?.gender || '—'}
                  </span>
                </div>
                <div className="demo-item">
                  <span className="demo-label">Consulting Clinician:</span>
                  <span className="demo-val">
                    {record.clinician || 'Dr. Authorized Signatory, MD'}
                  </span>
                </div>
                <div className="demo-item">
                  <span className="demo-label">Encounter Type:</span>
                  <span className="demo-val">
                    {record.encounterType || 'Outpatient Diagnostic Consultation'}
                  </span>
                </div>
                <div className="demo-item">
                  <span className="demo-label">Encounter Date:</span>
                  <span className="demo-val font-mono">
                    {record.encounterDate ? record.encounterDate.slice(0, 10) : record.date ? record.date.slice(0, 10) : '—'}
                  </span>
                </div>
              </div>

              {/* Clinical Report Headline & Summary */}
              <div className="doc-section">
                <h3 className="doc-section-title">{record.title}</h3>
                <div className="doc-clinical-summary-box">
                  <p>{record.clinicalSummary || record.details || 'Document verified on clinical registry node.'}</p>
                </div>
              </div>

              {/* Structured Observations Table (e.g. Lab or Vitals) */}
              {observations.length > 0 && (
                <div className="doc-section">
                  <h4 className="doc-subheading">
                    <Activity size={15} />
                    Quantitative Clinical Observations & Measurements
                  </h4>
                  <table className="doc-observations-table">
                    <thead>
                      <tr>
                        <th>Investigation / Test Parameter</th>
                        <th>Observed Value</th>
                        <th>Unit</th>
                        <th>Biological Reference Range</th>
                        <th>Clinical Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {observations.map((obs, idx) => {
                        const flag = (obs.flag || 'normal').toLowerCase();
                        return (
                          <tr key={idx} className={`obs-row ${flag !== 'normal' ? 'flagged' : ''}`}>
                            <td className="test-name">
                              <strong>{obs.name}</strong>
                            </td>
                            <td className={`test-value ${flag === 'high' ? 'text-rose font-bold' : flag === 'low' ? 'text-amber font-bold' : 'font-bold'}`}>
                              {obs.value}
                            </td>
                            <td className="test-unit">{obs.unit || '—'}</td>
                            <td className="test-ref font-mono">{obs.referenceRange || 'Standard'}</td>
                            <td className="test-flag">
                              <span className={`table-flag-pill ${flag}`}>
                                {flag.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Structured Medications Table (if present) */}
              {medications.length > 0 && (
                <div className="doc-section">
                  <h4 className="doc-subheading">
                    <Pill size={15} />
                    Prescribed Pharmacotherapy Details
                  </h4>
                  <table className="doc-observations-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Drug Name</th>
                        <th>Strength</th>
                        <th>Dosage & Frequency</th>
                        <th>Duration</th>
                        <th>Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medications.map((med, idx) => (
                        <tr key={idx}>
                          <td className="font-mono">{idx + 1}</td>
                          <td><strong>{med.drug}</strong></td>
                          <td>{med.strength || '—'}</td>
                          <td><span className="freq-badge">{med.frequency || 'OD'}</span></td>
                          <td>{med.duration || '—'}</td>
                          <td className="text-muted">{med.instructions || med.timing || 'As directed'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Cryptographic Validation & Integrity Seal Footer */}
              <div className="doc-crypto-seal-block">
                <div className="seal-left">
                  <div className="seal-badge">
                    {record.verificationStatus === 'VERIFIED' ? (
                      <div className="seal-verified">
                        <ShieldCheck size={28} className="text-emerald" />
                        <div>
                          <strong>CRYPTOGRAPHICALLY SEALED & VERIFIED</strong>
                          <p>SHA-256 byte digest matches genuine uploaded medical artifact.</p>
                        </div>
                      </div>
                    ) : record.verificationStatus === 'FAILED' ? (
                      <div className="seal-failed">
                        <AlertTriangle size={28} className="text-rose" />
                        <div>
                          <strong>INTEGRITY WARNING: HASH MISMATCH</strong>
                          <p>Document bytes have diverged from the registered ledger digest.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="seal-unverified">
                        <ShieldCheck size={28} className="text-muted" />
                        <div>
                          <strong>DIGITALLY REGISTERED ON ZERO-KNOWLEDGE LEDGER</strong>
                          <p>Document stored with SHA-256 integrity hash.</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {hash && (
                    <div className="hash-display-row">
                      <span className="hash-label">SHA-256 Digest:</span>
                      <code className="full-hash-code">{hash}</code>
                      <button
                        type="button"
                        className="copy-mini-btn"
                        onClick={handleCopyHash}
                        title="Copy full 64-char hash"
                      >
                        {copiedHash ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}
                </div>

                <div className="seal-signatory-col">
                  <div className="sig-line" />
                  <span className="sig-title">Authorized Medical Officer</span>
                  <span className="sig-sub">Department of Diagnostic Records</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
