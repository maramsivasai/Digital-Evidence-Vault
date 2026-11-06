import mongoose from "mongoose";
import { randomUUID } from "crypto";

const userSchema = new mongoose.Schema(
    {
        // Common User attributes
        userId: {
            type: String,
            default: () => randomUUID(),
            unique: true,
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        passwordHash: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            enum: [
                "administrator",
                "investigation_officer",
                "forensic_analyst",
                "authorized_reviewer"
            ],
            required: true
        },

        // Forensic Analyst attributes
        analystId: {
            type: String,
            required: function () {
                return this.role === "forensic_analyst";
            }
        },

        specialization: {
            type: String,
            required: function () {
                return this.role === "forensic_analyst";
            },
            trim: true
        },

        // Investigation Officer attributes
        officerId: {
            type: String,
            required: function () {
                return this.role === "investigation_officer";
            }
        },

        department: {
            type: String,
            required: function () {
                return this.role === "investigation_officer";
            },
            trim: true
        },

        // Authorized Reviewer attributes
        reviewerId: {
            type: String,
            required: function () {
                return this.role === "authorized_reviewer";
            }
        },

        designation: {
            type: String,
            required: function () {
                return this.role === "authorized_reviewer";
            },
            trim: true
        },

        // Administrator attributes
        adminId: {
            type: String,
            required: function () {
                return this.role === "administrator";
            }
        },

        accessLevel: {
            type: String,
            required: function () {
                return this.role === "administrator";
            }
        },

        // Account status required by the SRS
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

export default User;