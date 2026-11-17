const Event = require("../models/event.model");
const Organization = require("../models/organization.model");

/**
 * Middleware to enforce plan limits on resources (e.g. events)
 * Free Tier: max 3 events
 * Pro Tier: unlimited events
 */
function checkPlanLimit(resource) {
    return async (req, res, next) => {
        try {
            if (req.user?.role === "SUPER_ADMIN") {
                return next();
            }

            const organizationId = req.organizationId;
            if (!organizationId) {
                return res.status(403).json({
                    success: false,
                    message: "No organization associated with this request."
                });
            }

            const org = await Organization.findById(organizationId);
            if (!org) {
                return res.status(404).json({
                    success: false,
                    message: "Organization not found."
                });
            }

            if (resource === "events") {
                if (org.planTier === "FREE") {
                    const eventCount = await Event.countDocuments({ organization: organizationId });
                    const FREE_TIER_EVENT_LIMIT = 3;

                    if (eventCount >= FREE_TIER_EVENT_LIMIT) {
                        return res.status(403).json({
                            success: false,
                            code: "UPGRADE_REQUIRED",
                            message: `Free plan limit reached (${FREE_TIER_EVENT_LIMIT} events max). Please upgrade to Pro for unlimited events.`
                        });
                    }
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

module.exports = { checkPlanLimit };
