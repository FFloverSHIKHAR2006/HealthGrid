import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';
import { logAudit } from '../services/audit.service.js';

export const login = asyncHandler(async (req, res) => {
  const identifier = (req.body.identifier || req.body.email || '').trim();
  const password = req.body.password;

  if (!identifier || !password) {
    throw new HttpError(400, 'Identifier/Email and password are required');
  }

  let user = null;

  // 1. Search by email (case-insensitive)
  if (identifier.includes('@')) {
    user = await User.findOne({ email: identifier.toLowerCase() }).select('+passwordHash');
  }

  // 2. Search by HealthGrid ID if not found
  if (!user) {
    const patientDoc = await Patient.findOne({
      healthGridId: new RegExp(`^${identifier}$`, 'i'),
    });
    if (patientDoc) {
      user = await User.findOne({ patient: patientDoc._id }).select('+passwordHash');
    }
  }

  // 3. Fallback: Search by email or exact name
  if (!user) {
    user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { name: new RegExp(`^${identifier}$`, 'i') },
      ],
    }).select('+passwordHash');
  }

  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) throw new HttpError(401, 'Invalid ID/email or password');

  const token = jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  // Fetch healthGridId if patient
  let healthGridId = null;
  if (user.patient) {
    const p = await Patient.findById(user.patient).select('healthGridId');
    healthGridId = p?.healthGridId || null;
  }

  // Audit log login activity
  await logAudit(req, {
    action: 'UPDATE',
    entity: 'User',
    entityId: user._id,
    actor: user._id,
    actorRole: user.role,
    details: `User login: ${user.name} (${user.role})`,
  });

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      patient: user.patient,
      healthGridId,
    },
  });
});

export const register = asyncHandler(async (req, res) => {
  const { role, name, email, password } = req.body;
  if (!role || !['patient', 'provider'].includes(role)) {
    throw new HttpError(400, 'Role must be either "patient" or "provider"');
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: cleanEmail });
  if (existing) {
    throw new HttpError(409, 'An account with this email address already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  let patientId = null;
  let createdPatient = null;

  if (role === 'provider') {
    if (!req.body.licenseNumber || !req.body.licenseNumber.trim()) {
      throw new HttpError(400, 'Valid Medical Council License Number is required for Doctor account registration');
    }
  }

  if (role === 'patient') {
    // Generate unique HealthGrid ID
    let isUnique = false;
    let generatedId = '';
    while (!isUnique) {
      const year = new Date().getFullYear();
      const randNum = Math.floor(1000 + Math.random() * 9000);
      generatedId = `HG-${randNum}-${year}`;
      const found = await Patient.exists({ healthGridId: generatedId });
      if (!found) isUnique = true;
    }

    createdPatient = await Patient.create({
      healthGridId: generatedId,
      name: name.trim(),
      dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : new Date('1995-01-01'),
      gender: req.body.gender || 'Not Specified',
      bloodGroup: req.body.bloodGroup || 'O+',
      allergies: Array.isArray(req.body.allergies)
        ? req.body.allergies
        : req.body.allergies
        ? [req.body.allergies]
        : [],
      emergencyContact: {
        name: req.body.emergencyContactName || req.body.emergencyContact?.name || 'Primary Contact',
        relation: req.body.emergencyContactRelation || req.body.emergencyContact?.relation || 'Family',
        phone: req.body.emergencyContactPhone || req.body.emergencyContact?.phone || '+91 98765 43210',
      },
      telemetry: {
        heartRate: 72,
        bloodPressure: { systolic: 120, diastolic: 80 },
        glucose: 95,
        hrv: 65,
      },
    });
    patientId = createdPatient._id;
  }

  const user = await User.create({
    name: name.trim(),
    email: cleanEmail,
    passwordHash,
    role,
    patient: patientId,
  });

  const token = jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  await logAudit(req, {
    action: 'CREATE',
    entity: 'User',
    entityId: user._id,
    actor: user._id,
    actorRole: user.role,
    details: `Registered new ${role}: ${user.name} (${user.email})`,
  });

  res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      patient: user.patient,
      healthGridId: createdPatient?.healthGridId || null,
    },
    message: `Account created successfully for ${user.name} (${role === 'provider' ? 'Doctor' : 'Patient'})`,
  });
});

