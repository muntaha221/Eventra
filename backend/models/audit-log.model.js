const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        actorEmail: {
            type: String,
            default: "system"
        },
        action: {
            type: String,
            required: true,
            enum: [
                "USER_REGISTER",
                "USER_LOGIN",
                "PLAN_UPGRADE",
                "TEAM_INVITE",
                "EVENT_CREATE",
                "EVENT_DELETE",
                "BOOKING_CANCEL",
                "BOOKING_CHECKIN",
                "BOOKING_PAID",
                "ACCOUNT_DELETE"
            ]
        },
        targetId: {
            type: String,
            default: null
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ actorId: 1, timestamp: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
