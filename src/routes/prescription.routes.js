import { Router } from 'express';
import { z } from 'zod';
import { createPrescription } from '../controllers/prescription.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate, objectId } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  patient: objectId,
  medication: z.string().trim().min(1).max(200),
  dosage: z.string().trim().min(1).max(100),
  frequency: z.string().trim().max(100).optional(),
  duration: z.string().trim().max(100).optional(),
  instructions: z.string().trim().max(1000).optional(),
});

router.post('/', authorize('provider'), validate({ body: createSchema }), createPrescription);

export default router;
