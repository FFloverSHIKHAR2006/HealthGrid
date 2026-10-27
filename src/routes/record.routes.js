import { Router } from 'express';
import { z } from 'zod';
import { createRecord, getRecord, verifyRecord, deleteRecord } from '../controllers/record.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate, idParam, objectId } from '../middleware/validate.js';
import { RECORD_CATEGORIES } from '../models/MedicalRecord.js';

const router = Router();
router.use(authenticate);

const observationSchema = z.object({
  name: z.string().trim().min(1),
  value: z.string().trim().min(1),
  unit: z.string().trim().optional(),
  referenceRange: z.string().trim().optional(),
  flag: z.enum(['normal', 'high', 'low', 'abnormal', 'critical', '']).nullable().optional(),
  interpretation: z.string().trim().optional(),
});

const createSchema = z.object({
  patient: objectId.optional(), // required for providers; ignored for patients
  category: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase() : val),
    z.enum(RECORD_CATEGORIES)
  ),
  title: z.string().trim().min(1).max(200),
  date: z.coerce.date().optional(),
  encounterDate: z.coerce.date().optional(),
  reportDate: z.coerce.date().optional(),
  facility: z.string().trim().max(200).optional(),
  details: z.string().trim().max(5000).optional(),
  clinicalSummary: z.string().trim().max(5000).optional(),
  source: z.enum(['manual', 'scanner']).optional(),

  // Structured Metadata
  patientMetadata: z
    .object({
      name: z.string().trim().optional(),
      identifier: z.string().trim().optional(),
      age: z.number().optional(),
      gender: z.string().trim().optional(),
    })
    .optional(),
  clinician: z.string().trim().max(200).optional(),
  department: z.string().trim().max(200).optional(),
  encounterType: z.string().trim().max(100).optional(),
  labNumber: z.string().trim().max(100).optional(),

  observations: z.array(observationSchema).optional(),
  structuredData: z.record(z.any()).optional(),

  // Cryptographic & Audit
  documentHash: z.string().trim().optional(),
  verificationStatus: z.enum(['VERIFIED', 'UNVERIFIED', 'FAILED']).optional(),
  originalFile: z
    .object({
      url: z.string().optional(),
      filename: z.string().optional(),
      mimeType: z.string().optional(),
      size: z.number().optional(),
      dataUrl: z.string().optional(),
    })
    .optional(),
  rawOcrText: z.string().optional(),
});

const verifySchema = z.object({
  fileData: z.string().optional(),
  expectedHash: z.string().optional(),
});

router.post('/', validate({ body: createSchema }), createRecord);
router.get('/:id', validate({ params: idParam }), getRecord);
router.post('/:id/verify', validate({ params: idParam, body: verifySchema }), verifyRecord);
router.delete('/:id', authorize('provider'), validate({ params: idParam }), deleteRecord);

export default router;
