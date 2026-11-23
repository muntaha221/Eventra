import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import EventraLogo from "../components/EventraLogo";
import {
    LayoutDashboard,
    Calendar,
    Ticket,
    Users,
    CreditCard,
    Settings,
    Globe,
    Crown,
    LogOut,
    Plus,
    UserPlus,
    Trash2,
    Edit3,
    AlertCircle,
    Zap,
    ExternalLink,
    CheckCircle,
    Menu,
    X,
    DollarSign,
    MapPin,
    ChevronLeft,
    ChevronRight,
    QrCode,
    Check
} from "lucide-react";
import gsap from "gsap";
import TicketScanner from "../components/TicketScanner";
import { useToast } from "../components/Toast";

function AdminDashboard() {
    const navigate = useNavigate();
    const toast = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "dashboard";

    const [stats, setStats] = useState(null);
    const [events, setEvents] = useState([]);
    const [members, setMembers] = useState([]);
    const [attendees, setAttendees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        return localStorage.getItem("eventra_sidebar_collapsed") === "true";
    });

    useEffect(() => {
        localStorage.setItem("eventra_sidebar_collapsed", sidebarCollapsed);
    }, [sidebarCollapsed]);

    // Team Invite Modal State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteSending, setInviteSending] = useState(false);
    const [inviteMessage, setInviteMessage] = useState("");

    // Stripe checkout / portal loading
    const [billingLoading, setBillingLoading] = useState(false);

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const isOwner = user?.role === "ORG_OWNER";
    const isPro = stats?.organization?.planTier === "PRO";

    async function loadDashboardData() {
        setLoading(true);
        setError("");
        try {
            const [statsRes, eventsRes, membersRes, attendeesRes] = await Promise.all([
                api.get("/admin/org/stats"),
                api.get("/events/org/my-events"),
                isOwner ? api.get("/admin/org/members") : Promise.resolve({ data: { data: [] } }),
                api.get("/bookings/org").catch(() => ({ data: { data: [] } }))
            ]);

            setStats(statsRes.data.data);
            setEvents(eventsRes.data.data || []);
            setMembers(membersRes.data.data || []);
            setAttendees(attendeesRes.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadDashboardData();
    }, []);

    function handleTabChange(tabKey) {
        setSearchParams({ tab: tabKey });
        setMobileMenuOpen(false);
    }

    function handleLogout() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        navigate("/login");
    }

    async function handleSendInvite(e) {
        e.preventDefault();
        setInviteSending(true);
        setInviteMessage("");

        try {
            const res = await api.post("/orgs/invite", { email: inviteEmail });
            setInviteMessage(res.data.message || "Invite dispatched successfully!");
            setInviteEmail("");
            loadDashboardData();
        } catch (err) {
            setInviteMessage(err.response?.data?.message || "Failed to send invitation.");
        } finally {
            setInviteSending(false);
        }
    }

    async function handleDeleteEvent(eventId) {
        if (!window.confirm("Are you sure you want to permanently delete this event?")) return;

        try {
            const res = await api.delete(`/events/${eventId}`);
            toast.success(res.data.message || "Event deleted successfully.");
            loadDashboardData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete event.");
        }
    }

    async function handleCancelBooking(bookingId) {
        if (!window.confirm("Are you sure you want to cancel this booking? This will restore ticket inventory.")) return;

        try {
            await api.patch(`/bookings/org/${bookingId}/cancel`);
            loadDashboardData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to cancel booking.");
        }
    }

    async function handleMarkPaid(bookingId) {
        try {
            await api.patch(`/bookings/org/${bookingId}/mark-paid`);
            loadDashboardData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to mark booking as paid.");
        }
    }

    useEffect(() => {
        if (!loading && activeTab === "dashboard") {
            gsap.fromTo(
                ".kpi-card",
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out" }
            );
        }
    }, [activeTab, loading]);

    async function handleStripeCheckout() {
        setBillingLoading(true);
        try {
            const res = await api.post("/billing/checkout");
            if (res.data.data?.url) {
                window.location.href = res.data.data.url;
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to initialize Stripe checkout.");
        } finally {
            setBillingLoading(false);
        }
    }

    async function handleStripePortal() {
        setBillingLoading(true);
        try {
            const res = await api.get("/billing/portal");
            if (res.data.data?.url) {
                window.location.href = res.data.data.url;
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to open Stripe portal.");
        } finally {
            setBillingLoading(false);
        }
    }

    const NAV_ITEMS = [
        { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
        { key: "events", label: "Events", icon: <Calendar size={18} /> },
        { key: "attendees", label: "Attendees", icon: <Ticket size={18} /> },
        { key: "scanner", label: "Scanner", icon: <QrCode size={18} /> },
        { key: "teams", label: "Teams", icon: <Users size={18} /> },
        { key: "billing", label: "Billing", icon: <CreditCard size={18} /> },
        { key: "settings", label: "Settings", icon: <Settings size={18} /> }
    ];

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0c", color: "#94a3b8" }}>
                <div style={{ textAlign: "center" }}>
                    <EventraLogo height={28} />
                    <p style={{ marginTop: "16px", fontSize: "14px" }}>Loading organization workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", background: "#0a0a0c" }}>

            {/* ── Left Sidebar (Exactly matching user reference image, with GPT-style collapse) ─ */}
            <aside
                style={{
                    width: sidebarCollapsed ? "0px" : "250px",
                    minWidth: sidebarCollapsed ? "0px" : "250px",
                    background: "#0d0d12",
                    borderRight: sidebarCollapsed ? "none" : "1px solid #1c1c24",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: sidebarCollapsed ? "24px 0" : "24px 16px",
                    position: "sticky",
                    top: 0,
                    height: "100vh",
                    flexShrink: 0,
                    zIndex: 40,
                    overflow: "hidden",
                    opacity: sidebarCollapsed ? 0 : 1,
                    pointerEvents: sidebarCollapsed ? "none" : "auto",
                    transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding 0.25s ease, opacity 0.2s ease, border-color 0.2s ease",
                    whiteSpace: "nowrap"
                }}
                className={mobileMenuOpen ? "mobile-sidebar-open" : "desktop-sidebar"}
            >
                <div style={{ minWidth: "218px" }}>
                    {/* Brand Logo at Top + Sleek Collapse Arrow */}
                    <div style={{ padding: "0 6px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Link to="/" style={{ textDecoration: "none", display: "inline-block" }}>
                            <EventraLogo height={26} />
                        </Link>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            {/* Collapse Arrow Button (Desktop) */}
                            <button
                                onClick={() => setSidebarCollapsed(true)}
                                className="desktop-only-btn"
                                title="Collapse sidebar"
                                aria-label="Collapse sidebar"
                                style={{
                                    background: "rgba(255, 255, 255, 0.03)",
                                    border: "1px solid #23232c",
                                    color: "#94a3b8",
                                    cursor: "pointer",
                                    width: "30px",
                                    height: "30px",
                                    borderRadius: "8px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.15s ease",
                                    padding: 0
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "#22c55e";
                                    e.currentTarget.style.borderColor = "rgba(34, 197, 94, 0.4)";
                                    e.currentTarget.style.background = "rgba(34, 197, 94, 0.08)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "#94a3b8";
                                    e.currentTarget.style.borderColor = "#23232c";
                                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                                }}
                            >
                                <ChevronLeft size={17} />
                            </button>

                            {mobileMenuOpen && (
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
                                    aria-label="Close menu"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {NAV_ITEMS.map((item) => {
                            const isActive = activeTab === item.key;
                            return (
                                <button
                                    key={item.key}
                                    onClick={() => handleTabChange(item.key)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        padding: "11px 16px",
                                        borderRadius: "10px",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontFamily: "inherit",
                                        fontWeight: isActive ? "700" : "500",
                                        color: isActive ? "#052e16" : "#94a3b8",
                                        background: isActive ? "#22c55e" : "transparent",
                                        transition: "all 0.15s ease",
                                        width: "100%",
                                        textAlign: "left"
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.color = "#ffffff";
                                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.color = "#94a3b8";
                                            e.currentTarget.style.background = "transparent";
                                        }
                                    }}
                                >
                                    <span style={{ display: "flex", alignItems: "center" }}>{item.icon}</span>
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}

                        {/* Front Page Option on the Side */}
                        <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #1c1c24" }}>
                            <Link
                                to="/"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "10px 16px",
                                    borderRadius: "10px",
                                    color: "#64748b",
                                    textDecoration: "none",
                                    fontSize: "13.5px",
                                    fontWeight: "500",
                                    transition: "all 0.15s ease"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "#22c55e";
                                    e.currentTarget.style.background = "rgba(34, 197, 94, 0.06)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "#64748b";
                                    e.currentTarget.style.background = "transparent";
                                }}
                            >
                                <Globe size={16} />
                                <span>Front Page</span>
                                <ExternalLink size={12} style={{ marginLeft: "auto", opacity: 0.6 }} />
                            </Link>

                            <Link
                                to="/events"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "10px 16px",
                                    borderRadius: "10px",
                                    color: "#64748b",
                                    textDecoration: "none",
                                    fontSize: "13.5px",
                                    fontWeight: "500",
                                    transition: "all 0.15s ease"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "#22c55e";
                                    e.currentTarget.style.background = "rgba(34, 197, 94, 0.06)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "#64748b";
                                    e.currentTarget.style.background = "transparent";
                                }}
                            >
                                <Calendar size={16} />
                                <span>Public Events</span>
                            </Link>
                        </div>
                    </nav>
                </div>

                {/* Bottom Plan Card (Matching reference photo) */}
                <div
                    onClick={() => handleTabChange("billing")}
                    style={{
                        background: "#14141c",
                        border: "1px solid #23232c",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        minWidth: "218px"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(34, 197, 94, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#23232c";
                    }}
                >
                    <div
                        style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "10px",
                            background: "rgba(34, 197, 94, 0.12)",
                            border: "1px solid rgba(34, 197, 94, 0.25)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                        }}
                    >
                        <Crown size={19} color="#22c55e" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13.5px", fontWeight: "700", color: "#ffffff", lineHeight: "1.2" }}>
                            {isPro ? "Pro Plan" : "Starter Plan"}
                        </p>
                        <p style={{ fontSize: "11.5px", color: "#22c55e", fontWeight: "500", marginTop: "2px" }}>
                            Active
                        </p>
                    </div>
                </div>
            </aside>

            {/* ── Main View (Right side with top bar and tab contents) ── */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

                {/* Top Workspace Bar */}
                <header
                    style={{
                        padding: "16px 32px",
                        borderBottom: "1px solid #1c1c24",
                        background: "rgba(10, 10, 12, 0.8)",
                        backdropFilter: "blur(12px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "16px",
                        position: "sticky",
                        top: 0,
                        zIndex: 30
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {/* Expand Sidebar Toggle (when collapsed, GPT-style) */}
                        {sidebarCollapsed && (
                            <div className="desktop-only-btn" style={{ display: "flex", alignItems: "center", gap: "12px", marginRight: "6px" }}>
                                <button
                                    onClick={() => setSidebarCollapsed(false)}
                                    title="Open sidebar"
                                    aria-label="Open sidebar"
                                    style={{
                                        background: "rgba(255, 255, 255, 0.04)",
                                        border: "1px solid #23232c",
                                        color: "#94a3b8",
                                        cursor: "pointer",
                                        width: "34px",
                                        height: "34px",
                                        borderRadius: "8px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 0.15s ease",
                                        padding: 0
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = "#ffffff";
                                        e.currentTarget.style.borderColor = "#22c55e";
                                        e.currentTarget.style.background = "rgba(34, 197, 94, 0.1)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = "#94a3b8";
                                        e.currentTarget.style.borderColor = "#23232c";
                                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                                    }}
                                >
                                    <ChevronRight size={18} />
                                </button>

                                <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }} title="Eventra Home">
                                    <EventraLogo height={22} />
                                </Link>

                                <div style={{ height: "20px", width: "1px", background: "#23232c" }} />
                            </div>
                        )}

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="mobile-hamburger-btn"
                            style={{
                                background: "none",
                                border: "none",
                                color: "#f8fafc",
                                cursor: "pointer",
                                padding: "4px"
                            }}
                        >
                            <Menu size={22} />
                        </button>

                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff" }}>
                                    {stats?.organization?.name || "Organization Workspace"}
                                </h2>
                                {isPro ? (
                                    <span className="badge-pro" style={{ fontSize: "10px", padding: "2px 8px" }}>PRO</span>
                                ) : (
                                    <span className="badge-neon" style={{ fontSize: "10px", padding: "2px 8px" }}>FREE</span>
                                )}
                            </div>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                                Slug: /{stats?.organization?.slug}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <Link
                            to="/admin/events/new"
                            className="btn-neon"
                            style={{ padding: "8px 16px", fontSize: "13px" }}
                        >
                            <Plus size={15} /> Create Event
                        </Link>

                        <div style={{ height: "24px", width: "1px", background: "#23232c" }} />

                        <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: "13px", fontWeight: "600", color: "#f8fafc" }}>
                                {user?.name}
                            </p>
                            <p style={{ fontSize: "11px", color: "#64748b" }}>
                                {user?.role}
                            </p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="btn-secondary"
                            style={{ padding: "8px 12px" }}
                            title="Sign Out"
                        >
                            <LogOut size={15} />
                        </button>
                    </div>
                </header>

                {/* Tab Content Container */}
                <main style={{ padding: "36px 32px 80px", flex: 1, maxWidth: "1200px", width: "100%", margin: "0 auto" }}>

                    {error && (
                        <div
                            style={{
                                background: "rgba(239, 68, 68, 0.1)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                color: "#f87171",
                                padding: "12px 16px",
                                borderRadius: "8px",
                                marginBottom: "24px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "14px"
                            }}
                        >
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* ── TAB: DASHBOARD OVERVIEW ── */}
                    {activeTab === "dashboard" && (
                        <div>
                            {/* KPI Metrics */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                    gap: "18px",
                                    marginBottom: "36px"
                                }}
                            >
                                <div className="glass-panel kpi-card" style={{ padding: "22px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Events</span>
                                        <Calendar size={18} color="#22c55e" />
                                    </div>
                                    <p style={{ fontSize: "28px", fontWeight: "800", color: "#ffffff" }}>
                                        {stats?.stats?.events || 0}
                                        {!isPro && <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "400" }}> / 3 max</span>}
                                    </p>
                                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>Registered in workspace</span>
                                </div>

                                <div className="glass-panel kpi-card" style={{ padding: "22px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Tickets Sold</span>
                                        <Ticket size={18} color="#22c55e" />
                                    </div>
                                    <p style={{ fontSize: "28px", fontWeight: "800", color: "#ffffff" }}>
                                        {stats?.stats?.ticketsSold || 0}
                                    </p>
                                    <span style={{ fontSize: "12px", color: "#22c55e" }}>
                                        {stats?.stats?.bookings || 0} confirmed {stats?.stats?.bookings === 1 ? "booking" : "bookings"}
                                    </span>
                                </div>

                                <div className="glass-panel kpi-card" style={{ padding: "22px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Total Revenue</span>
                                        <DollarSign size={18} color="#22c55e" />
                                    </div>
                                    <p style={{ fontSize: "28px", fontWeight: "800", color: "#22c55e" }}>
                                        ${stats?.stats?.revenue?.toLocaleString() || 0}
                                    </p>
                                    <span style={{ fontSize: "12px", color: "#64748b" }}>Processed ticket sales</span>
                                </div>

                                <div className="glass-panel kpi-card" style={{ padding: "22px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Team</span>
                                        <Users size={18} color="#c084fc" />
                                    </div>
                                    <p style={{ fontSize: "28px", fontWeight: "800", color: "#ffffff" }}>
                                        {stats?.stats?.members || 1}
                                    </p>
                                    <span style={{ fontSize: "12px", color: "#c084fc" }}>Active team staff</span>
                                </div>
                            </div>

                            {/* Recent Events Table Preview */}
                            <div className="glass-panel" style={{ padding: "26px", marginBottom: "32px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                                    <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#ffffff" }}>
                                        Organization Events
                                    </h3>
                                    <button
                                        onClick={() => handleTabChange("events")}
                                        className="btn-secondary"
                                        style={{ padding: "6px 14px", fontSize: "12.5px" }}
                                    >
                                        Manage All Events
                                    </button>
                                </div>

                                {events.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "36px 16px", color: "#64748b" }}>
                                        <p>No events registered in this organization yet.</p>
                                        <Link to="/admin/events/new" className="btn-neon" style={{ marginTop: "14px" }}>
                                            <Plus size={15} /> Create Your First Event
                                        </Link>
                                    </div>
                                ) : (
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
                                            <thead>
                                                <tr style={{ borderBottom: "1px solid #23232c", color: "#64748b" }}>
                                                    <th style={{ padding: "10px 14px" }}>Event</th>
                                                    <th style={{ padding: "10px 14px" }}>Category</th>
                                                    <th style={{ padding: "10px 14px" }}>Date</th>
                                                    <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {events.slice(0, 5).map((ev) => (
                                                    <tr key={ev._id} style={{ borderBottom: "1px solid #1a1a22" }}>
                                                        <td style={{ padding: "12px 14px", fontWeight: "600", color: "#ffffff" }}>
                                                            {ev.title}
                                                        </td>
                                                        <td style={{ padding: "12px 14px" }}>
                                                            <span className="badge-neon" style={{ fontSize: "10px" }}>{ev.category}</span>
                                                        </td>
                                                        <td style={{ padding: "12px 14px", color: "#94a3b8" }}>
                                                            {new Date(ev.date).toLocaleDateString()}
                                                        </td>
                                                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                                                            <Link
                                                                to={`/admin/events/${ev._id}/tickets`}
                                                                className="btn-secondary"
                                                                style={{ padding: "5px 10px", fontSize: "12px", marginRight: "6px" }}
                                                            >
                                                                Tickets
                                                            </Link>
                                                            <Link
                                                                to={`/admin/events/${ev._id}/edit`}
                                                                className="btn-secondary"
                                                                style={{ padding: "5px 10px", fontSize: "12px" }}
                                                            >
                                                                Edit
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── TAB: EVENTS MANAGEMENT ── */}
                    {activeTab === "events" && (
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <div>
                                    <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#ffffff" }}>
                                        Event Management
                                    </h2>
                                    <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
                                        Create, edit, and configure ticket tiers for your organization's events.
                                    </p>
                                </div>
                                <Link to="/admin/events/new" className="btn-neon">
                                    <Plus size={16} /> Create Event
                                </Link>
                            </div>

                            <div className="glass-panel" style={{ padding: "24px" }}>
                                {events.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "48px 20px", color: "#64748b" }}>
                                        <Calendar size={36} color="#64748b" style={{ margin: "0 auto 12px" }} />
                                        <p style={{ fontSize: "16px", color: "#ffffff", fontWeight: "600", marginBottom: "6px" }}>No events created yet</p>
                                        <p style={{ fontSize: "13.5px", marginBottom: "20px" }}>Launch your first public event to begin selling tickets.</p>
                                        <Link to="/admin/events/new" className="btn-neon">
                                            <Plus size={15} /> Create Event
                                        </Link>
                                    </div>
                                ) : (
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                                            <thead>
                                                <tr style={{ borderBottom: "1px solid #23232c", color: "#64748b" }}>
                                                    <th style={{ padding: "12px 14px" }}>Title</th>
                                                    <th style={{ padding: "12px 14px" }}>Category</th>
                                                    <th style={{ padding: "12px 14px" }}>Date</th>
                                                    <th style={{ padding: "12px 14px" }}>Location</th>
                                                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {events.map((ev) => (
                                                    <tr key={ev._id} style={{ borderBottom: "1px solid #1a1a22" }}>
                                                        <td style={{ padding: "14px", fontWeight: "600", color: "#ffffff" }}>
                                                            {ev.title}
                                                        </td>
                                                        <td style={{ padding: "14px" }}>
                                                            <span className="badge-neon" style={{ fontSize: "10.5px" }}>{ev.category}</span>
                                                        </td>
                                                        <td style={{ padding: "14px", color: "#94a3b8" }}>
                                                            {new Date(ev.date).toLocaleDateString()}
                                                        </td>
                                                        <td style={{ padding: "14px", color: "#64748b" }}>
                                                            {ev.location || "Online / TBD"}
                                                        </td>
                                                        <td style={{ padding: "14px", textAlign: "right" }}>
                                                            <Link
                                                                to={`/admin/events/${ev._id}/tickets`}
                                                                className="btn-secondary"
                                                                style={{ padding: "6px 12px", fontSize: "12.5px", marginRight: "8px" }}
                                                            >
                                                                <Ticket size={13} /> Tickets
                                                            </Link>
                                                            <Link
                                                                to={`/admin/events/${ev._id}/edit`}
                                                                className="btn-secondary"
                                                                style={{ padding: "6px 12px", fontSize: "12.5px", marginRight: "8px" }}
                                                            >
                                                                <Edit3 size={13} /> Edit
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDeleteEvent(ev._id)}
                                                                className="btn-secondary"
                                                                style={{ padding: "6px 10px", color: "#f87171" }}
                                                                title="Delete Event"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── TAB: ATTENDEES & BOOKINGS ── */}
                    {activeTab === "attendees" && (
                        <div>
                            <div style={{ marginBottom: "24px" }}>
                                <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#ffffff" }}>
                                    Attendee Bookings
                                </h2>
                                <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
                                    Real-time tickets booked and customer reservations for your organization.
                                </p>
                            </div>

                            <div className="glass-panel" style={{ padding: "24px" }}>
                                {attendees.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "48px 20px", color: "#64748b" }}>
                                        <Ticket size={36} color="#64748b" style={{ margin: "0 auto 12px" }} />
                                        <p style={{ fontSize: "16px", color: "#ffffff", fontWeight: "600", marginBottom: "6px" }}>No bookings yet</p>
                                        <p style={{ fontSize: "13.5px" }}>When customers book tickets to your public events, their records appear here.</p>
                                    </div>
                                ) : (
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                                            <thead>
                                                <tr style={{ borderBottom: "1px solid #23232c", color: "#64748b" }}>
                                                    <th style={{ padding: "12px 14px" }}>Ref</th>
                                                    <th style={{ padding: "12px 14px" }}>Attendee</th>
                                                    <th style={{ padding: "12px 14px" }}>Event</th>
                                                    <th style={{ padding: "12px 14px" }}>Tickets</th>
                                                    <th style={{ padding: "12px 14px" }}>Total Due</th>
                                                    <th style={{ padding: "12px 14px" }}>Payment</th>
                                                    <th style={{ padding: "12px 14px" }}>Check-in</th>
                                                    <th style={{ padding: "12px 14px" }}>Status</th>
                                                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {attendees.map((b) => (
                                                    <tr key={b._id} style={{ borderBottom: "1px solid #1a1a22" }}>
                                                        <td style={{ padding: "14px", fontFamily: "monospace", fontSize: "12.5px", color: "#22c55e", fontWeight: "700" }}>
                                                            {b.bookingReference || b._id.substring(0, 8).toUpperCase()}
                                                        </td>
                                                        <td style={{ padding: "14px" }}>
                                                            <p style={{ fontWeight: "600", color: "#ffffff" }}>
                                                                {b.attendeeName || b.user?.name || "Guest Attendee"}
                                                            </p>
                                                            <p style={{ fontSize: "12px", color: "#64748b" }}>
                                                                {b.attendeeEmail || b.user?.email || "N/A"}
                                                            </p>
                                                        </td>
                                                        <td style={{ padding: "14px", color: "#94a3b8" }}>
                                                            {b.event?.title || "Event"}
                                                        </td>
                                                        <td style={{ padding: "14px", color: "#f8fafc" }}>
                                                            {b.quantity} x {b.ticket?.type || "Standard"}
                                                        </td>
                                                        <td style={{ padding: "14px", fontWeight: "700", color: "#22c55e" }}>
                                                            ${b.totalPrice || 0}
                                                        </td>
                                                        <td style={{ padding: "14px" }}>
                                                            {b.paymentStatus === "PAID" ? (
                                                                <span className="badge-neon" style={{ fontSize: "10px" }}>
                                                                    PAID
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    style={{
                                                                        fontSize: "10px",
                                                                        padding: "2px 8px",
                                                                        borderRadius: "999px",
                                                                        background: "rgba(250, 204, 21, 0.12)",
                                                                        color: "#facc15",
                                                                        border: "1px solid rgba(250, 204, 21, 0.3)",
                                                                        fontWeight: "700"
                                                                    }}
                                                                >
                                                                    PENDING
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: "14px" }}>
                                                            {b.checkInStatus === "CHECKED_IN" ? (
                                                                <span
                                                                    style={{
                                                                        fontSize: "10px",
                                                                        padding: "2px 8px",
                                                                        borderRadius: "999px",
                                                                        background: "rgba(34, 197, 94, 0.15)",
                                                                        color: "#22c55e",
                                                                        border: "1px solid rgba(34, 197, 94, 0.4)",
                                                                        fontWeight: "700"
                                                                    }}
                                                                >
                                                                    CHECKED IN
                                                                </span>
                                                            ) : (
                                                                <span style={{ fontSize: "11px", color: "#64748b" }}>
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: "14px" }}>
                                                            {b.status === "CONFIRMED" ? (
                                                                <span className="badge-neon" style={{ fontSize: "10px" }}>
                                                                    CONFIRMED
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    style={{
                                                                        fontSize: "10px",
                                                                        padding: "2px 8px",
                                                                        borderRadius: "6px",
                                                                        background: "rgba(239, 68, 68, 0.12)",
                                                                        color: "#f87171",
                                                                        border: "1px solid rgba(239, 68, 68, 0.3)",
                                                                        fontWeight: "600"
                                                                    }}
                                                                >
                                                                    CANCELLED
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: "14px", textAlign: "right", whiteSpace: "nowrap" }}>
                                                            {b.status === "CONFIRMED" ? (
                                                                <>
                                                                    {b.paymentStatus === "PENDING" && (
                                                                        <button
                                                                            onClick={() => handleMarkPaid(b._id)}
                                                                            className="btn-secondary"
                                                                            style={{
                                                                                padding: "5px 10px",
                                                                                fontSize: "11.5px",
                                                                                color: "#22c55e",
                                                                                marginRight: "6px"
                                                                            }}
                                                                            title="Mark as Paid"
                                                                        >
                                                                            Mark Paid
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleCancelBooking(b._id)}
                                                                        className="btn-secondary"
                                                                        style={{
                                                                            padding: "5px 10px",
                                                                            fontSize: "11.5px",
                                                                            color: "#f87171",
                                                                            border: "1px solid rgba(239, 68, 68, 0.3)"
                                                                        }}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span style={{ fontSize: "12px", color: "#64748b" }}>Restored</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── TAB: QR TICKET SCANNER ── */}
                    {activeTab === "scanner" && (
                        <TicketScanner onCheckedIn={loadDashboardData} />
                    )}

                    {/* ── TAB: TEAMS & INVITES ── */}
                    {activeTab === "teams" && (
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <div>
                                    <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#ffffff" }}>
                                        Team Members
                                    </h2>
                                    <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
                                        Manage staff colleagues who have access to this organization.
                                    </p>
                                </div>
                                {isOwner && (
                                    <button onClick={() => setShowInviteModal(true)} className="btn-neon">
                                        <UserPlus size={16} /> Invite Member
                                    </button>
                                )}
                            </div>

                            <div className="glass-panel" style={{ padding: "24px" }}>
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                                        <thead>
                                            <tr style={{ borderBottom: "1px solid #23232c", color: "#64748b" }}>
                                                <th style={{ padding: "12px 14px" }}>Member</th>
                                                <th style={{ padding: "12px 14px" }}>Role</th>
                                                <th style={{ padding: "12px 14px" }}>Email Status</th>
                                                <th style={{ padding: "12px 14px" }}>Joined</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {members.map((mem) => (
                                                <tr key={mem._id} style={{ borderBottom: "1px solid #1a1a22" }}>
                                                    <td style={{ padding: "14px" }}>
                                                        <p style={{ fontWeight: "600", color: "#ffffff" }}>{mem.name}</p>
                                                        <p style={{ fontSize: "12px", color: "#64748b" }}>{mem.email}</p>
                                                    </td>
                                                    <td style={{ padding: "14px" }}>
                                                        <span className={mem.role === "ORG_OWNER" ? "badge-pro" : "badge-neon"} style={{ fontSize: "10px" }}>
                                                            {mem.role}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "14px", color: mem.isEmailVerified ? "#22c55e" : "#eab308" }}>
                                                        {mem.isEmailVerified ? "Verified" : "Pending"}
                                                    </td>
                                                    <td style={{ padding: "14px", color: "#64748b" }}>
                                                        {new Date(mem.createdAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TAB: BILLING & SUBSCRIPTIONS ── */}
                    {activeTab === "billing" && (
                        <div>
                            <div style={{ marginBottom: "24px" }}>
                                <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#ffffff" }}>
                                    Subscription & Billing
                                </h2>
                                <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
                                    Manage your organization's subscription tier and Stripe billing portal.
                                </p>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                {/* Current Tier */}
                                <div className="glass-panel" style={{ padding: "28px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                        <span className="font-mono-tag">Current Plan</span>
                                        {isPro ? <span className="badge-pro">PRO ACTIVE</span> : <span className="badge-neon">STARTER FREE</span>}
                                    </div>

                                    <h3 style={{ fontSize: "24px", fontWeight: "800", color: "#ffffff", marginBottom: "8px" }}>
                                        {isPro ? "$29 / month" : "$0 / month"}
                                    </h3>
                                    <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
                                        {isPro
                                            ? "Your organization has access to unlimited events, team invites, and priority support."
                                            : "You are on the Starter free tier (max 3 events). Upgrade to Pro for unlimited events and team collaboration."}
                                    </p>

                                    {isPro ? (
                                        <button
                                            onClick={handleStripePortal}
                                            disabled={billingLoading}
                                            className="btn-secondary"
                                            style={{ width: "100%", justifyContent: "center" }}
                                        >
                                            <ExternalLink size={15} /> {billingLoading ? "Opening..." : "Manage Stripe Customer Portal"}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleStripeCheckout}
                                            disabled={billingLoading}
                                            className="btn-neon"
                                            style={{ width: "100%", justifyContent: "center" }}
                                        >
                                            <Zap size={16} /> {billingLoading ? "Loading..." : "Upgrade to Pro ($29/mo)"}
                                        </button>
                                    )}
                                </div>

                                {/* Usage & Limits */}
                                <div className="glass-panel" style={{ padding: "28px" }}>
                                    <span className="font-mono-tag" style={{ display: "block", marginBottom: "16px" }}>
                                        Workspace Limits
                                    </span>

                                    <div style={{ marginBottom: "20px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", marginBottom: "8px" }}>
                                            <span style={{ color: "#94a3b8" }}>Active Events</span>
                                            <span style={{ color: "#ffffff", fontWeight: "700" }}>
                                                {stats?.stats?.events || 0} {isPro ? "/ Unlimited" : "/ 3 max"}
                                            </span>
                                        </div>
                                        <div style={{ width: "100%", height: "8px", background: "#1c1c24", borderRadius: "4px", overflow: "hidden" }}>
                                            <div
                                                style={{
                                                    width: isPro ? "30%" : `${Math.min(((stats?.stats?.events || 0) / 3) * 100, 100)}%`,
                                                    height: "100%",
                                                    background: "#22c55e",
                                                    borderRadius: "4px"
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13.5px", color: "#94a3b8" }}>
                                        <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <CheckCircle size={15} color="#22c55e" /> Stripe Instant Webhooks
                                        </li>
                                        <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <CheckCircle size={15} color="#22c55e" /> Automated Email Receipts
                                        </li>
                                        <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <CheckCircle size={15} color="#22c55e" /> Self-Serve Customer Portal
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TAB: SETTINGS ── */}
                    {activeTab === "settings" && (
                        <div>
                            <div style={{ marginBottom: "24px" }}>
                                <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#ffffff" }}>
                                    Organization Settings
                                </h2>
                                <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
                                    Workspace identity, URL configuration, and administrator credentials.
                                </p>
                            </div>

                            <div className="glass-panel" style={{ padding: "28px", maxWidth: "680px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                                            Organization Name
                                        </label>
                                        <input
                                            disabled
                                            value={stats?.organization?.name || ""}
                                            style={{
                                                width: "100%",
                                                padding: "10px 14px",
                                                background: "#121217",
                                                border: "1px solid #23232c",
                                                borderRadius: "8px",
                                                color: "#ffffff",
                                                fontSize: "14px"
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                                            Public Workspace URL
                                        </label>
                                        <div style={{ display: "flex", alignItems: "center", background: "#121217", border: "1px solid #23232c", borderRadius: "8px", padding: "10px 14px" }}>
                                            <span style={{ color: "#64748b", fontSize: "13.5px" }}>eventra.app/org/</span>
                                            <span style={{ color: "#22c55e", fontWeight: "600", fontSize: "13.5px" }}>{stats?.organization?.slug}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                                            Administrator
                                        </label>
                                        <input
                                            disabled
                                            value={`${user?.name} (${user?.email})`}
                                            style={{
                                                width: "100%",
                                                padding: "10px 14px",
                                                background: "#121217",
                                                border: "1px solid #23232c",
                                                borderRadius: "8px",
                                                color: "#94a3b8",
                                                fontSize: "14px"
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Team Invite Modal */}
            {showInviteModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0, 0, 0, 0.75)",
                        backdropFilter: "blur(6px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 100,
                        padding: "20px"
                    }}
                >
                    <div
                        className="glass-panel"
                        style={{
                            maxWidth: "440px",
                            width: "100%",
                            padding: "32px",
                            background: "#16161e",
                            border: "1px solid #2f2f3d"
                        }}
                    >
                        <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff", marginBottom: "8px" }}>
                            Invite Team Member
                        </h3>
                        <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>
                            Send an invitation link to onboard a staff colleague into your organization.
                        </p>

                        {inviteMessage && (
                            <p style={{ fontSize: "13px", color: "#4ade80", marginBottom: "14px" }}>
                                {inviteMessage}
                            </p>
                        )}

                        <form onSubmit={handleSendInvite} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#94a3b8", marginBottom: "6px" }}>
                                    Colleague's Work Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="colleague@company.com"
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        background: "#101016",
                                        border: "1px solid #2b2b3a",
                                        borderRadius: "8px",
                                        color: "#ffffff",
                                        fontSize: "14px",
                                        outline: "none"
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowInviteModal(false);
                                        setInviteMessage("");
                                    }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" disabled={inviteSending} className="btn-neon">
                                    {inviteSending ? "Sending..." : "Send Invitation"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
