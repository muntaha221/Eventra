import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Users, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

function JoinTeam() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [inviteInfo, setInviteInfo] = useState(null);
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchInvite() {
            if (!token) {
                setError("Missing team invite token.");
                setLoading(false);
                return;
            }

            try {
                const res = await api.get(`/orgs/join/${token}`);
                setInviteInfo(res.data.data);
            } catch (err) {
                setError(err.response?.data?.message || "This invitation is invalid or has expired.");
            } finally {
                setLoading(false);
            }
        }

        fetchInvite();
    }, [token]);

    async function handleJoin(e) {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const res = await api.post(`/orgs/join/${token}`, { name, password });
            const { user, accessToken } = res.data.data;

            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("user", JSON.stringify(user));

            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to join team.");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "100px 20px", color: "#94a3b8" }}>
                Validating invitation...
            </div>
        );
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
                    maxWidth: "440px",
                    padding: "40px 32px"
                }}
            >
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div
                        style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            background: "rgba(59, 130, 246, 0.15)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "16px"
                        }}
                    >
                        <Users size={22} color="#60a5fa" />
                    </div>
                    <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.02em" }}>
                        Join {inviteInfo?.organization?.name || "Organization"}
                    </h1>
                    <p style={{ color: "#64748b", fontSize: "14px", marginTop: "6px" }}>
                        You've been invited to join as an <strong>ORG_MEMBER</strong>
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

                {inviteInfo && (
                    <form onSubmit={handleJoin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#94a3b8", marginBottom: "6px" }}>
                                Email Address (from invite)
                            </label>
                            <input
                                type="email"
                                disabled
                                value={inviteInfo.email}
                                style={{
                                    width: "100%",
                                    padding: "11px 14px",
                                    background: "#121217",
                                    border: "1px solid #23232c",
                                    borderRadius: "8px",
                                    color: "#64748b",
                                    fontSize: "14px",
                                    cursor: "not-allowed"
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#94a3b8", marginBottom: "6px" }}>
                                Your Full Name
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Jordan Lee"
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
                                Set Password
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create your account password"
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
                            disabled={submitting}
                            className="btn-neon"
                            style={{ width: "100%", padding: "12px", marginTop: "12px" }}
                        >
                            {submitting ? "Joining Organization..." : "Accept & Join Team"}
                            <ArrowRight size={16} />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default JoinTeam;

