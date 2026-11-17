const Stripe = require("stripe");
const Organization = require("../models/organization.model");
const Subscription = require("../models/subscription.model");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Get or create a Stripe Customer for an Organization
 */
async function getOrCreateCustomer(organizationId, userEmail, orgName) {
    const org = await Organization.findById(organizationId);
    if (!org) throw new Error("Organization not found");

    if (org.stripeCustomerId) {
        return org.stripeCustomerId;
    }

    const customer = await stripe.customers.create({
        email: userEmail,
        name: orgName || org.name,
        metadata: {
            organizationId: organizationId.toString()
        }
    });

    org.stripeCustomerId = customer.id;
    await org.save();

    return customer.id;
}

/**
 * Create a Stripe Checkout Session for upgrading to PRO
 */
async function createCheckoutSession(organizationId, user) {
    const org = await Organization.findById(organizationId);
    if (!org) throw new Error("Organization not found");

    if (org.planTier === "PRO") {
        throw new Error("Organization is already on the Pro plan");
    }

    const customerId = await getOrCreateCustomer(organizationId, user.email, org.name);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const sessionConfig = {
        customer: customerId,
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: "EventHub Pro Plan",
                        description: "Unlimited event creation and priority support"
                    },
                    unit_amount: 2900, // $29.00 / month
                    recurring: {
                        interval: "month"
                    }
                },
                quantity: 1
            }
        ],
        metadata: {
            organizationId: organizationId.toString()
        },
        subscription_data: {
            metadata: {
                organizationId: organizationId.toString()
            }
        },
        success_url: `${frontendUrl}/admin?session_id={CHECKOUT_SESSION_ID}&upgrade=success`,
        cancel_url: `${frontendUrl}/admin?upgrade=cancelled`
    };

    // If STRIPE_PRO_PRICE_ID is defined and not a placeholder, use standard price object
    if (
        process.env.STRIPE_PRO_PRICE_ID &&
        !process.env.STRIPE_PRO_PRICE_ID.includes("placeholder")
    ) {
        sessionConfig.line_items = [
            {
                price: process.env.STRIPE_PRO_PRICE_ID,
                quantity: 1
            }
        ];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return { url: session.url, sessionId: session.id };
}

/**
 * Create Stripe Customer Portal session for managing subscriptions
 */
async function createPortalSession(organizationId) {
    const org = await Organization.findById(organizationId);
    if (!org || !org.stripeCustomerId) {
        throw new Error("No active billing profile found for this organization");
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const portalSession = await stripe.billingPortal.sessions.create({
        customer: org.stripeCustomerId,
        return_url: `${frontendUrl}/admin`
    });

    return { url: portalSession.url };
}

/**
 * Handle Stripe Webhook Events
 */
async function handleWebhookEvent(rawBody, signature) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    if (webhookSecret && !webhookSecret.includes("placeholder")) {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
        // Fallback for direct local testing when testing without webhook secret signing
        try {
            event = JSON.parse(rawBody.toString());
        } catch (e) {
            throw new Error("Invalid payload format");
        }
    }

    const eventType = event.type;
    const dataObject = event.data.object;

    switch (eventType) {
        case "checkout.session.completed": {
            const organizationId =
                dataObject.metadata?.organizationId ||
                dataObject.subscription_data?.metadata?.organizationId;

            if (organizationId) {
                await Organization.findByIdAndUpdate(organizationId, {
                    planTier: "PRO",
                    stripeCustomerId: dataObject.customer
                });

                await Subscription.findOneAndUpdate(
                    { organization: organizationId },
                    {
                        stripeSubscriptionId: dataObject.subscription,
                        status: "active",
                        planTier: "PRO"
                    },
                    { upsert: true }
                );

                // Enterprise Audit Log
                const { logAuditAction } = require("./audit.service");
                logAuditAction({
                    action: "PLAN_UPGRADE",
                    targetId: organizationId,
                    metadata: { planTier: "PRO", customer: dataObject.customer }
                });
            }
            break;
        }

        case "customer.subscription.updated": {
            const sub = dataObject;
            const status = sub.status; // active, past_due, canceled, etc.
            const periodEnd = sub.current_period_end
                ? new Date(sub.current_period_end * 1000)
                : null;

            const existingSub = await Subscription.findOne({
                stripeSubscriptionId: sub.id
            });

            if (existingSub) {
                existingSub.status = status;
                existingSub.currentPeriodEnd = periodEnd;
                await existingSub.save();

                if (status === "canceled" || status === "unpaid") {
                    await Organization.findByIdAndUpdate(existingSub.organization, {
                        planTier: "FREE"
                    });
                    existingSub.planTier = "FREE";
                    await existingSub.save();
                }
            }
            break;
        }

        case "customer.subscription.deleted": {
            const sub = dataObject;
            const existingSub = await Subscription.findOne({
                stripeSubscriptionId: sub.id
            });

            if (existingSub) {
                existingSub.status = "canceled";
                existingSub.planTier = "FREE";
                await existingSub.save();

                await Organization.findByIdAndUpdate(existingSub.organization, {
                    planTier: "FREE"
                });
            }
            break;
        }

        default:
            // Unhandled event types
            break;
    }

    return { received: true, type: eventType };
}

module.exports = {
    stripe,
    createCheckoutSession,
    createPortalSession,
    handleWebhookEvent
};

