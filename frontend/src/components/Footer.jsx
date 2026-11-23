import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Mail, X, ChevronRight } from "lucide-react";
import api from "../api/axios";
import EventraLogo from "./EventraLogo";

// ── Social Icons (pure SVG — no emojis, no icon libs) ──────────────
function IconInstagram() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
    );
}
function IconTwitterX() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zM17.084 19.77h1.833L7.084 4.126H5.117L17.084 19.77z" />
        </svg>
    );
}
function IconFacebook() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    );
}
function IconWhatsApp() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
}

// ── Feedback Modal ──────────────────────────────────────────────────
function FeedbackModal({ onClose }) {
    const overlayRef = useRef(null);
    const panelRef = useRef(null);

    const [form, setForm] = useState({ name: "", email: "", type: "GENERAL", message: "" });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    // Animate in on mount
    useGSAP(() => {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out" });
        gsap.fromTo(panelRef.current, { opacity: 0, y: 32, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "power3.out" });
    });

    function closeWithAnimation() {
        gsap.to(panelRef.current, { opacity: 0, y: 20, scale: 0.97, duration: 0.2, ease: "power2.in" });
        gsap.to(overlayRef.current, { opacity: 0, duration: 0.25, onComplete: onClose });
    }

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
            setTimeout(closeWithAnimation, 2200);
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
        borderRadius: "8px",
        padding: "10px 14px",
        color: "#f8fafc",
        fontSize: "14px",
        outline: "none",
        fontFamily: "inherit",
        transition: "border-color 0.15s ease"
    };
    const labelStyle = { display: "block", fontSize: "12.5px", fontWeight: "600", color: "#94a3b8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" };

    return (
        <div
            ref={overlayRef}
            onClick={(e) => e.target === overlayRef.current && closeWithAnimation()}
            style={{
                position: "fixed", inset: 0, zIndex: 200,
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(6px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "20px"
            }}
        >
            <div
                ref={panelRef}
                className="glass-panel"
                style={{ width: "100%", maxWidth: "480px", padding: "36px", position: "relative" }}
            >
                {/* Close */}
                <button
                    onClick={closeWithAnimation}
                    style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
                >
                    <X size={18} />
                </button>

                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff", marginBottom: "4px", letterSpacing: "-0.02em" }}>
                    Share Your Feedback
                </h2>
                <p style={{ fontSize: "13.5px", color: "#64748b", marginBottom: "28px" }}>
                    We read every submission — your input shapes the product.
                </p>

                {success ? (
                    <div style={{ textAlign: "center", padding: "24px 0" }}>
                        <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "1.5px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <p style={{ color: "#f8fafc", fontWeight: "600", fontSize: "15px" }}>Feedback received</p>
                        <p style={{ color: "#64748b", fontSize: "13.5px", marginTop: "4px" }}>Thank you — we will review it shortly.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                            <div>
                                <label style={labelStyle}>Name</label>
                                <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" style={inputStyle} required />
                            </div>
                            <div>
                                <label style={labelStyle}>Email</label>
                                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" style={inputStyle} required />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Type</label>
                            <select name="type" value={form.type} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }}>
                                <option value="GENERAL">General</option>
                                <option value="COMPLAINT">Complaint</option>
                                <option value="BUG">Bug Report</option>
                                <option value="FEATURE_REQUEST">Feature Request</option>
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>Message</label>
                            <textarea
                                name="message"
                                value={form.message}
                                onChange={handleChange}
                                placeholder="Tell us what's on your mind..."
                                rows={4}
                                style={{ ...inputStyle, resize: "vertical", lineHeight: "1.55" }}
                                required
                            />
                        </div>

                        {error && (
                            <p style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "10px 14px", borderRadius: "8px", fontSize: "13.5px" }}>
                                {error}
                            </p>
                        )}

                        <button type="submit" className="btn-neon" disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
                            {loading ? "Sending..." : "Send Feedback"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

// ── Footer ──────────────────────────────────────────────────────────
function Footer() {
    const [modalOpen, setModalOpen] = useState(false);
    const [showFullSpecs, setShowFullSpecs] = useState(false);
    const year = new Date().getFullYear();

    const colHeadStyle = {
        fontSize: "11px",
        fontWeight: "700",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: "16px"
    };
    const linkStyle = {
        display: "flex",
        alignItems: "center",
        gap: "5px",
        color: "#94a3b8",
        textDecoration: "none",
        fontSize: "14px",
        lineHeight: "1",
        padding: "5px 0",
        transition: "color 0.15s ease"
    };
    const socialBtnStyle = {
        width: "36px",
        height: "36px",
        borderRadius: "8px",
        background: "#1a1a24",
        border: "1px solid #2a2a38",
        color: "#94a3b8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.15s ease",
        textDecoration: "none"
    };

    return (
        <>
            {modalOpen && <FeedbackModal onClose={() => setModalOpen(false)} />}

            <footer
                style={{
                    borderTop: "1px solid #1c1c24",
                    marginTop: "80px",
                    paddingTop: "60px",
                    paddingBottom: "36px",
                    padding: "60px 24px 36px"
                }}
            >
                <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

                    {/* Platform Architecture & Component Overview (Expandable) */}
                    <div
                        style={{
                            background: "rgba(18, 18, 24, 0.45)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "16px",
                            padding: "24px 28px",
                            marginBottom: "48px",
                            backdropFilter: "blur(12px)"
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: showFullSpecs ? "20px" : "0" }}>
                            <div>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />
                                    <span style={{ color: "#22c55e", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                        Platform Architecture & Capabilities
                                    </span>
                                </div>
                                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#f8fafc", margin: "4px 0" }}>
                                    Complete Multi-Tenant Event Infrastructure
                                </h3>
                                <p style={{ fontSize: "13.5px", color: "#94a3b8", margin: 0, maxWidth: "680px", lineHeight: "1.5" }}>
                                    Engineered with enterprise-grade tenant isolation, real-time ticket inventory locking, automated Stripe webhooks, and instant QR check-in scanning.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowFullSpecs(!showFullSpecs)}
                                className="btn-secondary"
                                style={{ padding: "8px 16px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                            >
                                {showFullSpecs ? "Show Less" : "Read More & Specs"}
                                <ChevronRight size={14} style={{ transform: showFullSpecs ? "rotate(90deg)" : "none", transition: "transform 0.2s ease" }} />
                            </button>
                        </div>

                        {showFullSpecs && (
                            <div
                                style={{
                                    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                                    paddingTop: "20px",
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                                    gap: "20px",
                                    marginTop: "16px"
                                }}
                            >
                                <div>
                                    <h4 style={{ fontSize: "13.5px", fontWeight: "700", color: "#22c55e", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                        Core Modules
                                    </h4>
                                    <ul style={{ margin: 0, paddingLeft: "18px", color: "#94a3b8", fontSize: "13px", lineHeight: "1.7" }}>
                                        <li><strong style={{ color: "#e2e8f0" }}>Organization Hub:</strong> Custom slugs, branding, domain isolation.</li>
                                        <li><strong style={{ color: "#e2e8f0" }}>Event Lifecycle:</strong> Multi-date, venue mappings, status controls.</li>
                                        <li><strong style={{ color: "#e2e8f0" }}>Tiered Ticketing:</strong> Dynamic pricing, early-bird & VIP tiers.</li>
                                        <li><strong style={{ color: "#e2e8f0" }}>Booking Flow:</strong> Atomic reservations preventing overselling.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 style={{ fontSize: "13.5px", fontWeight: "700", color: "#60a5fa", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                        Security & Verification
                                    </h4>
                                    <ul style={{ margin: 0, paddingLeft: "18px", color: "#94a3b8", fontSize: "13px", lineHeight: "1.7" }}>
                                        <li><strong style={{ color: "#e2e8f0" }}>QR Check-in Engine:</strong> One-tap cryptographic scanning.</li>
                                        <li><strong style={{ color: "#e2e8f0" }}>RBAC Permissions:</strong> Owner, Admin, and Scanner roles.</li>
                                        <li><strong style={{ color: "#e2e8f0" }}>Data Privacy:</strong> Strict per-tenant database queries.</li>
                                        <li><strong style={{ color: "#e2e8f0" }}>Secure Sessions:</strong> JWT tokens & encrypted credentials.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 style={{ fontSize: "13.5px", fontWeight: "700", color: "#c084fc", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                        Integrations & APIs
                                    </h4>
                                    <ul style={{ margin: 0, paddingLeft: "18px", color: "#94a3b8", fontSize: "13px", lineHeight: "1.7" }}>
                                        <li><strong style={{ color: "#e2e8f0" }}>Stripe Checkout:</strong> Automatic settlements & webhook sync.</li>
                                        <li><strong style={{ color: "#e2e8f0" }}>Automated Jobs:</strong> Nightly expired event auto-cleanup.</li>
                                        <li><strong style={{ color: "#e2e8f0" }}>GraphQL Endpoint:</strong> High-speed queries for modern clients.</li>
                                        <li><strong style={{ color: "#e2e8f0" }}>Cloudinary Storage:</strong> Optimized media and banner assets.</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Top grid */}
                    <div
                        className="footer-grid"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr 1fr 1fr",
                            gap: "48px",
                            marginBottom: "56px"
                        }}
                    >
                        {/* Brand column */}
                        <div>
                            <Link to="/" style={{ display: "inline-block", marginBottom: "14px" }}>
                                <EventraLogo height={26} />
                            </Link>
                            <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.65", maxWidth: "240px", marginBottom: "24px" }}>
                                The premier platform for event organizations. Manage tickets, teams, and revenue from one unified hub.
                            </p>

                            {/* Social icons */}
                            <div style={{ display: "flex", gap: "10px" }}>
                                <a href="https://instagram.com" target="_blank" rel="noreferrer" style={socialBtnStyle} title="Instagram">
                                    <IconInstagram />
                                </a>
                                <a href="https://twitter.com" target="_blank" rel="noreferrer" style={socialBtnStyle} title="X (Twitter)">
                                    <IconTwitterX />
                                </a>
                                <a href="https://facebook.com" target="_blank" rel="noreferrer" style={socialBtnStyle} title="Facebook">
                                    <IconFacebook />
                                </a>
                                <a href="https://wa.me" target="_blank" rel="noreferrer" style={socialBtnStyle} title="WhatsApp">
                                    <IconWhatsApp />
                                </a>
                            </div>
                        </div>

                        {/* Product */}
                        <div>
                            <p style={colHeadStyle}>Product</p>
                            <nav style={{ display: "flex", flexDirection: "column" }}>
                                <Link to="/" style={linkStyle}><ChevronRight size={12} />Overview</Link>
                                <Link to="/pricing" style={linkStyle}><ChevronRight size={12} />Pricing</Link>
                                <Link to="/events" style={linkStyle}><ChevronRight size={12} />Explore Events</Link>
                                <Link to="/register" style={linkStyle}><ChevronRight size={12} />Get Started</Link>
                            </nav>
                        </div>

                        {/* Company */}
                        <div>
                            <p style={colHeadStyle}>Company</p>
                            <nav style={{ display: "flex", flexDirection: "column" }}>
                                <Link to="/contact" style={linkStyle}><ChevronRight size={12} />Contact Us</Link>
                                <a href="#" style={linkStyle}><ChevronRight size={12} />About Us</a>
                                <a href="#" style={linkStyle}><ChevronRight size={12} />Careers</a>
                                <a href="#" style={linkStyle}><ChevronRight size={12} />API Reference</a>
                                <a href="#" style={linkStyle}><ChevronRight size={12} />Documentation</a>
                            </nav>
                        </div>

                        {/* Support */}
                        <div>
                            <p style={colHeadStyle}>Support</p>
                            <nav style={{ display: "flex", flexDirection: "column" }}>
                                <a href="mailto:support@eventra.app" style={linkStyle}>
                                    <Mail size={13} />support@eventra.app
                                </a>
                                <a href="#" style={linkStyle}><ChevronRight size={12} />Privacy Policy</a>
                                <a href="#" style={linkStyle}><ChevronRight size={12} />Terms of Service</a>
                                <button
                                    onClick={() => setModalOpen(true)}
                                    style={{
                                        ...linkStyle,
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: "5px 0",
                                        fontFamily: "inherit",
                                        marginTop: "8px",
                                        color: "#22c55e",
                                        fontWeight: "600"
                                    }}
                                >
                                    <ChevronRight size={12} />Give Feedback
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div
                        style={{
                            borderTop: "1px solid #1c1c24",
                            paddingTop: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "12px"
                        }}
                    >
                        <p style={{ color: "#475569", fontSize: "13px" }}>
                            &copy; {year} Eventra Technologies Inc. All rights reserved.
                        </p>
                        <p style={{ color: "#334155", fontSize: "12px" }}>
                            Built for event-driven organizations.
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
}

export default Footer;

