import React from 'react';
import {
  Activity,
  AlertTriangle,
  LogOut,
  User as UserIcon,
  Stethoscope,
  Fingerprint,
} from 'lucide-react';
import ShimmerButton from './ShimmerButton';

export default function Header({ user, onLogout, onTriggerEmergency, onReturnHome }) {
  const isDoctor = user?.role === 'provider';
  const avatarUrl = isDoctor
    ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';

  const patientIdDisplay = user?.healthGridId || (user?.role === 'patient' ? 'HG-8904-2026' : null);

  return (
    <header className="stitch-main-header">
      <div className="header-content-inner">
        {/* Brand Group */}
        <div className="header-brand-group">
          <div
            className="header-brand-clickable"
            onClick={onReturnHome}
            title="Return to Home / Gateway"
          >
            <div className="header-brand-icon-box">
              <Activity size={22} className="brand-pulse-icon" />
              <div className="icon-glow-ring" />
            </div>
            <div className="header-brand-titles">
              <div className="brand-title-row">
                <span className="brand-title-main">HealthGrid</span>
                <span className="brand-version-chip">CLINICAL EHR</span>
              </div>
              <span className="brand-subtitle">Unified Electronic Health Records & Diagnostic Platform</span>
            </div>
          </div>

          <div className="header-vertical-sep" />

          {/* System Status Chip */}
          <div className="header-node-chip">
            <span className="node-live-dot" />
            <span className="node-text">National Health Network • Online & Synced</span>
          </div>
        </div>

        {/* Right Controls Group */}
        <div className="header-actions-group">
          {/* Patient Health ID or ABHA Chip */}
          {user && (
            <div className="header-abha-chip" title="Verified HealthGrid Medical Identity">
              <Fingerprint size={15} />
              <span>
                {patientIdDisplay ? `ID: ${patientIdDisplay}` : 'Doctor: MCI Verified'}
              </span>
            </div>
          )}

          {/* 108 SOS TRIGGER Button */}
          <ShimmerButton
            variant="emergency"
            size="md"
            className="header-sos-btn"
            onClick={onTriggerEmergency}
            icon={AlertTriangle}
          >
            108 SOS EMERGENCY
          </ShimmerButton>

          {/* User Session Profile */}
          {user && (
            <div className="header-session-box">
              <div className="user-avatar-wrapper">
                <img src={avatarUrl} alt={user.name} className="user-avatar-img" />
                <span className="avatar-online-indicator" />
              </div>

              <div className="user-meta-texts">
                <span className="user-full-name">{user.name}</span>
                <span className="user-role-label">
                  {isDoctor ? (
                    <>
                      <Stethoscope size={12} className="inline-icon" />
                      Doctor / Clinician
                    </>
                  ) : (
                    <>
                      <UserIcon size={12} className="inline-icon" />
                      Patient
                    </>
                  )}
                </span>
              </div>

              <button
                type="button"
                className="header-logout-btn"
                onClick={onLogout}
                title="Sign Out / Switch Account"
              >
                <LogOut size={17} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
