import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Building2, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

function Register() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [organizationName, setOrganizationName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        setLoading(true);

        try {
            const res = await api.post("/auth/register", {
                name,
                email,
                organizationName,
                password
            });

            const { user, accessToken } = res.data.data;
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("user", JSON.stringify(user));

            setSuccessMessage("Organization created! Check your email to verify your address.");
            setTimeout(() => {
                navigate("/dashboard");
            }, 1800);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to register organization.");
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
                    maxWidth: "460px",
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
                        <Building2 size={20} color="#22c55e" />
                    </div>
                    <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.02em" }}>
                        Create Organization
                    </h1>
                    <p style={{ color: "#64748b", fontSize: "14px", marginTop: "6px" }}>
                        Start your 14-day free trial on Eventra
                    </p>
                </div>

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

                {successMessage && (
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
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#94a3b8", marginBottom: "6px" }}>
                            Your Full Name
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Alex Morgan"
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

                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#94a3b8", marginBottom: "6px" }}>
                            Organization Name
                        </label>
                        <input
                            type="text"
                            required
                            value={organizationName}
                            onChange={(e) => setOrganizationName(e.target.value)}
                            placeholder="Acme Productions LLC"
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

                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#94a3b8", marginBottom: "6px" }}>
                            Work Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="alex@acme.com"
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

                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#94a3b8", marginBottom: "6px" }}>
                            Password (min. 6 characters)
                        </label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a strong password"
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
                        style={{ width: "100%", padding: "12px", marginTop: "12px" }}
                    >
                        {loading ? "Setting up Organization..." : "Launch Organization"}
                        <ArrowRight size={16} />
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "24px" }}>
                    <p style={{ color: "#64748b", fontSize: "13.5px" }}>
                        Already have an account?{" "}
                        <Link to="/login" style={{ color: "#22c55e", fontWeight: "600", textDecoration: "none" }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;
