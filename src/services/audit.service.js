import crypto from 'crypto';
import AuditLog from '../models/AuditLog.js';

export const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

/**
 * Hash of one audit entry. Fields included (in this exact order):
 * prevHash, seq, action, entity, entityId, actor, actorRole, details, timestamp(ISO)
 */
export const computeAuditHash = (e) =>
  sha256(
    JSON.stringify([
      e.prevHash,
      e.seq,
      e.action,
      e.entity,
      String(e.entityId),
      String(e.actor),
      e.actorRole,
      e.details || '',
      new Date(e.timestamp).toISOString(),
    ])
  );

// Serialises writes so the hash chain stays consistent (single server process).
let queue = Promise.resolve();

export const logAudit = (req, { action, entity, entityId, details = '', actor, actorRole }) => {
  const run = queue.then(async () => {
    const last = await AuditLog.findOne().sort({ seq: -1 }).lean();
    const resolvedActor = actor || req.user?._id || entityId;
    const resolvedRole = actorRole || req.user?.role || 'user';
    const entry = {
      seq: last ? last.seq + 1 : 1,
      action,
      entity,
      entityId,
      actor: resolvedActor,
      actorRole: resolvedRole,
      details: String(details).slice(0, 300),
      timestamp: new Date(),
      prevHash: last ? last.hash : 'GENESIS',
    };
    entry.hash = computeAuditHash(entry);
    return AuditLog.create(entry);
  });
  queue = run.catch(() => {});
  return run;
};

/** Recomputes the whole chain and reports the first broken entry, if any. */
export const verifyAuditChain = async () => {
  let prevHash = 'GENESIS';
  let expectedSeq = 1;
  let checked = 0;
  for await (const log of AuditLog.find().sort({ seq: 1 }).lean().cursor()) {
    const ok =
      log.seq === expectedSeq && log.prevHash === prevHash && log.hash === computeAuditHash(log);
    if (!ok) return { valid: false, checked, brokenAtSeq: log.seq };
    prevHash = log.hash;
    expectedSeq += 1;
    checked += 1;
  }
  return { valid: true, checked, brokenAtSeq: null };
};
