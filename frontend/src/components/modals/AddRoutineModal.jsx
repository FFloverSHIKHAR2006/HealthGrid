import React, { useState } from 'react';
import { X, Clock, Plus, Loader2 } from 'lucide-react';

export default function AddRoutineModal({ onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Medication');
  const [time, setTime] = useState('08:00');
  const [frequency, setFrequency] = useState('Daily');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const schedule = `${time} ${frequency} (${category})`;
      await onSave({
        title,
        schedule,
        status: 'active',
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to schedule routine');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop active" onClick={(e) => e.target.className.includes('modal-backdrop') && onClose()}>
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="var(--accent-emerald)" />
            <h3>Add Health Routine Reminder</h3>
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
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Routine Title / Medication Name
              </label>
              <input
                type="text"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Atorvastatin 20mg / Morning Blood Pressure Check"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Category
                </label>
                <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Medication">Medication</option>
                  <option value="Vitals">Vitals / Biometrics</option>
                  <option value="Exercise">Physical Therapy / Cardio</option>
                  <option value="Hydration">Hydration & Nutrition</option>
                  <option value="Sleep">Sleep Hygiene</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Target Time
                </label>
                <input
                  type="time"
                  className="form-control"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Frequency
              </label>
              <select className="form-control" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <option value="Daily">Daily</option>
                <option value="Twice Daily">Twice Daily (Morning / Evening)</option>
                <option value="Weekly">Weekly</option>
                <option value="As Needed (PRN)">As Needed (PRN)</option>
              </select>
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : <><Plus size={16} /> Schedule Routine (FR-05)</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
