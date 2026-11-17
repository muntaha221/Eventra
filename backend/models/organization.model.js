const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        planTier: {
            type: String,
            enum: ["FREE", "PRO"],
            default: "FREE"
        },
        stripeCustomerId: { type: String, default: null },
        stripeAccountId: { type: String, default: null },
        stripeAccountStatus: {
            type: String,
            enum: ["NOT_CONNECTED", "PENDING", "CONNECTED"],
            default: "NOT_CONNECTED"
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

// Database Indexing (ESR Rule)
organizationSchema.index({ stripeAccountId: 1 });

module.exports = mongoose.model("Organization", organizationSchema);
