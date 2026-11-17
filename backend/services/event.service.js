const Event = require("../models/event.model");
const Organization = require("../models/organization.model");
const bookingService = require("./booking.service");
const ticketService = require("./ticket.service");

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function createEvent(userId, organizationId, data) {
    const { title, description, category, date, location } = data;

    if (!title) throw new Error("Title is required");
    if (!description) throw new Error("Description is required");
    if (!date) throw new Error("Date is required");
    if (!location) throw new Error("Location is required");
    if (!organizationId) throw new Error("Organization is required to create an event");

    const event = await Event.create({
        title: title.trim(),
        description: description.trim(),
        category: category || "Other",
        date: new Date(date),
        location: location.trim(),
        createdBy: userId,
        organization: organizationId
    });

    // Enterprise Audit Log
    const { logAuditAction } = require("./audit.service");
    logAuditAction({
        actorId: userId,
        action: "EVENT_CREATE",
        targetId: event._id,
        metadata: { title: event.title, organizationId }
    });

    return event;
}

/**
 * Fetch events.
 * If organizationId is provided, scopes to that tenant (dashboard/management).
 * If organizationId is null, returns public events across all active orgs.
 */
async function getAllEvents(queryParams, organizationId = null) {
    let page = parseInt(queryParams.page) || 1;
    let limit = parseInt(queryParams.limit) || 10;
    const maxLimit = 100;
    if (limit > maxLimit) limit = maxLimit;
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;

    const filter = {};

    if (organizationId) {
        filter.organization = organizationId;
    }

    if (queryParams.category) {
        filter.category = queryParams.category;
    }

    if (queryParams.search) {
        const safe = escapeRegex(queryParams.search);
        filter.title = { $regex: safe, $options: "i" };
    }

    if (queryParams.dateFrom || queryParams.dateTo) {
        filter.date = {};
        if (queryParams.dateFrom) filter.date.$gte = new Date(queryParams.dateFrom);
        if (queryParams.dateTo) filter.date.$lte = new Date(queryParams.dateTo);
    }

    const sort = queryParams.sort ? { [queryParams.sort]: 1 } : { date: 1 };
    const skip = (page - 1) * limit;

    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name email")
        .populate("organization", "name slug planTier");

    const eventsWithStatus = events.map((e) => ({
        ...e.toObject(),
        isExpired: new Date(e.date) < new Date()
    }));

    const totalPages = Math.ceil(total / limit);

    return {
        data: eventsWithStatus,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    };
}

async function getEventById(eventId, organizationId = null) {
    const filter = { _id: eventId };
    if (organizationId) {
        filter.organization = organizationId;
    }

    const event = await Event.findOne(filter)
        .populate("createdBy", "name email")
        .populate("organization", "name slug planTier");

    if (!event) throw new Error("Event not found");

    const eventObj = event.toObject();
    eventObj.isExpired = new Date(event.date) < new Date();
    return eventObj;
}

async function updateEvent(eventId, organizationId, data) {
    const { title, description, category, date, location } = data;

    const updates = {};
    if (title) updates.title = title.trim();
    if (description) updates.description = description.trim();
    if (category) updates.category = category;
    if (date) updates.date = new Date(date);
    if (location) updates.location = location.trim();

    const event = await Event.findOneAndUpdate(
        { _id: eventId, organization: organizationId },
        updates,
        { new: true, runValidators: false }
    );

    if (!event) throw new Error("Event not found or access denied");
    return event;
}

async function deleteEvent(eventId, organizationId) {
    const event = await Event.findOne({ _id: eventId, organization: organizationId });
    if (!event) throw new Error("Event not found or access denied");

    const deletedBookings = await bookingService.deleteBookingsByEvent(eventId);
    const deletedTickets = await ticketService.deleteTicketsByEvent(eventId);

    await Event.findByIdAndDelete(eventId);

    // Enterprise Audit Log
    const { logAuditAction } = require("./audit.service");
    logAuditAction({
        action: "EVENT_DELETE",
        targetId: eventId,
        metadata: { title: event.title, organizationId }
    });

    return {
        message: `Event deleted. ${deletedBookings} booking(s) and ${deletedTickets} ticket type(s) also removed.`,
        deletedBookings,
        deletedTickets
    };
}

async function updateEventImage(eventId, organizationId, fileBuffer) {
    const event = await Event.findOne({ _id: eventId, organization: organizationId });
    if (!event) throw new Error("Event not found or access denied");

    if (!process.env.IMGBB_API_KEY || process.env.IMGBB_API_KEY === "PLACEHOLDER") {
        throw new Error("IMGBB_API_KEY is not configured in .env");
    }

    const formData = new FormData();
    formData.append("key", process.env.IMGBB_API_KEY);
    formData.append("image", fileBuffer.toString("base64"));

    const response = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: formData
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "ImgBB upload failed");
    }

    event.image = {
        url: result.data.url,
        publicId: result.data.id
    };

    await event.save();
    return event;
}

module.exports = {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    updateEventImage
};
