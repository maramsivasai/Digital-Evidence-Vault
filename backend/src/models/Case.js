import mongoose from "mongoose";
import { randomUUID } from "crypto";

const caseSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      default: () => randomUUID(),
      unique: true,
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      required: true
    },

    createdDate: {
      type: Date,
      default: Date.now,
      required: true
    },

    updatedDate: {
      type: Date,
      default: Date.now,
      required: true
    },

    assignedTo: [
      {
        type: String,
        ref: "User"
      }
    ],

    // Implementation field: identifies the case creator.
    createdBy: {
      type: String,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

const Case = mongoose.model("Case", caseSchema);

export default Case;