import { Router } from 'express';
import { z } from 'zod';
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  recordAdherence,
} from '../controllers/reminder.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate, idParam, objectId } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  patient: objectId.optional(),
  type: z.enum(['medication', 'appointment']).optional(),
  title: z.string().trim().min(1).max(200),
  medication: z.string().trim().max(200).optional(),
  dosage: z.string().trim().max(100).optional(),
  frequency: z.string().trim().max(100).optional(),
  time: z.string().trim().max(20).optional(),
  times: z.array(z.string().trim().max(20)).optional(),
  prescription: objectId.optional(),
  instructions: z.string().trim().max(1000).optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),

  // Appointment fields
  doctorName: z.string().trim().max(150).optional(),
  specialty: z.string().trim().max(100).optional(),
  facility: z.string().trim().max(200).optional(),
  appointmentDate: z.string().or(z.date()).optional(),
  appointmentTime: z.string().trim().max(30).optional(),
  reminderLeadTime: z.string().trim().max(50).optional(),
  location: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
});

const updateSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    medication: z.string().trim().max(200),
    dosage: z.string().trim().max(100),
    frequency: z.string().trim().max(100),
    time: z.string().trim().max(20),
    times: z.array(z.string().trim().max(20)),
    instructions: z.string().trim().max(1000),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
    doctorName: z.string().trim().max(150),
    specialty: z.string().trim().max(100),
    facility: z.string().trim().max(200),
    appointmentDate: z.string().or(z.date()),
    appointmentTime: z.string().trim().max(30),
    reminderLeadTime: z.string().trim().max(50),
    location: z.string().trim().max(200),
    notes: z.string().trim().max(1000),
    status: z.enum(['active', 'paused', 'completed', 'cancelled']),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to update' });

const adherenceSchema = z.object({
  status: z.enum(['taken', 'skipped']),
  note: z.string().trim().max(200).optional(),
  scheduledTime: z.string().trim().max(20).optional(),
});

router.get('/', getReminders);
router.post('/', validate({ body: createSchema }), createReminder);
router.put('/:id', validate({ params: idParam, body: updateSchema }), updateReminder);
router.delete('/:id', validate({ params: idParam }), deleteReminder);
router.post('/:id/adherence', validate({ params: idParam, body: adherenceSchema }), recordAdherence);

export default router;
