import React, { useState } from 'react';
import { X, ShieldAlert, Loader2, Save } from 'lucide-react';

export default function EditProfileModal({ patient, onClose, onSave }) {
  const [name, setName] = useState(patient?.emergencyContact?.name || '');
  const [relation, setRelation] = useState(patient?.emergencyContact?.relation || 'Spouse');
  const [phone, setPhone] = useState(patient?.emergencyContact?.phone || '');
  const [allergiesText, setAllergiesText] = useState((patient?.allergies || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const allergies = allergiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        emergencyContact: { name, relation, phone },
        allergies,
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop active" onClick={(e) => e.target.className.includes('modal-backdrop') && onClose()}>
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} color="var(--accent-emerald)" />
            <h3>Update Emergency Contact & Allergies</h3>
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
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              These critical safety parameters are instantly synchronized with Indian National Emergency Responders (108 / 112) upon transmission.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Primary Emergency Contact Name
              </label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mark Jenkins"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Relationship
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  placeholder="e.g. Spouse / Sibling / Parent"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Emergency Phone Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Known Drug Allergies & Sensitivities (comma-separated)
              </label>
              <textarea
                className="form-control"
                rows={3}
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                placeholder="Penicillin (Anaphylactic), Latex Sensitivity, Peanuts"
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : <><Save size={16} /> Save Changes (FR-06)</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
