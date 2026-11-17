const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/user.model");
const Event = require("../models/event.model");
const Ticket = require("../models/ticket.model");
const Booking = require("../models/booking.model");
const Organization = require("../models/organization.model");
const authMiddleware = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { attachTenant } = require("../middleware/tenant.middleware");
const router = express.Router();

/**
 * Organization Dashboard Stats (for ORG_OWNER / ORG_MEMBER)
 * Strictly scoped to req.organizationId
 */
router.get(
    "/org/stats",
    authMiddleware,
    authorize("ORG_OWNER", "ORG_MEMBER"),
    attachTenant,
    async (req, res) => {
        try {
            const orgId = req.organizationId;
            const orgObjectId = mongoose.Types.ObjectId.isValid(orgId)
                ? new mongoose.Types.ObjectId(orgId)
                : orgId;

            // Calculate total revenue and total tickets sold for this org's confirmed bookings
            const [aggregateResult, org] = await Promise.all([
                Booking.aggregate([
                    { $match: { organization: orgObjectId, status: "CONFIRMED" } },
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: "$totalPrice" },
                            totalTickets: { $sum: "$quantity" }
                        }
                    }
                ]),
                Organization.findById(orgId).select("name slug planTier createdAt")
            ]);

            const [eventsCount, membersCount, bookingsCount] = await Promise.all([
                Event.countDocuments({ organization: orgId }),
                User.countDocuments({ organization: orgId }),
                Booking.countDocuments({ organization: orgId, status: "CONFIRMED" })
            ]);

            const revenue = aggregateResult[0]?.totalRevenue || 0;
            const ticketsSold = aggregateResult[0]?.totalTickets || 0;

            res.json({
                success: true,
                data: {
                    organization: org,
                    stats: {
                        events: eventsCount,
                        members: membersCount,
                        bookings: bookingsCount,
                        ticketsSold,
                        revenue
                    }
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

/**
 * Organization Members List (for ORG_OWNER)
 */
router.get(
    "/org/members",
    authMiddleware,
    authorize("ORG_OWNER"),
    attachTenant,
    async (req, res) => {
        try {
            const members = await User.find({ organization: req.organizationId })
                .select("-password")
                .sort({ createdAt: -1 });

            res.json({ success: true, data: members });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

/**
 * Platform Stats (SUPER_ADMIN only)
 */
router.get(
    "/platform/stats",
    authMiddleware,
    authorize("SUPER_ADMIN"),
    async (req, res) => {
        try {
            const [orgs, users, events, bookings] = await Promise.all([
                Organization.countDocuments(),
                User.countDocuments(),
                Event.countDocuments(),
                Booking.countDocuments()
            ]);

            res.json({
                success: true,
                data: { orgs, users, events, bookings }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

/**
 * List all Organizations (SUPER_ADMIN only)
 */
router.get(
    "/platform/organizations",
    authMiddleware,
    authorize("SUPER_ADMIN"),
    async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const total = await Organization.countDocuments();
            const orgs = await Organization.find()
                .populate("createdBy", "name email")
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                data: orgs,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

/**
 * Audit Logs (SUPER_ADMIN only)
 * GET /api/admin/audit-logs
 */
router.get(
    "/audit-logs",
    authMiddleware,
    authorize("SUPER_ADMIN"),
    async (req, res) => {
        try {
            const auditService = require("../services/audit.service");
            const result = await auditService.getAuditLogs(req.query);
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

module.exports = router;
