import React, { useState } from 'react';
import {
  Activity,
  Shield,
  Heart,
  Stethoscope,
  Pill,
  FileText,
  Building,
  Check,
  Copy,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Syringe,
  Scan,
  LogOut,
  Calendar,
  User,
  ShieldCheck,
  Thermometer,
  Zap,
} from 'lucide-react';

/**
 * Format ISO or raw date string to human-readable format (e.g. "Oct 12, 2026")
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Category configuration for icons, colors, and labels
 */
const CATEGORY_CONFIG = {
  lab: {
    label: 'LAB',
    icon: Activity,
    badgeClass: 'cat-lab',
    bulletClass: 'bullet-lab',
    defaultTitle: 'Laboratory Diagnostic Panel',
  },
  diagnosis: {
    label: 'DIAGNOSIS',
    icon: Stethoscope,
    badgeClass: 'cat-diagnosis',
    bulletClass: 'bullet-diagnosis',
    defaultTitle: 'Clinical Encounter & Diagnosis',
  },
  prescription: {
    label: 'PRESCRIPTION',
    icon: Pill,
    badgeClass: 'cat-prescription',
    bulletClass: 'bullet-prescription',
    defaultTitle: 'Medical Prescription',
  },
  imaging: {
    label: 'IMAGING',
    icon: Scan,
    badgeClass: 'cat-imaging',
    bulletClass: 'bullet-imaging',
    defaultTitle: 'Diagnostic Radiology & Imaging',
  },
  immunization: {
    label: 'IMMUNIZATION',
    icon: Syringe,
    badgeClass: 'cat-immunization',
    bulletClass: 'bullet-immunization',
    defaultTitle: 'Immunization Certificate',
  },
  surgery: {
    label: 'SURGERY',
    icon: Heart,
    badgeClass: 'cat-surgery',
    bulletClass: 'bullet-surgery',
    defaultTitle: 'Surgical Operative Record',
  },
  discharge: {
    label: 'DISCHARGE',
    icon: LogOut,
    badgeClass: 'cat-discharge',
    bulletClass: 'bullet-discharge',
    defaultTitle: 'Inpatient Hospital Discharge Summary',
  },
  other: {
    label: 'RECORD',
    icon: FileText,
    badgeClass: 'cat-other',
    bulletClass: 'bullet-other',
    defaultTitle: 'Clinical Medical Document',
  },
};

