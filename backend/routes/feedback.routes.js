const express = require("express");
const Feedback = require("../models/feedback.model");
const authMiddleware = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const router = express.Router();

/**
 * POST /api/feedback
 * Public — anyone can submit feedback or a complaint.
 */
router.post("/", async (req, res) => {
    try {
        const { name, email, type, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and message are required."
            });
        }

        if (message.length < 10) {
            return res.status(400).json({
                success: false,
                message: "Message must be at least 10 characters."
            });
        }

        const feedback = await Feedback.create({ name, email, type, message });

        res.status(201).json({
            success: true,
            message: "Thank you for your feedback. We will review it shortly.",
            data: { id: feedback._id }
        });
    } catch (error) {
        // Handle mongoose validation errors cleanly
        if (error.name === "ValidationError") {
            const msg = Object.values(error.errors).map((e) => e.message).join(", ");
            return res.status(400).json({ success: false, message: msg });
        }
        res.status(500).json({ success: false, message: "Server error. Please try again." });
    }
});

/**
 * GET /api/feedback
 * Protected — SUPER_ADMIN only. View all submissions with optional status filter.
 */
router.get(
    "/",
    authMiddleware,
    authorize("SUPER_ADMIN"),
    async (req, res) => {
        try {
            const { status, type, page = 1, limit = 20 } = req.query;
            const filter = {};
            if (status) filter.status = status;
            if (type) filter.type = type;

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const [submissions, total] = await Promise.all([
                Feedback.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                Feedback.countDocuments(filter)
            ]);

            res.json({
                success: true,
                data: submissions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

/**
 * PATCH /api/feedback/:id/resolve
 * Protected — SUPER_ADMIN only. Mark a submission as resolved.
 */
router.patch(
    "/:id/resolve",
    authMiddleware,
    authorize("SUPER_ADMIN"),
    async (req, res) => {
        try {
            const feedback = await Feedback.findByIdAndUpdate(
                req.params.id,
                { status: "RESOLVED" },
                { new: true }
            );
            if (!feedback) {
                return res.status(404).json({ success: false, message: "Feedback not found." });
            }
            res.json({ success: true, data: feedback });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

module.exports = router;

