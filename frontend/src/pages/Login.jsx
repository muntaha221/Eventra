import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { LogIn, AlertCircle, ArrowRight, Sparkles } from "lucide-react";

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await api.post("/auth/login", { email, password });
            const { user, accessToken } = res.data.data;

            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("user", JSON.stringify(user));

            if (user.role === "ORG_OWNER" || user.role === "ORG_MEMBER") {
                navigate("/dashboard");
            } else {
                navigate("/events");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid email or password");
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
                        <LogIn size={20} color="#22c55e" />
                    </div>
                    <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.02em" }}>
                        Sign in to Eventra
                    </h1>
                    <p style={{ color: "#64748b", fontSize: "14px", marginTop: "6px" }}>
                        Enter your credentials to access your organization
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
                                outline: "none",
                                transition: "border-color 0.2s"
                            }}
                            onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                            onBlur={(e) => (e.target.style.borderColor = "#282834")}
                        />
                    </div>

                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                            <label style={{ fontSize: "13px", fontWeight: "600", color: "#94a3b8" }}>
                                Password
                            </label>
                            <Link to="/forgot-password" style={{ fontSize: "12px", color: "#4ade80", textDecoration: "none" }}>
                                Forgot password?
                            </Link>
                        </div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            style={{
                                width: "100%",
                                padding: "11px 14px",
                                background: "#16161d",
                                border: "1px solid #282834",
                                borderRadius: "8px",
                                color: "#ffffff",
                                fontSize: "14px",
                                outline: "none",
                                transition: "border-color 0.2s"
                            }}
                            onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                            onBlur={(e) => (e.target.style.borderColor = "#282834")}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-neon"
                        style={{ width: "100%", padding: "12px", marginTop: "10px" }}
                    >
                        {loading ? "Authenticating..." : "Sign In"}
                        <ArrowRight size={16} />
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "24px" }}>
                    <p style={{ color: "#64748b", fontSize: "13.5px" }}>
                        Don't have an organization yet?{" "}
                        <Link to="/register" style={{ color: "#22c55e", fontWeight: "600", textDecoration: "none" }}>
                            Register now
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
