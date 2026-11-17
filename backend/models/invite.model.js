const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, lowercase: true, trim: true },
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true
        },
        role: {
            type: String,
            enum: ["ORG_MEMBER"],
            default: "ORG_MEMBER"
        },
        token: { type: String, required: true, unique: true },
        expiresAt: { type: Date, required: true },
        status: {
            type: String,
            enum: ["pending", "accepted", "expired"],
            default: "pending"
        },
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Invite", inviteSchema);
