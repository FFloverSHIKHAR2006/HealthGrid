import React from 'react';
import {
  Layers,
  HeartPulse,
  Stethoscope,
  ShieldCheck,
  Database,
  CheckCircle,
} from 'lucide-react';

export default function Sidebar({ currentView, onNavigate, user }) {
  const isDoctor = user?.role === 'provider';
  const isPatient = user?.role === 'patient';

  const navItems = [
    {
      id: 'gateway',
      label: 'Sign In / Register',
      icon: Layers,
      role: 'all',
      badge: 'Account Access',
    },
    {
      id: 'patient',
      label: 'Patient Health Records',
      icon: HeartPulse,
      role: 'patient',
      badge: isPatient ? 'Active Patient' : 'Patient View',
      disabled: !isPatient && !!user && isDoctor,
    },
    {
      id: 'provider',
      label: 'Doctor Consultations',
      icon: Stethoscope,
      role: 'provider',
      badge: isDoctor ? 'Active Clinician' : 'Doctor View',
      disabled: !isDoctor && !!user && isPatient,
    },
    {
      id: 'ledger',
      label: 'Activity & Audit Trail',
      icon: ShieldCheck,
      role: 'all',
      badge: 'Tamper-Evident',
    },
  ];

  return (
    <aside className="stitch-sidebar">
      <div className="sidebar-top-section">
        <div className="sidebar-section-title">
          <span>Navigation Menu</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-item ${isActive ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
                onClick={() => {
                  if (!item.disabled) onNavigate(item.id);
                }}
                disabled={item.disabled}
                title={item.disabled ? item.badge : item.label}
              >
                <div className="nav-item-icon-box">
                  <Icon size={19} />
                </div>
                <span className="nav-item-label">{item.label}</span>
                {isActive && <div className="nav-item-active-indicator" />}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-bottom-section">
        {/* Database Status Card */}
        <div className="zk-sync-card">
          <div className="zk-sync-header">
            <span className="zk-title">
              <Database size={13} style={{ marginRight: '6px', verticalAlign: 'middle', color: 'var(--primary)' }} />
              Live Database
            </span>
            <span className="zk-status-pill">
              <span className="pulse-dot" /> CONNECTED
            </span>
          </div>

          <div className="zk-progress-bar-bg">
            <div className="zk-progress-bar-fill" style={{ width: '100%' }} />
          </div>

          <div className="zk-sync-footer">
            <span className="zk-block-num">MongoDB Active</span>
            <span className="zk-quorum">All Records Synced</span>
          </div>
        </div>

        <div className="sidebar-brand-legal">
          <span>© 2026 HealthGrid Clinical EHR</span>
        </div>
      </div>
    </aside>
  );
}