export const getOAuthConfig = (req, res) => {
  const config = {
    google: {
      enabled: Boolean(process.env.GOOGLE_CLIENT_ID),
      clientId: process.env.GOOGLE_CLIENT_ID || null,
    },
    microsoft: {
      enabled: Boolean(process.env.MICROSOFT_CLIENT_ID),
      clientId: process.env.MICROSOFT_CLIENT_ID || null,
    },
  };
  res.json({
    ...config,
    providers: config,
  });
};

export const googleOAuth = asyncHandler(async (req, res) => {
  const { credential, role = 'patient' } = req.body;

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({
      configured: false,
      code: 'GOOGLE_OAUTH_NOT_CONFIGURED',
      message: 'Google Sign-In is not configured on this server. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.',
    });
  }

  if (!credential) {
    throw new HttpError(400, 'Google OAuth credential token is required');
  }

  let googlePayload;
  try {
    const gRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!gRes.ok) {
      throw new Error('Google token validation returned non-200 response');
    }
    googlePayload = await gRes.json();
  } catch (err) {
    throw new HttpError(401, 'Google authentication verification failed: ' + err.message);
  }

  if (process.env.GOOGLE_CLIENT_ID && googlePayload.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new HttpError(401, 'Google credential token audience mismatch');
  }

  const email = (googlePayload.email || '').toLowerCase().trim();
  const name = googlePayload.name || 'Google User';
  const sub = googlePayload.sub;

  if (!email || !googlePayload.email_verified) {
    throw new HttpError(400, 'Google account email is missing or unverified');
  }

  let user = await User.findOne({ email });

  if (!user) {
    const randomPassword = crypto.randomBytes(24).toString('hex');
    const passwordHash = await bcrypt.hash(randomPassword, 10);
    const chosenRole = role === 'provider' ? 'provider' : 'patient';

    let patientId = null;
    let createdPatient = null;

    if (chosenRole === 'patient') {
      const year = new Date().getFullYear();
      const randNum = Math.floor(1000 + Math.random() * 9000);
      createdPatient = await Patient.create({
        healthGridId: `HG-${randNum}-${year}`,
        name,
        dateOfBirth: new Date('1995-01-01'),
        gender: 'Not Specified',
        bloodGroup: 'O+',
        allergies: [],
        emergencyContact: { name: 'Emergency Contact', relation: 'Family', phone: '+91 98765 43210' },
        telemetry: { heartRate: 72, bloodPressure: { systolic: 120, diastolic: 80 }, glucose: 95, hrv: 65 },
      });
      patientId = createdPatient._id;
    }

    user = await User.create({
      name,
      email,
      passwordHash,
      role: chosenRole,
      patient: patientId,
      authProvider: 'google',
      authProviderId: sub,
    });

    await logAudit(req, {
      action: 'CREATE',
      entity: 'User',
      entityId: user._id,
      actor: user._id,
      actorRole: user.role,
      details: `Registered via Google OAuth: ${user.name} (${user.role})`,
    });
  } else {
    // Preserve existing role strictly; link provider ID if not linked
    if (!user.authProviderId) {
      user.authProvider = 'google';
      user.authProviderId = sub;
      await user.save();
    }
  }

  let healthGridId = null;
  if (user.patient) {
    const p = await Patient.findById(user.patient).select('healthGridId');
    healthGridId = p?.healthGridId || null;
  }

  const token = jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      patient: user.patient,
      healthGridId,
    },
    message: `Signed in successfully via Google as ${user.name}`,
  });
});

