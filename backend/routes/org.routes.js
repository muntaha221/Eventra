const express = require("express");
const inviteService = require("../services/invite.service");
const authMiddleware = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { attachTenant } = require("../middleware/tenant.middleware");
const { REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS } = require("../config/tokens");
const router = express.Router();

/**
 * POST /api/orgs/invite
 * Send a team member invitation (ORG_OWNER only)
 */
router.post(
    "/invite",
    authMiddleware,
    authorize("ORG_OWNER"),
    attachTenant,
    async (req, res) => {
        try {
            const result = await inviteService.inviteMember(
                req.organizationId,
                req.user,
                req.body
            );
            res.status(201).json({
                success: true,
                message: result.message,
                data: result.invite
            });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
);

/**
 * GET /api/orgs/invites
 * List pending and sent invites for current org
 */
router.get(
    "/invites",
    authMiddleware,
    authorize("ORG_OWNER"),
    attachTenant,
    async (req, res) => {
        try {
            const invites = await inviteService.getOrgInvites(req.organizationId);
            res.json({ success: true, data: invites });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

/**
 * GET /api/orgs/join/:token
 * Preview organization info for the invited user
 */
router.get("/join/:token", async (req, res) => {
    try {
        const invite = await inviteService.getInviteByToken(req.params.token);
        res.json({
            success: true,
            data: {
                email: invite.email,
                role: invite.role,
                organization: invite.organization
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/orgs/join/:token
 * Accept invite and create/join user account as ORG_MEMBER
 * Body: { name, password }
 */
router.post("/join/:token", async (req, res) => {
    try {
        const { name, password } = req.body;
        const result = await inviteService.acceptInvite({
            token: req.params.token,
            name,
            password
        });

        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

        res.status(201).json({
            success: true,
            message: result.message,
            data: {
                user: result.user,
                accessToken: result.accessToken
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/orgs/bookings (Alias for organization attendee bookings)
 */
router.get(
    "/bookings",
    authMiddleware,
    authorize("ORG_OWNER", "ORG_MEMBER"),
    attachTenant,
    async (req, res) => {
        try {
            const bookingService = require("../services/booking.service");
            const result = await bookingService.getOrgBookings(req.organizationId, req.query);
            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

/**
 * PATCH /api/orgs/bookings/:id/cancel
 */
router.patch(
    "/bookings/:id/cancel",
    authMiddleware,
    authorize("ORG_OWNER", "ORG_MEMBER"),
    attachTenant,
    async (req, res) => {
        try {
            const bookingService = require("../services/booking.service");
            const booking = await bookingService.cancelOrgBooking(req.params.id, req.organizationId);
            res.json({
                success: true,
                message: "Booking cancelled and ticket inventory restored.",
                data: booking
            });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
);

module.exports = router;

