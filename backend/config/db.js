const mongoose = require("mongoose");

let cachedPromise = null;

async function connectDB() {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    if (!cachedPromise) {
        cachedPromise = mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        }).catch(err => {
            cachedPromise = null;
            throw err;
        });
    }
    try {
        await cachedPromise;
        console.log("✅ MongoDB connected successfully");
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        throw error;
    }
}

module.exports = connectDB;