export const microsoftOAuth = asyncHandler(async (req, res) => {
  const { idToken, role = 'patient' } = req.body;

  if (!process.env.MICROSOFT_CLIENT_ID) {
    return res.status(503).json({
      configured: false,
      code: 'MICROSOFT_OAUTH_NOT_CONFIGURED',
      message: 'Microsoft Sign-In is not configured on this server. Add MICROSOFT_CLIENT_ID in .env.',
    });
  }

  if (!idToken) {
    throw new HttpError(400, 'Microsoft token is required');
  }

  let msPayload;
  try {
    const msRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!msRes.ok) throw new Error('Microsoft Graph API rejected authorization');
    msPayload = await msRes.json();
  } catch (err) {
    throw new HttpError(401, 'Microsoft authentication verification failed: ' + err.message);
  }

  const email = (msPayload.mail || msPayload.userPrincipalName || '').toLowerCase().trim();
  const name = msPayload.displayName || 'Microsoft User';
  const sub = msPayload.id;

  if (!email) {
    throw new HttpError(400, 'Microsoft account does not provide an email address');
  }

  let user = await User.findOne({ email });

  if (!user) {
    const randomPassword = crypto.randomBytes(24).toString('hex');
    const passwordHash = await bcrypt.hash(randomPassword, 10);
    const chosenRole = role === 'provider' ? 'provider' : 'patient';

    let patientId = null;
    let createdPatient = null;

    if (chosenRole === 'patient') {
      const year = new Date().getFullYear();
      const randNum = Math.floor(1000 + Math.random() * 9000);
      createdPatient = await Patient.create({
        healthGridId: `HG-${randNum}-${year}`,
        name,
        dateOfBirth: new Date('1995-01-01'),
        gender: 'Not Specified',
        bloodGroup: 'O+',
        allergies: [],
        emergencyContact: { name: 'Emergency Contact', relation: 'Family', phone: '+91 98765 43210' },
        telemetry: { heartRate: 72, bloodPressure: { systolic: 120, diastolic: 80 }, glucose: 95, hrv: 65 },
      });
      patientId = createdPatient._id;
    }

    user = await User.create({
      name,
      email,
      passwordHash,
      role: chosenRole,
      patient: patientId,
      authProvider: 'microsoft',
      authProviderId: sub,
    });
  }

  let healthGridId = null;
  if (user.patient) {
    const p = await Patient.findById(user.patient).select('healthGridId');
    healthGridId = p?.healthGridId || null;
  }

  const token = jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      patient: user.patient,
      healthGridId,
    },
    message: `Signed in successfully via Microsoft as ${user.name}`,
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    throw new HttpError(400, 'Valid email address is required');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    // Obfuscate whether user exists for privacy
    return res.json({
      message: 'If an account associated with this email exists, Password reset instructions have been prepared.',
    });
  }

  const rawToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.resetPasswordToken = tokenHash;
  user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
  await user.save();

  await logAudit(req, {
    action: 'UPDATE',
    entity: 'User',
    entityId: user._id,
    actor: user._id,
    actorRole: user.role,
    details: `Password reset requested for: ${user.email}`,
  });

  res.json({
    message: 'If an account associated with this email exists, Password reset instructions have been prepared.',
    resetToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    throw new HttpError(400, 'Reset token and new password are required');
  }
  if (newPassword.length < 6) {
    throw new HttpError(400, 'Password must be at least 6 characters');
  }

  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+passwordHash +resetPasswordToken +resetPasswordExpires');

  if (!user) {
    throw new HttpError(400, 'Password reset token is invalid or has expired');
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  await logAudit(req, {
    action: 'UPDATE',
    entity: 'User',
    entityId: user._id,
    actor: user._id,
    actorRole: user.role,
    details: `Password reset successfully completed for: ${user.email}`,
  });

  res.json({
    message: 'Password reset successful. You may now sign in with your new password.',
  });
});

export const me = (req, res) => {
  const u = req.user;
  res.json({ id: u._id, name: u.name, email: u.email, role: u.role, patient: u.patient });
};
