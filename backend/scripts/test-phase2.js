const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const userService = require("../services/user.service");
const eventService = require("../services/event.service");
const billingService = require("../services/billing.service");
const Organization = require("../models/organization.model");
const Subscription = require("../models/subscription.model");
const { checkPlanLimit } = require("../middleware/plan.middleware");

async function testPhase2() {
    try {
        console.log("=== PHASE 2 VERIFICATION TEST ===");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✓ Connected to MongoDB");

        // 1. Register a fresh Org on FREE Tier
        console.log("\n1. Creating test organization on FREE tier...");
        const reg = await userService.registerUser({
            name: "Charlie FreeOrg",
            email: `charlie_${Date.now()}@test.com`,
            password: "password123",
            organizationName: "Limit Check Events"
        });
        const orgId = reg.organization._id;
        const userId = reg.user._id;
        console.log("✓ Created Org:", reg.organization.name, "Plan:", reg.organization.planTier);

        // 2. Create 3 events (Free Tier limit)
        console.log("\n2. Creating 3 events on FREE plan (up to the limit)...");
        for (let i = 1; i <= 3; i++) {
            await eventService.createEvent(userId, orgId, {
                title: `Event #${i}`,
                description: `Description for event #${i}`,
                category: "Tech",
                date: new Date(Date.now() + 86400000 * i),
                location: "Online"
            });
            console.log(`✓ Created Event #${i}`);
        }

        // 3. Test Plan Limit Middleware
        console.log("\n3. Testing checkPlanLimit guard on 4th event creation...");
        const mockReq = {
            user: { role: "ORG_OWNER", userId },
            organizationId: orgId.toString()
        };
        let errorStatus = null;
        let errorMessage = null;
        const mockRes = {
            status: function(code) {
                errorStatus = code;
                return {
                    json: function(payload) {
                        errorMessage = payload.message;
                    }
                };
            }
        };
        const mockNext = () => {
            throw new Error("Guard failed! checkPlanLimit allowed 4th event on FREE plan!");
        };

        const limitGuard = checkPlanLimit("events");
        await limitGuard(mockReq, mockRes, mockNext);

        if (errorStatus === 403) {
            console.log(`✓ SUCCESS: 4th event correctly blocked with 403! Message: "${errorMessage}"`);
        } else {
            console.error(`❌ FAILED: Expected status 403, got ${errorStatus}`);
            process.exit(1);
        }

        // 4. Test Webhook: Simulate checkout.session.completed -> Upgrade to PRO
        console.log("\n4. Simulating Stripe Webhook: checkout.session.completed...");
        const mockWebhookPayload = {
            type: "checkout.session.completed",
            data: {
                object: {
                    customer: "cus_mock_12345",
                    subscription: "sub_mock_67890",
                    metadata: {
                        organizationId: orgId.toString()
                    }
                }
            }
        };

        await billingService.handleWebhookEvent(
            Buffer.from(JSON.stringify(mockWebhookPayload)),
            "mock_sig"
        );

        const updatedOrg = await Organization.findById(orgId);
        const updatedSub = await Subscription.findOne({ organization: orgId });

        if (updatedOrg.planTier === "PRO" && updatedSub.planTier === "PRO" && updatedSub.status === "active") {
            console.log("✓ SUCCESS: Org successfully upgraded to PRO via webhook!");
            console.log("  Org planTier:", updatedOrg.planTier, "| Stripe Customer:", updatedOrg.stripeCustomerId);
            console.log("  Sub planTier:", updatedSub.planTier, "| Stripe Sub ID:", updatedSub.stripeSubscriptionId);
        } else {
            console.error("❌ FAILED: Org was not upgraded to PRO properly.");
            process.exit(1);
        }

        // 5. Test 4th event allowed after PRO upgrade
        console.log("\n5. Testing 4th event allowed now that organization is PRO...");
        let allowed = false;
        const mockNextAfterPro = () => {
            allowed = true;
        };
        await limitGuard(mockReq, mockRes, mockNextAfterPro);

        if (allowed) {
            console.log("✓ SUCCESS: checkPlanLimit guard allowed 4th event after PRO upgrade!");
        } else {
            console.error("❌ FAILED: Pro org was blocked by plan guard.");
            process.exit(1);
        }

        // 6. Test Webhook: customer.subscription.deleted -> Downgrade back to FREE
        console.log("\n6. Simulating Stripe Webhook: customer.subscription.deleted...");
        const mockCancelPayload = {
            type: "customer.subscription.deleted",
            data: {
                object: {
                    id: "sub_mock_67890",
                    status: "canceled"
                }
            }
        };

        await billingService.handleWebhookEvent(
            Buffer.from(JSON.stringify(mockCancelPayload)),
            "mock_sig"
        );

        const downgradedOrg = await Organization.findById(orgId);
        const downgradedSub = await Subscription.findOne({ organization: orgId });

        if (downgradedOrg.planTier === "FREE" && downgradedSub.status === "canceled") {
            console.log("✓ SUCCESS: Org downgraded back to FREE upon subscription cancellation!");
        } else {
            console.error("❌ FAILED: Org was not downgraded properly.");
            process.exit(1);
        }

        console.log("\n=== ALL PHASE 2 TESTS PASSED! ===");
        process.exit(0);
    } catch (error) {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }
}

testPhase2();

