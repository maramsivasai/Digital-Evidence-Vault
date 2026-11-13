import mongoose from "mongoose";

const evidenceMetadataSchema = new mongoose.Schema(
  {
    evidenceId: {
      type: String,
      ref: "Evidence",
      required: true,
      unique: true
    },

    originalFileName: {
      type: String,
      required: true
    },

    mimeType: {
      type: String,
      required: true
    },

    fileSize: {
      type: Number,
      required: true
    },

    description: {
      type: String,
      default: "",
      trim: true
    },

    uploadedBy: {
      type: String,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

const EvidenceMetadata = mongoose.model(
  "EvidenceMetadata",
  evidenceMetadataSchema
);

export default EvidenceMetadata;