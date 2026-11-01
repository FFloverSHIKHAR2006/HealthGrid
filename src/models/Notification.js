import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', index: true },
    type: {
      type: String,
      enum: ['medication_due', 'appointment_upcoming', 'prescription_alert', 'system'],
      default: 'system',
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    priority: {
      type: String,
      enum: ['low', 'normal', 'urgent', 'critical'],
      default: 'normal',
    },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    reminder: { type: mongoose.Schema.Types.ObjectId, ref: 'Reminder' },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
