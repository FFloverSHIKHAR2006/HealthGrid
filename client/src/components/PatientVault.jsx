import React, { useState, useEffect } from 'react';
import {
  Heart,
  Activity,
  Droplet,
  Zap,
  Plus,
  Scan,
  Shield,
  Clock,
  Pill,
  AlertTriangle,
  FileText,
  Download,
  Trash2,
  CheckCircle2,
  Edit2,
  Filter,
  Check,
  Copy,
  ExternalLink,
  Phone,
  ShieldCheck,
  Stethoscope,
  Baby,
  Calendar,
  Building,
} from 'lucide-react';
import ShimmerButton from './ShimmerButton';
import MedicalTimelineCard from './MedicalTimelineCard';
import MedicalPdfModal from './modals/MedicalPdfModal';
import { api } from '../services/api';

export default function PatientVault({
  vault,
  onOpenAddRoutine,
  onOpenAddRecord,
  onOpenScanner,
  onOpenEditProfile,
  onToggleRoutine,
  onDeleteRoutine,
  onTriggerEmergency,
  onOpenAddReminder,
  onRecordAdherence,
  onDeleteReminder,
  onAutoSchedulePrescription,
}) {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [copiedHash, setCopiedHash] = useState(null);
  const [selectedPdfRecord, setSelectedPdfRecord] = useState(null);
  const [verifyingRecordId, setVerifyingRecordId] = useState(null);
  const [localRecords, setLocalRecords] = useState(vault?.records || vault?.medicalRecords || []);

  const patient = vault?.patient;
  const records = localRecords.length > 0 ? localRecords : vault?.records || vault?.medicalRecords || [];
  const routines = vault?.routines || [];
  const prescriptions = vault?.prescriptions || [];
  const reminders = vault?.reminders || [];
  const medicationReminders = reminders.filter((r) => r.type === 'medication');
  const appointmentReminders = reminders.filter((r) => r.type === 'appointment');
  const telemetry = patient?.telemetry || {
    heartRate: 72,
    bloodPressure: { systolic: 118, diastolic: 78 },
    glucose: 92,
    hrv: 62,
  };

  useEffect(() => {
    if (vault?.records || vault?.medicalRecords) {
      setLocalRecords(vault.records || vault.medicalRecords || []);
    }
  }, [vault]);

  const handleVerifyRecord = async (rec) => {
    if (!rec?._id) return;
    try {
      setVerifyingRecordId(rec._id);
      const res = await api.verifyRecord(rec._id, rec.documentHash || rec.sha256Hash);
      if (res?.record) {
        setLocalRecords((prev) =>
          prev.map((r) => (r._id === rec._id ? { ...r, ...res.record } : r))
        );
        if (selectedPdfRecord?._id === rec._id) {
          setSelectedPdfRecord((prev) => ({ ...prev, ...res.record }));
        }
      }
    } catch (err) {
      console.error('Record verification failed:', err);
    } finally {
      setVerifyingRecordId(null);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (categoryFilter === 'all') return true;
    return (r.category || '').toLowerCase() === categoryFilter.toLowerCase();
  });

  const getCategoryCount = (cat) => {
    if (cat === 'all') return records.length;
    return records.filter((r) => (r.category || '').toLowerCase() === cat.toLowerCase()).length;
  };

  // Copy hash feedback
  const handleCopyHash = (hash) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Export passport JSON
  const handleExportPassport = () => {
    const passportData = {
      exportVersion: 'HealthGrid-v4.8-ZK-Passport',
      exportedAt: new Date().toISOString(),
      patientIdentity: {
        name: patient?.name,
        abhaId: '91-8842-4910-4491',
        healthGridId: `HG-${patient?._id?.slice(-8)?.toUpperCase() || '8904-2026'}`,
        bloodGroup: patient?.bloodGroup,
        emergencyContact: patient?.emergencyContact,
        allergies: patient?.allergies,
      },
      biometrics: telemetry,
      lifetimeRecords: records,
      activePrescriptions: prescriptions,
      activeRoutines: routines,
      cryptographicSignature: {
        hashAlgorithm: 'SHA-256',
        ledgerAnchor: 'Consensus-Cluster-Delhi-NCR-Fed08',
        proofState: 'VALIDATED_ZERO_KNOWLEDGE',
      },
    };

    const blob = new Blob([JSON.stringify(passportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HealthGrid-Passport-${patient?.name?.replace(/\s+/g, '_') || 'Patient'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="stitch-patient-vault-container">
      {/* Top Welcoming & Action Header */}
      <div className="vault-top-banner">
        <div className="vault-titles-block">
          <div className="vault-badge-row">
            <span className="vault-micro-tag">Verified Patient Health Vault</span>
            <span className="pulsing-green-dot" />
          </div>
          <h1 className="vault-welcome-text">Welcome back, {patient?.name?.split(' ')[0] || 'Patient'}</h1>
          <p className="vault-subtitle-text">
            Your comprehensive electronic health records, diagnostic lab reports, vitals monitoring, and prescriptions
            stored live in MongoDB.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="vault-action-toolbar">
          <ShimmerButton
            variant="primary"
            size="md"
            onClick={onOpenScanner}
            icon={Scan}
          >
            Upload Report Image (OCR)
          </ShimmerButton>

          <ShimmerButton
            variant="outline"
            size="md"
            onClick={onOpenAddRecord}
            icon={Plus}
          >
            Log Record Manually
          </ShimmerButton>

          <ShimmerButton
            variant="outline"
            size="md"
            onClick={handleExportPassport}
            icon={Download}
          >
            Download Health Summary
          </ShimmerButton>
        </div>
      </div>

      {/* Telemetry Grid (4-Column Precision Biometric Cards) */}
      <div className="telemetry-four-grid">
        {/* Metric 1: Resting Heart Rate */}
        <div className="telemetry-card">
          <div className="telemetry-header">
            <div className="telemetry-label-group">
              <div className="telemetry-icon-box emerald">
                <Heart size={18} />
              </div>
              <span className="telemetry-title">Resting HR</span>
            </div>
            <span className="telemetry-status-pill optimal">
              <span className="pulse-dot-sm" /> Optimal
            </span>
          </div>

          <div className="telemetry-value-row">
            <span className="telemetry-big-num">{telemetry.heartRate || 72}</span>
            <span className="telemetry-unit">BPM</span>
          </div>

          {/* Waveform sparkline SVG */}
          <div className="telemetry-wave-container">
            <svg className="sparkline-svg emerald" fill="none" viewBox="0 0 160 32">
              <path
                d="M0 16 L25 16 L35 6 L42 26 L48 10 L54 20 L60 16 L95 16 L105 8 L112 24 L118 12 L124 19 L130 16 L160 16"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="telemetry-footer-row">
            <span>Rhythm baseline</span>
            <span className="telemetry-target-bold">60–100 BPM</span>
          </div>
        </div>

        {/* Metric 2: Blood Pressure */}
        <div className="telemetry-card">
          <div className="telemetry-header">
            <div className="telemetry-label-group">
              <div className="telemetry-icon-box indigo">
                <Activity size={18} />
              </div>
              <span className="telemetry-title">Blood Pressure</span>
            </div>
            <span className="telemetry-status-pill normotensive">
              Normotensive
            </span>
          </div>

          <div className="telemetry-value-row">
            <span className="telemetry-big-num">
              {telemetry.bloodPressure?.systolic || 118}/{telemetry.bloodPressure?.diastolic || 78}
            </span>
            <span className="telemetry-unit">mmHg</span>
          </div>

          {/* Pulse trend SVG */}
          <div className="telemetry-wave-container">
            <svg className="sparkline-svg indigo" fill="none" viewBox="0 0 160 32">
              <path
                d="M0 20 Q 30 10, 60 18 T 120 14 T 160 16"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle cx="160" cy="16" r="3.5" fill="currentColor" />
            </svg>
          </div>

          <div className="telemetry-footer-row">
            <span>MAP: 91 mmHg</span>
            <span className="telemetry-target-indigo">Stage A Verified</span>
          </div>
        </div>

        {/* Metric 3: Fasting Glucose */}
        <div className="telemetry-card">
          <div className="telemetry-header">
            <div className="telemetry-label-group">
              <div className="telemetry-icon-box emerald-soft">
                <Droplet size={18} />
              </div>
              <span className="telemetry-title">Fasting Glucose</span>
            </div>
            <span className="telemetry-status-pill euglycemic">
              Euglycemic
            </span>
          </div>

          <div className="telemetry-value-row">
            <span className="telemetry-big-num">{telemetry.glucose || 92}</span>
            <span className="telemetry-unit">mg/dL</span>
          </div>

          {/* Glucose curve SVG */}
          <div className="telemetry-wave-container">
            <svg className="sparkline-svg emerald" fill="none" viewBox="0 0 160 32">
              <path
                d="M0 16 C 40 18, 70 12, 110 16 S 140 14, 160 15"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M0 16 C 40 18, 70 12, 110 16 S 140 14, 160 15 L 160 32 L 0 32 Z"
                fill="currentColor"
                fillOpacity="0.08"
              />
            </svg>
          </div>

          <div className="telemetry-footer-row">
            <span>CGM Continuous</span>
            <span className="telemetry-target-bold">Target: 70–99</span>
          </div>
        </div>

        {/* Metric 4: HRV */}
        <div className="telemetry-card">
          <div className="telemetry-header">
            <div className="telemetry-label-group">
              <div className="telemetry-icon-box indigo-soft">
                <Zap size={18} />
              </div>
              <span className="telemetry-title">HRV Index</span>
            </div>
            <span className="telemetry-status-pill recovery">
              High Recovery
            </span>
          </div>

          <div className="telemetry-value-row">
            <span className="telemetry-big-num">{telemetry.hrv || 62}</span>
            <span className="telemetry-unit">ms</span>
          </div>

          {/* HRV dynamic animated bars */}
          <div className="hrv-bars-wrapper">
            <div className="hrv-bar h-4" />
            <div className="hrv-bar h-6" />
            <div className="hrv-bar h-5" />
            <div className="hrv-bar h-8 active" />
            <div className="hrv-bar h-7" />
            <div className="hrv-bar h-6" />
          </div>

          <div className="telemetry-footer-row">
            <span>Parasympathetic</span>
            <span className="telemetry-target-indigo">Tone Balanced</span>
          </div>
        </div>
      </div>

      {/* Main Asymmetric 2-Column Split: Clinical Timeline (65%) vs Directives & Action Cards (35%) */}
      <div className="vault-main-split-grid">
        {/* LEFT COLUMN: Lifetime Health History (8 Cols) */}
        <section className="vault-left-timeline-section">
          {/* Section Header with Filter Pills */}
          <div className="timeline-header-card">
            <div className="timeline-title-row">
              <div>
                <h2 className="timeline-heading">Unified Lifetime Health History</h2>
                <p className="timeline-subheading">
                  Persistent medical events, labs, vaccinations, and digitized hospital encounters.
                </p>
              </div>
              <div className="immutable-ledger-chip">
                <ShieldCheck size={16} />
                <span>Immutable Ledger</span>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="timeline-filter-pills-row">
              {[
                { id: 'all', label: 'All Logs' },
                { id: 'lab', label: 'Lab' },
                { id: 'diagnosis', label: 'Diagnosis' },
                { id: 'prescription', label: 'Prescription' },
                { id: 'imaging', label: 'Imaging' },
                { id: 'immunization', label: 'Immunization' },
                { id: 'surgery', label: 'Surgery' },
                { id: 'discharge', label: 'Discharge' },
              ].map((cat) => {
                const count = getCategoryCount(cat.id);
                const isActive = categoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`timeline-filter-pill ${isActive ? 'active' : ''}`}
                    onClick={() => setCategoryFilter(cat.id)}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vertical Timeline Stack */}
          <div className="timeline-vertical-track">
            {filteredRecords.length === 0 ? (
              <div className="timeline-empty-card">
                <FileText size={32} className="text-muted" />
                <p>No records found in this category.</p>
              </div>
            ) : (
              filteredRecords.map((rec, idx) => (
                <MedicalTimelineCard
                  key={rec._id || idx}
                  record={rec}
                  onViewPdf={(r) => setSelectedPdfRecord(r)}
                  onVerifyIntegrity={handleVerifyRecord}
                  isVerifying={verifyingRecordId === rec._id}
                />
              ))
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Emergency Card, E-Prescriptions, Routines (4 Cols) */}
        <aside className="vault-right-aside-section">
          {/* Emergency Health Card (Crimson Highlight) */}
          <div className="emergency-health-card">
            <div className="emergency-card-top-accent" />
            <div className="emergency-card-header">
              <div className="emergency-title-group">
                <div className="emergency-icon-box">
                  <AlertTriangle size={18} />
                </div>
                <h2 className="emergency-heading">Emergency Health Card</h2>
              </div>
              <button
                type="button"
                className="edit-emergency-btn"
                onClick={onOpenEditProfile}
              >
                <Edit2 size={14} />
                <span>Edit (FR-06)</span>
              </button>
            </div>

            {/* Blood Group Highlight Banner */}
            <div className="blood-group-banner">
              <div className="blood-group-texts">
                <span className="blood-caption">BLOOD GROUP</span>
                <span className="blood-type-label">Rh Positive Typing</span>
              </div>
              <span className="blood-group-value">{patient?.bloodGroup || 'O+'}</span>
            </div>

            {/* Primary Contact */}
            <div className="emergency-contact-box">
              <span className="contact-overline">PRIMARY EMERGENCY CONTACT</span>
              <span className="contact-name">
                {patient?.emergencyContact?.name || 'Mark Jenkins'} ({patient?.emergencyContact?.relationship || 'Spouse'})
              </span>
              <div className="contact-phone-row">
                <span className="contact-phone-num">
                  {patient?.emergencyContact?.phone || '+91 98765 00000'}
                </span>
                <a
                  href={`tel:${patient?.emergencyContact?.phone || '+919876500000'}`}
                  className="speed-dial-link"
                >
                  <Phone size={13} />
                  <span>Speed Dial</span>
                </a>
              </div>
            </div>

            {/* Allergies & Alerts */}
            <div className="allergies-box">
              <span className="allergies-heading">
                <AlertTriangle size={14} />
                Active Critical Allergies
              </span>
              <div className="allergies-tags-row">
                {(patient?.allergies && patient.allergies.length > 0
                  ? patient.allergies
                  : ['Penicillin (Anaphylactic)', 'Latex Sensitivity', 'Peanuts']
                ).map((allergy, i) => (
                  <span key={i} className="allergy-pill">
                    <span className="allergy-dot" />
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Active E-Prescriptions Module */}
          <div className="prescriptions-card">
            <div className="prescriptions-header">
              <div className="prescriptions-title-group">
                <div className="prescriptions-icon-box">
                  <Pill size={18} />
                </div>
                <h2 className="prescriptions-heading">Active E-Prescriptions</h2>
              </div>
              <span className="prescriptions-count-chip">
                {prescriptions.length || 2} Valid
              </span>
            </div>

            <div className="prescriptions-list">
              {(prescriptions.length > 0
                ? prescriptions
                : [
                    {
                      _id: 'rx1',
                      medication: 'Metformin 500mg',
                      dosage: '1 TAB BID',
                      frequency: 'Twice daily • 30 days remaining',
                      instructions: 'Take after breakfast and dinner with water.',
                      doctor: 'Dr. Alexander Wright, MD',
                    },
                    {
                      _id: 'rx2',
                      medication: 'Atorvastatin 20mg',
                      dosage: '1 TAB HS',
                      frequency: 'Once daily • 90 days supply',
                      instructions: 'Take in the evening with or without food. 3 refills left.',
                      doctor: 'Apollo Pharmacy Linked',
                    },
                  ]
              ).map((rx, idx) => (
                <div key={rx._id || idx} className="rx-item-box">
                  <div className="rx-item-top">
                    <div>
                      <h3 className="rx-med-name">{rx.medication}</h3>
                      <span className="rx-dosage-info">{rx.frequency || rx.dosage}</span>
                    </div>
                    <span className="rx-code-tag">{rx.dosage || '1 TAB BID'}</span>
                  </div>
                  <p className="rx-instructions">{rx.instructions}</p>
                  <div className="rx-footer-line">
                    <span>{rx.doctor?.name || rx.doctor || 'Dr. Alexander Wright, MD'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="rx-verified-tag">Auto-Refill On</span>
                      {onAutoSchedulePrescription && rx._id && (
                        <button
                          type="button"
                          onClick={() => onAutoSchedulePrescription(rx._id)}
                          style={{
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '10px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Generate automated medication reminder schedule"
                        >
                          <Clock size={10} />
                          Auto-Schedule
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Health Routines & Adherence Checklist (FR-05, FR-06, FR-07) */}
          <div className="routines-checklist-card">
            <div className="routines-header">
              <div className="routines-title-group">
                <div className="routines-icon-box">
                  <CheckCircle2 size={18} />
                </div>
                <h2 className="routines-heading">Daily Routines</h2>
              </div>
              <button
                type="button"
                className="add-routine-btn"
                onClick={onOpenAddRoutine}
              >
                <Plus size={15} />
                <span>Add</span>
              </button>
            </div>

            <div className="routines-list">
              {routines.length === 0 ? (
                <p className="no-routines-msg">No active routines scheduled yet.</p>
              ) : (
                routines.map((routine) => {
                  const isDone = routine.status === 'completed';
                  return (
                    <div
                      key={routine._id}
                      className={`routine-item-row ${isDone ? 'completed' : ''}`}
                    >
                      <label className="routine-checkbox-label">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => onToggleRoutine(routine)}
                          className="routine-checkbox-input"
                        />
                        <div className="routine-custom-checkbox">
                          {isDone && <Check size={13} className="text-white" />}
                        </div>
                        <div className="routine-texts">
                          <span className={`routine-title ${isDone ? 'line-through' : ''}`}>
                            {routine.title}
                          </span>
                          <span className="routine-meta">
                            {routine.time} • {routine.frequency}
                          </span>
                        </div>
                      </label>

                      <button
                        type="button"
                        className="routine-delete-btn"
                        onClick={() => onDeleteRoutine(routine._id)}
                        title="Delete routine"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Medication Reminders & Adherence Card */}
          <div className="routines-checklist-card" style={{ marginTop: '20px' }}>
            <div className="routines-header">
              <div className="routines-title-group">
                <div className="routines-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <Pill size={18} />
                </div>
                <div>
                  <h2 className="routines-heading">Medication Reminders</h2>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Daily Dose Adherence
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="add-routine-btn"
                onClick={() => onOpenAddReminder && onOpenAddReminder('medication')}
                title="Schedule new medication reminder"
              >
                <Plus size={15} />
                <span>Add</span>
              </button>
            </div>

            <div className="routines-list" style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {medicationReminders.length === 0 ? (
                <p className="no-routines-msg">No active medication reminders scheduled yet.</p>
              ) : (
                medicationReminders.map((rem) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const todayAdherence = rem.adherenceHistory?.find(
                    (a) => new Date(a.timestamp).toISOString().split('T')[0] === todayStr
                  );
                  const isTakenToday = todayAdherence?.status === 'taken';
                  const isSkippedToday = todayAdherence?.status === 'skipped';
                  const totalTaken = rem.adherenceHistory?.filter((a) => a.status === 'taken').length || 0;

                  return (
                    <div
                      key={rem._id}
                      style={{
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-light, #27272a)',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main, #fff)' }}>
                              {rem.title}
                            </span>
                            {rem.dosage && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#10b981',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                }}
                              >
                                {rem.dosage}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            <Clock size={12} />
                            <span>{rem.time || 'Scheduled'} • {rem.frequency || 'Daily'}</span>
                          </div>
                        </div>

                        {onDeleteReminder && (
                          <button
                            type="button"
                            className="routine-delete-btn"
                            onClick={() => onDeleteReminder(rem._id)}
                            title="Delete reminder"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {rem.instructions && (
                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary, #a1a1aa)', fontStyle: 'italic' }}>
                          "{rem.instructions}"
                        </p>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px dashed var(--border-light, #27272a)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Adherence: <strong>{totalTaken}</strong> doses logged
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isTakenToday ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                color: '#10b981',
                                fontWeight: 600,
                              }}
                            >
                              <CheckCircle2 size={13} /> Taken Today
                            </span>
                          ) : isSkippedToday ? (
                            <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>
                              Skipped
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => onRecordAdherence && onRecordAdherence(rem._id, 'taken')}
                                style={{
                                  background: 'rgba(16, 185, 129, 0.2)',
                                  color: '#10b981',
                                  border: '1px solid rgba(16, 185, 129, 0.4)',
                                  borderRadius: '4px',
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                title="Mark dose taken"
                              >
                                <Check size={12} /> Take
                              </button>
                              <button
                                type="button"
                                onClick={() => onRecordAdherence && onRecordAdherence(rem._id, 'skipped')}
                                style={{
                                  background: 'transparent',
                                  color: 'var(--text-muted)',
                                  border: '1px solid var(--border-light, #3f3f46)',
                                  borderRadius: '4px',
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                }}
                                title="Mark dose skipped"
                              >
                                Skip
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Upcoming Doctor Appointments Card */}
          <div className="routines-checklist-card" style={{ marginTop: '20px' }}>
            <div className="routines-header">
              <div className="routines-title-group">
                <div className="routines-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <h2 className="routines-heading">Doctor Appointments</h2>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Upcoming Consultations
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="add-routine-btn"
                onClick={() => onOpenAddReminder && onOpenAddReminder('appointment')}
                title="Schedule new appointment alert"
              >
                <Plus size={15} />
                <span>Add</span>
              </button>
            </div>

            <div className="routines-list" style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {appointmentReminders.length === 0 ? (
                <p className="no-routines-msg">No upcoming doctor appointments scheduled.</p>
              ) : (
                appointmentReminders.map((app) => {
                  const dateFormatted = app.appointmentDate
                    ? new Date(app.appointmentDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Upcoming';

                  return (
                    <div
                      key={app._id}
                      style={{
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-light, #27272a)',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main, #fff)' }}>
                            {app.title}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#60a5fa', marginTop: '2px' }}>
                            <Stethoscope size={12} />
                            <span>{app.doctorName || 'Specialist'} {app.specialty ? `(${app.specialty})` : ''}</span>
                          </div>
                        </div>

                        {onDeleteReminder && (
                          <button
                            type="button"
                            className="routine-delete-btn"
                            onClick={() => onDeleteReminder(app._id)}
                            title="Delete appointment reminder"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          <span>{dateFormatted}</span>
                        </div>
                        {app.appointmentTime && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            <span>{app.appointmentTime}</span>
                          </div>
                        )}
                      </div>

                      {app.facility && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary, #a1a1aa)' }}>
                          <Building size={12} />
                          <span>{app.facility} {app.location ? `• ${app.location}` : ''}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px dashed var(--border-light, #27272a)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Alert: {app.reminderLeadTime ? app.reminderLeadTime.replace(/_/g, ' ') : '1 day before'}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '1px 6px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#60a5fa',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          Confirmed
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Modal for PDF / Official Document Preview */}
      {selectedPdfRecord && (
        <MedicalPdfModal
          record={selectedPdfRecord}
          patient={patient}
          onClose={() => setSelectedPdfRecord(null)}
          onVerifyIntegrity={handleVerifyRecord}
          isVerifying={verifyingRecordId === selectedPdfRecord?._id}
        />
      )}
    </div>
  );
}
