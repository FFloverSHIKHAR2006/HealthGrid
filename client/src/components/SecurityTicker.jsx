import React from 'react';
import { ShieldCheck, Database, Siren, Sparkles } from 'lucide-react';

export default function SecurityTicker() {
  return (
    <div className="stitch-top-status-bar">
      <div className="status-bar-container">
        <div className="status-group-left">
          <div className="status-item highlight">
            <span className="pulsing-green-dot" />
            <span className="status-label">HealthGrid Network Active</span>
          </div>
          <div className="status-divider" />
          <div className="status-item">
            <Database size={14} className="status-icon" />
            <span>Connected: Live MongoDB Database</span>
          </div>
          <div className="status-divider" />
          <div className="status-item">
            <ShieldCheck size={14} className="status-icon" />
            <span>ABDM & DPDP Compliant Electronic Health Records</span>
          </div>
        </div>

        <div className="status-group-right">
          <div className="status-item emerald-glow">
            <Sparkles size={14} className="status-icon" />
            <span>Smart OCR Report Digitizer Ready</span>
          </div>
          <div className="status-divider" />
          <div className="status-item emergency-glow">
            <Siren size={14} className="status-icon" />
            <span>Emergency Ambulance Grid: 108 / 112 Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
