import React, { Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

// Fast direct imports for instant public attendee navigation (0ms route latency)
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import Contact from './pages/Contact';
import EventList from './pages/EventList';
import EventDetails from './pages/EventDetails';

// Auth & onboarding (lightweight)
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import JoinTeam from "./pages/JoinTeam";

// Attendee pages (lightweight)
import BookingList from "./pages/BookingList";
import Profile from "./pages/Profile";

// Org SaaS hub – lazy load admin UI
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminEventForm = React.lazy(() => import('./pages/AdminEventForm'));
const AdminEventTickets = React.lazy(() => import('./pages/AdminEventTickets'));


// Routes that render the footer — keeps the app/dashboard shell clean
const PUBLIC_ROUTES_WITH_FOOTER = [
    "/", "/pricing", "/events", "/contact",
    "/login", "/register", "/verify-email",
    "/forgot-password", "/reset-password", "/join-team"
];

function AppShell() {
    const { pathname } = useLocation();

    // Org SaaS hub routes use a dedicated full-height sidebar layout
    const isDashboardRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
    const showNavbar = !isDashboardRoute;

    // Show footer on public/marketing routes; hide inside the SaaS dashboard
    const showFooter =
        !isDashboardRoute &&
        (PUBLIC_ROUTES_WITH_FOOTER.includes(pathname) || pathname.startsWith("/events/"));

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <ScrollToTop />
            {showNavbar && <Navbar />}

            <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <Suspense fallback={<div className="loader">Loading…</div>}>
                <Routes>
                    {/* ── Public marketing & browse ── */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/events" element={<EventList />} />
                    <Route path="/events/:id" element={<EventDetails />} />

                    {/* ── Auth & onboarding ── */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/join-team" element={<JoinTeam />} />

                    {/* ── Attendee ── */}
                    <Route path="/bookings" element={<ProtectedRoute><BookingList /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                    {/* ── Org SaaS hub ── */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={["ORG_OWNER", "ORG_MEMBER", "SUPER_ADMIN"]}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
                    <Route
                        path="/admin/events/new"
                        element={
                            <ProtectedRoute allowedRoles={["ORG_OWNER", "ORG_MEMBER"]}>
                                <AdminEventForm />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/events/:id/edit"
                        element={
                            <ProtectedRoute allowedRoles={["ORG_OWNER", "ORG_MEMBER"]}>
                                <AdminEventForm />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/events/:id/tickets"
                        element={
                            <ProtectedRoute allowedRoles={["ORG_OWNER", "ORG_MEMBER"]}>
                                <AdminEventTickets />
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                </Suspense>
            </main>

            {showFooter && <Footer />}
        </div>
    );
}

function App() {
    return <AppShell />;
}

export default App;
