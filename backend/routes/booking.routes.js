const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const bookingService = require("../services/booking.service");
const authMiddleware = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { attachTenant } = require("../middleware/tenant.middleware");
const router = express.Router();

// Helper: Optional authentication (supports both public guests and logged-in users)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select("email name role organization");
            if (user) {
                req.user = {
                    userId: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    organizationId: user.organization ? user.organization.toString() : null
                };
            }
        }
    } catch (e) {
        // Optional auth: continue without req.user for guests
    }
    next();
};

/**
 * Public & Authenticated: Create a booking (Pay at Venue model)
 * Accepts { eventId, ticketId, quantity, name, email }
 */
router.post("/", optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || null;
        const booking = await bookingService.createBooking(userId, req.body);
        res.status(201).json({
            success: true,
            message: "Ticket reservation confirmed! Total is due at venue entrance.",
            data: booking
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * Scanner Check-in Endpoint: Verify QR code token and check in attendee
 */
router.post(
    "/verify-ticket",
    authMiddleware,
    authorize("ORG_OWNER", "ORG_MEMBER"),
    attachTenant,
    async (req, res) => {
        try {
            const token = req.body.qrCodeToken || req.body.token || req.body.bookingReference;
            const result = await bookingService.verifyTicket(token, req.organizationId, req.user);
            res.json({
                success: true,
                message: result.message,
                data: result.booking
            });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
);

/**
 * Manual Mark as Paid (Org Owner / Staff for direct bank transfers or early payments)
 */
router.patch(
    "/org/:id/mark-paid",
    authMiddleware,
    authorize("ORG_OWNER", "ORG_MEMBER"),
    attachTenant,
    async (req, res) => {
        try {
            const booking = await bookingService.markBookingPaid(req.params.id, req.organizationId, req.user);
            res.json({
                success: true,
                message: "Booking payment status updated to PAID.",
                data: booking
            });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
);

/**
 * User: view own bookings history
 */
router.get(
    "/my",
    authMiddleware,
    authorize("USER", "ORG_OWNER", "ORG_MEMBER", "SUPER_ADMIN"),
    async (req, res) => {
        try {
            const result = await bookingService.getUserBookings(req.user.userId, req.query);
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
 * Organization: view all attendee bookings strictly scoped to caller's organizationId
 */
router.get(
    "/org",
    authMiddleware,
    authorize("ORG_OWNER", "ORG_MEMBER"),
    attachTenant,
    async (req, res) => {
        try {
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
 * Organization: Cancel booking & restore ticket stock (strictly scoped to organizationId)
 */
router.patch(
    "/org/:id/cancel",
    authMiddleware,
    authorize("ORG_OWNER", "ORG_MEMBER"),
    attachTenant,
    async (req, res) => {
        try {
            const booking = await bookingService.cancelOrgBooking(req.params.id, req.organizationId, req.user);
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

/**
 * User: cancel own booking
 */
router.post(
    "/:id/cancel",
    authMiddleware,
    authorize("USER", "ORG_OWNER", "ORG_MEMBER"),
    async (req, res) => {
        try {
            const booking = await bookingService.cancelBooking(req.params.id, req.user.userId);
            res.json({
                success: true,
                message: "Booking cancelled",
                data: booking
            });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
);

module.exports = router;
