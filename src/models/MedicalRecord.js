import mongoose from 'mongoose';

export const RECORD_CATEGORIES = [
  'lab',
  'diagnosis',
  'prescription',
  'imaging',
  'immunization',
  'surgery',
  'discharge',
  'facility',
  'other',
];

const observationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    unit: { type: String, default: '', trim: true },
    referenceRange: { type: String, default: '', trim: true },
    flag: {
      type: String,
      enum: ['normal', 'high', 'low', 'abnormal', 'critical', null, ''],
      default: null,
    },
    interpretation: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    category: {
      type: String,
      enum: RECORD_CATEGORIES,
      required: true,
      lowercase: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    date: { type: Date, required: true }, // Main chronological anchor (encounterDate or reportDate)
    encounterDate: { type: Date },
    reportDate: { type: Date },
    facility: { type: String, trim: true, maxlength: 200 },
    details: { type: String, trim: true, maxlength: 5000 },
    clinicalSummary: { type: String, trim: true, maxlength: 5000 },
    source: { type: String, enum: ['manual', 'scanner'], default: 'manual' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Structured Clinical Extraction
    patientMetadata: {
      name: { type: String, trim: true },
      identifier: { type: String, trim: true },
      age: { type: Number },
      gender: { type: String, trim: true },
    },
    clinician: { type: String, trim: true, maxlength: 200 },
    department: { type: String, trim: true, maxlength: 200 },
    encounterType: { type: String, trim: true, maxlength: 100 },
    labNumber: { type: String, trim: true, maxlength: 100 },

    observations: { type: [observationSchema], default: [] },
    structuredData: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Cryptographic Document Integrity
    documentHash: { type: String, trim: true, index: true },
    hashAlgorithm: { type: String, default: 'SHA-256' },
    verificationStatus: {
      type: String,
      enum: ['VERIFIED', 'UNVERIFIED', 'FAILED'],
      default: 'UNVERIFIED',
    },
    originalFile: {
      url: { type: String },
      filename: { type: String },
      mimeType: { type: String },
      size: { type: Number },
      dataUrl: { type: String },
    },
    rawOcrText: { type: String },
  },
  { timestamps: true }
);

medicalRecordSchema.index({ patient: 1, date: -1 });
medicalRecordSchema.index({ patient: 1, category: 1 });

export default mongoose.model('MedicalRecord', medicalRecordSchema);
