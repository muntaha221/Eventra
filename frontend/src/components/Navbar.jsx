import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Calendar,
    CreditCard,
    Ticket,
    LogOut,
    Shield,
    Menu,
    X,
    User
} from "lucide-react";
import gsap from "gsap";
import EventraLogo from "./EventraLogo";

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const authAreaRef = useRef(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    const token = localStorage.getItem("accessToken");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const isOrgOwner = user?.role === "ORG_OWNER";
    const isOrgMember = user?.role === "ORG_MEMBER";
    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const isOrgUser = isOrgOwner || isOrgMember;

    // Close mobile menu whenever location changes
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    // Animate the auth area whenever the login state changes
    useEffect(() => {
        if (authAreaRef.current) {
            gsap.fromTo(
                authAreaRef.current,
                { opacity: 0, x: 14 },
                { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }
            );
        }
    }, [token]);

    function handleLogout() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setMobileOpen(false);
        navigate("/login");
    }

    const isActive = (path) => location.pathname === path;

    const navLinkStyle = (path) => ({
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "13.5px",
        fontWeight: "500",
        padding: "8px 14px",
        borderRadius: "8px",
        textDecoration: "none",
        transition: "all 0.15s ease",
        color: isActive(path) ? "#22c55e" : "#94a3b8",
        background: isActive(path) ? "rgba(34, 197, 94, 0.08)" : "transparent",
        border: isActive(path) ? "1px solid rgba(34, 197, 94, 0.2)" : "1px solid transparent"
    });

    const mobileLinkStyle = (path) => ({
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "15px",
        fontWeight: "600",
        padding: "12px 16px",
        borderRadius: "10px",
        textDecoration: "none",
        color: isActive(path) ? "#22c55e" : "#e2e8f0",
        background: isActive(path) ? "rgba(34, 197, 94, 0.12)" : "rgba(255, 255, 255, 0.03)",
        border: isActive(path) ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid #23232c"
    });

    return (
        <header
            style={{
                position: "sticky",
                top: 0,
                zIndex: 100,
                background: "rgba(10, 10, 12, 0.92)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderBottom: "1px solid #1c1c24"
            }}
        >
            <div
                style={{
                    maxWidth: "1280px",
                    margin: "0 auto",
                    padding: "12px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px"
                }}
            >
                {/* Brand */}
                <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
                    <EventraLogo />
                </Link>

                {/* Desktop Nav links */}
                <nav className="nav-desktop-links" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Link to="/" style={navLinkStyle("/")}>Overview</Link>
                    <Link to="/events" style={navLinkStyle("/events")}>
                        <Calendar size={14} />
                        Explore Events
                    </Link>
                    <Link to="/pricing" style={navLinkStyle("/pricing")}>
                        <CreditCard size={14} />
                        Pricing
                    </Link>

                    {token && isOrgUser && (
                        <Link to="/dashboard" style={navLinkStyle("/dashboard")}>
                            <LayoutDashboard size={14} />
                            Org Hub
                        </Link>
                    )}

                    {token && isSuperAdmin && (
                        <Link to="/admin" style={navLinkStyle("/admin")}>
                            <Shield size={14} />
                            Admin
                        </Link>
                    )}

                    {token && !isOrgUser && !isSuperAdmin && (
                        <Link to="/bookings" style={navLinkStyle("/bookings")}>
                            <Ticket size={14} />
                            My Tickets
                        </Link>
                    )}
                </nav>

                {/* Desktop Auth area */}
                <div
                    ref={authAreaRef}
                    className="nav-desktop-auth"
                    style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                    {!token ? (
                        <>
                            <Link to="/login" style={navLinkStyle("/login")}>Sign In</Link>
                            <Link to="/register" className="btn-neon" style={{ padding: "8px 18px", fontSize: "13.5px" }}>
                                Start Free Trial
                            </Link>
                        </>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                <span style={{ fontSize: "13px", fontWeight: "600", color: "#f8fafc" }}>
                                    {user?.name}
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    {user?.organization?.planTier === "PRO" ? (
                                        <span className="badge-pro">PRO</span>
                                    ) : isOrgUser ? (
                                        <span className="badge-neon">FREE</span>
                                    ) : null}
                                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                                        {user?.role}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="btn-secondary"
                                style={{ padding: "8px 12px" }}
                                title="Sign Out"
                            >
                                <LogOut size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile Hamburger Toggle Button */}
                <button
                    className="nav-mobile-btn"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle navigation menu"
                    style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid #282834",
                        borderRadius: "8px",
                        padding: "8px",
                        color: "#f8fafc",
                        cursor: "pointer",
                        display: "none",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile Dropdown Drawer */}
            {mobileOpen && (
                <div
                    className="nav-mobile-drawer"
                    style={{
                        padding: "16px 20px 24px",
                        background: "#0d0d12",
                        borderTop: "1px solid #1c1c24",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        animation: "fadeInUp 0.25s ease both"
                    }}
                >
                    <Link to="/" style={mobileLinkStyle("/")} onClick={() => setMobileOpen(false)}>
                        Overview
                    </Link>
                    <Link to="/events" style={mobileLinkStyle("/events")} onClick={() => setMobileOpen(false)}>
                        <Calendar size={16} /> Explore Events
                    </Link>
                    <Link to="/pricing" style={mobileLinkStyle("/pricing")} onClick={() => setMobileOpen(false)}>
                        <CreditCard size={16} /> Pricing
                    </Link>

                    {token && isOrgUser && (
                        <Link to="/dashboard" style={mobileLinkStyle("/dashboard")} onClick={() => setMobileOpen(false)}>
                            <LayoutDashboard size={16} /> Org Hub
                        </Link>
                    )}

                    {token && isSuperAdmin && (
                        <Link to="/admin" style={mobileLinkStyle("/admin")} onClick={() => setMobileOpen(false)}>
                            <Shield size={16} /> Admin Portal
                        </Link>
                    )}

                    {token && !isOrgUser && !isSuperAdmin && (
                        <Link to="/bookings" style={mobileLinkStyle("/bookings")} onClick={() => setMobileOpen(false)}>
                            <Ticket size={16} /> My Tickets
                        </Link>
                    )}

                    <div style={{ margin: "8px 0", borderTop: "1px solid #1c1c24" }} />

                    {!token ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <Link
                                to="/login"
                                className="btn-secondary"
                                style={{ width: "100%", justifyContent: "center", padding: "12px" }}
                                onClick={() => setMobileOpen(false)}
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="btn-neon"
                                style={{ width: "100%", justifyContent: "center", padding: "12px" }}
                                onClick={() => setMobileOpen(false)}
                            >
                                Start Free Trial
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <User size={16} color="#22c55e" />
                                    <div>
                                        <div style={{ fontSize: "14px", fontWeight: "600", color: "#f8fafc" }}>{user?.name}</div>
                                        <div style={{ fontSize: "12px", color: "#64748b" }}>{user?.email}</div>
                                    </div>
                                </div>
                                {user?.organization?.planTier === "PRO" ? (
                                    <span className="badge-pro">PRO</span>
                                ) : isOrgUser ? (
                                    <span className="badge-neon">FREE</span>
                                ) : null}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="btn-secondary"
                                style={{ width: "100%", justifyContent: "center", padding: "12px", color: "#f87171" }}
                            >
                                <LogOut size={16} /> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}

export default Navbar;
