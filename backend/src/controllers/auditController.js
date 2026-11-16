import AuditLog from "../models/AuditLog.js";

// GET /api/audit
export const getAuditLogs = async (req, res, next) => {
  try {
    const {
      eventType,
      actorUserId,
      affectedRecordType,
      affectedRecordId,
      caseId,
      evidenceId,
      startDate,
      endDate
    } = req.query;

    const filter = {};

    if (eventType) filter.eventType = eventType;
    if (actorUserId) filter.actorUserId = actorUserId;
    if (affectedRecordType) {
      filter.affectedRecordType = affectedRecordType;
    }
    if (affectedRecordId) {
      filter.affectedRecordId = affectedRecordId;
    }
    if (caseId) filter.caseId = caseId;
    if (evidenceId) filter.evidenceId = evidenceId;

    if (startDate || endDate) {
      filter.eventDate = {};

      if (startDate) {
        const start = new Date(startDate);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date"
          });
        }

        filter.eventDate.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date"
          });
        }

        end.setHours(23, 59, 59, 999);
        filter.eventDate.$lte = end;
      }

      if (
        filter.eventDate.$gte &&
        filter.eventDate.$lte &&
        filter.eventDate.$gte > filter.eventDate.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "Start date cannot be after end date"
        });
      }
    }

    const auditLogs = await AuditLog.find(filter).sort({
      eventDate: -1
    });

    return res.status(200).json({
      success: true,
      count: auditLogs.length,
      auditLogs
    });
  } catch (error) {
    next(error);
  }
};