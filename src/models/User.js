import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['patient', 'provider'], required: true },
    // For patient users: the patient profile they own
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null, index: true },
    authProvider: { type: String, enum: ['local', 'google', 'microsoft'], default: 'local' },
    authProviderId: { type: String, default: null },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('User', userSchema);
