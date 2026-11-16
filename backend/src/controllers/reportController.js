import Case from "../models/Case.js";
import Evidence from "../models/Evidence.js";
import EvidenceMetadata from "../models/EvidenceMetadata.js";
import ChainOfCustody from "../models/ChainOfCustody.js";
import AuditLog from "../models/AuditLog.js";
import logAuditEvent from "../services/auditService.js";

import { generateReportPDF } from "../services/reportService.js";

const sendReport = async (req, res, report) => {
  await logAuditEvent({
    actorUserId: req.user.userId,
    eventType: "REPORT_GENERATED",
    affectedRecordType: "REPORT",
    affectedRecordId: report.reference,
    caseId: report.caseId || null,
    evidenceId: report.evidenceId || null,
    details: `Report generated: ${report.reportType}`
  });

  if (req.query.format === "pdf") {
    const pdfBuffer = await generateReportPDF(report);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${report.fileName}"`
    );

    return res.status(200).send(pdfBuffer);
  }

  return res.status(200).json({
    success: true,
    message: "Report generated successfully",
    report
  });
};


const handleReportError = (res, error) => {
  console.error("Report generation error:", error);

  return res.status(500).json({
    success: false,
    message: "Unable to generate report"
  });
};

// 5.1 Generate Case Report
export const generateCaseReport = async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseRecord = await Case.findOne({ caseId }).lean();

    if (!caseRecord) {
      return res.status(404).json({
        success: false,
        message: "Case not found"
      });
    }

    const report = {
      reportType: "Case Report",
      reference: caseRecord.caseId,
      caseId: caseRecord.caseId,
      fileName: `case-report-${caseRecord.caseId}.pdf`,
      generatedAt: new Date(),
      generatedBy: {
        userId: req.user.userId,
        name: req.user.name
      },
      sections: [
        {
          heading: "Case Information",
          items: [
            { label: "Case ID", value: caseRecord.caseId },
            { label: "Title", value: caseRecord.title },
            { label: "Description", value: caseRecord.description },
            { label: "Status", value: caseRecord.status },
            { label: "Created By", value: caseRecord.createdBy },
            {
              label: "Assigned Personnel",
              value: (caseRecord.assignedTo || []).join(", ") || "Unassigned"
            },
            { label: "Created At", value: caseRecord.createdAt },
            { label: "Last Updated", value: caseRecord.updatedAt }
          ]
        }
      ]
    };

    return await sendReport(req, res, report);
  } catch (error) {
    return handleReportError(res, error);
  }
};

// 5.2 Generate Evidence Report
export const generateEvidenceReport = async (req, res) => {
  try {
    const { evidenceId } = req.params;

    const evidence = await Evidence.findOne({ evidenceId }).lean();

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: "Evidence not found"
      });
    }

    const metadata = await EvidenceMetadata.findOne({
      evidenceId
    }).lean();

    if (!metadata) {
      return res.status(404).json({
        success: false,
        message: "Evidence metadata not found"
      });
    }

    const report = {
      reportType: "Evidence Report",
      reference: evidence.evidenceId,
      caseId: evidence.caseId,
      evidenceId: evidence.evidenceId,
      fileName: `evidence-report-${evidence.evidenceId}.pdf`,
      generatedAt: new Date(),
      generatedBy: {
        userId: req.user.userId,
        name: req.user.name
      },
      sections: [
        {
          heading: "Evidence Information",
          items: [
            { label: "Evidence ID", value: evidence.evidenceId },
            { label: "Related Case ID", value: evidence.caseId },
            { label: "File Name", value: metadata.originalFileName },
            { label: "File Type", value: metadata.mimeType },
            { label: "File Size (bytes)", value: metadata.fileSize },
            { label: "Description", value: metadata.description },
            { label: "Uploaded By", value: metadata.uploadedBy },
            { label: "Upload Date", value: metadata.createdAt },
            { label: "SHA-256 Hash", value: evidence.sha256Hash }
          ]
        }
      ]
    };

    return await sendReport(req, res, report);
  } catch (error) {
    return handleReportError(res, error);
  }
};

