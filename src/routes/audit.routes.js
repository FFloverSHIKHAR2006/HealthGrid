import { Router } from 'express';
import { z } from 'zod';
import { listAuditLogs, verifyAuditLogs } from '../controllers/audit.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate, authorize('provider'));

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get('/', validate({ query: querySchema }), listAuditLogs);
router.get('/verify', verifyAuditLogs);

export default router;
