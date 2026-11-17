const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
    {
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            unique: true
        },
        stripeSubscriptionId: { type: String, default: null },
        status: {
            type: String,
            enum: ["active", "canceled", "past_due", "trialing", "incomplete"],
            default: "active"
        },
        planTier: {
            type: String,
            enum: ["FREE", "PRO"],
            default: "FREE"
        },
        currentPeriodEnd: { type: Date, default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
