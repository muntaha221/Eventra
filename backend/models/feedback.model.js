const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: 100
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
        },
        type: {
            type: String,
            enum: ["GENERAL", "COMPLAINT", "BUG", "FEATURE_REQUEST"],
            default: "GENERAL"
        },
        message: {
            type: String,
            required: [true, "Message is required"],
            trim: true,
            minlength: 10,
            maxlength: 2000
        },
        status: {
            type: String,
            enum: ["PENDING", "RESOLVED"],
            default: "PENDING"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);