// 5.3 Generate Custody Report
export const generateCustodyReport = async (req, res) => {
  try {
    const { caseId, evidenceId } = req.query;

    if (!caseId && !evidenceId) {
      return res.status(400).json({
        success: false,
        message: "Provide either caseId or evidenceId"
      });
    }

    let query;

    if (evidenceId) {
      const evidence = await Evidence.findOne({ evidenceId }).lean();

      if (!evidence) {
        return res.status(404).json({
          success: false,
          message: "Evidence not found"
        });
      }

      query = { evidenceId };
    } else {
      const caseRecord = await Case.findOne({ caseId }).lean();

      if (!caseRecord) {
        return res.status(404).json({
          success: false,
          message: "Case not found"
        });
      }

      query = { caseId };
    }

    const custodyRecords = await ChainOfCustody.find(query)
      .sort({ eventDate: 1, createdAt: 1 })
      .lean();

    const report = {
      reportType: "Chain of Custody Report",
      reference: evidenceId || caseId,
      caseId: caseId || null,
      evidenceId: evidenceId || null,
      fileName: `custody-report-${evidenceId || caseId}.pdf`,
      generatedAt: new Date(),
      generatedBy: {
        userId: req.user.userId,
        name: req.user.name
      },
      sections: [
        {
          heading: "Custody History",
          items: custodyRecords.map((record, index) => ({
            label: `Event ${index + 1}`,
            value: [
              `Evidence: ${record.evidenceId}`,
              `Event Type: ${record.eventType}`,
              `Date/Time: ${formatDateForReport(record.eventDate)}`,
              `Responsible User: ${record.responsibleUser}`,
              `Transferred From: ${record.transferredFrom || "N/A"}`,
              `Transferred To: ${record.transferredTo || "N/A"}`,
              `Purpose: ${record.purpose || "N/A"}`,
              `Details: ${record.details || "N/A"}`
            ].join(" | ")
          }))
        }
      ]
    };

    return await sendReport(req, res, report);
  } catch (error) {
    return handleReportError(res, error);
  }
};

const formatDateForReport = (value) => {
  return value ? new Date(value).toLocaleString() : "Not available";
};

// 5.4 Generate Audit Report
export const generateAuditReport = async (req, res) => {
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

    const query = {};

    if (eventType) query.eventType = eventType;
    if (actorUserId) query.actorUserId = actorUserId;
    if (affectedRecordType) query.affectedRecordType = affectedRecordType;
    if (affectedRecordId) query.affectedRecordId = affectedRecordId;
    if (caseId) query.caseId = caseId;
    if (evidenceId) query.evidenceId = evidenceId;

    if (startDate || endDate) {
      query.eventDate = {};

      if (startDate) {
        const start = new Date(startDate);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid startDate"
          });
        }

        query.eventDate.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid endDate"
          });
        }

        query.eventDate.$lte = end;
      }
    }

    const auditRecords = await AuditLog.find(query)
      .sort({ eventDate: -1 })
      .lean();

    const report = {
      reportType: "Audit Report",
      reference: caseId || evidenceId || "Filtered Audit Records",
      caseId: caseId || null,
      evidenceId: evidenceId || null,
      fileName: `audit-report-${Date.now()}.pdf`,
      generatedAt: new Date(),
      generatedBy: {
        userId: req.user.userId,
        name: req.user.name
      },
      sections: [
        {
          heading: "Audit Records",
          items: auditRecords.map((record, index) => ({
            label: `Activity ${index + 1}`,
            value: [
              `Actor: ${record.actorUserId}`,
              `Event: ${record.eventType}`,
              `Record Type: ${record.affectedRecordType}`,
              `Record ID: ${record.affectedRecordId}`,
              `Case ID: ${record.caseId || "N/A"}`,
              `Evidence ID: ${record.evidenceId || "N/A"}`,
              `Date/Time: ${formatDateForReport(record.eventDate)}`,
              `Details: ${JSON.stringify(record.details || {})}`
            ].join(" | ")
          }))
        }
      ]
    };

    return await sendReport(req, res, report);
  } catch (error) {
    return handleReportError(res, error);
  }
};