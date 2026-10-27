import AuditLog from '../models/AuditLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAuditChain } from '../services/audit.service.js';

// FR-08 (providers only)
export const listAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const [logs, total] = await Promise.all([
    AuditLog.find()
      .sort({ seq: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('actor', 'name role'),
    AuditLog.countDocuments(),
  ]);
  res.json({ page, limit, total, logs });
});

export const verifyAuditLogs = asyncHandler(async (req, res) => {
  res.json(await verifyAuditChain());
});
