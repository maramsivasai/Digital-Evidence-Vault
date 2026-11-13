import mongoose from "mongoose";
import { randomUUID } from "crypto";

const evidenceSchema = new mongoose.Schema(
  {
    evidenceId: {
      type: String,
      default: () => randomUUID(),
      unique: true,
      required: true
    },

    caseId: {
      type: String,
      required: true,
      index: true
    },

    storageName: {
      type: String,
      required: true
    },

    sha256Hash: {
      type: String,
      required: true
    },

    uploadedBy: {
      type: String,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

const Evidence = mongoose.model("Evidence", evidenceSchema);

export default Evidence;