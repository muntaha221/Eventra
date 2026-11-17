const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const userService = require("../services/user.service");
const eventService = require("../services/event.service");
const ticketService = require("../services/ticket.service");
const bookingService = require("../services/booking.service");

async function testPhase1() {
    try {
        console.log("=== PHASE 1 VERIFICATION TEST ===");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✓ Connected to MongoDB");

        // 1. Test Registration (creates Org + User ORG_OWNER + Subscription)
        console.log("\n1. Testing Org Owner Registration...");
        const regResult = await userService.registerUser({
            name: "Alice Owner",
            email: `alice_${Date.now()}@test.com`,
            password: "password123",
            organizationName: "Acme Events Corp"
        });

        console.log("✓ User created:", regResult.user.email, "Role:", regResult.user.role);
        console.log("✓ Org created:", regResult.organization.name, "Slug:", regResult.organization.slug);
        console.log("✓ Access Token generated (length):", regResult.accessToken.length);
        console.log("✓ Refresh Token generated (length):", regResult.refreshToken.length);

        const orgAId = regResult.organization._id;
        const ownerAId = regResult.user._id;

        // 2. Test Second Org (for Tenant Isolation testing)
        console.log("\n2. Testing Second Org Registration for Tenant Isolation...");
        const regB = await userService.registerUser({
            name: "Bob Rival",
            email: `bob_${Date.now()}@test.com`,
            password: "password123",
            organizationName: "Beta Productions"
        });
        const orgBId = regB.organization._id;
        const ownerBId = regB.user._id;
        console.log("✓ Org B created:", regB.organization.name);

        // 3. Test Event Creation for Org A
        console.log("\n3. Testing Event Creation for Org A...");
        const eventA = await eventService.createEvent(ownerAId, orgAId, {
            title: "Acme Tech Summit 2026",
            description: "The biggest tech summit of the year",
            category: "Tech",
            date: new Date(Date.now() + 86400000 * 30),
            location: "San Francisco, CA"
        });
        console.log("✓ Event created for Org A:", eventA.title, "ID:", eventA._id);

        // 4. Test Tenant Isolation: Org B attempts to update Org A's event
        console.log("\n4. Testing Tenant Isolation (Org B trying to update Org A's event)...");
        try {
            await eventService.updateEvent(eventA._id, orgBId, { title: "Hacked Title" });
            console.error("❌ FAILED: Org B was able to modify Org A's event!");
            process.exit(1);
        } catch (err) {
            console.log("✓ SUCCESS: Org B update rejected with:", err.message);
        }

        // 5. Test Org A can update its own event
        console.log("\n5. Testing Org A updating its own event...");
        const updatedEventA = await eventService.updateEvent(eventA._id, orgAId, {
            title: "Acme Tech Summit 2026 (Updated)"
        });
        console.log("✓ Event updated successfully:", updatedEventA.title);

        // 6. Test Ticket Creation with Tenant Check
        console.log("\n6. Testing Ticket Creation for Org A's event...");
        const ticketA = await ticketService.createTicket(ownerAId, orgAId, {
            eventId: eventA._id,
            type: "VIP",
            price: 150,
            totalQuantity: 50
        });
        console.log("✓ Ticket created:", ticketA.type, "Price: $" + ticketA.price);

        // 7. Org B trying to create ticket for Org A's event
        console.log("\n7. Testing Org B trying to create ticket for Org A's event...");
        try {
            await ticketService.createTicket(ownerBId, orgBId, {
                eventId: eventA._id,
                type: "Regular",
                price: 50,
                totalQuantity: 100
            });
            console.error("❌ FAILED: Org B was able to add ticket to Org A's event!");
            process.exit(1);
        } catch (err) {
            console.log("✓ SUCCESS: Ticket creation rejected with:", err.message);
        }

        // 8. Test Refresh Token
        console.log("\n8. Testing Refresh Token flow...");
        const refreshed = await userService.refreshToken(regResult.refreshToken);
        console.log("✓ Refresh token valid, new access token generated for:", refreshed.user.email);

        console.log("\n=== ALL PHASE 1 TESTS PASSED! ===");
        process.exit(0);
    } catch (error) {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }
}

testPhase1();

