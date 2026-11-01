import React, { useState } from 'react';
import {
  Stethoscope,
  Search,
  User,
  Plus,
  Trash2,
  FileText,
  Activity,
  Heart,
  Calendar,
  AlertCircle,
  Building,
  CheckCircle,
  Clock,
  Sparkles,
  Download,
  Eye,
  Check,
  Send,
  Loader2,
  Share2,
  Scan,
} from 'lucide-react';
import ShimmerButton from './ShimmerButton';
import MedicalPdfModal from './modals/MedicalPdfModal';

export default function ProviderWorkspace({
  doctor,
  caseload = [],
  selectedPatientId,
  selectedVault,
  onSelectPatient,
  onDeleteRecord,
  onCreatePrescription,
  onSimulateABDMRetrieval,
  onOpenScanner,
  onOpenAddRecord,
  onOpenAddReminder,
  onDeleteReminder,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('dossier'); // 'dossier' | 'prescription' | 'abdm'
  const [isSyncingABDM, setIsSyncingABDM] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    medication: 'Atorvastatin 20mg',
    dosage: '20 mg Oral Tablet',
    frequency: 'Once Daily',
    duration: '30 days',
    instructions: 'Take once daily after evening meal with water.',
  });
  const [autoSchedule, setAutoSchedule] = useState(true);
  const [isSubmittingRx, setIsSubmittingRx] = useState(false);
  const [selectedRecordToView, setSelectedRecordToView] = useState(null);

  const selectedPatient = selectedVault?.patient;
  const records = selectedVault?.records || [];
  const prescriptions = selectedVault?.prescriptions || [];
  const routines = selectedVault?.routines || [];
  const reminders = selectedVault?.reminders || [];
  const appointmentReminders = reminders.filter((r) => r.type === 'appointment');

  const filteredPatients = caseload.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.bloodGroup?.toLowerCase().includes(term) ||
      p._id?.toLowerCase().includes(term)
    );
  });

  const handleABDMClick = async () => {
    if (!selectedPatientId) return;
    setIsSyncingABDM(true);
    try {
      await onSimulateABDMRetrieval(selectedPatientId);
    } finally {
      setIsSyncingABDM(false);
    }
  };

  const handleRxSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId || !prescriptionForm.medication) return;
    setIsSubmittingRx(true);
    try {
      await onCreatePrescription({
        patient: selectedPatientId,
        autoScheduleReminders: autoSchedule,
        ...prescriptionForm,
      });
      // Reset to defaults
      setPrescriptionForm({
        medication: '',
        dosage: '1 Tablet',
        frequency: 'Once Daily',
        duration: '14 days',
        instructions: 'Take as directed.',
      });
    } finally {
      setIsSubmittingRx(false);
    }
  };

  const patientAvatars = {
    'Sarah Jenkins': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    'Arjun Sharma': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    'David Miller': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    'Maya Lin': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    'Robert Thorne': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
  };

  return (
    <div className="stitch-provider-workspace-container">
      {/* Top Physician Identity & Status Ribbon */}
      <div className="physician-ribbon-card">
        <div className="physician-profile-group">
          <div className="physician-avatar-box">
            <img
              src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80"
              alt={doctor?.name || 'Dr. Alexander Wright'}
              className="physician-avatar-img"
            />
            <span className="physician-verified-badge" title="Verified Medical License">
              <Check size={11} />
            </span>
          </div>

          <div className="physician-titles">
            <div className="physician-name-row">
              <h1 className="physician-name">{doctor?.name || 'Dr. Alexander Wright, MD'}</h1>
              <span className="physician-specialty-badge">Senior Cardiologist</span>
              <span className="physician-license-badge">LIC: MED-89421</span>
            </div>
            <div className="physician-hospital-row">
              <Building size={14} className="text-emerald" />
              <span>Fortis Memorial Research Institute • AIIMS Exchange Node [FED-IN-DL-09]</span>
            </div>
          </div>
        </div>

        <div className="physician-stats-actions">
          {/* Live Caseload Stat Strip */}
          <div className="caseload-stat-strip">
            <div className="stat-unit">
              <span className="stat-caption">ASSIGNED</span>
              <span className="stat-value">{caseload.length} Patients</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-unit">
              <span className="stat-caption">PENDING RX</span>
              <span className="stat-value tertiary">2 Directives</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-unit">
              <span className="stat-caption">ABDM SYNCED</span>
              <span className="stat-value primary">1 Node Ready</span>
            </div>
          </div>

          {/* ABDM Fast Query Button */}
          <ShimmerButton
            variant="secondary"
            size="md"
            onClick={handleABDMClick}
            disabled={isSyncingABDM || !selectedPatientId}
            icon={Share2}
          >
            {isSyncingABDM ? 'Querying ABDM...' : 'Query ABDM Network'}
          </ShimmerButton>
        </div>
      </div>

      {/* Master-Detail 2-Column Workstation Grid */}
      <div className="provider-grid-layout">
        {/* LEFT COLUMN: Active Patient Caseload Roster (4 Cols) */}
        <aside className="caseload-roster-sidebar">
          <div className="roster-header-row">
            <div className="roster-title-group">
              <span className="roster-heading">Patient Caseload</span>
              <span className="roster-count-chip">
                {String(caseload.length).padStart(2, '0')} Active
              </span>
            </div>
            <span className="roster-feed-caption">Federated Feed</span>
          </div>

          {/* Quick Search */}
          <div className="roster-search-wrap">
            <Search size={16} className="roster-search-icon" />
            <input
              type="text"
              className="roster-search-input"
              placeholder="Search by ABHA, ID, or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Patient Cards Roster List */}
          <div className="roster-cards-list">
            {filteredPatients.map((p, idx) => {
              const isSelected = p._id === selectedPatientId;
              const avatar = patientAvatars[p.name] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
              const statusTag = idx === 0 ? 'Needs Review' : idx === 1 ? 'Stable' : idx === 2 ? 'Follow-up' : idx === 3 ? 'Critical' : 'Routine';

              return (
                <div
                  key={p._id}
                  className={`roster-patient-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectPatient(p._id)}
                >
                  <div className="card-identity-top">
                    <div className="patient-mini-profile">
                      <img src={avatar} alt={p.name} className="patient-thumb" />
                      <div className="patient-thumb-texts">
                        <div className="patient-name-line">
                          <span className="patient-name">{p.name}</span>
                          {isSelected && <span className="active-green-dot" />}
                        </div>
                        <span className="patient-hg-id">HG-{p._id.slice(-4).toUpperCase()}-2026</span>
                      </div>
                    </div>
                    <span className={`patient-status-chip status-${statusTag.toLowerCase().replace(/\s+/g, '-')}`}>
                      {statusTag}
                    </span>
                  </div>

                  <div className="card-identity-bottom">
                    <div className="patient-bio-tags">
                      <span className="bio-pill blood">{p.bloodGroup || 'O+'}</span>
                      <span className="bio-pill">{p.age ? `${p.age} yrs` : 'Adult'}</span>
                    </div>
                    <span className="last-encounter-time">Last Encounter: 12m ago</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ABDM Fast-FHIR Gateway Callout */}
          <div className="abdm-callout-box">
            <div className="abdm-callout-header">
              <Share2 size={16} />
              <span>ABDM FAST-FHIR GATEWAY</span>
            </div>
            <p className="abdm-callout-desc">
              Simulate cross-hospital medical artifact lookup across AIIMS New Delhi and Apollo Hospital federation nodes.
            </p>
            <button
              type="button"
              className="abdm-query-inline-btn"
              onClick={handleABDMClick}
              disabled={isSyncingABDM}
            >
              {isSyncingABDM ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
              <span>Query Federated Gateways</span>
            </button>
          </div>
        </aside>

        {/* RIGHT COLUMN: Main Work Area (8 Cols) */}
        <div className="provider-main-work-area">
          {/* TOP PANEL: Clinical Dossier for Selected Patient */}
          <div className="dossier-card">
            {/* Dossier Header with Key Biological Markers */}
            <div className="dossier-header-row">
              <div className="dossier-title-group">
                <div className="dossier-icon-box">
                  <User size={24} />
                </div>
                <div className="dossier-texts">
                  <div className="dossier-name-line">
                    <h2 className="dossier-patient-title">
                      Clinical Dossier: {selectedPatient?.name || 'Selected Patient'}
                    </h2>
                    <span className="consent-verified-chip">Consent Verified</span>
                  </div>
                  <span className="dossier-subtitle">
                    Cryptographic lifetime encounters, lab biomarkers, and hospital discharge notes
                  </span>
                </div>
              </div>

              {/* Biological Summary Tags */}
              <div className="dossier-markers-group">
                <div className="dossier-marker-box">
                  <span className="marker-caption">BLOOD GROUP</span>
                  <span className="marker-val">{selectedPatient?.bloodGroup || 'O+'} Rh Positive</span>
                </div>
                <div className="dossier-marker-box">
                  <span className="marker-caption">CHRONOLOGY</span>
                  <span className="marker-val">{selectedPatient?.age || 32} Yrs / Patient</span>
                </div>
                <div className="dossier-marker-box">
                  <span className="marker-caption">ENCOUNTERS</span>
                  <span className="marker-val primary">{records.length} Records</span>
                </div>
              </div>
            </div>

            {/* Doctor Diagnostic Actions Toolbar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                background: 'var(--surface-container-low)',
                borderBottom: '1px solid var(--border-light)',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
                <FileText size={16} color="var(--primary)" />
                <span>Patient Diagnostic Reports & Encounters</span>
                <span className="badge badge-emerald" style={{ fontSize: '11px' }}>
                  {records.length} Stored Live
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={onOpenScanner}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Scan size={14} /> Upload Diagnostic Image (OCR)
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={onOpenAddRecord}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Add Record Manually
                </button>
              </div>
            </div>

            {/* Diagnostic & Encounters Ledger Table */}
            <div className="encounters-table-container">
              <table className="encounters-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Clinical Title / Status</th>
                    <th>Originating Facility</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-6 text-muted">
                        No clinical records found for this patient. Click "Upload Diagnostic Image (OCR)" to add one.
                      </td>
                    </tr>
                  ) : (
                    records.map((rec) => {
                      const cat = (rec.category || 'lab').toLowerCase();
                      const statusShort = rec.source === 'scanner' ? 'OCR Digitized • Verified' : 'Clinically Logged';

                      return (
                        <tr key={rec._id} className="encounter-row">
                          <td className="font-mono text-date">
                            {rec.date ? new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'May 12, 2026'}
                          </td>
                          <td>
                            <span className={`cat-pill pill-${cat}`}>
                              {cat.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div className="record-title-hash-group">
                              <span className="record-main-title">{rec.title}</span>
                              <span className="record-hash-sub font-mono">{statusShort}</span>
                            </div>
                          </td>
                          <td className="facility-cell">
                            <Building size={14} className="facility-icon" />
                            <span>{rec.facility || 'AIIMS New Delhi Health Exchange'}</span>
                          </td>
                          <td className="text-right actions-cell">
                            <div className="table-actions-group">
                              <button
                                type="button"
                                className="table-action-icon-btn"
                                onClick={() => setSelectedRecordToView(rec)}
                                title="Inspect Record Details"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                type="button"
                                className="table-action-icon-btn delete-btn"
                                onClick={() => onDeleteRecord(rec._id)}
                                title="Physician Revoke / Delete Record (FR-07)"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Dossier Vitals Mini-Strip inline SVG Sparklines */}
            <div className="vitals-mini-strip-grid">
              <div className="vital-mini-box">
                <div className="vital-mini-texts">
                  <span className="vital-mini-caption">Resting Heart Rate</span>
                  <span className="vital-mini-num">{selectedPatient?.telemetry?.heartRate || 68} bpm</span>
                </div>
                <svg className="vital-mini-spark emerald" fill="none" viewBox="0 0 100 30">
                  <path
                    d="M0 15 L20 15 L25 5 L32 28 L38 12 L45 15 L100 15"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="vital-mini-box">
                <div className="vital-mini-texts">
                  <span className="vital-mini-caption">Blood Pressure</span>
                  <span className="vital-mini-num">
                    {selectedPatient?.telemetry?.bloodPressure?.systolic || 128} /{' '}
                    {selectedPatient?.telemetry?.bloodPressure?.diastolic || 82}
                  </span>
                </div>
                <span className="vital-status-pill">Stage 1 Pre</span>
              </div>

              <div className="vital-mini-box">
                <div className="vital-mini-texts">
                  <span className="vital-mini-caption">HbA1c Level</span>
                  <span className="vital-mini-num">5.8%</span>
                </div>
                <span className="vital-status-pill optimal">Optimal</span>
              </div>
            </div>
          </div>

          {/* Active Appointments & Clinical Reminders Strip */}
          <div className="dossier-card" style={{ marginTop: '16px', padding: '18px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="#3b82f6" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f4f4f5' }}>
                  Scheduled Consultations & Follow-Ups ({appointmentReminders.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onOpenAddReminder && onOpenAddReminder('appointment')}
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={14} /> Schedule Follow-Up Visit
              </button>
            </div>

            {appointmentReminders.length === 0 ? (
              <p style={{ margin: 0, fontSize: '13px', color: '#71717a' }}>
                No follow-up consultations currently scheduled for {selectedPatient?.name || 'this patient'}.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {appointmentReminders.map((app) => (
                  <div
                    key={app._id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: '#fff' }}>{app.title}</span>
                      {onDeleteReminder && (
                        <button
                          type="button"
                          onClick={() => onDeleteReminder(app._id)}
                          style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}
                          title="Cancel appointment"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#60a5fa' }}>
                      <Clock size={12} />
                      <span>{app.appointmentDate ? new Date(app.appointmentDate).toLocaleDateString() : ''} at {app.appointmentTime || 'Scheduled'}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
                      {app.facility || 'Clinical Facility'} {app.location ? `• ${app.location}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BOTTOM PANEL: Redesigned Digital E-Prescription Module (FR-04) */}
          <div className="prescription-composer-card">
            <div className="rx-composer-header">
              <div className="rx-composer-title-group">
                <div className="rx-composer-icon-box">
                  <Stethoscope size={22} />
                </div>
                <div className="rx-composer-texts">
                  <div className="rx-composer-title-line">
                    <h3 className="rx-composer-title">Assign Digital E-Prescription (FR-04)</h3>
                    <span className="rx-algo-chip">ECDSA SECP256K1</span>
                  </div>
                  <span className="rx-composer-desc">
                    ABHA compliant cryptographic drug directive issued directly to patient vault
                  </span>
                </div>
              </div>

              {/* Locked Recipient Chip */}
              <div className="rx-recipient-chip">
                <CheckCircle size={15} />
                <span>Prescribing For: <strong>{selectedPatient?.name || 'Selected Patient'}</strong></span>
              </div>
            </div>

            {/* Prescription Form Fields Grid */}
            <form onSubmit={handleRxSubmit} className="rx-composer-form">
              {/* Medication Name + Quick Formulary Pills */}
              <div className="form-field-group">
                <label className="form-field-label">Medication Name & Formulation</label>
                <input
                  type="text"
                  className="stitch-input"
                  placeholder="e.g. Atorvastatin, Metformin, Rosuvastatin..."
                  value={prescriptionForm.medication}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medication: e.target.value })}
                  required
                />
                <div className="quick-formulary-row">
                  <span className="formulary-caption">Quick Formulary:</span>
                  {['Atorvastatin 20mg', 'Metformin HCl 500mg', 'Amlodipine Besylate 5mg', 'Ramipril 2.5mg'].map(
                    (med) => (
                      <button
                        key={med}
                        type="button"
                        className="formulary-btn"
                        onClick={() =>
                          setPrescriptionForm({
                            ...prescriptionForm,
                            medication: med,
                            dosage: med.includes('500mg') ? '500 mg Oral Tablet' : '20 mg Oral Tablet',
                          })
                        }
                      >
                        {med.split(' ')[0]}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Dosage & Frequency (2-Col Grid) */}
              <div className="form-two-col-grid">
                <div className="form-field-group">
                  <label className="form-field-label">Standard Clinical Dosage</label>
                  <input
                    type="text"
                    className="stitch-input"
                    placeholder="e.g. 20 mg Oral Tablet"
                    value={prescriptionForm.dosage}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-field-label">Administration Frequency</label>
                  <div className="frequency-pills-selector">
                    {['Once Daily', 'BID (2x)', 'TID (3x)', 'QID (4x)'].map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        className={`freq-selector-btn ${prescriptionForm.frequency === freq ? 'active' : ''}`}
                        onClick={() => setPrescriptionForm({ ...prescriptionForm, frequency: freq })}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Duration & Instructions */}
              <div className="form-two-col-grid">
                <div className="form-field-group">
                  <label className="form-field-label">Duration / Supply Period</label>
                  <input
                    type="text"
                    className="stitch-input"
                    placeholder="e.g. 30 days / 90 days supply"
                    value={prescriptionForm.duration}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, duration: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-field-label">Patient Special Instructions</label>
                  <input
                    type="text"
                    className="stitch-input"
                    placeholder="e.g. Take after breakfast and dinner with water."
                    value={prescriptionForm.instructions}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Auto-schedule Reminders Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 12px' }}>
                <input
                  type="checkbox"
                  id="autoScheduleRx"
                  checked={autoSchedule}
                  onChange={(e) => setAutoSchedule(e.target.checked)}
                  style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label
                  htmlFor="autoScheduleRx"
                  style={{ fontSize: '13px', color: '#e4e4e7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Auto-schedule patient medication reminders & notification center alerts</span>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>(Recommended)</span>
                </label>
              </div>

              {/* Submit & Sign Button */}
              <div className="rx-submit-row">
                <ShimmerButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmittingRx || !selectedPatientId}
                  icon={Send}
                >
                  {isSubmittingRx ? 'Signing & Sealing Directive...' : 'Sign & Issue Digital E-Prescription (FR-04)'}
                </ShimmerButton>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Record Inspect Modal */}
      {selectedRecordToView && (
        <MedicalPdfModal
          record={selectedRecordToView}
          patient={selectedPatient}
          onClose={() => setSelectedRecordToView(null)}
        />
      )}
    </div>
  );
}
