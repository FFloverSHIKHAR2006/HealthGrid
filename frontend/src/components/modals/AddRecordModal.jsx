import React, { useState } from 'react';
import { X, FileText, Plus, Loader2 } from 'lucide-react';

export default function AddRecordModal({ patientId, onClose, onSave }) {
  const [category, setCategory] = useState('lab');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [facility, setFacility] = useState('');
  const [details, setDetails] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave({
        patient: patientId,
        category,
        title,
        date: new Date(date).toISOString(),
        facility: facility || 'Verified Medical Center',
        details,
        source: 'manual',
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save medical record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop active" onClick={(e) => e.target.className.includes('modal-backdrop') && onClose()}>
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="var(--accent-emerald)" />
            <h3>Log Clinical Medical Record</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ margin: '16px 24px 0', padding: '10px 14px', background: '#fef2f2', border: '1px solid #f87171', borderRadius: '6px', color: '#991b1b', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Category
                </label>
                <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="lab">Diagnostic Lab Report</option>
                  <option value="immunization">Immunization / Vaccine</option>
                  <option value="surgery">Surgical Procedure</option>
                  <option value="diagnosis">Clinical Diagnosis</option>
                  <option value="facility">Hospital Admission / Discharge</option>
                  <option value="other">General Clinical Note</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Encounter Date
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Record Title / Procedure Name
              </label>
              <input
                type="text"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Comprehensive Metabolic Panel (CMP) / Echocardiogram"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Healthcare Facility / Hospital
              </label>
              <input
                type="text"
                className="form-control"
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                placeholder="e.g. Apollo Hospital, Fortis Healthcare, AIIMS"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Clinical Details & Summary
              </label>
              <textarea
                className="form-control"
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Key findings, diagnostic biomarkers, physician impression, and follow-up notes..."
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : <><Plus size={16} /> Save Record (FR-03)</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
