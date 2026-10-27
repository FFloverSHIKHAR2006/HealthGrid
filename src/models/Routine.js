import mongoose from 'mongoose';

const routineSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    schedule: { type: String, required: true, trim: true, maxlength: 200 }, // e.g. "08:00 daily"
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
  },
  { timestamps: true }
);

routineSchema.index({ patient: 1, createdAt: -1 });

export default mongoose.model('Routine', routineSchema);
