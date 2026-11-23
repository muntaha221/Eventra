import React, { useState } from "react";
import api from "../api/axios";
import { CheckCircle, Zap, Shield, ExternalLink, AlertCircle } from "lucide-react";

function Pricing() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const isPro = user?.organization?.planTier === "PRO";
    const isOrgOwner = user?.role === "ORG_OWNER";

    async function handleUpgrade() {
        if (!user) {
            window.location.href = "/register";
            return;
        }

        if (!isOrgOwner) {
            setError("Only organization owners can manage billing.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await api.post("/billing/checkout");
            if (res.data.data?.url) {
                window.location.href = res.data.data.url;
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to initialize Stripe checkout.");
        } finally {
            setLoading(false);
        }
    }

    async function handleOpenPortal() {
        setLoading(true);
        setError("");

        try {
            const res = await api.get("/billing/portal");
            if (res.data.data?.url) {
                window.location.href = res.data.data.url;
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to open billing portal.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: "1000px", margin: "60px auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: "50px" }}>
                <span className="badge-neon">Subscription Plans</span>
                <h1
                    style={{
                        fontSize: "clamp(32px, 5vw, 48px)",
                        fontWeight: "800",
                        letterSpacing: "-0.03em",
                        color: "#f8fafc",
                        marginTop: "12px"
                    }}
                >
                    Predictable, Scalable Pricing
                </h1>
                <p style={{ color: "#94a3b8", fontSize: "16px", marginTop: "8px" }}>
                    Upgrade your organization to uncap your event volume and unlock team tools.
                </p>

                {error && (
                    <div
                        style={{
                            maxWidth: "480px",
                            margin: "20px auto 0",
                            background: "rgba(239, 68, 68, 0.12)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#f87171",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            justifyContent: "center"
                        }}
                    >
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "24px",
                    alignItems: "stretch"
                }}
            >
                {/* Free Tier */}
                <div
                    className="glass-panel"
                    style={{
                        padding: "40px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                    }}
                >
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#f8fafc" }}>Starter Plan</h2>
                            {!isPro && user?.organization && (
                                <span className="badge-neon">CURRENT PLAN</span>
                            )}
                        </div>
                        <p style={{ color: "#64748b", fontSize: "14px", margin: "8px 0 24px" }}>
                            For emerging organizers and grassroots events.
                        </p>

                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "32px" }}>
                            <span style={{ fontSize: "48px", fontWeight: "800", color: "#f8fafc" }}>$0</span>
                            <span style={{ color: "#64748b", fontSize: "15px" }}>/month</span>
                        </div>

                        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "14px", marginBottom: "36px" }}>
                            <li style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", color: "#94a3b8" }}>
                                <CheckCircle size={17} color="#22c55e" /> Maximum of 3 active events
                            </li>
                            <li style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", color: "#94a3b8" }}>
                                <CheckCircle size={17} color="#22c55e" /> Standard ticket sales & orders
                            </li>
                            <li style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", color: "#94a3b8" }}>
                                <CheckCircle size={17} color="#22c55e" /> Basic email confirmations
                            </li>
                        </ul>
                    </div>

                    <button
                        className="btn-secondary"
                        disabled={!isPro && !!user?.organization}
                        style={{ width: "100%", opacity: !isPro && !!user?.organization ? 0.6 : 1 }}
                    >
                        {!isPro && !!user?.organization ? "Active Plan" : "Free Forever"}
                    </button>
                </div>

                {/* Pro Tier */}
                <div
                    className="glass-panel"
                    style={{
                        padding: "40px",
                        border: "2px solid #22c55e",
                        boxShadow: "0 0 32px rgba(34, 197, 94, 0.18)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        position: "relative"
                    }}
                >
                    <div style={{ position: "absolute", top: "-13px", right: "28px" }}>
                        <span className="badge-pro" style={{ padding: "4px 14px", fontSize: "11px" }}>
                            PRO TIER
                        </span>
                    </div>

                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#ffffff" }}>Pro Enterprise</h2>
                            {isPro && <span className="badge-pro">ACTIVE</span>}
                        </div>
                        <p style={{ color: "#64748b", fontSize: "14px", margin: "8px 0 24px" }}>
                            Complete power and scale for event brands.
                        </p>

                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "32px" }}>
                            <span style={{ fontSize: "48px", fontWeight: "800", color: "#22c55e" }}>$29</span>
                            <span style={{ color: "#64748b", fontSize: "15px" }}>/month</span>
                        </div>

                        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "14px", marginBottom: "36px" }}>
                            <li style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", color: "#ffffff" }}>
                                <CheckCircle size={17} color="#22c55e" /> <strong>Unlimited events creation</strong>
                            </li>
                            <li style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", color: "#ffffff" }}>
                                <CheckCircle size={17} color="#22c55e" /> Team member invites & permissions
                            </li>
                            <li style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", color: "#ffffff" }}>
                                <CheckCircle size={17} color="#22c55e" /> Centralized organization dashboard
                            </li>
                            <li style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", color: "#ffffff" }}>
                                <CheckCircle size={17} color="#22c55e" /> Stripe Billing Customer Portal
                            </li>
                        </ul>
                    </div>

                    {isPro ? (
                        <button
                            onClick={handleOpenPortal}
                            className="btn-secondary"
                            disabled={loading}
                            style={{ width: "100%" }}
                        >
                            <ExternalLink size={16} />
                            {loading ? "Opening Portal..." : "Manage Subscription"}
                        </button>
                    ) : (
                        <button
                            onClick={handleUpgrade}
                            className="btn-neon"
                            disabled={loading}
                            style={{ width: "100%" }}
                        >
                            <Zap size={16} />
                            {loading ? "Redirecting to Stripe..." : "Upgrade with Stripe"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Pricing;

