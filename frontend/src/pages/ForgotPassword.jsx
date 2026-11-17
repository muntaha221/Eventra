import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { KeyRound, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await api.post("/auth/forgot-password", { email });
            setMessage(res.data.message || "A reset link has been dispatched to your email address.");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to process password reset.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            style={{
                minHeight: "calc(100vh - 120px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 20px"
            }}
        >
            <div
                className="glass-panel"
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    padding: "40px 32px"
                }}
            >
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div
                        style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "12px",
                            background: "rgba(34, 197, 94, 0.12)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "16px"
                        }}
                    >
                        <KeyRound size={20} color="#22c55e" />
                    </div>
                    <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.02em" }}>
                        Reset Password
                    </h1>
                    <p style={{ color: "#64748b", fontSize: "14px", marginTop: "6px" }}>
                        Enter your email to receive recovery instructions
                    </p>
                </div>

                {message && (
                    <div
                        style={{
                            background: "rgba(34, 197, 94, 0.12)",
                            border: "1px solid rgba(34, 197, 94, 0.3)",
                            color: "#4ade80",
                            padding: "12px 14px",
                            borderRadius: "8px",
                            fontSize: "13.5px",
                            marginBottom: "20px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                    >
                        <CheckCircle2 size={16} />
                        {message}
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            background: "rgba(239, 68, 68, 0.12)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#f87171",
                            padding: "12px 14px",
                            borderRadius: "8px",
                            fontSize: "13.5px",
                            marginBottom: "20px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                    >
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#94a3b8", marginBottom: "6px" }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            style={{
                                width: "100%",
                                padding: "11px 14px",
                                background: "#16161d",
                                border: "1px solid #282834",
                                borderRadius: "8px",
                                color: "#ffffff",
                                fontSize: "14px",
                                outline: "none"
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-neon"
                        style={{ width: "100%", padding: "12px", marginTop: "10px" }}
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                        <ArrowRight size={16} />
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "24px" }}>
                    <Link to="/login" style={{ color: "#64748b", fontSize: "13.5px", textDecoration: "none" }}>
                        Return to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;

