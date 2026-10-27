import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Radio, PhoneCall, ShieldAlert, Check } from 'lucide-react';

export default function EmergencyModal({ patient, onClose }) {
  const [broadcasting, setBroadcasting] = useState(true);
  const [coords, setCoords] = useState({ lat: '28.6139° N', lon: '77.2090° E' });

  useEffect(() => {
    // Generate realistic telemetry coordinate simulation
    const timer = setTimeout(() => {
      setBroadcasting(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="modal-backdrop active" onClick={(e) => e.target.className.includes('modal-backdrop') && onClose()}>
      <div className="modal-content" style={{ maxWidth: '580px', border: '2px solid var(--accent-rose)' }}>
        <div className="modal-header" style={{ background: '#fef2f2', borderBottom: '1px solid #fee2e2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={22} color="#dc2626" />
            <h3 style={{ color: '#991b1b', margin: 0 }}>INDIAN EMERGENCY AMBULANCE PORTAL (108 / 112)</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '12px 16px', background: broadcasting ? '#fff7ed' : '#f0fdf4', border: `1px solid ${broadcasting ? '#fdba74' : '#86efac'}`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {broadcasting ? (
              <>
                <Radio size={24} color="#ea580c" className="pulse-slow" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#9a3412' }}>Simulating Real-Time Emergency Beacon Broadcast</div>
                  <div style={{ fontSize: '12px', color: '#c2410c' }}>Packaging GPS telemetry & critical allergy parameters for responder dispatch.</div>
                </div>
              </>
            ) : (
              <>
                <Check size={24} color="#16a34a" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#166534' }}>Emergency Broadcast Packet Formatted (Simulated)</div>
                  <div style={{ fontSize: '12px', color: '#15803d' }}>Ready for emergency paramedical triage handoff.</div>
                </div>
              </>
            )}
          </div>

          <div style={{ background: 'var(--bg-glass-input)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Patient Name</span>
              <strong>{patient?.name || 'Sarah Jenkins'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>HealthGrid ID</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{patient?.healthGridId || 'HG-8904-2026'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Blood Group</span>
              <span className="badge badge-emerald" style={{ marginTop: '2px', display: 'inline-block' }}>{patient?.bloodGroup || 'O+'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Simulated GPS Fix</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>{coords.lat}, {coords.lon}</span>
            </div>
          </div>

          <div style={{ padding: '14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: '#991b1b', marginBottom: '4px' }}>
              <ShieldAlert size={16} /> CRITICAL ALLERGIES ON RECORD:
            </div>
            <div style={{ fontSize: '13px', color: '#7f1d1d' }}>
              {(patient?.allergies || []).join(', ') || 'No critical drug allergies registered'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Emergency Contact</span>
              <strong style={{ fontSize: '14px' }}>{patient?.emergencyContact?.name} ({patient?.emergencyContact?.relation})</strong>
            </div>
            <a
              href={`tel:${patient?.emergencyContact?.phone || '108'}`}
              className="btn btn-sm btn-primary"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <PhoneCall size={14} /> Call {patient?.emergencyContact?.phone}
            </a>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close Emergency View
          </button>
        </div>
      </div>
    </div>
  );
}
