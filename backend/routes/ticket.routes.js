const express = require("express");
const ticketService = require("../services/ticket.service");
const authMiddleware = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { attachTenant } = require("../middleware/tenant.middleware");
const router = express.Router();

// Public: get tickets for an event
router.get("/event/:eventId", async (req, res) => {
    try {
        const tickets = await ticketService.getTicketsByEvent(req.params.eventId);
        res.json({ success: true, data: tickets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Organization: create ticket (tenant enforced)
router.post(
    "/",
    authMiddleware,
    authorize("ORG_OWNER", "ORG_MEMBER"),
    attachTenant,
    async (req, res) => {
        try {
            const ticket = await ticketService.createTicket(
                req.user.userId,
                req.organizationId,
                req.body
            );
            res.status(201).json({ success: true, message: "Ticket created", data: ticket });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
);

// Organization: update ticket
router.put(
    "/:id",
    authMiddleware,
    authorize("ORG_OWNER", "ORG_MEMBER"),
    attachTenant,
    async (req, res) => {
        try {
            const ticket = await ticketService.updateTicket(
                req.params.id,
                req.organizationId,
                req.body
            );
            res.json({ success: true, message: "Ticket updated", data: ticket });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
);

// Organization: delete ticket (ORG_OWNER or ORG_MEMBER)
router.delete(
    "/:id",
    authMiddleware,
    authorize("ORG_OWNER", "ORG_MEMBER"),
    attachTenant,
    async (req, res) => {
        try {
            const result = await ticketService.deleteTicket(
                req.params.id,
                req.organizationId
            );
            res.json({ success: true, message: result.message });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
);

module.exports = router;
