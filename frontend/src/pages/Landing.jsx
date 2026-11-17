import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
    Search,
    Calendar,
    MapPin,
    ArrowRight,
    ShieldCheck,
    CreditCard,
    Users,
    CheckCircle,
    Ticket
} from "lucide-react";
import api from "../api/axios";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const QUICK_CATEGORIES = ["All", "Tech", "Music", "Sports", "Art", "Other"];

function Landing() {
    const navigate = useNavigate();
    const heroRef = useRef(null);
    const eventsRef = useRef(null);
    const featureTitleRef = useRef(null);
    const featureCardsRef = useRef(null);
    const pricingRef = useRef(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [liveEvents, setLiveEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);

    async function fetchEvents(cat = selectedCategory) {
        setLoadingEvents(true);
        try {
            const params = { page: 1, limit: 6 };
            if (cat && cat !== "All") {
                params.category = cat;
            }
            const res = await api.get("/events", { params });
            setLiveEvents(res.data.data || []);
        } catch (err) {
            setLiveEvents([]);
        } finally {
            setLoadingEvents(false);
        }
    }

    // Load real public events from backend
    useEffect(() => {
        fetchEvents("All");
    }, []);

    // GSAP animations on hero mount
    useGSAP(() => {
        gsap.fromTo(
            heroRef.current,
            { opacity: 0, y: 26 },
            { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
        );
    }, { scope: heroRef });

    // Features scroll trigger
    useGSAP(() => {
        if (featureTitleRef.current) {
            gsap.fromTo(
                featureTitleRef.current,
                { opacity: 0, y: 24 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.65,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: featureTitleRef.current,
                        start: "top 85%",
                    }
                }
            );
        }

        const cards = featureCardsRef.current?.querySelectorAll(".feature-card");
        if (cards?.length) {
            gsap.fromTo(
                cards,
                { opacity: 0, y: 40 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    ease: "power2.out",
                    stagger: 0.12,
                    scrollTrigger: {
                        trigger: featureCardsRef.current,
                        start: "top 82%",
                    }
                }
            );
        }
    });

    // Pricing scroll trigger
    useGSAP(() => {
        if (pricingRef.current) {
            gsap.fromTo(
                pricingRef.current,
                { opacity: 0, y: 36 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.7,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: pricingRef.current,
                        start: "top 85%",
                    }
                }
            );
        }
    });

    function handleSearchSubmit(e) {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            navigate("/events");
        }
    }

    function handleCategoryClick(cat) {
        setSelectedCategory(cat);
        fetchEvents(cat);
        eventsRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    function formatDate(dateStr) {
        if (!dateStr) return "Upcoming";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    return (
        <div style={{ paddingBottom: "100px" }}>

            {/* ── Focused Hero Section ─────────────────────────────── */}
            <section
                ref={heroRef}
                style={{
                    position: "relative",
                    padding: "100px 24px 80px",
                    maxWidth: "940px",
                    margin: "0 auto",
                    textAlign: "center"
                }}
            >
                {/* Subtle, soft ambient lighting behind the headline */}
                <div
                    style={{
                        position: "absolute",
                        top: "35%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "650px",
                        height: "360px",
                        background: "radial-gradient(circle, rgba(34, 197, 94, 0.08) 0%, rgba(168, 85, 247, 0.03) 45%, transparent 75%)",
                        pointerEvents: "none",
                        zIndex: 0
                    }}
                />

                <div style={{ position: "relative", zIndex: 1 }}>
                    {/* Minimal Category Tag */}
                    <p className="font-mono-tag" style={{ marginBottom: "22px" }}>
                        Platform / Multi-Tenant Event Management
                    </p>

                    {/* Headline with Clash Display + Instrument Serif Italic */}
                    <h1
                        className="font-heading-clash"
                        style={{
                            fontSize: "clamp(36px, 5.2vw, 62px)",
                            fontWeight: "600",
                            letterSpacing: "-0.035em",
                            lineHeight: "1.1",
                            marginBottom: "24px",
                            color: "#f8fafc"
                        }}
                    >
                        Scale your event business <br />
                        <span
                            className="font-editorial-serif"
                            style={{
                                fontSize: "1.14em",
                                fontWeight: "400",
                                color: "#e2e8f0",
                                letterSpacing: "-0.01em"
                            }}
                        >
                            without the operational friction.
                        </span>
                    </h1>

                    <p
                        style={{
                            fontSize: "clamp(16px, 1.8vw, 19px)",
                            color: "#94a3b8",
                            maxWidth: "640px",
                            margin: "0 auto 38px",
                            lineHeight: "1.65",
                            fontWeight: "400"
                        }}
                    >
                        The modern platform for event creators and organizations. Launch branded events,
                        manage multi-tier tickets, invite team members, and accept global payments
                        with automated Stripe billing.
                    </p>

                    {/* Interactive Hook: Live Search Bar */}
                    <form
                        onSubmit={handleSearchSubmit}
                        style={{
                            maxWidth: "600px",
                            margin: "0 auto 24px",
                            display: "flex",
                            alignItems: "center",
                            background: "#121217",
                            border: "1px solid #23232c",
                            borderRadius: "12px",
                            padding: "6px 8px 6px 16px",
                            boxShadow: "0 12px 32px -8px rgba(0, 0, 0, 0.5)"
                        }}
                    >
                        <Search size={18} color="#64748b" style={{ flexShrink: 0, marginRight: "10px" }} />
                        <input
                            type="text"
                            placeholder="Search real events by title, topic, or city..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                flex: 1,
                                background: "transparent",
                                border: "none",
                                outline: "none",
                                color: "#f8fafc",
                                fontSize: "14.5px",
                                fontFamily: "inherit"
                            }}
                        />
                        <button
                            type="submit"
                            className="btn-neon"
                            style={{ padding: "10px 20px", fontSize: "14px", flexShrink: 0 }}
                        >
                            Search
                        </button>
                    </form>

                    {/* Category Fast Filter Pills */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                            marginBottom: "38px"
                        }}
                    >
                        <span style={{ fontSize: "12.5px", color: "#64748b", marginRight: "4px" }}>Browse:</span>
                        {QUICK_CATEGORIES.map((cat) => {
                            const isActive = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryClick(cat)}
                                    style={{
                                        background: isActive ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.03)",
                                        border: isActive ? "1px solid #22c55e" : "1px solid #23232c",
                                        color: isActive ? "#22c55e" : "#94a3b8",
                                        boxShadow: isActive ? "0 0 12px rgba(34, 197, 94, 0.25)" : "none",
                                        fontWeight: isActive ? "600" : "400",
                                        padding: "6px 14px",
                                        borderRadius: "20px",
                                        fontSize: "12.5px",
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                        fontFamily: "inherit"
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.borderColor = "#22c55e";
                                            e.currentTarget.style.color = "#ffffff";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.borderColor = "#23232c";
                                            e.currentTarget.style.color = "#94a3b8";
                                        }
                                    }}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>

                    {/* Primary Actions */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "14px",
                            flexWrap: "wrap",
                            marginBottom: "36px"
                        }}
                    >
                        <Link
                            to="/register"
                            className="btn-neon"
                            style={{ padding: "14px 28px", fontSize: "15px" }}
                        >
                            Create an Organization
                            <ArrowRight size={16} />
                        </Link>
                        <Link
                            to="/events"
                            className="btn-secondary"
                            style={{ padding: "14px 26px", fontSize: "15px" }}
                        >
                            Explore All Events
                        </Link>
                    </div>

                    {/* Understated Spec Badges */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "24px",
                            flexWrap: "wrap",
                            paddingTop: "16px",
                            borderTop: "1px solid rgba(255, 255, 255, 0.06)"
                        }}
                    >
                        <span style={{ fontSize: "12.5px", color: "#64748b", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />
                            Automated Stripe Payouts
                        </span>
                        <span style={{ fontSize: "12.5px", color: "#64748b", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a855f7" }} />
                            Strict Multi-Tenant Isolation
                        </span>
                        <span style={{ fontSize: "12.5px", color: "#64748b", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#60a5fa" }} />
                            Role-Based Team Access
                        </span>
                    </div>
                </div>
            </section>

            {/* ── Real Live Public Events Showcase ──────────────────── */}
            <section
                ref={eventsRef}
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto 100px",
                    padding: "0 24px"
                }}
            >
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "36px", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                        <span className="font-mono-tag" style={{ color: "#22c55e", marginBottom: "8px", display: "inline-block" }}>
                            Live Directory {selectedCategory !== "All" && `• ${selectedCategory}`}
                        </span>
                        <h2
                            className="font-heading-clash"
                            style={{
                                fontSize: "clamp(24px, 3vw, 32px)",
                                fontWeight: "700",
                                letterSpacing: "-0.02em",
                                color: "#f8fafc"
                            }}
                        >
                            {selectedCategory === "All" ? "Featured Upcoming Events" : `${selectedCategory} Events`}
                        </h2>
                    </div>

                    <Link
                        to={selectedCategory === "All" ? "/events" : `/events?category=${encodeURIComponent(selectedCategory)}`}
                        className="btn-secondary"
                        style={{ padding: "8px 18px", fontSize: "13.5px" }}
                    >
                        View All {selectedCategory !== "All" ? `${selectedCategory} ` : ""}Events <ArrowRight size={14} />
                    </Link>
                </div>

                {loadingEvents ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="glass-panel" style={{ height: "240px", opacity: 0.4 }} />
                        ))}
                    </div>
                ) : liveEvents.length === 0 ? (
                    <div
                        className="glass-panel"
                        style={{
                            padding: "48px 24px",
                            textAlign: "center"
                        }}
                    >
                        <Calendar size={36} color="#64748b" style={{ margin: "0 auto 14px" }} />
                        <h3 style={{ fontSize: "18px", color: "#f8fafc", marginBottom: "8px", fontWeight: "600" }}>
                            No {selectedCategory !== "All" ? `${selectedCategory} ` : ""}events scheduled right now
                        </h3>
                        <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>
                            {selectedCategory !== "All"
                                ? `No upcoming events found in "${selectedCategory}". Try choosing another category or explore all events.`
                                : "Create your organization to be the first to publish tickets on Eventra."}
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                            {selectedCategory !== "All" && (
                                <button
                                    onClick={() => handleCategoryClick("All")}
                                    className="btn-secondary"
                                    style={{ padding: "10px 20px", fontSize: "13.5px" }}
                                >
                                    Reset to All
                                </button>
                            )}
                            <Link to="/events" className="btn-secondary" style={{ padding: "10px 20px", fontSize: "13.5px" }}>
                                Browse All Events
                            </Link>
                            <Link to="/register" className="btn-neon" style={{ padding: "10px 20px", fontSize: "13.5px" }}>
                                Create an Organization
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                            gap: "24px"
                        }}
                    >
                        {liveEvents.map((evt) => (
                            <div
                                key={evt._id}
                                className="glass-panel glass-panel-hover"
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    padding: "26px",
                                    borderRadius: "14px",
                                    position: "relative"
                                }}
                            >
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                                        <span className="badge-neon" style={{ fontSize: "11px", padding: "3px 10px" }}>
                                            {evt.category || "General"}
                                        </span>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12.5px" }}>
                                            <Calendar size={13} color="#22c55e" />
                                            <span>{formatDate(evt.date)}</span>
                                        </div>
                                    </div>

                                    <h3
                                        style={{
                                            fontSize: "20px",
                                            fontWeight: "700",
                                            color: "#ffffff",
                                            marginBottom: "10px",
                                            lineHeight: "1.3"
                                        }}
                                    >
                                        {evt.title}
                                    </h3>

                                    {evt.description && (
                                        <p
                                            style={{
                                                color: "#94a3b8",
                                                fontSize: "13.5px",
                                                lineHeight: "1.6",
                                                marginBottom: "16px",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden"
                                            }}
                                        >
                                            {evt.description}
                                        </p>
                                    )}

                                    {evt.location && (
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>
                                            <MapPin size={13} />
                                            <span>{evt.location}</span>
                                        </div>
                                    )}
                                </div>

                                <div style={{ paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
                                    <Link
                                        to={`/events/${evt._id}`}
                                        className="btn-neon"
                                        style={{ width: "100%", justifyContent: "center", padding: "10px 16px", fontSize: "13.5px" }}
                                    >
                                        <Ticket size={14} /> View & Book Tickets
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Features Grid ────────────────────────────────────── */}
            <section
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto 110px",
                    padding: "0 24px"
                }}
            >
                <div ref={featureTitleRef} style={{ textAlign: "center", marginBottom: "52px" }}>
                    <h2
                        className="font-heading-clash"
                        style={{
                            fontSize: "clamp(26px, 3vw, 34px)",
                            fontWeight: "700",
                            letterSpacing: "-0.025em",
                            color: "#f8fafc"
                        }}
                    >
                        Engineered for High-Growth Event Companies
                    </h2>
                    <p style={{ color: "#64748b", fontSize: "15px", marginTop: "10px" }}>
                        Everything you need to manage tickets, revenue, and team members in one place.
                    </p>
                </div>

                <div
                    ref={featureCardsRef}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
                        gap: "24px"
                    }}
                >
                    {[
                        {
                            icon: <ShieldCheck size={22} color="#22c55e" />,
                            iconBg: "rgba(34, 197, 94, 0.1)",
                            title: "True Multi-Tenant Isolation",
                            body: "Every organization has its own isolated workspace. Events, tickets, bookings, and customer data are strictly separated at the database and middleware level."
                        },
                        {
                            icon: <CreditCard size={22} color="#c084fc" />,
                            iconBg: "rgba(168, 85, 247, 0.1)",
                            title: "Automated Stripe Subscriptions",
                            body: "Seamless checkout with instant webhooks that upgrade organizations to Pro. Includes a self-serve Customer Portal for invoices and payment method management."
                        },
                        {
                            icon: <Users size={22} color="#60a5fa" />,
                            iconBg: "rgba(59, 130, 246, 0.1)",
                            title: "Team Collaboration & Invites",
                            body: "Invite staff via secure email links. Role-based access ensures your team can manage events and tickets while billing settings stay protected."
                        }
                    ].map((f) => (
                        <div
                            key={f.title}
                            className="glass-panel glass-panel-hover feature-card"
                            style={{ padding: "32px" }}
                        >
                            <div
                                style={{
                                    width: "44px",
                                    height: "44px",
                                    borderRadius: "10px",
                                    background: f.iconBg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: "20px"
                                }}
                            >
                                {f.icon}
                            </div>
                            <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "10px", color: "#f8fafc" }}>
                                {f.title}
                            </h3>
                            <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.65" }}>
                                {f.body}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Pricing Preview ───────────────────────────────────── */}
            <section
                ref={pricingRef}
                style={{ maxWidth: "960px", margin: "0 auto", padding: "0 24px" }}
            >
                <div style={{ textAlign: "center", marginBottom: "44px" }}>
                    <p className="font-mono-tag" style={{ marginBottom: "12px" }}>
                        Pricing / Transparent Tiers
                    </p>
                    <h2
                        className="font-heading-clash"
                        style={{
                            fontSize: "clamp(26px, 3vw, 34px)",
                            fontWeight: "700",
                            letterSpacing: "-0.025em",
                            color: "#f8fafc",
                            marginTop: "8px"
                        }}
                    >
                        Choose the Plan That Fits Your Scale
                    </h2>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: "28px"
                    }}
                >
                    {/* Free */}
                    <div className="glass-panel" style={{ padding: "36px" }}>
                        <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#ffffff" }}>Starter</h3>
                        <p style={{ color: "#64748b", fontSize: "14px", margin: "6px 0 22px" }}>
                            Ideal for community meetups and small-scale events.
                        </p>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "28px" }}>
                            <span style={{ fontSize: "42px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.04em" }}>$0</span>
                            <span style={{ color: "#64748b", fontSize: "14px" }}>/month</span>
                        </div>
                        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                            {["Max 3 Active Events", "Public Event Listing", "Standard Email Receipts"].map((item) => (
                                <li key={item} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#94a3b8" }}>
                                    <CheckCircle size={16} color="#22c55e" /> {item}
                                </li>
                            ))}
                        </ul>
                        <Link to="/register" className="btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                            Get Started Free
                        </Link>
                    </div>

                    {/* Pro */}
                    <div
                        className="glass-panel"
                        style={{
                            padding: "36px",
                            border: "1.5px solid rgba(34, 197, 94, 0.4)",
                            position: "relative",
                            boxShadow: "0 0 40px rgba(34, 197, 94, 0.08)"
                        }}
                    >
                        <div style={{ position: "absolute", top: "-13px", right: "24px" }}>
                            <span className="badge-pro" style={{ padding: "4px 12px", fontSize: "10.5px" }}>
                                RECOMMENDED
                            </span>
                        </div>
                        <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#ffffff" }}>Pro</h3>
                        <p style={{ color: "#64748b", fontSize: "14px", margin: "6px 0 22px" }}>
                            For professional event companies and high-volume sellers.
                        </p>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "28px" }}>
                            <span style={{ fontSize: "42px", fontWeight: "800", color: "#22c55e", letterSpacing: "-0.04em" }}>$29</span>
                            <span style={{ color: "#64748b", fontSize: "14px" }}>/month</span>
                        </div>
                        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                            {[
                                "Unlimited Events",
                                "Team Invites and Staff Roles",
                                "Organization Analytics Hub",
                                "Self-Serve Stripe Portal"
                            ].map((item) => (
                                <li key={item} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#ffffff" }}>
                                    <CheckCircle size={16} color="#22c55e" /> {item}
                                </li>
                            ))}
                        </ul>
                        <Link to="/pricing" className="btn-neon" style={{ width: "100%", justifyContent: "center" }}>
                            Upgrade to Pro
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Landing;
