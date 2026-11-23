const { randomUUID } = require("crypto");
const qrcode = require("qrcode");
const Booking = require("../models/booking.model");
const Event = require("../models/event.model");
const Ticket = require("../models/ticket.model");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const emailService = require("./email.service");
const { logAuditAction } = require("./audit.service");

function generateBookingReference() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let ref = "EVT-";
    for (let i = 0; i < 6; i++) {
        ref += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return ref;
}

/**
 * Create a Booking (Pay at Venue model: No Stripe, instant stock lock, QR code generation)
 */
async function createBooking(userId, data) {
    const { eventId, ticketId, quantity, name, email } = data;

    if (!eventId) throw new Error("Event ID is required");
    if (!ticketId) throw new Error("Ticket ID is required");
    if (!quantity || quantity < 1) throw new Error("Quantity must be at least 1");

    // Resolve attendee name and email
    let attendeeName = (name || "").trim();
    let attendeeEmail = (email || "").trim().toLowerCase();

    let userDoc = null;
    if (userId) {
        userDoc = await User.findById(userId);
        if (userDoc) {
            if (!attendeeName) attendeeName = userDoc.name;
            if (!attendeeEmail) attendeeEmail = userDoc.email;
        }
    }

    if (!attendeeName) throw new Error("Attendee name is required");
    if (!attendeeEmail || !/^\S+@\S+\.\S+$/.test(attendeeEmail)) {
        throw new Error("A valid attendee email is required");
    }

    const event = await Event.findById(eventId);
    if (!event) throw new Error("Event not found");
    if (new Date(event.date) < new Date()) {
        throw new Error("This event has already passed and can no longer be booked");
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) throw new Error("Ticket not found");
    if (ticket.event.toString() !== eventId.toString()) {
        throw new Error("Ticket does not belong to this event");
    }

    // Atomic stock decrement to prevent overselling
    const updatedTicket = await Ticket.findOneAndUpdate(
        {
            _id: ticketId,
            $expr: {
                $lte: [{ $add: ["$soldQuantity", quantity] }, "$totalQuantity"]
            }
        },
        { $inc: { soldQuantity: quantity } },
        { returnDocument: "after" }
    );

    if (!updatedTicket) {
        throw new Error("Not enough tickets available for this tier");
    }

    const totalPrice = updatedTicket.price * quantity;

    // Generate guaranteed unique booking reference
    let bookingReference = generateBookingReference();
    let exists = await Booking.findOne({ bookingReference });
    while (exists) {
        bookingReference = generateBookingReference();
        exists = await Booking.findOne({ bookingReference });
    }

    // Generate unique QR Code token and Base64 QR code image
    const qrCodeToken = randomUUID();
    const qrCode = await qrcode.toDataURL(qrCodeToken, {
        width: 300,
        margin: 2,
        color: {
            dark: "#000000",
            light: "#ffffff"
        }
    });

    const booking = await Booking.create({
        user: userId || null,
        attendeeName,
        attendeeEmail,
        bookingReference,
        qrCodeToken,
        qrCode,
        paymentStatus: "PENDING",
        checkInStatus: "PENDING",
        event: eventId,
        ticket: ticketId,
        organization: event.organization,
        quantity,
        totalPrice,
        status: "CONFIRMED"
    });

    // Send confirmation email with QR code
    emailService.sendBookingConfirmationEmail(
        { name: attendeeName, email: attendeeEmail },
        booking,
        event,
        updatedTicket
    );

    return booking;
}

/**
 * Verify and Check-in Ticket QR Code Scanner Logic
 */
async function verifyTicket(qrCodeToken, organizationId, staffUser = {}) {
    if (!qrCodeToken) {
        throw new Error("QR code token is required");
    }

    const tokenClean = qrCodeToken.trim();

    // Find the booking by qrCodeToken or bookingReference (supports manual reference fallback)
    const booking = await Booking.findOne({
        $or: [{ qrCodeToken: tokenClean }, { bookingReference: tokenClean.toUpperCase() }]
    })
        .populate("event", "title date location")
        .populate("ticket", "type price")
        .populate("organization", "name slug");

    if (!booking) {
        throw new Error("Invalid ticket code. No reservation found matching this token.");
    }

    // Verify tenant ownership
    if (booking.organization._id.toString() !== organizationId.toString()) {
        throw new Error("Access denied. This ticket belongs to another organization.");
    }

    // Check cancellation
    if (booking.status === "CANCELLED") {
        throw new Error("This ticket reservation was cancelled and is no longer valid.");
    }

    // Check previous check-in
    if (booking.checkInStatus === "CHECKED_IN") {
        const checkInTime = booking.checkedInAt
            ? new Date(booking.checkedInAt).toLocaleString()
            : "earlier";
        throw new Error(`Ticket already used and checked in at ${checkInTime}.`);
    }

    // Mark as checked in and paid (Pay at Venue verified)
    booking.checkInStatus = "CHECKED_IN";
    booking.paymentStatus = "PAID";
    booking.checkedInAt = new Date();
    await booking.save();

    // Log enterprise audit action
    await logAuditAction({
        actorId: staffUser.userId || null,
        actorEmail: staffUser.email || "staff",
        action: "BOOKING_CHECKIN",
        targetId: booking._id,
        metadata: {
            bookingReference: booking.bookingReference,
            attendeeName: booking.attendeeName,
            totalPrice: booking.totalPrice,
            eventTitle: booking.event?.title
        }
    });

    return {
        booking,
        message: "Ticket successfully verified! Attendee checked in and payment marked as collected."
    };
}

