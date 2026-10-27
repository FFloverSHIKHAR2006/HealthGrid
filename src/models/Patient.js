import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    healthGridId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, trim: true },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    allergies: { type: [String], default: [] },
    emergencyContact: {
      name: { type: String, trim: true },
      relation: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    // Demonstration telemetry values (not live device data)
    telemetry: {
      heartRate: { type: Number, min: 0, max: 300 },
      bloodPressure: {
        systolic: { type: Number, min: 0, max: 300 },
        diastolic: { type: Number, min: 0, max: 200 },
      },
      glucose: { type: Number, min: 0, max: 1000 },
      hrv: { type: Number, min: 0, max: 500 },
    },
  },
  { timestamps: true }
);

patientSchema.index({ name: 1 });

export default mongoose.model('Patient', patientSchema);
