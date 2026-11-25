import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Search,
    Calendar,
    MapPin,
    ArrowRight,
    ShieldCheck,
    CreditCard,
    Users,
    CheckCircle,
    Ticket,
    Building2,
    QrCode,
    Zap,
    Activity,
    Lock
} from "lucide-react";
import api from "../api/axios";
import AnimatedBackground from "../components/AnimatedBackground";

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
    const [platformStats, setPlatformStats] = useState({
        totalOrganizations: 6,
        totalEvents: 9,
        totalAttendees: 21,
        totalMembers: 7
    });

    async function fetchEvents(cat = selectedCategory) {
        setLoadingEvents(true);
        try {
            const params = { page: 1, limit: 6 };
            if (cat && cat !== "All") {
                params.category = cat;
            }
            const res = await api.get("/events", { params });
            const validEvents = (res.data.data || []).filter(e => !e.isExpired);
            setLiveEvents(validEvents);
        } catch (err) {
            setLiveEvents([]);
        } finally {
            setLoadingEvents(false);
        }
    }

    // Load real public events and platform metrics from backend
    useEffect(() => {
        fetchEvents("All");
        api.get("/events/public/stats")
            .then(res => {
                if (res.data?.data) {
                    setPlatformStats(res.data.data);
                }
            })
            .catch(() => {});
    }, []);

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
        <div style={{ paddingBottom: "100px", position: "relative" }}>

            {/* ── Top Atmospheric Ambient Animated Hero Canvas ── */}
            <div style={{ position: "relative", overflow: "hidden", minHeight: "auto" }}>
                <AnimatedBackground />

                {/* ── Focused Hero Section ─────────────────────────────── */}
                <section
                    ref={heroRef}
                    style={{
                        position: "relative",
                        padding: "clamp(60px, 8vw, 100px) 16px 40px",
                        maxWidth: "980px",
                        margin: "0 auto",
                        textAlign: "center",
                        zIndex: 2
                    }}
                >
                    <div style={{ position: "relative", zIndex: 1 }}>
                    {/* Professional Pill Badge */}
                    <div
                        className="animate-fade-in-up"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "rgba(34, 197, 94, 0.08)",
                            border: "1px solid rgba(34, 197, 94, 0.25)",
                            borderRadius: "9999px",
                            padding: "6px 16px",
                            marginBottom: "22px",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#f8fafc"
                        }}
                    >
                        <span className="live-dot-pulse" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e" }} />
                        <span>Multi-Tenant Event Management & Ticketing</span>
                    </div>

                    {/* Headline - Title Case with Clean Modern Typography (No period) */}
                    <h1>
                        <span className="hero-glow-title">
                            Scale Your <span className="hero-glow-accent">Event Empire</span> with Eventra
                        </span>
                    </h1>

                    <p
                        className="animate-fade-in-up"
                        style={{
                            fontSize: "clamp(15px, 1.6vw, 17.5px)",
                            color: "#94a3b8",
                            maxWidth: "620px",
                            margin: "0 auto 38px",
                            lineHeight: "1.7",
                            fontWeight: "400",
                            animationDelay: "0.1s"
                        }}
                    >
                        From Ticket Sales to Team Management → Everything Your Organization Needs, in One Place
                    </p>

                    {/* Interactive Hook: Live Search Bar */}
                    <form
                        onSubmit={handleSearchSubmit}
                        style={{
                            maxWidth: "600px",
                            margin: "0 auto 24px",
                            display: "flex",
                            alignItems: "center",
                            background: "rgba(18, 18, 24, 0.42)",
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "12px",
                            padding: "6px 8px 6px 16px",
                            boxShadow: "0 12px 32px -8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(34, 197, 94, 0.06)",
                            transition: "all 0.2s ease"
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "#22c55e"; e.currentTarget.style.boxShadow = "0 0 25px rgba(34, 197, 94, 0.2)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"; e.currentTarget.style.boxShadow = "0 12px 32px -8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(34, 197, 94, 0.06)"; }}
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
                            Instant Revenue Settlements
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

                    {/* ── Real Live Platform Metrics Showcase ── */}
                    <div
                        style={{
                            maxWidth: "940px",
                            width: "100%",
                            margin: "44px auto 0",
                            background: "rgba(18, 18, 24, 0.45)",
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "16px",
                            padding: "24px 28px",
                            boxShadow: "0 20px 48px -10px rgba(0, 0, 0, 0.5)"
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                paddingBottom: "16px",
                                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                                marginBottom: "20px",
                                flexWrap: "wrap",
                                gap: "10px"
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                                <span style={{ fontSize: "13px", fontWeight: "600", color: "#f8fafc" }}>
                                    Live Platform Scale
                                </span>
                            </div>
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                                Production Network Metrics
                            </span>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                gap: "16px"
                            }}
                        >
                            <div style={{ background: "rgba(255, 255, 255, 0.025)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "16px 20px", textAlign: "left" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "#22c55e" }}>
                                    <Building2 size={16} />
                                    <span style={{ fontSize: "12.5px", color: "#94a3b8", fontWeight: "500" }}>Organizations</span>
                                </div>
                                <div style={{ fontSize: "28px", fontWeight: "800", color: "#f8fafc", lineHeight: "1.1" }}>
                                    {platformStats.totalOrganizations}
                                </div>
                                <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "4px" }}>
                                    Active organizers registered
                                </div>
                            </div>

                            <div style={{ background: "rgba(255, 255, 255, 0.025)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "16px 20px", textAlign: "left" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "#60a5fa" }}>
                                    <Calendar size={16} />
                                    <span style={{ fontSize: "12.5px", color: "#94a3b8", fontWeight: "500" }}>Events Published</span>
                                </div>
                                <div style={{ fontSize: "28px", fontWeight: "800", color: "#f8fafc", lineHeight: "1.1" }}>
                                    {platformStats.totalEvents}
                                </div>
                                <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "4px" }}>
                                    Live sessions scheduled
                                </div>
                            </div>

                            <div style={{ background: "rgba(255, 255, 255, 0.025)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "16px 20px", textAlign: "left" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "#c084fc" }}>
                                    <Ticket size={16} />
                                    <span style={{ fontSize: "12.5px", color: "#94a3b8", fontWeight: "500" }}>Reservations</span>
                                </div>
                                <div style={{ fontSize: "28px", fontWeight: "800", color: "#f8fafc", lineHeight: "1.1" }}>
                                    {platformStats.totalAttendees}
                                </div>
                                <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "4px" }}>
                                    Attendee tickets reserved
                                </div>
                            </div>

                            <div style={{ background: "rgba(255, 255, 255, 0.025)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px", padding: "16px 20px", textAlign: "left" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "#38bdf8" }}>
                                    <Users size={16} />
                                    <span style={{ fontSize: "12.5px", color: "#94a3b8", fontWeight: "500" }}>Team Members</span>
                                </div>
                                <div style={{ fontSize: "28px", fontWeight: "800", color: "#f8fafc", lineHeight: "1.1" }}>
                                    {platformStats.totalMembers}
                                </div>
                                <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "4px" }}>
                                    Staff & gate coordinators
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>

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
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />
                            <span style={{ color: "#22c55e", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                Upcoming Events {selectedCategory !== "All" && `· ${selectedCategory}`}
                            </span>
                        </div>
                        <h2
                            style={{
                                fontSize: "clamp(24px, 3vw, 32px)",
                                fontWeight: "800",
                                letterSpacing: "-0.025em",
                                color: "#f8fafc"
                            }}
                        >
                            {selectedCategory === "All" ? "Featured Events" : `${selectedCategory} Events`}
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
                            gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
                            gap: "20px"
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
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#94a3b8", fontSize: "12.5px" }}>
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
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#94a3b8", fontSize: "13px", marginBottom: "20px" }}>
                                            <MapPin size={13} />
                                            <span>{evt.location}</span>
                                        </div>
                                    )}
                                </div>

                                <div style={{ paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
                                    <Link
                                        to={`/events/${evt._id}`}
                                        state={{ event: evt }}
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
                        style={{
                            fontSize: "clamp(26px, 3vw, 34px)",
                            fontWeight: "800",
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
                        gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
                        gap: "20px"
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
                            title: "Flexible Organization Billing",
                            body: "Seamless organization upgrades to Pro for unlimited event capacity, team invitations, and advanced event management analytics."
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
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />
                        <span style={{ color: "#22c55e", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Pricing Plans
                        </span>
                    </div>
                    <h2
                        style={{
                            fontSize: "clamp(26px, 3vw, 34px)",
                            fontWeight: "800",
                            letterSpacing: "-0.025em",
                            color: "#f8fafc",
                            marginTop: "4px"
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
                                "Self-Serve Billing Portal"
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
