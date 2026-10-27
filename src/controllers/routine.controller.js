import Routine from '../models/Routine.js';
import Patient from '../models/Patient.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';
import { canAccessPatient } from '../middleware/auth.js';
import { logAudit } from '../services/audit.service.js';

// FR-05
export const createRoutine = asyncHandler(async (req, res) => {
  const patientId = req.user.role === 'patient' ? req.user.patient : req.body.patient;
  if (!patientId) throw new HttpError(400, 'patient is required');
  if (!canAccessPatient(req.user, patientId)) throw new HttpError(403, 'You do not have access to this patient');
  if (!(await Patient.exists({ _id: patientId }))) throw new HttpError(404, 'Patient not found');

  const routine = await Routine.create({ ...req.body, patient: patientId });
  await logAudit(req, { action: 'CREATE', entity: 'Routine', entityId: routine._id, details: routine.title });
  res.status(201).json(routine);
});

// FR-06
export const updateRoutine = asyncHandler(async (req, res) => {
  const routine = await Routine.findById(req.params.id);
  if (!routine) throw new HttpError(404, 'Routine not found');
  if (!canAccessPatient(req.user, routine.patient)) throw new HttpError(403, 'You do not have access to this routine');

  Object.assign(routine, req.body);
  await routine.save();
  await logAudit(req, {
    action: 'UPDATE',
    entity: 'Routine',
    entityId: routine._id,
    details: `${routine.title} -> ${routine.status}`,
  });
  res.json(routine);
});

// FR-07
export const deleteRoutine = asyncHandler(async (req, res) => {
  const routine = await Routine.findById(req.params.id);
  if (!routine) throw new HttpError(404, 'Routine not found');
  if (!canAccessPatient(req.user, routine.patient)) throw new HttpError(403, 'You do not have access to this routine');

  await routine.deleteOne();
  await logAudit(req, { action: 'DELETE', entity: 'Routine', entityId: routine._id, details: routine.title });
  res.json({ message: 'Routine deleted' });
});
