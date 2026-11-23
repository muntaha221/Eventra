const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const eventRoutes = require("./routes/event.routes");
const ticketRoutes = require("./routes/ticket.routes");
const bookingRoutes = require("./routes/booking.routes");
const adminRoutes = require("./routes/admin.routes");
const billingRoutes = require("./routes/billing.routes");
const orgRoutes = require("./routes/org.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const cronRoutes = require("./routes/cron.routes");
const graphqlRoutes = require("./routes/graphql.routes");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

// Mount billing webhook route with raw body parser BEFORE express.json()
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.json({ success: true, message: "Eventra API" });
});

// Ensure database is connected (serverless & standalone)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(500).json({ success: false, message: "Database connection failed" });
    }
});

// Mount routes with both /api and root prefixes for seamless serverless & standalone compatibility
const mountRoutes = (prefix) => {
    app.use(`${prefix}/auth`, authRoutes);
    app.use(`${prefix}/events`, eventRoutes);
    app.use(`${prefix}/tickets`, ticketRoutes);
    app.use(`${prefix}/bookings`, bookingRoutes);
    app.use(`${prefix}/admin`, adminRoutes);
    app.use(`${prefix}/billing`, billingRoutes);
    app.use(`${prefix}/orgs`, orgRoutes);
    app.use(`${prefix}/feedback`, feedbackRoutes);
    app.use(`${prefix}/cron`, cronRoutes);
    app.use(`${prefix}/graphql`, graphqlRoutes);
};

mountRoutes("/api");
mountRoutes("");

// 404
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// Error handler
app.use(errorMiddleware);

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Eventra API running on port ${PORT}`);
        });
    }).catch(err => {
        console.error("Failed to start server:", err);
    });
}

module.exports = app;
