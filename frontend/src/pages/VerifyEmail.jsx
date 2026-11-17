import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../api/axios";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [status, setStatus] = useState("verifying"); // verifying, success, error
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function verify() {
            if (!token) {
                setStatus("error");
                setMessage("No verification token was provided.");
                return;
            }

            try {
                const res = await api.get(`/auth/verify/${token}`);
                setStatus("success");
                setMessage(res.data.message || "Your email has been successfully verified!");
            } catch (err) {
                setStatus("error");
                setMessage(err.response?.data?.message || "Verification link is invalid or has expired.");
            }
        }

        verify();
    }, [token]);

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
                    padding: "48px 36px",
                    textAlign: "center"
                }}
            >
                {status === "verifying" && (
                    <div>
                        <Loader2 size={36} color="#22c55e" className="animate-spin" style={{ margin: "0 auto 20px" }} />
                        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#ffffff" }}>
                            Verifying your email...
                        </h2>
                        <p style={{ color: "#64748b", fontSize: "14px", marginTop: "8px" }}>
                            Please wait while we validate your credentials.
                        </p>
                    </div>
                )}

                {status === "success" && (
                    <div>
                        <div
                            style={{
                                width: "52px",
                                height: "52px",
                                borderRadius: "50%",
                                background: "rgba(34, 197, 94, 0.15)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "20px"
                            }}
                        >
                            <CheckCircle2 size={28} color="#22c55e" />
                        </div>
                        <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.02em" }}>
                            Email Verified!
                        </h2>
                        <p style={{ color: "#94a3b8", fontSize: "14px", margin: "10px 0 28px" }}>
                            {message}
                        </p>
                        <Link to="/dashboard" className="btn-neon" style={{ width: "100%" }}>
                            Go to Dashboard
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div>
                        <div
                            style={{
                                width: "52px",
                                height: "52px",
                                borderRadius: "50%",
                                background: "rgba(239, 68, 68, 0.15)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "20px"
                            }}
                        >
                            <XCircle size={28} color="#ef4444" />
                        </div>
                        <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.02em" }}>
                            Verification Failed
                        </h2>
                        <p style={{ color: "#f87171", fontSize: "14px", margin: "10px 0 28px" }}>
                            {message}
                        </p>
                        <Link to="/login" className="btn-secondary" style={{ width: "100%" }}>
                            Back to Sign In
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default VerifyEmail;

