const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const BASE_URL = "http://localhost:3000/api";

async function runTest() {
    console.log("--------------------------------------------------");
    console.log("STARTING END-TO-END ATTENDEE BOOKING & ORG VERIFICATION");
    console.log("--------------------------------------------------");

    try {
        // Step 1: Browse Public Events
        console.log("\n[Step 1] Fetching public events from /api/events...");
        const eventsRes = await fetch(`${BASE_URL}/events`);
        const eventsData = await eventsRes.json();
        const events = eventsData.data;
        if (!events || events.length === 0) {
            throw new Error("No public events found. Seed at least one event first.");
        }

        // Find an event that has active ticket tiers
        let targetEvent = null;
        let targetTicket = null;
        let initialSold = 0;

        for (const ev of events) {
            const ticketsRes = await fetch(`${BASE_URL}/tickets/event/${ev._id}`);
            const ticketsData = await ticketsRes.json();
            const availableTiers = (ticketsData.data || []).filter(t => (t.totalQuantity - t.soldQuantity) >= 2);
            if (availableTiers.length > 0) {
                targetEvent = ev;
                targetTicket = availableTiers[0];
                initialSold = targetTicket.soldQuantity;
                break;
            }
        }

        if (!targetEvent || !targetTicket) {
            throw new Error("No event with available ticket tiers found.");
        }

        console.log(`✓ Target event: "${targetEvent.title}" (ID: ${targetEvent._id})`);
        console.log(`✓ Selected ticket tier: "${targetTicket.type}" @ $${targetTicket.price} (Sold: ${initialSold}/${targetTicket.totalQuantity})`);

        // Step 3: Book ticket as public guest attendee
        const testAttendee = {
            eventId: targetEvent._id,
            ticketId: targetTicket._id,
            quantity: 2,
            name: "Alexander Wright",
            email: "alex.wright.public@example.com"
        };
        console.log("\n[Step 3] Submitting public guest booking:", testAttendee);
        const bookingRes = await fetch(`${BASE_URL}/bookings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(testAttendee)
        });
        const bookingData = await bookingRes.json();
        if (!bookingRes.ok) {
            throw new Error(`Booking failed: ${JSON.stringify(bookingData)}`);
        }
        const booking = bookingData.data;
        console.log(`✓ Booking confirmed! Reference: ${booking.bookingReference}, Status: ${booking.status}, Total: $${booking.totalPrice}`);

        if (!booking.bookingReference || !booking.bookingReference.startsWith("EVT-")) {
            throw new Error(`Unexpected booking reference format: ${booking.bookingReference}`);
        }

        // Step 4: Verify ticket stock decremented (soldQuantity increased)
        const updatedTicketsRes = await fetch(`${BASE_URL}/tickets/event/${targetEvent._id}`);
        const updatedTicketsData = await updatedTicketsRes.json();
        const updatedTicket = updatedTicketsData.data.find(t => t._id === targetTicket._id);
        console.log(`✓ Updated ticket soldQuantity: ${updatedTicket.soldQuantity} (Expected: ${initialSold + 2})`);
        if (updatedTicket.soldQuantity !== initialSold + 2) {
            throw new Error(`Stock mismatch: got ${updatedTicket.soldQuantity}, expected ${initialSold + 2}`);
        }

        // Step 5: Generate ORG_OWNER token for the event's organization
        console.log("\n[Step 5] Acquiring ORG_OWNER credentials for target event's organization...");
        const mongoose = require("mongoose");
        const jwt = require("jsonwebtoken");
        require("../models/organization.model");
        const User = require("../models/user.model");

        await mongoose.connect(process.env.MONGODB_URI);
        const orgId = targetEvent.organization?._id || targetEvent.organization;
        const ownerUser = await User.findOne({ organization: orgId, role: "ORG_OWNER" });
        if (!ownerUser) {
            throw new Error(`No ORG_OWNER found for organization ${orgId}`);
        }

        const token = jwt.sign(
            { userId: ownerUser._id.toString(), role: ownerUser.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        console.log(`✓ Authenticated as ORG_OWNER: ${ownerUser.email} (${ownerUser.name})`);

        const authHeaders = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };

        // Step 6: Fetch Organization Bookings (/api/bookings/org)
        console.log("\n[Step 6] Calling GET /api/bookings/org with tenant isolation...");
        const orgBookingsRes = await fetch(`${BASE_URL}/bookings/org`, { headers: authHeaders });
        const orgBookingsData = await orgBookingsRes.json();
        const orgBookings = orgBookingsData.data;
        console.log(`✓ Found ${orgBookings.length} total bookings for this organization.`);

        const foundBooking = orgBookings.find(b => b.bookingReference === booking.bookingReference);
        if (!foundBooking) {
            throw new Error(`Booking ${booking.bookingReference} not found in organization attendee list.`);
        }
        console.log(`✓ Verified booking appears in Org Dashboard: Attendee "${foundBooking.attendeeName}", Ref: ${foundBooking.bookingReference}`);

        // Step 7: Verify Org Dashboard Stats (/api/admin/org/stats)
        console.log("\n[Step 7] Verifying Org Dashboard KPI Stats (/api/admin/org/stats)...");
        const statsRes = await fetch(`${BASE_URL}/admin/org/stats`, { headers: authHeaders });
        const statsData = await statsRes.json();
        console.log("✓ Org Stats:", statsData.data.stats);

        // Step 8: Organization cancels the booking and restores inventory
        console.log(`\n[Step 8] Testing Org Attendee cancellation (PATCH /api/bookings/org/${booking._id}/cancel)...`);
        const cancelRes = await fetch(`${BASE_URL}/bookings/org/${booking._id}/cancel`, {
            method: "PATCH",
            headers: authHeaders
        });
        const cancelData = await cancelRes.json();
        console.log(`✓ Cancellation response: ${cancelData.message}`);

        // Step 9: Verify inventory restored
        const restoredTicketsRes = await fetch(`${BASE_URL}/tickets/event/${targetEvent._id}`);
        const restoredTicketsData = await restoredTicketsRes.json();
        const restoredTicket = restoredTicketsData.data.find(t => t._id === targetTicket._id);
        console.log(`✓ Restored ticket soldQuantity: ${restoredTicket.soldQuantity} (Expected: ${initialSold})`);
        if (restoredTicket.soldQuantity !== initialSold) {
            throw new Error(`Restoration failed: got ${restoredTicket.soldQuantity}, expected ${initialSold}`);
        }

        console.log("\n==================================================");
        console.log("ALL TESTS PASSED: PUBLIC BOOKING & ORG DASHBOARD FLOW VERIFIED 100%");
        console.log("==================================================");
    } catch (err) {
        console.error("\n❌ Test Failed:", err.message);
        process.exit(1);
    }
}

runTest();
