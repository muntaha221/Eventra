const express = require("express");
const eventService = require("../services/event.service");
const authMiddleware = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { attachTenant } = require("../middleware/tenant.middleware");
const { checkPlanLimit } = require("../middleware/plan.middleware");
const upload = require("../middleware/upload.middleware");
const router = express.Router();

// Public: browse all events across all organizations
router.get("/", async (req, res) => {
    try {
        res.set("Cache-Control", "public, s-maxage=10, stale-while-revalidate=30");
        const result = await eventService.getAllEvents(req.query);
        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Organization-scoped: list events belonging to caller's org
router.get(
    "/org/my-events",
    authMiddleware,
    authorize("ORG_OWNER", "ORG_MEMBER"),
    attachTenant,
    async (req, res) => {
        try {
            const result = await eventService.getAllEvents(req.query, req.organizationId);
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

// Public: single event details
router.get("/:id", async (req, res) => {
    try {
        res.set("Cache-Control", "public, s-maxage=10, stale-while-revalidate=30");
        const event = await eventService.getEventById(req.params.id);
        res.json({ success: true, data: event });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
});

// Organization: create event (enforces tenant scope + plan limits)
router.post(
    "/",
    authMiddleware,
    authorize("ORG_OWNER", "ORG_MEMBER"),
    attachTenant,
    checkPlanLimit("events"),
    async (req, res) => {
        try {
            const event = await eventService.createEvent(
                req.user.userId,
                req.organizationId,
                req.body
            );
            res.status(201).json({ success: true, message: "Event created", data: event });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
);

// Organization: update event (scoped to org)
router.put(
    "/:id",
    authMiddleware,
    authorize("ORG_OWNER", "ORG_MEMBER"),
    attachTenant,
    async (req, res) => {
        try {
            const event = await eventService.updateEvent(
                req.params.id,
                req.organizationId,
                req.body
            );
            res.json({ success: true, message: "Event updated", data: event });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
);

// Organization: delete event (ORG_OWNER or ORG_MEMBER, strictly scoped to org)
router.delete(
    "/:id",
    authMiddleware,
    authorize("ORG_OWNER", "ORG_MEMBER"),
    attachTenant,
    async (req, res) => {
        try {
            const result = await eventService.deleteEvent(
                req.params.id,
                req.organizationId
            );
            res.json({ success: true, message: result.message });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
);

// Organization: upload image
router.post(
    "/:id/image",
    authMiddleware,
    authorize("ORG_OWNER", "ORG_MEMBER"),
    attachTenant,
    upload.single("image"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: "No file uploaded" });
            }
            const event = await eventService.updateEventImage(
                req.params.id,
                req.organizationId,
                req.file.buffer
            );
            res.json({
                success: true,
                message: "Image uploaded",
                data: event.image
            });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
);

module.exports = router;
