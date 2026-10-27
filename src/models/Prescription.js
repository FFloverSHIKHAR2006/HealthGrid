import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    medication: { type: String, required: true, trim: true, maxlength: 200 },
    dosage: { type: String, required: true, trim: true, maxlength: 100 },
    frequency: { type: String, trim: true, maxlength: 100 },
    duration: { type: String, trim: true, maxlength: 100 },
    instructions: { type: String, trim: true, maxlength: 1000 },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

prescriptionSchema.index({ patient: 1, issuedAt: -1 });

export default mongoose.model('Prescription', prescriptionSchema);
