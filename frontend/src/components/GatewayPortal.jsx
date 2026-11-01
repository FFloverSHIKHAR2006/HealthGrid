import React, { useState } from 'react';
import {
  User,
  Stethoscope,
  Eye,
  EyeOff,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  LogIn,
  X,
  HelpCircle,
  Database,
  Building,
  Phone,
  FileText,
} from 'lucide-react';
import ShimmerButton from './ShimmerButton';
import { api } from '../services/api';

export default function GatewayPortal({ onLoginSuccess, onRegisterSuccess, onSelectLedgerView }) {
  // Role & Mode State
  const [role, setRole] = useState('patient'); // 'patient' | 'provider'
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // Form Fields - Login
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields - Register
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Patient-specific register fields
  const [gender, setGender] = useState('Female');
  const [dob, setDob] = useState('1996-05-20');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [emergName, setEmergName] = useState('');
  const [emergRelation, setEmergRelation] = useState('Spouse');
  const [emergPhone, setEmergPhone] = useState('');

  // Doctor-specific register fields
  const [specialization, setSpecialization] = useState('Cardiology');
  const [hospital, setHospital] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  // UI & Feedback State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Forgot Password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState('request'); // 'request' | 'reset'
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');

  const isPatient = role === 'patient';

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!identifier.trim() || !password) {
      setError('Please provide your ID or Email and Password.');
      return;
    }

    setLoading(true);
    try {
      await onLoginSuccess(identifier.trim(), password);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim() || !email.trim() || !regPassword) {
      setError('Name, email, and password are required.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!isPatient && (!licenseNumber || !licenseNumber.trim())) {
      setError('Medical Council License Number is required for Doctor registration.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        role,
        name: name.trim(),
        email: email.trim(),
        password: regPassword,
      };

      if (isPatient) {
        payload.gender = gender;
        payload.dateOfBirth = dob;
        payload.bloodGroup = bloodGroup;
        if (allergies.trim()) {
          payload.allergies = allergies.split(',').map((a) => a.trim()).filter(Boolean);
        }
        if (emergName.trim()) {
          payload.emergencyContact = {
            name: emergName.trim(),
            relation: emergRelation.trim() || 'Family',
            phone: emergPhone.trim() || '+91 98765 43210',
          };
        }
      } else {
        payload.specialization = specialization.trim();
        payload.hospital = hospital.trim() || 'Metro Super Specialty Hospital';
        payload.licenseNumber = licenseNumber.trim();
      }

      await onRegisterSuccess(payload);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check form data.');
    } finally {
      setLoading(false);
    }
  };

  const autofillDemo = (demoRole) => {
    setError('');
    setSuccessMsg('');
    setMode('login');
    if (demoRole === 'patient') {
      setRole('patient');
      setIdentifier('patient1@healthgrid.test');
      setPassword('Password@123');
    } else {
      setRole('provider');
      setIdentifier('doctor@healthgrid.test');
      setPassword('Password@123');
    }
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');
    setForgotLoading(true);
    try {
      const res = await api.forgotPassword(forgotEmail.trim());
      setForgotMsg(res.message);
      if (res.resetToken) {
        setResetToken(res.resetToken);
        setForgotStep('reset');
      }
    } catch (err) {
      setForgotError(err.message || 'Failed to request password reset');
    } finally {
      setForgotLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');

    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.resetPassword(resetToken.trim(), newPassword);
      setSuccessMsg(res.message || 'Password reset successfully. You can now sign in.');
      setShowForgotModal(false);
      setPassword(newPassword);
      setIdentifier(forgotEmail);
    } catch (err) {
      setForgotError(err.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="unified-auth-viewport">
      {/* Brand Hero Header */}
      <header className="unified-auth-header">
        <div className="auth-brand-badge">
          <span className="auth-badge-dot"></span>
          <span>Enterprise Healthcare Node &bull; ABDM Compliant</span>
        </div>
        <h1 className="auth-main-heading">HealthGrid Access Portal</h1>
        <p className="auth-subheading">
          Unified electronic health records, active telemetry tracking, and clinical consultations with cryptographically secured storage.
        </p>
      </header>

      {/* Main Authentication Card */}
      <div className="unified-auth-card">
        {/* Role Toggle Selector */}
        <div className="auth-role-selector">
          <button
            type="button"
            className={`role-toggle-btn patient-btn ${isPatient ? 'active' : ''}`}
            onClick={() => {
              setRole('patient');
              setError('');
            }}
          >
            <div className="role-icon-box">
              <User size={20} />
            </div>
            <div className="role-label-group">
              <span className="role-title">Patient Portal</span>
              <span className="role-sub">Health Vault &amp; Vitals</span>
            </div>
            {isPatient && <span className="active-badge">Active</span>}
          </button>

          <button
            type="button"
            className={`role-toggle-btn doctor-btn ${!isPatient ? 'active' : ''}`}
            onClick={() => {
              setRole('provider');
              setError('');
            }}
          >
            <div className="role-icon-box">
              <Stethoscope size={20} />
            </div>
            <div className="role-label-group">
              <span className="role-title">Doctor Workspace</span>
              <span className="role-sub">Caseload &amp; E-Prescriptions</span>
            </div>
            {!isPatient && <span className="active-badge">Active</span>}
          </button>
        </div>

        {/* Mode Switch (Sign In vs Create Account) */}
        <div className="auth-mode-switch">
          <button
            type="button"
            className={`mode-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError('');
              setSuccessMsg('');
            }}
          >
            <LogIn size={15} /> Sign In
          </button>

          <button
            type="button"
            className={`mode-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setError('');
              setSuccessMsg('');
            }}
          >
            <UserPlus size={15} /> Create Account
          </button>
        </div>

        {/* Inline Alerts */}
        {error && (
          <div className="auth-alert error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert success" role="status">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. SIGN IN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="auth-form-body">
            <div className="form-group">
              <label className="form-label">
                {isPatient ? 'HealthGrid ID or Email Address' : 'Doctor Email or Medical ID'}
              </label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  type="text"
                  className="auth-input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    isPatient
                      ? 'e.g. HG-8904-2026 or patient1@healthgrid.test'
                      : 'e.g. doctor@healthgrid.test'
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-actions-row">
                <label className="form-label">Password</label>
                <button
                  type="button"
                  className="forgot-btn"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotEmail(identifier.includes('@') ? identifier : '');
                    setForgotStep('request');
                    setForgotMsg('');
                    setForgotError('');
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  required
                />
                <button
                  type="button"
                  className="visibility-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <ShimmerButton
              type="submit"
              variant={isPatient ? 'primary' : 'secondary'}
              size="md"
              className="btn-auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" /> Verifying Credentials...
                </>
              ) : (
                <>
                  Sign In to {isPatient ? 'Patient Portal' : 'Doctor Workspace'} <ArrowRight size={16} />
                </>
              )}
            </ShimmerButton>

            <div className="auth-switch-footer">
              <span>Don't have an account yet?</span>
              <button
                type="button"
                className="switch-link-btn"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
              >
                Create a new {isPatient ? 'Patient' : 'Doctor'} account
              </button>
            </div>
          </form>
        ) : (
          /* 2. REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="auth-form-body">
            <div className="role-registration-banner">
              Creating account for:{' '}
              <strong>{isPatient ? 'Patient (Lifetime EHR Profile)' : 'Doctor / Licensed Clinician'}</strong>
            </div>

            <div className="form-grid-2col">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="auth-input no-left-icon"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isPatient ? 'e.g. Ramesh Kumar' : 'e.g. Dr. Ramesh Patel, MD'}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="auth-input no-left-icon"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@example.com"
                  required
                />
              </div>

              <div className="form-group span-2">
                <label className="form-label">Password * (min 6 characters)</label>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    className="auth-input"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                  />
                  <button
                    type="button"
                    className="visibility-toggle-btn"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    title={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Patient Fields */}
              {isPatient ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="auth-input no-left-icon"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      className="auth-input no-left-icon"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select
                      className="auth-input no-left-icon"
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Emergency Contact Name</label>
                    <input
                      type="text"
                      className="auth-input no-left-icon"
                      value={emergName}
                      onChange={(e) => setEmergName(e.target.value)}
                      placeholder="e.g. Anita Kumar"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Emergency Phone</label>
                    <input
                      type="text"
                      className="auth-input no-left-icon"
                      value={emergPhone}
                      onChange={(e) => setEmergPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Allergies (Optional)</label>
                    <input
                      type="text"
                      className="auth-input no-left-icon"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="e.g. Penicillin, Peanuts"
                    />
                  </div>
                </>
              ) : (
                /* Doctor Fields */
                <>
                  <div className="form-group">
                    <label className="form-label">Medical Specialization *</label>
                    <input
                      type="text"
                      className="auth-input no-left-icon"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. Cardiology, Neurology"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hospital Affiliation</label>
                    <input
                      type="text"
                      className="auth-input no-left-icon"
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                      placeholder="e.g. AIIMS, Apollo Hospitals"
                    />
                  </div>

                  <div className="form-group span-2">
                    <label className="form-label">Medical Council License Number *</label>
                    <input
                      type="text"
                      className="auth-input no-left-icon"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g. MCI-REG-98421"
                      required
                    />
                  </div>
                </>
              )}
            </div>

            <ShimmerButton
              type="submit"
              variant={isPatient ? 'primary' : 'secondary'}
              size="md"
              className="btn-auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" /> Creating Account in MongoDB...
                </>
              ) : (
                <>
                  <UserPlus size={16} /> Register as {isPatient ? 'Patient' : 'Doctor'} &amp; Sign In Live
                </>
              )}
            </ShimmerButton>

            <div className="auth-switch-footer">
              <span>Already have an account?</span>
              <button
                type="button"
                className="switch-link-btn"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
              >
                Sign in to existing account
              </button>
            </div>
          </form>
        )}

        {/* Quick Demo Evaluation Credentials Strip */}
        <div className="demo-credentials-strip">
          <span className="demo-strip-label">Quick Demo Evaluation (1-Click Fill)</span>
          <div className="demo-chips-group">
            <button
              type="button"
              className="demo-chip-btn"
              onClick={() => autofillDemo('patient')}
              title="Populate Sarah Jenkins credentials"
            >
              <User size={13} />
              <span className="demo-chip-role patient">Patient</span>
              <span className="demo-chip-name">Sarah Jenkins</span>
            </button>
            <button
              type="button"
              className="demo-chip-btn"
              onClick={() => autofillDemo('provider')}
              title="Populate Dr. Wright credentials"
            >
              <Stethoscope size={13} />
              <span className="demo-chip-role doctor">Doctor</span>
              <span className="demo-chip-name">Dr. Alexander Wright</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trust & Security Verification Grid */}
      <div className="unified-trust-grid">
        <div className="trust-pill">
          <ShieldCheck size={18} color="var(--primary)" />
          <span className="trust-pill-label">SHA-256 Ledger</span>
          <span className="trust-pill-sub">Tamper-proof audit chain</span>
        </div>
        <div className="trust-pill">
          <Database size={18} color="#4648d4" />
          <span className="trust-pill-label">MongoDB Cloud &amp; Local</span>
          <span className="trust-pill-sub">Live persistent records</span>
        </div>
        <div className="trust-pill" style={{ cursor: 'pointer' }} onClick={onSelectLedgerView}>
          <FileText size={18} color="#b61722" />
          <span className="trust-pill-label">Inspect Public Ledger</span>
          <span className="trust-pill-sub">View cryptographic blocks &rarr;</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="unified-modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="unified-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="unified-modal-header">
              <div className="unified-modal-title">
                <HelpCircle size={20} color="var(--primary)" />
                <h3>Account Password Recovery</h3>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setShowForgotModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="unified-modal-body">
              {forgotError && (
                <div className="auth-alert error">
                  <AlertCircle size={16} />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotMsg && (
                <div className="auth-alert success">
                  <CheckCircle2 size={16} />
                  <span>{forgotMsg}</span>
                </div>
              )}

              {forgotStep === 'request' ? (
                <form onSubmit={handleForgotPasswordRequest} className="auth-form-body">
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                    Enter your registered email address. The system will generate a secure cryptographic token to reset your password.
                  </p>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className="input-wrapper">
                      <Mail size={16} className="input-icon" />
                      <input
                        type="email"
                        className="auth-input"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. user@healthgrid.test"
                        required
                      />
                    </div>
                  </div>

                  <div className="unified-modal-footer">
                    <button
                      type="button"
                      className="btn-modal-secondary"
                      onClick={() => setShowForgotModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-modal-primary"
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? (
                        <>
                          <Loader2 size={14} className="spin" /> Generating...
                        </>
                      ) : (
                        'Request Reset Token'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handlePasswordResetSubmit} className="auth-form-body">
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                    Verification token generated. Please set your new password below:
                  </p>
                  <div className="form-group">
                    <label className="form-label">Reset Token</label>
                    <input
                      type="text"
                      className="auth-input no-left-icon font-mono"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password (min 6 characters)</label>
                    <div className="input-wrapper">
                      <Lock size={16} className="input-icon" />
                      <input
                        type="password"
                        className="auth-input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new secure password"
                        required
                      />
                    </div>
                  </div>

                  <div className="unified-modal-footer">
                    <button
                      type="button"
                      className="btn-modal-secondary"
                      onClick={() => setShowForgotModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-modal-primary"
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? (
                        <>
                          <Loader2 size={14} className="spin" /> Updating...
                        </>
                      ) : (
                        'Update Password &amp; Finish'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
