import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  seq: { type: Number, required: true, unique: true }, // position in the hash chain
  action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
  entity: { type: String, required: true }, // e.g. "MedicalRecord"
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorRole: { type: String, required: true },
  details: { type: String, default: '' }, // short, non-sensitive summary
  timestamp: { type: Date, required: true },
  prevHash: { type: String, required: true },
  hash: { type: String, required: true },
});

// Audit entries are append-only: block updates and deletes through Mongoose.
const blocked = function (next) {
  next(new Error('Audit logs are append-only'));
};
['updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndDelete', 'deleteOne', 'deleteMany', 'findOneAndReplace'].forEach(
  (op) => auditLogSchema.pre(op, blocked)
);

export default mongoose.model('AuditLog', auditLogSchema);
