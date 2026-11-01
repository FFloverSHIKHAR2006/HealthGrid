import Patient from '../models/Patient.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Prescription from '../models/Prescription.js';
import Routine from '../models/Routine.js';
import Reminder from '../models/Reminder.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';
import { canAccessPatient } from '../middleware/auth.js';
import { logAudit } from '../services/audit.service.js';

// FR-01: patient list (providers: whole caseload, patients: only themselves)
export const listPatients = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'provider' ? {} : { _id: req.user.patient };
  const patients = await Patient.find(filter).sort({ name: 1 }).lean();
  res.json(patients);
});

// FR-02: full vault
export const getPatientVault = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!canAccessPatient(req.user, id)) throw new HttpError(403, 'You do not have access to this patient');

  const patient = await Patient.findById(id).lean();
  if (!patient) throw new HttpError(404, 'Patient not found');

  const [records, prescriptions, routines, reminders] = await Promise.all([
    MedicalRecord.find({ patient: id }).sort({ date: -1 }).lean(),
    Prescription.find({ patient: id }).populate('provider', 'name').sort({ issuedAt: -1 }).lean(),
    Routine.find({ patient: id }).sort({ createdAt: -1 }).lean(),
    Reminder.find({ patient: id }).populate('prescription', 'medication dosage frequency').sort({ createdAt: -1 }).lean(),
  ]);
  res.json({ patient, records, prescriptions, routines, reminders });
});

const PATIENT_EDITABLE = ['emergencyContact', 'allergies'];
const PROVIDER_EDITABLE = ['name', 'bloodGroup', 'allergies', 'emergencyContact', 'telemetry'];

// Turns nested objects into dot-paths so partial updates don't wipe sibling fields.
const flatten = (obj, prefix = '', out = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, path, out);
    else out[path] = v;
  }
  return out;
};

export const updatePatient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!canAccessPatient(req.user, id)) throw new HttpError(403, 'You do not have access to this patient');

  const allowed = req.user.role === 'provider' ? PROVIDER_EDITABLE : PATIENT_EDITABLE;
  const picked = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  if (Object.keys(picked).length === 0)
    throw new HttpError(400, `No editable fields supplied. Allowed: ${allowed.join(', ')}`);

  const patient = await Patient.findByIdAndUpdate(id, { $set: flatten(picked) }, { new: true, runValidators: true });
  if (!patient) throw new HttpError(404, 'Patient not found');

  await logAudit(req, {
    action: 'UPDATE',
    entity: 'Patient',
    entityId: patient._id,
    details: `Updated fields: ${Object.keys(picked).join(', ')}`,
  });
  res.json(patient);
});
