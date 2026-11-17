import React, { useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Mail, MapPin, Clock, Send } from "lucide-react";
import api from "../api/axios";

const FEEDBACK_TYPES = [
    { value: "GENERAL", label: "General Inquiry" },
    { value: "COMPLAINT", label: "Complaint" },
    { value: "BUG", label: "Bug Report" },
    { value: "FEATURE_REQUEST", label: "Feature Request" }
];

function Contact() {
    const heroRef = useRef(null);
    const formRef = useRef(null);

    const [form, setForm] = useState({ name: "", email: "", type: "GENERAL", message: "" });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    // Animate sections on load
    useGSAP(() => {
        gsap.fromTo(heroRef.current, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" });
        gsap.fromTo(formRef.current, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.7, delay: 0.15, ease: "power3.out" });
    });

    function handleChange(e) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError("");
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await api.post("/feedback", form);
            setSuccess(true);
            setForm({ name: "", email: "", type: "GENERAL", message: "" });
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const inputStyle = {
        width: "100%",
        background: "#0f0f14",
        border: "1px solid #2a2a38",
        borderRadius: "9px",
        padding: "11px 15px",
        color: "#f8fafc",
        fontSize: "14.5px",
        outline: "none",
        fontFamily: "inherit",
        transition: "border-color 0.15s ease"
    };
    const labelStyle = {
        display: "block",
        fontSize: "12px",
        fontWeight: "700",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: "7px"
    };

    return (
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "80px 24px 120px" }}>

            {/* Page header */}
            <div ref={heroRef} style={{ textAlign: "center", marginBottom: "72px", opacity: 0 }}>
                <span className="badge-neon" style={{ marginBottom: "18px", display: "inline-flex", padding: "5px 14px" }}>
                    Contact Us
                </span>
                <h1
                    style={{
                        fontSize: "clamp(32px, 5vw, 52px)",
                        fontWeight: "900",
                        letterSpacing: "-0.04em",
                        color: "#ffffff",
                        marginBottom: "14px",
                        lineHeight: "1.1"
                    }}
                >
                    We are here to help
                </h1>
                <p style={{ color: "#94a3b8", fontSize: "17px", maxWidth: "520px", margin: "0 auto", lineHeight: "1.65" }}>
                    Have a question, a problem, or a great idea? Send us a message and we will get back to you within one business day.
                </p>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.6fr",
                    gap: "36px",
                    alignItems: "start"
                }}
            >
                {/* Left — info cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {[
                        {
                            icon: <Mail size={20} color="#22c55e" />,
                            title: "Email Support",
                            detail: "support@eventra.app",
                            sub: "We reply within 24 hours on business days.",
                            href: "mailto:support@eventra.app"
                        },
                        {
                            icon: <MapPin size={20} color="#c084fc" />,
                            title: "Office",
                            detail: "14 Innovation Drive, Suite 300",
                            sub: "San Francisco, CA 94105, USA",
                            href: null
                        },
                        {
                            icon: <Clock size={20} color="#60a5fa" />,
                            title: "Support Hours",
                            detail: "Monday – Friday",
                            sub: "9:00 AM – 6:00 PM PST",
                            href: null
                        }
                    ].map((card) => (
                        <div key={card.title} className="glass-panel" style={{ padding: "24px 26px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
                            <div
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "10px",
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid #2a2a38",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0
                                }}
                            >
                                {card.icon}
                            </div>
                            <div>
                                <p style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                                    {card.title}
                                </p>
                                {card.href ? (
                                    <a href={card.href} style={{ color: "#f8fafc", fontSize: "14.5px", fontWeight: "600", textDecoration: "none" }}>
                                        {card.detail}
                                    </a>
                                ) : (
                                    <p style={{ color: "#f8fafc", fontSize: "14.5px", fontWeight: "600" }}>{card.detail}</p>
                                )}
                                <p style={{ color: "#64748b", fontSize: "13px", marginTop: "3px" }}>{card.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right — contact form */}
                <div ref={formRef} className="glass-panel" style={{ padding: "40px", opacity: 0 }}>
                    <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.02em", marginBottom: "6px" }}>
                        Send a Message
                    </h2>
                    <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "32px" }}>
                        Fill in the form below and our team will respond promptly.
                    </p>

                    {success ? (
                        <div style={{ textAlign: "center", padding: "48px 0" }}>
                            <div
                                style={{
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "50%",
                                    background: "rgba(34,197,94,0.1)",
                                    border: "1.5px solid rgba(34,197,94,0.3)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 20px"
                                }}
                            >
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <p style={{ color: "#f8fafc", fontWeight: "700", fontSize: "17px", marginBottom: "8px" }}>Message sent</p>
                            <p style={{ color: "#64748b", fontSize: "14px" }}>
                                Thank you for reaching out. We will get back to you within 24 hours.
                            </p>
                            <button
                                onClick={() => setSuccess(false)}
                                className="btn-secondary"
                                style={{ marginTop: "24px" }}
                            >
                                Send another message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={labelStyle}>Full Name</label>
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Your name"
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Email Address</label>
                                    <input
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="you@company.com"
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Inquiry Type</label>
                                <select
                                    name="type"
                                    value={form.type}
                                    onChange={handleChange}
                                    style={{ ...inputStyle, cursor: "pointer" }}
                                >
                                    {FEEDBACK_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>Message</label>
                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    placeholder="Describe your question or issue in detail..."
                                    rows={5}
                                    style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }}
                                    required
                                />
                            </div>

                            {error && (
                                <div style={{
                                    background: "rgba(239,68,68,0.08)",
                                    border: "1px solid rgba(239,68,68,0.3)",
                                    color: "#f87171",
                                    padding: "12px 15px",
                                    borderRadius: "8px",
                                    fontSize: "13.5px"
                                }}>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn-neon"
                                disabled={loading}
                                style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "15px" }}
                            >
                                {loading ? "Sending..." : (
                                    <>
                                        <Send size={16} />
                                        Send Message
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Contact;

