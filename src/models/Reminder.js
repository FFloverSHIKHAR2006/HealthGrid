import mongoose from 'mongoose';

const adherenceEntrySchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['taken', 'skipped'], required: true },
    scheduledTime: { type: String, trim: true },
    note: { type: String, trim: true, maxlength: 200 },
  },
  { _id: true }
);

const reminderSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['medication', 'appointment'], default: 'medication', index: true },

    // Medication-specific fields
    title: { type: String, required: true, trim: true, maxlength: 200 },
    medication: { type: String, trim: true, maxlength: 200 },
    dosage: { type: String, trim: true, maxlength: 100 },
    frequency: { type: String, trim: true, maxlength: 100, default: 'daily' },
    time: { type: String, trim: true, maxlength: 20 }, // e.g. "08:00"
    times: [{ type: String, trim: true, maxlength: 20 }], // e.g. ["08:00", "20:00"]
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', index: true },
    instructions: { type: String, trim: true, maxlength: 1000 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    adherenceHistory: [adherenceEntrySchema],

    // Doctor appointment-specific fields
    doctorName: { type: String, trim: true, maxlength: 150 },
    specialty: { type: String, trim: true, maxlength: 100 },
    facility: { type: String, trim: true, maxlength: 200 },
    appointmentDate: { type: Date },
    appointmentTime: { type: String, trim: true, maxlength: 30 },
    reminderLeadTime: { type: String, trim: true, maxlength: 50, default: '1_day_before' },
    location: { type: String, trim: true, maxlength: 200 },
    notes: { type: String, trim: true, maxlength: 1000 },

    status: { type: String, enum: ['active', 'paused', 'completed', 'cancelled'], default: 'active', index: true },
  },
  { timestamps: true }
);

reminderSchema.index({ patient: 1, type: 1, status: 1 });
reminderSchema.index({ patient: 1, createdAt: -1 });

export default mongoose.model('Reminder', reminderSchema);
