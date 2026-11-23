const express = require("express");
const router = express.Router();
const Event = require("../models/event.model");
const Booking = require("../models/booking.model");

/**
 * GET /api/cron/cleanup
 * Scheduled task (invoked daily via Vercel Cron or manual ping)
 * 1. Audits expired events
 * 2. Cleans up stale pending bookings older than 24 hours
 */
router.get("/cleanup", async (req, res) => {
    try {
        const now = new Date();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // 1. Audit expired events count
        const expiredCount = await Event.countDocuments({ date: { $lt: now } });

        // 2. Clean up / cancel stale unconfirmed bookings older than 24h
        const staleBookings = await Booking.updateMany(
            {
                status: "PENDING",
                createdAt: { $lt: yesterday }
            },
            {
                $set: { status: "CANCELLED" }
            }
        );

        return res.status(200).json({
            success: true,
            message: "Scheduled cron maintenance completed successfully",
            timestamp: now.toISOString(),
            metrics: {
                totalExpiredEventsAudited: expiredCount,
                staleBookingsCancelled: staleBookings.modifiedCount || 0
            }
        });
    } catch (error) {
        console.error("Cron execution error:", error);
        return res.status(500).json({
            success: false,
            message: "Cron job failed",
            error: error.message
        });
    }
});

module.exports = router;
