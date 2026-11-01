import Reminder from '../models/Reminder.js';
import Patient from '../models/Patient.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';
import { canAccessPatient } from '../middleware/auth.js';
import { logAudit } from '../services/audit.service.js';

// List reminders (patients: own reminders, providers: filtered or full caseload)
export const getReminders = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === 'patient') {
    filter.patient = req.user.patient;
  } else if (req.query.patient) {
    if (!canAccessPatient(req.user, req.query.patient)) {
      throw new HttpError(403, 'You do not have access to this patient');
    }
    filter.patient = req.query.patient;
  }

  if (req.query.type) {
    filter.type = req.query.type;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const reminders = await Reminder.find(filter)
    .populate('prescription', 'medication dosage frequency')
    .sort({ createdAt: -1 })
    .lean();

  res.json(reminders);
});

// Create a medication or appointment reminder
export const createReminder = asyncHandler(async (req, res) => {
  const patientId = req.user.role === 'patient' ? req.user.patient : req.body.patient;
  if (!patientId) throw new HttpError(400, 'patient is required');
  if (!canAccessPatient(req.user, patientId)) throw new HttpError(403, 'You do not have access to this patient');
  if (!(await Patient.exists({ _id: patientId }))) throw new HttpError(404, 'Patient not found');

  const reminder = await Reminder.create({
    ...req.body,
    patient: patientId,
    createdBy: req.user._id,
  });

  await logAudit(req, {
    action: 'CREATE',
    entity: 'Reminder',
    entityId: reminder._id,
    details: `${reminder.type.toUpperCase()}: ${reminder.title}`,
  });

  res.status(201).json(reminder);
});

// Update an existing reminder
export const updateReminder = asyncHandler(async (req, res) => {
  const reminder = await Reminder.findById(req.params.id);
  if (!reminder) throw new HttpError(404, 'Reminder not found');
  if (!canAccessPatient(req.user, reminder.patient)) {
    throw new HttpError(403, 'You do not have access to this reminder');
  }

  Object.assign(reminder, req.body);
  await reminder.save();

  await logAudit(req, {
    action: 'UPDATE',
    entity: 'Reminder',
    entityId: reminder._id,
    details: `${reminder.type.toUpperCase()}: ${reminder.title} -> ${reminder.status}`,
  });

  res.json(reminder);
});

// Delete a reminder
export const deleteReminder = asyncHandler(async (req, res) => {
  const reminder = await Reminder.findById(req.params.id);
  if (!reminder) throw new HttpError(404, 'Reminder not found');
  if (!canAccessPatient(req.user, reminder.patient)) {
    throw new HttpError(403, 'You do not have access to this reminder');
  }

  await reminder.deleteOne();

  await logAudit(req, {
    action: 'DELETE',
    entity: 'Reminder',
    entityId: reminder._id,
    details: `${reminder.type.toUpperCase()}: ${reminder.title}`,
  });

  res.json({ message: 'Reminder deleted successfully' });
});

// Record adherence (mark dose as taken or skipped)
export const recordAdherence = asyncHandler(async (req, res) => {
  const { status, note, scheduledTime } = req.body;
  if (!['taken', 'skipped'].includes(status)) {
    throw new HttpError(400, 'Status must be taken or skipped');
  }

  const reminder = await Reminder.findById(req.params.id);
  if (!reminder) throw new HttpError(404, 'Reminder not found');
  if (!canAccessPatient(req.user, reminder.patient)) {
    throw new HttpError(403, 'You do not have access to this reminder');
  }

  const entry = {
    timestamp: new Date(),
    status,
    note: note || '',
    scheduledTime: scheduledTime || reminder.time || '',
  };

  reminder.adherenceHistory.push(entry);
  await reminder.save();

  await logAudit(req, {
    action: 'UPDATE',
    entity: 'Reminder',
    entityId: reminder._id,
    details: `Adherence recorded: ${status.toUpperCase()} for ${reminder.title}`,
  });

  res.json({
    message: `Medication marked as ${status}`,
    reminder,
    adherence: entry,
  });
});
