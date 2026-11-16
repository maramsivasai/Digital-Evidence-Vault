import mongoose from "mongoose";
import { randomUUID } from "crypto";

const auditLogSchema = new mongoose.Schema(
  {
    auditId: {
      type: String,
      default: () => randomUUID(),
      unique: true,
      required: true
    },

    actorUserId: {
      type: String,
      ref: "User",
      required: true,
      index: true
    },

    eventType: {
      type: String,
      required: true,
      index: true
    },

    affectedRecordType: {
      type: String,
      required: true
    },

    affectedRecordId: {
      type: String,
      required: true,
      index: true
    },

    caseId: {
      type: String,
      default: null,
      index: true
    },

    evidenceId: {
      type: String,
      default: null,
      index: true
    },

    details: {
      type: String,
      required: true
    },

    eventDate: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true
    }
  },
  { timestamps: true }
);

// Prevent ordinary application-level update/delete operations.
const immutableOperations = [
  "updateOne",
  "updateMany",
  "findOneAndUpdate",
  "replaceOne",
  "deleteOne",
  "deleteMany",
  "findOneAndDelete"
];

auditLogSchema.pre("save", function () {
  if (!this.isNew) {
    throw new Error("Existing audit records cannot be modified");
  }
});

auditLogSchema.pre(immutableOperations, function () {
  throw new Error("Audit records cannot be modified or deleted");
});

auditLogSchema.pre("deleteOne", { document: true, query: false }, function () {
  throw new Error("Audit records cannot be modified or deleted");
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;