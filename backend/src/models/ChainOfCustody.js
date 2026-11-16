import mongoose from "mongoose";
import { randomUUID } from "crypto";

const chainOfCustodySchema = new mongoose.Schema(
  {
    custodyId: {
      type: String,
      default: () => randomUUID(),
      unique: true,
      required: true
    },

    evidenceId: {
      type: String,
      ref: "Evidence",
      required: true,
      index: true
    },

    caseId: {
      type: String,
      required: true,
      index: true
    },

    eventType: {
      type: String,
      required: true,
      trim: true
    },

    eventDate: {
      type: Date,
      required: true,
      default: Date.now
    },

    responsibleUser: {
      type: String,
      ref: "User",
      required: true
    },

    transferredFrom: {
      type: String,
      ref: "User",
      default: null
    },

    transferredTo: {
      type: String,
      ref: "User",
      default: null
    },

    purpose: {
      type: String,
      required: true,
      trim: true
    },

    details: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

const ChainOfCustody = mongoose.model(
  "ChainOfCustody",
  chainOfCustodySchema
);

export default ChainOfCustody;