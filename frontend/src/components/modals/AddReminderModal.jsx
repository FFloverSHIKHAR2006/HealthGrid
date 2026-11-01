import React, { useState } from 'react';
import { X, Pill, Calendar, Clock, Plus, Loader2, Stethoscope, AlertCircle, MapPin } from 'lucide-react';

export default function AddReminderModal({ onClose, onSave, defaultType = 'medication', patientId = null }) {
  const [activeTab, setActiveTab] = useState(defaultType); // 'medication' | 'appointment'
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Medication fields
  const [medTitle, setMedTitle] = useState('');
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [time, setTime] = useState('08:00');
  const [instructions, setInstructions] = useState('');

  // Appointment fields
  const [appTitle, setAppTitle] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('Cardiology');
  const [facility, setFacility] = useState('Max Super Speciality Hospital');
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [appointmentTime, setAppointmentTime] = useState('10:30');
  const [reminderLeadTime, setReminderLeadTime] = useState('1_day_before');
  const [location, setLocation] = useState('Room 402, OPD Block B');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (activeTab === 'medication') {
        const payload = {
          type: 'medication',
          title: medTitle || `${medication} (${dosage || 'Daily Dose'})`,
          medication: medication || medTitle,
          dosage: dosage || '1 Tab',
          frequency,
          time,
          instructions,
        };
        if (patientId) payload.patient = patientId;
        await onSave(payload);
      } else {
        const payload = {
          type: 'appointment',
          title: appTitle || `Consultation with ${doctorName || 'Specialist'}`,
          doctorName: doctorName || 'Dr. Alexander Wright, MD',
          specialty,
          facility,
          appointmentDate: new Date(`${appointmentDate}T${appointmentTime}:00`),
          appointmentTime,
          reminderLeadTime,
          location,
          notes,
        };
        if (patientId) payload.patient = patientId;
        await onSave(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to schedule reminder');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop active"
      onClick={(e) => e.target.className.includes('modal-backdrop') && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeTab === 'medication' ? (
              <Pill size={22} color="#10b981" />
            ) : (
              <Calendar size={22} color="#3b82f6" />
            )}
            <h3>Schedule Clinical Reminder</h3>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        {/* Tab selection */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 24px 0',
            borderBottom: '1px solid var(--border-color, #27272a)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('medication')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'medication' ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === 'medication' ? '#10b981' : 'var(--text-muted, #a1a1aa)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <Pill size={15} />
            Medication Reminder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('appointment')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'appointment' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'appointment' ? '#3b82f6' : 'var(--text-muted, #a1a1aa)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <Calendar size={15} />
            Doctor Appointment
          </button>
        </div>

        {error && (
          <div
            style={{
              margin: '16px 24px 0',
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #f87171',
              borderRadius: '6px',
              color: '#991b1b',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeTab === 'medication' ? (
              <>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '4px',
                    }}
                  >
                    Medication Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={medication}
                    onChange={(e) => {
                      setMedication(e.target.value);
                      if (!medTitle) setMedTitle(e.target.value);
                    }}
                    placeholder="e.g. Metformin / Atorvastatin"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                      }}
                    >
                      Dosage / Strength
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      placeholder="e.g. 500mg, 1 tablet"
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                      }}
                    >
                      Reminder Time *
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                      }}
                    >
                      Frequency
                    </label>
                    <select
                      className="form-control"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                    >
                      <option value="daily">Once Daily</option>
                      <option value="twice_daily">Twice Daily (BID)</option>
                      <option value="three_times_daily">Three Times Daily (TID)</option>
                      <option value="weekly">Weekly</option>
                      <option value="as_needed">As Needed (PRN)</option>
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                      }}
                    >
                      Reminder Title
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={medTitle}
                      onChange={(e) => setMedTitle(e.target.value)}
                      placeholder="e.g. Morning Blood Sugar Meds"
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '4px',
                    }}
                  >
                    Clinical Instructions / Notes
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g. Take with food. Do not skip breakfast."
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '4px',
                    }}
                  >
                    Consultation Title / Purpose *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={appTitle}
                    onChange={(e) => setAppTitle(e.target.value)}
                    placeholder="e.g. 6-Month Cardiology Follow-Up"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                      }}
                    >
                      Doctor / Specialist Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      placeholder="e.g. Dr. Alexander Wright, MD"
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                      }}
                    >
                      Specialty
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="e.g. Cardiology, Endocrinology"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                      }}
                    >
                      Appointment Date *
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                      }}
                    >
                      Appointment Time *
                    </label>
                    <input
                      type="time"
                      className="form-control"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                      }}
                    >
                      Hospital / Clinic Facility
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={facility}
                      onChange={(e) => setFacility(e.target.value)}
                      placeholder="e.g. Max Super Speciality Hospital"
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                      }}
                    >
                      Reminder Notification Alert
                    </label>
                    <select
                      className="form-control"
                      value={reminderLeadTime}
                      onChange={(e) => setReminderLeadTime(e.target.value)}
                    >
                      <option value="1_day_before">1 Day in Advance</option>
                      <option value="2_hours_before">2 Hours in Advance</option>
                      <option value="1_hour_before">1 Hour in Advance</option>
                      <option value="3_days_before">3 Days in Advance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '4px',
                    }}
                  >
                    Location / Room / Notes
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. OPD Wing B, 3rd Floor, Bring previous lipid profile"
                  />
                </div>
              </>
            )}
          </div>

          <div
            className="modal-footer"
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{
                backgroundColor: activeTab === 'medication' ? '#10b981' : '#3b82f6',
                borderColor: activeTab === 'medication' ? '#10b981' : '#3b82f6',
              }}
            >
              {saving ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <>
                  <Plus size={16} />
                  {activeTab === 'medication' ? 'Save Medication Reminder' : 'Set Appointment Alert'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
