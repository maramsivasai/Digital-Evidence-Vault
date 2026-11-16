import AuditLog from "../models/AuditLog.js";

const logAuditEvent = async ({
  actorUserId,
  eventType,
  affectedRecordType,
  affectedRecordId,
  caseId = null,
  evidenceId = null,
  details
}) => {
  if (
    !actorUserId ||
    !eventType ||
    !affectedRecordType ||
    !affectedRecordId ||
    !details
  ) {
    throw new Error("Required audit information is missing");
  }

  return AuditLog.create({
    actorUserId,
    eventType,
    affectedRecordType,
    affectedRecordId,
    caseId,
    evidenceId,
    details,
    eventDate: new Date()
  });
};

export default logAuditEvent;