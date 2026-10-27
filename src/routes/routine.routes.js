import { Router } from 'express';
import { z } from 'zod';
import { createRoutine, updateRoutine, deleteRoutine } from '../controllers/routine.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate, idParam, objectId } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  patient: objectId.optional(), // required for providers; ignored for patients
  title: z.string().trim().min(1).max(200),
  schedule: z.string().trim().min(1).max(200),
  status: z.enum(['active', 'completed']).optional(),
});

const updateSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    schedule: z.string().trim().min(1).max(200),
    status: z.enum(['active', 'completed']),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to update' });

router.post('/', validate({ body: createSchema }), createRoutine);
router.put('/:id', validate({ params: idParam, body: updateSchema }), updateRoutine);
router.delete('/:id', validate({ params: idParam }), deleteRoutine);

export default router;
