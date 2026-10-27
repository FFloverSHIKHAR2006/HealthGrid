import MedicalRecord from '../models/MedicalRecord.js';
import Patient from '../models/Patient.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';
import { canAccessPatient } from '../middleware/auth.js';
import { logAudit } from '../services/audit.service.js';
import { computeFileSha256, verifyDocumentIntegrity } from '../services/documentCrypto.service.js';

// FR-03: Create Medical Record
export const createRecord = asyncHandler(async (req, res) => {
  // Patients can only add to their own vault
  const patientId = req.user.role === 'patient' ? req.user.patient : req.body.patient;
  if (!patientId) throw new HttpError(400, 'patient is required');
  if (!canAccessPatient(req.user, patientId)) throw new HttpError(403, 'You do not have access to this patient');
  if (!(await Patient.exists({ _id: patientId }))) throw new HttpError(404, 'Patient not found');

  const payload = { ...req.body, patient: patientId, createdBy: req.user._id };

  // Date coercion & chronological anchor
  if (!payload.date) {
    payload.date = payload.encounterDate || payload.reportDate || new Date();
  }

  // Summary fallback
  if (!payload.details && payload.clinicalSummary) {
    payload.details = payload.clinicalSummary;
  }

  // Calculate genuine document hash if originalFile is present
  if (payload.originalFile?.dataUrl && !payload.documentHash) {
    try {
      payload.documentHash = computeFileSha256(payload.originalFile.dataUrl);
    } catch {
      // Ignore calculation error on malformed base64
    }
  }

  // Idempotency guard: prevent duplicate records during retries or re-scans
  if (payload.documentHash) {
    const existing = await MedicalRecord.findOne({
      patient: patientId,
      documentHash: payload.documentHash,
    });
    if (existing) {
      return res.status(200).json(existing);
    }
  }

  const record = await MedicalRecord.create(payload);
  await logAudit(req, {
    action: 'CREATE',
    entity: 'MedicalRecord',
    entityId: record._id,
    details: `${record.category}: ${record.title}`,
  });
  res.status(201).json(record);
});

// Retrieve single medical record by ID
export const getRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record) throw new HttpError(404, 'Record not found');

  if (!canAccessPatient(req.user, record.patient)) {
    throw new HttpError(403, 'You do not have access to this patient record');
  }

  res.json(record);
});

// Cryptographic Verification of Medical Record Document
export const verifyRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record) throw new HttpError(404, 'Record not found');

  if (!canAccessPatient(req.user, record.patient)) {
    throw new HttpError(403, 'You do not have access to this patient record');
  }

  const fileData = req.body.fileData || record.originalFile?.dataUrl;
  if (!fileData) {
    throw new HttpError(400, 'Original document file data is required for cryptographic verification');
  }

  const targetHash = req.body.expectedHash || record.documentHash;
  if (!targetHash) {
    throw new HttpError(400, 'No hash available for verification on this record');
  }

  const { verified, actualHash, expectedHash } = verifyDocumentIntegrity(fileData, targetHash);

  record.verificationStatus = verified ? 'VERIFIED' : 'FAILED';
  record.documentHash = actualHash;
  await record.save();

  await logAudit(req, {
    action: 'VERIFY_HASH',
    entity: 'MedicalRecord',
    entityId: record._id,
    details: `Hash check ${verified ? 'PASSED' : 'FAILED'}: ${actualHash}`,
  });

  res.json({
    recordId: record._id,
    verified,
    actualHash,
    expectedHash,
    verificationStatus: record.verificationStatus,
    timestamp: new Date().toISOString(),
  });
});

// FR-07 (providers only)
export const deleteRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findByIdAndDelete(req.params.id);
  if (!record) throw new HttpError(404, 'Record not found');

  await logAudit(req, {
    action: 'DELETE',
    entity: 'MedicalRecord',
    entityId: record._id,
    details: `${record.category}: ${record.title}`,
  });
  res.json({ message: 'Record deleted' });
});
