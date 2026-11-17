const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");

async function cleanDatabase() {
    try {
        console.log("Connecting to MongoDB...");
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI not found in environment");
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");

        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map((c) => c.name);

        console.log("Existing collections:", collectionNames);

        const targetCollections = [
            "users",
            "events",
            "tickets",
            "bookings",
            "organizations",
            "subscriptions",
            "invites"
        ];

        for (const name of targetCollections) {
            if (collectionNames.includes(name)) {
                await mongoose.connection.db.dropCollection(name);
                console.log(`✓ Dropped collection: ${name}`);
            } else {
                console.log(`- Collection ${name} does not exist, skipping`);
            }
        }

        console.log("\nDatabase clean completed successfully. Ready for fresh multi-tenant data.");
        process.exit(0);
    } catch (error) {
        console.error("Database clean failed:", error);
        process.exit(1);
    }
}

cleanDatabase();
