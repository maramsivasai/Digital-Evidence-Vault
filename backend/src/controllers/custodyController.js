import ChainOfCustody from "../models/ChainOfCustody.js";
import Evidence from "../models/Evidence.js";
import User from "../models/User.js";
import logAuditEvent from "../services/auditService.js";

// POST /api/custody
export const recordCustody = async (req, res, next) => {
  try {
    const {
      evidenceId,
      eventType,
      transferredTo,
      purpose,
      details
    } = req.body;

    if (
      typeof evidenceId !== "string" ||
      !evidenceId.trim() ||
      typeof eventType !== "string" ||
      !eventType.trim() ||
      typeof purpose !== "string" ||
      !purpose.trim() ||
      typeof details !== "string" ||
      !details.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Evidence ID, event type, purpose and details are required"
      });
    }

    const evidence = await Evidence.findOne({
      evidenceId: evidenceId.trim()
    });

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: "Evidence record not found"
      });
    }

    const isTransfer = eventType.trim().toUpperCase() === "TRANSFERRED";

    let recipient = null;

    if (isTransfer) {
      if (
        typeof transferredTo !== "string" ||
        !transferredTo.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Recipient user ID is required for a transfer"
        });
      }

      recipient = await User.findOne({
        userId: transferredTo.trim(),
        isActive: true
      });

      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: "Active recipient user not found"
        });
      }

      if (recipient.userId === req.user.userId) {
        return res.status(400).json({
          success: false,
          message: "Evidence cannot be transferred to the same user"
        });
      }
    }

    const custodyRecord = await ChainOfCustody.create({
      evidenceId: evidence.evidenceId,
      caseId: evidence.caseId,
      eventType: eventType.trim(),
      eventDate: new Date(),
      responsibleUser: req.user.userId,
      transferredFrom: isTransfer ? req.user.userId : null,
      transferredTo: isTransfer ? recipient.userId : null,
      purpose: purpose.trim(),
      details: details.trim()
    });

    await logAuditEvent({
      actorUserId: req.user.userId,
      eventType: "CUSTODY_RECORDED",
      affectedRecordType: "ChainOfCustody",
      affectedRecordId: custodyRecord.custodyId,
      caseId: evidence.caseId,
      evidenceId: evidence.evidenceId,
      details: `Custody event '${custodyRecord.eventType}' recorded for evidence ${evidence.evidenceId}`
    });

    return res.status(201).json({
      success: true,
      message: "Chain of custody record created successfully",
      custody: custodyRecord
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/custody/:evidenceId
export const getCustodyHistory = async (req, res, next) => {
  try {
    const evidence = await Evidence.findOne({
      evidenceId: req.params.evidenceId
    });

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: "Evidence record not found"
      });
    }

    const records = await ChainOfCustody.find({
      evidenceId: evidence.evidenceId
    }).sort({
      eventDate: 1,
      createdAt: 1
    });

    return res.status(200).json({
      success: true,
      evidenceId: evidence.evidenceId,
      caseId: evidence.caseId,
      count: records.length,
      custodyHistory: records
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/custody/case/:caseId
export const getCaseCustodyHistory = async (req, res, next) => {
  try {
    const records = await ChainOfCustody.find({
      caseId: req.params.caseId
    }).sort({
      eventDate: 1,
      createdAt: 1
    });

    return res.status(200).json({
      success: true,
      caseId: req.params.caseId,
      count: records.length,
      custodyHistory: records
    });
  } catch (error) {
    next(error);
  }
};