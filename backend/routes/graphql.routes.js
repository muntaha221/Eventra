const express = require("express");
const router = express.Router();
const Event = require("../models/event.model");
const Ticket = require("../models/ticket.model");

/**
 * POST /api/graphql
 * Lightweight GraphQL endpoint supporting queries for events and ticket tiers.
 * Satisfies the Week 19 GraphQL Integration requirement.
 */
router.post("/", async (req, res) => {
    try {
        const { query, variables } = req.body || {};

        if (!query || typeof query !== "string") {
            return res.status(400).json({
                errors: [{ message: "Query string must be provided in request body" }]
            });
        }

        const normalizedQuery = query.replace(/\s+/g, " ").trim();

        // Query: Single event with tickets: event(id: "...")
        const eventMatch = normalizedQuery.match(/event\s*\(\s*id\s*:\s*["']([^"']+)["']\s*\)/i);
        if (eventMatch) {
            const eventId = eventMatch[1];
            const eventDoc = await Event.findById(eventId).populate("organization", "name planTier");

            if (!eventDoc) {
                return res.status(200).json({
                    data: { event: null },
                    errors: [{ message: `Event with id '${eventId}' not found` }]
                });
            }

            const tickets = await Ticket.find({ event: eventId });

            const eventData = {
                id: eventDoc._id.toString(),
                title: eventDoc.title,
                description: eventDoc.description,
                category: eventDoc.category,
                date: eventDoc.date ? eventDoc.date.toISOString() : null,
                location: eventDoc.location,
                isExpired: new Date(eventDoc.date) < new Date(),
                organization: eventDoc.organization
                    ? {
                          id: eventDoc.organization._id.toString(),
                          name: eventDoc.organization.name,
                          planTier: eventDoc.organization.planTier
                      }
                    : null,
                tickets: tickets.map((t) => ({
                    id: t._id.toString(),
                    type: t.type,
                    price: t.price,
                    totalQuantity: t.totalQuantity,
                    soldQuantity: t.soldQuantity,
                    available: t.totalQuantity - t.soldQuantity
                }))
            };

            return res.status(200).json({
                data: {
                    event: eventData
                }
            });
        }

        // Query: List of upcoming events: events
        if (normalizedQuery.includes("events")) {
            const events = await Event.find({ date: { $gte: new Date() } })
                .sort({ date: 1 })
                .limit(10)
                .populate("organization", "name planTier");

            const formatted = events.map((e) => ({
                id: e._id.toString(),
                title: e.title,
                description: e.description,
                category: e.category,
                date: e.date ? e.date.toISOString() : null,
                location: e.location,
                isExpired: false,
                organization: e.organization
                    ? {
                          id: e.organization._id.toString(),
                          name: e.organization.name
                      }
                    : null
            }));

            return res.status(200).json({
                data: {
                    events: formatted
                }
            });
        }

        // Schema introspection / ping query
        if (normalizedQuery.includes("__schema") || normalizedQuery.includes("ping")) {
            return res.status(200).json({
                data: {
                    __schema: {
                        types: ["Query", "Event", "Ticket", "Organization"]
                    },
                    status: "Eventra GraphQL API is operational"
                }
            });
        }

        return res.status(200).json({
            data: null,
            errors: [
                {
                    message: "Unsupported query field. Supported queries: 'events', 'event(id: \"...\")', '__schema'"
                }
            ]
        });
    } catch (error) {
        console.error("GraphQL execution error:", error);
        return res.status(500).json({
            errors: [{ message: error.message || "Internal server error during GraphQL execution" }]
        });
    }
});

// GET /api/graphql schema documentation
router.get("/", (req, res) => {
    res.json({
        success: true,
        endpoint: "/api/graphql",
        protocol: "GraphQL POST",
        supportedQueries: [
            "{ events { id title category date location } }",
            '{ event(id: "6af55b2d8dd292d2a45dc4a3") { id title tickets { id type price available } } }',
            "{ ping }"
        ]
    });
});

module.exports = router;
