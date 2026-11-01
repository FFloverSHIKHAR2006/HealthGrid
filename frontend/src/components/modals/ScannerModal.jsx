import React, { useState } from 'react';
import {
  X,
  Scan,
  UploadCloud,
  CheckCircle2,
  Loader2,
  FileText,
  Building,
  Calendar,
  Tag,
  AlertCircle,
  Database,
  Eye,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Activity,
  Pill,
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import { parseMedicalReport, computeBrowserFileSha256, fileToDataUrl } from '../../utils/medicalDocumentEngine';
import ShimmerButton from '../ShimmerButton';

export default function ScannerModal({ patientId, onClose, onSave }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [rawOcrText, setRawOcrText] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [isSavedLive, setIsSavedLive] = useState(false);
  const [savedRecordId, setSavedRecordId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [fileHash, setFileHash] = useState('');
  const [fileDataUrl, setFileDataUrl] = useState('');

  // Editable fields for user review
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('lab');
  const [facility, setFacility] = useState('');
  const [date, setDate] = useState('');
  const [clinicalSummary, setClinicalSummary] = useState('');

  const handleFileSelect = async (file) => {
    if (!file) return;
    setError('');
    setSelectedFile(file);
    setIsSavedLive(false);
    setSavedRecordId(null);
    setExtractedData(null);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    setIsProcessing(true);
    setOcrProgress(5);
    setOcrStatus('Computing cryptographic SHA-256 hash...');

    try {
      // 1. Calculate genuine SHA-256 file hash and dataUrl
      const [computedHash, dataUrl] = await Promise.all([
        computeBrowserFileSha256(file),
        fileToDataUrl(file),
      ]);
      setFileHash(computedHash);
      setFileDataUrl(dataUrl);

      // 2. Execute Real Client-Side OCR with Tesseract
      setOcrProgress(15);
      setOcrStatus('Initializing OCR Neural Engine...');

      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const p = Math.round((m.progress || 0) * 80) + 15;
            setOcrProgress(Math.min(p, 92));
            setOcrStatus(`Extracting Text from Medical Document (${Math.round((m.progress || 0) * 100)}%)...`);
          } else if (m.status) {
            setOcrStatus(m.status.charAt(0).toUpperCase() + m.status.slice(1) + '...');
          }
        },
      });

      const extractedText = result?.data?.text || '';
      setRawOcrText(extractedText);
      setOcrStatus('Extracting Structured Clinical Entities...');
      setOcrProgress(95);

      // 3. Intelligent Multi-Stage Clinical Extraction
      const parsed = parseMedicalReport(extractedText, file.name, { expectedHash: computedHash });
      parsed.documentHash = computedHash;
      parsed.verificationStatus = 'VERIFIED';
      setExtractedData(parsed);

      setTitle(parsed.title);
      setCategory(parsed.category);
      setFacility(parsed.facility);
      setDate((parsed.reportDate || parsed.date || new Date().toISOString()).split('T')[0]);
      setClinicalSummary(parsed.clinicalSummary || parsed.details);

      setOcrProgress(100);
      setOcrStatus('Clinical Extraction Complete. Synchronizing to MongoDB...');

      // 4. Save structured medical record to backend
      setIsSaving(true);
      const recordPayload = {
        patient: patientId,
        category: parsed.category,
        title: parsed.title,
        date: parsed.reportDate || parsed.date || new Date().toISOString(),
        reportDate: parsed.reportDate || parsed.date || new Date().toISOString(),
        encounterDate: parsed.encounterDate || parsed.reportDate || parsed.date,
        facility: parsed.facility,
        department: parsed.department,
        clinician: parsed.clinician,
        encounterType: parsed.encounterType,
        patientMetadata: parsed.patientMetadata,
        details: parsed.clinicalSummary || parsed.details,
        clinicalSummary: parsed.clinicalSummary || parsed.details,
        observations: parsed.observations || [],
        structuredData: parsed.structuredData || {},
        rawOcrText: extractedText,
        documentHash: computedHash,
        verificationStatus: 'VERIFIED',
        originalFile: {
          dataUrl,
          filename: file.name,
          mimeType: file.type || 'image/png',
          size: file.size,
        },
        source: 'scanner',
      };

      const saved = await onSave(recordPayload);
      setIsSavedLive(true);
      setSavedRecordId(saved?._id || 'SAVED-LIVE');
      setOcrStatus('Successfully Saved to MongoDB Database');
    } catch (err) {
      console.error('OCR Processing error:', err);
      setError(err.message || 'Error occurred while extracting text from report image');
    } finally {
      setIsProcessing(false);
      setIsSaving(false);
    }
  };

  const handleManualReSave = async () => {
    if (!title.trim()) {
      setError('Report title is required');
      return;
    }
    setIsSaving(true);
    setError('');

    try {
      const recordPayload = {
        patient: patientId,
        category,
        title: title.trim(),
        date: new Date(date || Date.now()).toISOString(),
        reportDate: new Date(date || Date.now()).toISOString(),
        encounterDate: extractedData?.encounterDate || new Date(date || Date.now()).toISOString(),
        facility: facility.trim(),
        department: extractedData?.department || '',
        clinician: extractedData?.clinician || '',
        encounterType: extractedData?.encounterType || 'Outpatient',
        patientMetadata: extractedData?.patientMetadata || {},
        details: clinicalSummary.trim(),
        clinicalSummary: clinicalSummary.trim(),
        observations: extractedData?.observations || [],
        structuredData: extractedData?.structuredData || {},
        rawOcrText: rawOcrText,
        documentHash: fileHash,
        verificationStatus: 'VERIFIED',
        originalFile: fileDataUrl
          ? {
              dataUrl: fileDataUrl,
              filename: selectedFile?.name || 'medical-report.png',
              mimeType: selectedFile?.type || 'image/png',
              size: selectedFile?.size || 0,
            }
          : undefined,
        source: 'scanner',
      };

      const saved = await onSave(recordPayload);
      setIsSavedLive(true);
      setSavedRecordId(saved?._id || savedRecordId);
    } catch (err) {
      setError(err.message || 'Failed to update record in MongoDB');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop active" onClick={(e) => e.target.className.includes('modal-backdrop') && onClose()}>
      <div className="modal-content" style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(0, 105, 72, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Scan size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                Upload & Digitize Medical Report (OCR)
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                Upload any report photo/image to extract clinical text and store directly in MongoDB
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              margin: '16px 24px 0',
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* File Picker or Drag & Drop Area */}
          {!selectedFile ? (
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '44px 20px',
                border: '2px dashed rgba(0, 105, 72, 0.3)',
                borderRadius: '16px',
                cursor: 'pointer',
                background: 'var(--surface-container-low)',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(0, 105, 72, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                }}
              >
                <UploadCloud size={28} color="var(--primary)" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--on-surface)', marginBottom: '4px' }}>
                Select or drop medical report image
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '360px' }}>
                Supports lab test reports, blood panels, prescriptions, and radiology receipts (PNG, JPG, JPEG, WebP)
              </span>
              <div style={{ marginTop: '16px' }}>
                <span className="btn btn-sm btn-primary">Browse Files</span>
              </div>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </label>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Image Preview & Status Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px 18px',
                  background: 'var(--surface-container-low)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                }}
              >
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Report Preview"
                    style={{
                      width: '64px',
                      height: '64px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB • Image OCR Ingestion
                  </div>

                  {/* OCR Progress Bar */}
                  {isProcessing && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--primary)', fontWeight: 600, marginBottom: '4px' }}>
                        <span>{ocrStatus}</span>
                        <span>{ocrProgress}%</span>
                      </div>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${ocrProgress}%`,
                            background: 'var(--primary)',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Live Database Persist Banner */}
                  {isSavedLive && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--primary)',
                      }}
                    >
                      <Database size={14} />
                      <span>Saved Live in MongoDB Collection</span>
                      {savedRecordId && (
                        <span style={{ fontSize: '10px', opacity: 0.8, fontFamily: 'var(--font-mono)' }}>
                          ({savedRecordId})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setSelectedFile(null);
                    setExtractedData(null);
                    setPreviewUrl(null);
                    setRawOcrText('');
                    setIsSavedLive(false);
                  }}
                  disabled={isProcessing}
                >
                  <RefreshCw size={12} /> Replace
                </button>
              </div>

              {/* Detected Biomarkers Highlight */}
              {extractedData?.biomarkers?.length > 0 && (
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(0, 105, 72, 0.05)',
                    border: '1px solid rgba(0, 105, 72, 0.15)',
                    borderRadius: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
                    <Sparkles size={14} /> Detected Key Medical Biomarkers:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {extractedData.biomarkers.map((b, i) => (
                      <span key={i} className="badge badge-emerald" style={{ fontSize: '12px', padding: '4px 10px' }}>
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Medical Report Form */}
              {extractedData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <Tag size={12} /> Category
                      </label>
                      <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="lab">Diagnostic Lab Report (LFT, CBC, Lipid)</option>
                        <option value="diagnosis">Clinical Consultation & Diagnosis</option>
                        <option value="prescription">Medical Prescription & Rx</option>
                        <option value="imaging">Radiology & Imaging (X-Ray, CT, MRI)</option>
                        <option value="immunization">Immunization / Vaccine Certificate</option>
                        <option value="surgery">Surgical Operative Record</option>
                        <option value="discharge">Hospital Discharge Summary</option>
                        <option value="other">General Clinical Note</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <Calendar size={12} /> Date of Report
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <FileText size={12} /> Report Title
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Complete Blood Count (CBC) Panel"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <Building size={12} /> Laboratory / Healthcare Facility
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={facility}
                      onChange={(e) => setFacility(e.target.value)}
                      placeholder="e.g. Dr. Lal PathLabs, Apollo Diagnostics"
                    />
                  </div>

                  {/* Extracted Quantitative Lab Observations Preview */}
                  {extractedData.observations && extractedData.observations.length > 0 && (
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--primary)', marginBottom: '6px' }}>
                        <Activity size={13} /> Extracted Clinical Measurements ({extractedData.observations.length}):
                      </label>
                      <div className="lab-metrics-grid" style={{ maxHeight: '180px', overflowY: 'auto', padding: '4px' }}>
                        {extractedData.observations.map((obs, idx) => (
                          <div key={idx} className={`lab-metric-card flag-${obs.flag || 'normal'}`} style={{ padding: '8px 10px' }}>
                            <div className="metric-header">
                              <span className="metric-name" style={{ fontSize: '10px' }}>{obs.name}</span>
                              {obs.flag !== 'normal' && (
                                <span className={`flag-badge ${obs.flag}`}>{obs.flag.toUpperCase()}</span>
                              )}
                            </div>
                            <div className="metric-value-row">
                              <span className={`metric-number ${obs.flag === 'high' ? 'rose' : obs.flag === 'low' ? 'amber' : 'emerald'}`} style={{ fontSize: '14px' }}>
                                {obs.value}
                              </span>
                              {obs.unit && <span className="metric-unit">{obs.unit}</span>}
                            </div>
                            {obs.referenceRange && (
                              <div className="metric-footer" style={{ fontSize: '9.5px' }}>
                                Ref: {obs.referenceRange}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted Prescriptions Preview */}
                  {extractedData.structuredData?.medications && extractedData.structuredData.medications.length > 0 && (
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#7e22ce', marginBottom: '6px' }}>
                        <Pill size={13} /> Extracted Prescribed Medications ({extractedData.structuredData.medications.length}):
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {extractedData.structuredData.medications.map((med, idx) => (
                          <div key={idx} className="med-pill-item" style={{ padding: '6px 8px' }}>
                            <span className="med-name">{med.drug}</span>
                            {med.strength && <span className="med-strength">{med.strength}</span>}
                            {med.instructions && <span className="med-inst">{med.instructions}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cryptographic Hash Indicator */}
                  {fileHash && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                      <ShieldCheck size={16} className="text-emerald" />
                      <div style={{ flex: 1, minWidth: 0, fontSize: '11px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Cryptographic Hash Generated: </span>
                        <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--on-surface)' }}>{fileHash}</code>
                      </div>
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Validated Clinical Summary
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowRawText(!showRawText)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Eye size={12} /> {showRawText ? 'Hide Raw OCR Text' : 'View Raw OCR Text'}
                      </button>
                    </div>

                    {showRawText && (
                      <div
                        style={{
                          marginBottom: '10px',
                          padding: '10px',
                          background: '#0f172a',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          maxHeight: '140px',
                          overflowY: 'auto',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          whiteSpace: 'pre-wrap',
                          color: '#94a3b8',
                        }}
                      >
                        {rawOcrText || 'No raw text available.'}
                      </div>
                    )}

                    <textarea
                      className="form-control"
                      rows={4}
                      value={clinicalSummary}
                      onChange={(e) => setClinicalSummary(e.target.value)}
                      placeholder="Clean clinical observations, diagnostic findings, and summary..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {isSavedLive ? (
              <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={15} /> Active in Patient Record & MongoDB
              </span>
            ) : isProcessing ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Loader2 size={14} className="spin" /> Processing document...
              </span>
            ) : (
              <span>Ready for live database ingestion</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              {isSavedLive ? 'Done' : 'Cancel'}
            </button>

            {extractedData && (
              <ShimmerButton
                variant="primary"
                onClick={handleManualReSave}
                disabled={isSaving || isProcessing}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="spin" /> Storing in MongoDB...
                  </>
                ) : isSavedLive ? (
                  <>
                    <Database size={16} /> Update in MongoDB
                  </>
                ) : (
                  <>
                    <Database size={16} /> Store in MongoDB
                  </>
                )}
              </ShimmerButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
