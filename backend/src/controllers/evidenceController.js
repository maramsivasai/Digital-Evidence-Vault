import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import Evidence from "../models/Evidence.js";
import EvidenceMetadata from "../models/EvidenceMetadata.js";
import Case from "../models/Case.js";

import {
  calculateSHA256,
  encryptEvidence,
  decryptEvidence
} from "../utils/evidenceEncryption.js";

const STORAGE_DIR = path.resolve("storage");

// POST /api/evidence
export const uploadEvidence = async (req, res, next) => {
  let savedFilePath;
  let createdEvidence;

  try {
    const { caseId, description = "" } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a file to upload"
      });
    }

    if (typeof caseId !== "string" || !caseId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Case ID is required"
      });
    }

    if (typeof description !== "string") {
      return res.status(400).json({
        success: false,
        message: "Description must be a string"
      });
    }

    const existingCase = await Case.findOne({
      caseId: caseId.trim()
    });

    if (!existingCase) {
      return res.status(404).json({
        success: false,
        message: "Associated case not found"
      });
    }

    const originalBuffer = req.file.buffer;

    const sha256Hash = calculateSHA256(originalBuffer);

    const encryptedBuffer = encryptEvidence(originalBuffer);

    await fs.mkdir(STORAGE_DIR, { recursive: true });

    const storageName = `${randomUUID()}.enc`;

    savedFilePath = path.join(STORAGE_DIR, storageName);

    await fs.writeFile(savedFilePath, encryptedBuffer, {
      flag: "wx"
    });

    createdEvidence = await Evidence.create({
      caseId: existingCase.caseId,
      storageName,
      sha256Hash,
      uploadedBy: req.user.userId
    });

    await EvidenceMetadata.create({
      evidenceId: evidence.evidenceId,
      originalFileName: path.basename(req.file.originalname),
      mimeType: req.file.mimetype || "application/octet-stream",
      fileSize: req.file.size,
      description: description.trim(),
      uploadedBy: req.user.userId
    });

    return res.status(201).json({
      success: true,
      message: "Evidence uploaded and stored successfully",
      evidence: {
        evidenceId: evidence.evidenceId,
        caseId: evidence.caseId,
        originalFileName: path.basename(req.file.originalname),
        sha256Hash: evidence.sha256Hash,
        uploadedBy: evidence.uploadedBy,
        createdAt: evidence.createdAt
      }
    });
  } catch (error) {
    if (createdEvidence) {
      await Evidence.deleteOne({
        evidenceId: createdEvidence.evidenceId
      }).catch(() => { });
    }

    if (savedFilePath) {
      await fs.unlink(savedFilePath).catch(() => { });
    }

    next(error);
  }
};

// GET /api/evidence
export const getEvidence = async (req, res, next) => {
  try {
    const { evidenceId, caseId, fileName } = req.query;

    const filter = {};

    if (evidenceId) {
      filter.evidenceId = evidenceId;
    }

    if (caseId) {
      filter.caseId = caseId;
    }

    const records = await Evidence.find(filter).sort({
      createdAt: -1
    });

    const metadataRecords = await EvidenceMetadata.find({
      evidenceId: { $in: records.map(item => item.evidenceId) }
    });

    const metadataMap = new Map(
      metadataRecords.map(item => [item.evidenceId, item])
    );

    let results = records.map(item => ({
      evidenceId: item.evidenceId,
      caseId: item.caseId,
      sha256Hash: item.sha256Hash,
      uploadedBy: item.uploadedBy,
      createdAt: item.createdAt,
      metadata: metadataMap.get(item.evidenceId) || null
    }));

    if (fileName) {
      const search = String(fileName).toLowerCase();

      results = results.filter(item =>
        item.metadata?.originalFileName
          ?.toLowerCase()
          .includes(search)
      );
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      evidence: results
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/evidence/:evidenceId
export const getEvidenceById = async (req, res, next) => {
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

    const metadata = await EvidenceMetadata.findOne({
      evidenceId: evidence.evidenceId
    });

    return res.status(200).json({
      success: true,
      evidence: {
        evidenceId: evidence.evidenceId,
        caseId: evidence.caseId,
        sha256Hash: evidence.sha256Hash,
        uploadedBy: evidence.uploadedBy,
        createdAt: evidence.createdAt,
        updatedAt: evidence.updatedAt,
        metadata
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/evidence/:evidenceId/download
export const downloadEvidence = async (req, res, next) => {
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

    const metadata = await EvidenceMetadata.findOne({
      evidenceId: evidence.evidenceId
    });

    if (!metadata) {
      return res.status(404).json({
        success: false,
        message: "Evidence metadata not found"
      });
    }

    const filePath = path.join(STORAGE_DIR, evidence.storageName);

    const encryptedBuffer = await fs.readFile(filePath);
    const originalBuffer = decryptEvidence(encryptedBuffer);

    res.setHeader(
      "Content-Type",
      metadata.mimeType
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(metadata.originalFileName)}`
    );

    res.setHeader(
      "Content-Length",
      originalBuffer.length
    );

    return res.status(200).send(originalBuffer);
  } catch (error) {
    next(error);
  }
};

// POST /api/evidence/:evidenceId/verify
export const verifyEvidenceIntegrity = async (req, res, next) => {
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

    const filePath = path.join(STORAGE_DIR, evidence.storageName);

    const encryptedBuffer = await fs.readFile(filePath);

    const originalBuffer = decryptEvidence(encryptedBuffer);

    const currentHash = calculateSHA256(originalBuffer);

    const isIntegrityValid = currentHash === evidence.sha256Hash;

    return res.status(200).json({
      success: true,
      evidenceId: evidence.evidenceId,
      integrityVerified: isIntegrityValid,
      message: isIntegrityValid
        ? "Evidence integrity verified successfully"
        : "Evidence integrity verification failed",
      originalHash: evidence.sha256Hash,
      currentHash
    });
  } catch (error) {
    next(error);
  }
};