export default function MedicalTimelineCard({
  record,
  onViewPdf,
  onVerifyIntegrity,
  isVerifying = false,
}) {
  const [copied, setCopied] = useState(false);
  const [showRawOcr, setShowRawOcr] = useState(false);

  const catKey = (record.category || 'other').toLowerCase();
  const config = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.other;
  const CategoryIcon = config.icon;

  const displayDate =
    record.reportDate || record.date || record.encounterDate || record.createdAt;
  const formattedDate = formatDate(displayDate);

  const hashStr = record.documentHash || record.sha256Hash || '';
  const shortHash = hashStr
    ? `${hashStr.slice(0, 6)}...${hashStr.slice(-4)}`
    : '';

  const observations = Array.isArray(record.observations) ? record.observations : [];
  const structuredData = record.structuredData || {};
  const medications = Array.isArray(structuredData.medications)
    ? structuredData.medications
    : [];

  // Vitals separated from lab observations if diagnosis
  const vitals = observations.filter((o) =>
    /temperature|pulse|blood pressure|bp|spo2|oxygen|respiratory/i.test(o.name)
  );

  // Quantitative lab observations
  const labObservations =
    catKey === 'lab'
      ? observations
      : observations.filter(
          (o) => !/temperature|pulse|blood pressure|bp|spo2|oxygen/i.test(o.name)
        );

  const handleCopyHash = (e) => {
    e.stopPropagation();
    if (!hashStr) return;
    navigator.clipboard.writeText(hashStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="timeline-node-item" data-category={catKey}>
      {/* Circle Icon Node on Vertical Line */}
      <div className={`timeline-track-bullet ${config.bulletClass}`} title={config.label}>
        <CategoryIcon size={16} />
      </div>

      {/* Main Clinical Card */}
      <div className="timeline-event-card">
        {/* Header Row: Category Badge + Facility Name + Date */}
        <div className="event-top-row">
          <div className="event-facility-group">
            <span className={`category-tag-badge ${config.badgeClass}`}>
              {config.label}
            </span>
            <span className="event-facility-name" title={record.facility || 'Verified Health Node'}>
              <Building size={14} className="facility-icon" />
              {record.facility || 'Diagnostic Health Center'}
            </span>
            {record.department && (
              <span className="event-dept-chip">
                {record.department}
              </span>
            )}
          </div>
          <div className="event-date-group">
            {formattedDate && (
              <span className="event-date-text">
                <Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                {formattedDate}
              </span>
            )}
          </div>
        </div>

        {/* Clinician & Patient Metadata Strip (if present) */}
        {(record.clinician || record.encounterType || record.patientMetadata?.identifier) && (
          <div className="event-metadata-strip">
            {record.clinician && (
              <span className="meta-pill" title="Attending Physician / Surgeon">
                <User size={12} />
                <span>{record.clinician}</span>
              </span>
            )}
            {record.encounterType && (
              <span className="meta-pill encounter-type">
                <span>{record.encounterType}</span>
              </span>
            )}
            {record.patientMetadata?.identifier && (
              <span className="meta-pill identifier" title="Patient Identifier / UHID">
                <span>ID: {record.patientMetadata.identifier}</span>
              </span>
            )}
            {record.encounterDate && record.encounterDate !== record.reportDate && (
              <span className="meta-pill" title="Clinical Encounter Date">
                <span>Encounter: {formatDate(record.encounterDate)}</span>
              </span>
            )}
          </div>
        )}

        {/* Report Title & Clinical Summary */}
        <div className="event-body-content">
          <h3 className="event-record-title">{record.title || config.defaultTitle}</h3>
          {record.clinicalSummary ? (
            <p className="event-record-desc">{record.clinicalSummary}</p>
          ) : record.details ? (
            <p className="event-record-desc">
              {record.details.length > 280
                ? `${record.details.slice(0, 280)}...`
                : record.details}
            </p>
          ) : null}
        </div>

        {/* ============================================================== */}
        {/* Category-Specific Structured Content Section */}
        {/* ============================================================== */}

        {/* 1. LAB REPORT: Structured 3-Column Observation Metric Grid */}
        {catKey === 'lab' && (
          <div className="lab-observations-section">
            {labObservations.length > 0 ? (
              <div className="lab-metrics-grid">
                {labObservations.map((obs, idx) => {
                  const flag = (obs.flag || 'normal').toLowerCase();
                  return (
                    <div key={idx} className={`lab-metric-card flag-${flag}`}>
                      <div className="metric-header">
                        <span className="metric-name" title={obs.name}>{obs.name}</span>
                        {flag !== 'normal' && (
                          <span className={`flag-badge ${flag}`}>
                            {flag.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="metric-value-row">
                        <span className={`metric-number ${flag === 'high' ? 'rose' : flag === 'low' ? 'amber' : 'emerald'}`}>
                          {obs.value}
                        </span>
                        {obs.unit && <span className="metric-unit">{obs.unit}</span>}
                      </div>
                      <div className="metric-footer">
                        {obs.referenceRange ? (
                          <span className="metric-ref">Ref: {obs.referenceRange}</span>
                        ) : (
                          <span className="metric-ref text-muted">Standard panel</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="lab-empty-state">
                <Activity size={18} className="text-muted" />
                <span>No quantitative biometric measurements detected in this document.</span>
              </div>
            )}
          </div>
        )}

        {/* 2. DIAGNOSIS / CLINICAL ENCOUNTER: Vitals + Diagnosis + Advice */}
        {catKey === 'diagnosis' && (
          <div className="diagnosis-structured-section">
            {/* Vitals Strip */}
            {vitals.length > 0 && (
              <div className="vitals-strip">
                {vitals.map((v, idx) => (
                  <div key={idx} className="vital-chip">
                    <span className="vital-label">{v.name}:</span>
                    <span className={`vital-val ${v.flag === 'high' ? 'rose' : 'normal'}`}>
                      {v.value} {v.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Provisional Diagnosis Banner */}
            {structuredData.diagnosis?.provisionalDiagnosis && (
              <div className="diagnosis-banner">
                <span className="banner-label">Provisional Diagnosis:</span>
                <span className="banner-text">
                  {structuredData.diagnosis.provisionalDiagnosis}
                </span>
              </div>
            )}

            {/* Prescriptions Mini-List inside Consultation */}
            {medications.length > 0 && (
              <div className="consultation-meds-box">
                <span className="meds-box-title">
                  <Pill size={13} />
                  Prescribed Therapy ({medications.length})
                </span>
                <div className="consultation-meds-grid">
                  {medications.map((med, idx) => (
                    <div key={idx} className="med-pill-item">
                      <span className="med-name">{med.drug}</span>
                      {med.strength && <span className="med-strength">{med.strength}</span>}
                      {med.frequency && <span className="med-freq-tag">{med.frequency}</span>}
                      {med.instructions && (
                        <span className="med-inst">{med.instructions}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advice & Instructions */}
            {structuredData.diagnosis?.advice && structuredData.diagnosis.advice.length > 0 && (
              <div className="advice-box">
                <span className="advice-label">Clinical Advice:</span>
                <ul className="advice-list">
                  {structuredData.diagnosis.advice.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 3. PRESCRIPTION: Medications List */}
        {catKey === 'prescription' && (
          <div className="prescription-structured-section">
            {medications.length > 0 ? (
              <div className="prescription-meds-table">
                {medications.map((med, idx) => (
                  <div key={idx} className="prescription-row">
                    <div className="rx-icon-col">
                      <Pill size={16} />
                    </div>
                    <div className="rx-details-col">
                      <div className="rx-main-line">
                        <strong className="rx-drug-name">{med.drug}</strong>
                        {med.strength && <span className="rx-strength-chip">{med.strength}</span>}
                      </div>
                      <div className="rx-sub-line">
                        {med.instructions ? (
                          <span>{med.instructions}</span>
                        ) : (
                          <span>
                            {med.dosage || '1 tab'} • {med.frequency || 'OD'} • {med.duration || '5 days'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rx-empty-state">
                <span>Handwritten prescription details preserved in scanned record.</span>
              </div>
            )}
          </div>
        )}

        {/* 4. IMAGING: Findings & Impression */}
        {catKey === 'imaging' && structuredData.imaging && (
          <div className="imaging-structured-section">
            <div className="imaging-details-grid">
              {structuredData.imaging.modality && (
                <div className="imaging-detail-col">
                  <span className="im-label">Modality</span>
                  <span className="im-val">{structuredData.imaging.modality}</span>
                </div>
              )}
              {structuredData.imaging.region && (
                <div className="imaging-detail-col">
                  <span className="im-label">Region</span>
                  <span className="im-val">{structuredData.imaging.region}</span>
                </div>
              )}
            </div>
            {structuredData.imaging.impression && (
              <div className="imaging-impression-box">
                <span className="im-label">Impression:</span>
                <p>{structuredData.imaging.impression}</p>
              </div>
            )}
          </div>
        )}

        {/* 5. IMMUNIZATION: Vaccine Details */}
        {catKey === 'immunization' && structuredData.immunization && (
          <div className="immunization-structured-section">
            <div className="immu-grid">
              <div className="immu-item">
                <span className="immu-label">Vaccine</span>
                <span className="immu-val">{structuredData.immunization.vaccine}</span>
              </div>
              {structuredData.immunization.dose && (
                <div className="immu-item">
                  <span className="immu-label">Dose</span>
                  <span className="immu-val">{structuredData.immunization.dose}</span>
                </div>
              )}
              {structuredData.immunization.batch && (
                <div className="immu-item">
                  <span className="immu-label">Batch No.</span>
                  <span className="immu-val font-mono">{structuredData.immunization.batch}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. SURGERY: Procedure & Surgeon */}
        {catKey === 'surgery' && structuredData.surgery && (
          <div className="surgery-structured-section">
            <div className="surgery-info-row">
              {structuredData.surgery.procedure && (
                <div>
                  <span className="surg-label">Procedure: </span>
                  <strong className="surg-val">{structuredData.surgery.procedure}</strong>
                </div>
              )}
              {structuredData.surgery.surgeon && (
                <div>
                  <span className="surg-label">Lead Surgeon: </span>
                  <span className="surg-val">{structuredData.surgery.surgeon}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. DISCHARGE SUMMARY */}
        {catKey === 'discharge' && structuredData.discharge && (
          <div className="discharge-structured-section">
            <div className="discharge-grid">
              {structuredData.discharge.admissionDate && (
                <div>
                  <span className="dc-label">Admission:</span>{' '}
                  <span>{formatDate(structuredData.discharge.admissionDate)}</span>
                </div>
              )}
              {structuredData.discharge.dischargeDate && (
                <div>
                  <span className="dc-label">Discharge:</span>{' '}
                  <span>{formatDate(structuredData.discharge.dischargeDate)}</span>
                </div>
              )}
              {structuredData.discharge.condition && (
                <div>
                  <span className="dc-label">Condition:</span>{' '}
                  <strong>{structuredData.discharge.condition}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Raw OCR Toggle for Audit / Troubleshooting */}
        {record.rawOcrText && (
          <div className="ocr-audit-container">
            <button
              type="button"
              className="ocr-audit-toggle-btn"
              onClick={() => setShowRawOcr(!showRawOcr)}
            >
              <Eye size={12} />
              <span>{showRawOcr ? 'Hide Raw OCR Audit Text' : 'View Raw OCR Text'}</span>
            </button>
            {showRawOcr && (
              <pre className="ocr-audit-pre">
                {record.rawOcrText}
              </pre>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* Action Footer: PDF View + SHA-256 Copy + Integrity Status */}
        {/* ============================================================== */}
        <div className="event-footer-action-row">
          {/* View PDF Button */}
          <button
            type="button"
            className="view-pdf-btn"
            onClick={() => onViewPdf && onViewPdf(record)}
            title="View signed original medical document or validated certificate"
          >
            <FileText size={15} className="pdf-icon" />
            <span>View Signed Report (PDF)</span>
          </button>

          {/* Right Group: Cryptographic Verification Badge + SHA-256 Copy */}
          <div className="crypto-footer-group">
            {/* Verification Status Badge */}
            {record.verificationStatus === 'VERIFIED' ? (
              <span className="verification-status-chip verified" title="Document SHA-256 cryptographic integrity successfully verified">
                <ShieldCheck size={14} className="text-emerald" />
                <span>Verified</span>
              </span>
            ) : record.verificationStatus === 'FAILED' ? (
              <span className="verification-status-chip failed" title="Cryptographic verification failed: hash mismatch">
                <AlertTriangle size={14} className="text-rose" />
                <span>Integrity Mismatch</span>
              </span>
            ) : onVerifyIntegrity && hashStr ? (
              <button
                type="button"
                className="verification-action-btn"
                onClick={() => onVerifyIntegrity(record)}
                disabled={isVerifying}
                title="Verify cryptographic integrity against original file hash"
              >
                <Shield size={13} />
                <span>{isVerifying ? 'Verifying...' : 'Verify'}</span>
              </button>
            ) : null}

            {/* Genuine SHA-256 Hash Copy Chip */}
            {hashStr && (
              <button
                type="button"
                className="hash-copy-chip"
                onClick={handleCopyHash}
                title={`Click to copy full SHA-256 hash:\n${hashStr}`}
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald" />
                    <span className="copied-text">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span className="font-mono">SHA-256: {shortHash}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