/**
 * Manual Mark as Paid (Org Owner / Staff for direct bank transfers or early settlement)
 */
async function markBookingPaid(bookingId, organizationId, actorUser = {}) {
    const booking = await Booking.findOne({ _id: bookingId, organization: organizationId });
    if (!booking) {
        throw new Error("Booking not found or not owned by your organization");
    }

    if (booking.status === "CANCELLED") {
        throw new Error("Cannot mark a cancelled booking as paid");
    }

    booking.paymentStatus = "PAID";
    await booking.save();

    await logAuditAction({
        actorId: actorUser.userId || null,
        actorEmail: actorUser.email || "owner",
        action: "BOOKING_PAID",
        targetId: booking._id,
        metadata: {
            bookingReference: booking.bookingReference,
            totalPrice: booking.totalPrice
        }
    });

    return booking;
}

/**
 * Organization: Fetch all attendee bookings strictly scoped to organizationId
 */
async function getOrgBookings(organizationId, queryParams) {
    let page = parseInt(queryParams.page) || 1;
    let limit = parseInt(queryParams.limit) || 50;
    const maxLimit = 100;
    if (limit > maxLimit) limit = maxLimit;
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;

    const filter = { organization: organizationId };
    if (queryParams.status) filter.status = queryParams.status;
    if (queryParams.paymentStatus) filter.paymentStatus = queryParams.paymentStatus;
    if (queryParams.checkInStatus) filter.checkInStatus = queryParams.checkInStatus;

    const skip = (page - 1) * limit;
    const total = await Booking.countDocuments(filter);

    const bookings = await Booking.find(filter)
        .populate("event", "title date location")
        .populate("ticket", "type price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalPages = Math.ceil(total / limit);

    return {
        data: bookings,
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

/**
 * Organization: Cancel booking & restore ticket inventory
 */
async function cancelOrgBooking(bookingId, organizationId, actorUser = {}) {
    const booking = await Booking.findOne({ _id: bookingId, organization: organizationId });
    if (!booking) {
        throw new Error("Booking not found or not owned by your organization");
    }

    if (booking.status === "CANCELLED") {
        throw new Error("This booking has already been cancelled");
    }

    // Restore inventory
    await Ticket.findByIdAndUpdate(booking.ticket, {
        $inc: { soldQuantity: -booking.quantity }
    });

    booking.status = "CANCELLED";
    await booking.save();

    await logAuditAction({
        actorId: actorUser.userId || null,
        actorEmail: actorUser.email || "owner",
        action: "BOOKING_CANCEL",
        targetId: booking._id,
        metadata: {
            bookingReference: booking.bookingReference,
            quantity: booking.quantity,
            ticketId: booking.ticket
        }
    });

    return booking;
}

/**
 * User: Cancel own booking
 */
async function cancelBooking(bookingId, userId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error("Booking not found");

    if (booking.user?.toString() !== userId.toString()) {
        throw new Error("Not authorized to cancel this booking");
    }

    if (booking.status === "CANCELLED") {
        throw new Error("This booking has already been cancelled");
    }

    await Ticket.findByIdAndUpdate(booking.ticket, {
        $inc: { soldQuantity: -booking.quantity }
    });

    booking.status = "CANCELLED";
    await booking.save();

    await logAuditAction({
        actorId: userId,
        action: "BOOKING_CANCEL",
        targetId: booking._id,
        metadata: { bookingReference: booking.bookingReference }
    });

    return booking;
}

/**
 * User: Get own bookings history
 */
async function getUserBookings(userId, queryParams) {
    let page = parseInt(queryParams.page) || 1;
    let limit = parseInt(queryParams.limit) || 10;
    const maxLimit = 100;
    if (limit > maxLimit) limit = maxLimit;
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;

    const user = await User.findById(userId);
    const filter = {
        $or: [
            { user: userId },
            ...(user?.email ? [{ attendeeEmail: user.email.toLowerCase() }] : [])
        ]
    };

    if (queryParams.status) filter.status = queryParams.status;

    const skip = (page - 1) * limit;
    const total = await Booking.countDocuments(filter);

    const bookings = await Booking.find(filter)
        .populate("event", "title date location image")
        .populate("ticket", "type price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalPages = Math.ceil(total / limit);

    return {
        data: bookings,
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

async function deleteBookingsByEvent(eventId) {
    const result = await Booking.deleteMany({ event: eventId });
    return result.deletedCount;
}

module.exports = {
    createBooking,
    verifyTicket,
    markBookingPaid,
    getOrgBookings,
    cancelOrgBooking,
    cancelBooking,
    getUserBookings,
    deleteBookingsByEvent
};
