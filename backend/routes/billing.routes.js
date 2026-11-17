const express = require("express");
const billingService = require("../services/billing.service");
const authMiddleware = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { attachTenant } = require("../middleware/tenant.middleware");
const router = express.Router();

/**
 * POST /api/billing/checkout
 * Generates a Stripe Checkout session URL for upgrading the organization to PRO
 */
router.post(
    "/checkout",
    authMiddleware,
    authorize("ORG_OWNER"),
    attachTenant,
    async (req, res) => {
        try {
            const session = await billingService.createCheckoutSession(
                req.organizationId,
                req.user
            );
            res.json({
                success: true,
                data: {
                    url: session.url,
                    sessionId: session.sessionId
                }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * GET /api/billing/portal
 * Creates a Stripe Customer Portal link for managing payment methods and cancelations
 */
router.get(
    "/portal",
    authMiddleware,
    authorize("ORG_OWNER"),
    attachTenant,
    async (req, res) => {
        try {
            const portal = await billingService.createPortalSession(req.organizationId);
            res.json({
                success: true,
                data: {
                    url: portal.url
                }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * POST /api/billing/webhook
 * Receives raw body events directly from Stripe
 */
router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        const signature = req.headers["stripe-signature"];

        try {
            const result = await billingService.handleWebhookEvent(req.body, signature);
            res.status(200).json(result);
        } catch (error) {
            console.error("Webhook processing error:", error.message);
            res.status(400).send(`Webhook Error: ${error.message}`);
        }
    }
);

module.exports = router;

