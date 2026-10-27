import { Router } from 'express';
import { z } from 'zod';
import { listPatients, getPatientVault, updatePatient } from '../controllers/patient.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const updateSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    allergies: z.array(z.string().trim().min(1).max(100)).max(30),
    emergencyContact: z.object({
      name: z.string().trim().min(1).max(100),
      relation: z.string().trim().max(50).optional(),
      phone: z.string().trim().min(5).max(20),
    }),
    telemetry: z
      .object({
        heartRate: z.number().min(0).max(300),
        bloodPressure: z
          .object({ systolic: z.number().min(0).max(300), diastolic: z.number().min(0).max(200) })
          .partial(),
        glucose: z.number().min(0).max(1000),
        hrv: z.number().min(0).max(500),
      })
      .partial(),
  })
  .partial();

router.get('/', listPatients);
router.get('/:id', validate({ params: idParam }), getPatientVault);
router.put('/:id', validate({ params: idParam, body: updateSchema }), updatePatient);

export default router;
