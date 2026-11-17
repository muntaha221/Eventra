import React, { useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Calendar,
    CreditCard,
    Ticket,
    LogOut,
    Shield
} from "lucide-react";
import gsap from "gsap";
import EventraLogo from "./EventraLogo";

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const authAreaRef = useRef(null);

    const token = localStorage.getItem("accessToken");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const isOrgOwner = user?.role === "ORG_OWNER";
    const isOrgMember = user?.role === "ORG_MEMBER";
    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const isOrgUser = isOrgOwner || isOrgMember;

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

    return (
        <header
            style={{
                position: "sticky",
                top: 0,
                zIndex: 50,
                background: "rgba(10, 10, 12, 0.85)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderBottom: "1px solid #1c1c24"
            }}
        >
            <div
                style={{
                    maxWidth: "1280px",
                    margin: "0 auto",
                    padding: "13px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "20px",
                    flexWrap: "wrap"
                }}
            >
                {/* Brand */}
                <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
                    <EventraLogo />
                </Link>

                {/* Nav links */}
                <nav style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
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

                {/* Auth area — GSAP animates this ref on token change */}
                <div
                    ref={authAreaRef}
                    className="nav-auth-area"
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
            </div>
        </header>
    );
}

export default Navbar;
