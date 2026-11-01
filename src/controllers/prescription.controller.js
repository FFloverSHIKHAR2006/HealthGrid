import Prescription from '../models/Prescription.js';
import Patient from '../models/Patient.js';
import { scheduleRemindersForPrescription } from '../services/prescriptionScheduler.service.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';
import { logAudit } from '../services/audit.service.js';

// FR-04 (providers only)
export const createPrescription = asyncHandler(async (req, res) => {
  if (!(await Patient.exists({ _id: req.body.patient }))) throw new HttpError(404, 'Patient not found');

  const { autoScheduleReminders, ...prescriptionData } = req.body;
  const rx = await Prescription.create({ ...prescriptionData, provider: req.user._id });
  await logAudit(req, {
    action: 'CREATE',
    entity: 'Prescription',
    entityId: rx._id,
    details: `${rx.medication} ${rx.dosage}`,
  });

  if (autoScheduleReminders) {
    try {
      await scheduleRemindersForPrescription(rx._id, req.user._id);
    } catch (err) {
      console.warn('Failed to auto-schedule reminders for prescription:', err.message);
    }
  }

  res.status(201).json(rx);
});
