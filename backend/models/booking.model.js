const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
            default: null
        },
        attendeeName: {
            type: String,
            required: [true, "Attendee name is required"],
            trim: true
        },
        attendeeEmail: {
            type: String,
            required: [true, "Attendee email is required"],
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
        },
        bookingReference: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
        qrCodeToken: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        qrCode: {
            type: String,
            default: null
        },
        paymentStatus: {
            type: String,
            enum: ["PENDING", "PAID"],
            default: "PENDING"
        },
        checkInStatus: {
            type: String,
            enum: ["PENDING", "CHECKED_IN"],
            default: "PENDING"
        },
        checkedInAt: {
            type: Date,
            default: null
        },
        qrCodeToken: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        qrCode: {
            type: String,
            default: null
        },
        paymentStatus: {
            type: String,
            enum: ["PENDING", "PAID"],
            default: "PENDING"
        },
        checkInStatus: {
            type: String,
            enum: ["PENDING", "CHECKED_IN"],
            default: "PENDING"
        },
        checkedInAt: {
            type: Date,
            default: null
        },
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },
        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: true
        },
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true
        },
        quantity: { type: Number, required: true, min: 1 },
        totalPrice: { type: Number, required: true, min: 0 },
        status: {
            type: String,
            enum: ["CONFIRMED", "CANCELLED"],
            default: "CONFIRMED"
        }
    },
    { timestamps: true }
);

// Database Indexing (Phase 5 Specs)
bookingSchema.index({ organization: 1, event: 1 });
// Database Indexing (Phase 5 Specs)
bookingSchema.index({ organization: 1, event: 1 });
bookingSchema.index({ organization: 1, createdAt: -1 });
bookingSchema.index({ attendeeEmail: 1, createdAt: -1 });

module.exports = mongoose.model("Booking", bookingSchema);
