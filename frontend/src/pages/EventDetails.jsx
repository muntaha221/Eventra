import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import {
    Calendar,
    MapPin,
    Ticket,
    CheckCircle,
    ArrowLeft,
    AlertCircle,
    ShieldCheck,
    CreditCard,
    QrCode,
    Clock
} from "lucide-react";

function EventDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedTicket, setSelectedTicket] = useState(null);
    const [quantity, setQuantity] = useState(1);

    // Public attendee checkout details
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");

    const [bookingError, setBookingError] = useState("");
    const [booking, setBooking] = useState(false);
    const [confirmedBooking, setConfirmedBooking] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                const [eventRes, ticketRes] = await Promise.all([
                    api.get(`/events/${id}`),
                    api.get(`/tickets/event/${id}`)
                ]);
                setEvent(eventRes.data.data);
                const tiers = ticketRes.data.data || [];
                setTickets(tiers);
                if (tiers.length > 0) {
                    const firstAvail = tiers.find(t => (t.totalQuantity - t.soldQuantity) > 0) || tiers[0];
                    setSelectedTicket(firstAvail);
                }
            } catch (err) {
                setError("Failed to load event details");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    async function handleBook(e) {
        e.preventDefault();
        if (!selectedTicket) {
            setBookingError("Please select a ticket tier.");
            return;
        }
        if (!name.trim()) {
            setBookingError("Please enter your full name.");
            return;
        }
        if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
            setBookingError("Please enter a valid email address.");
            return;
        }

        setBooking(true);
        setBookingError("");

        try {
            const res = await api.post("/bookings", {
                eventId: id,
                ticketId: selectedTicket._id,
                quantity: parseInt(quantity) || 1,
                name: name.trim(),
                email: email.trim().toLowerCase()
            });

            setConfirmedBooking(res.data.data);
        } catch (err) {
            setBookingError(err.response?.data?.message || "Booking reservation failed. Please try again.");
        } finally {
            setBooking(false);
        }
    }

    if (loading) {
        return (
            <div style={{ maxWidth: "800px", margin: "80px auto", textAlign: "center", color: "#94a3b8" }}>
                <p>Loading event information...</p>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div style={{ maxWidth: "800px", margin: "80px auto", textAlign: "center", padding: "0 20px" }}>
                <p style={{ color: "#f87171", fontSize: "16px", marginBottom: "16px" }}>{error || "Event not found"}</p>
                <Link to="/events" className="btn-secondary">
                    Browse All Events
                </Link>
            </div>
        );
    }

    const available = selectedTicket ? selectedTicket.totalQuantity - selectedTicket.soldQuantity : 0;
    const totalPrice = selectedTicket ? selectedTicket.price * (parseInt(quantity) || 1) : 0;

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "48px 24px 100px" }}>

            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    marginBottom: "28px",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: 0,
                    fontFamily: "inherit"
                }}
            >
                <ArrowLeft size={16} /> Back to Events
            </button>

            {/* Confirmation Screen on Successful Booking */}
            {confirmedBooking ? (
                <div
                    className="glass-panel"
                    style={{
                        padding: "48px 36px",
                        textAlign: "center",
                        maxWidth: "600px",
                        margin: "0 auto",
                        border: "1.5px solid #22c55e"
                    }}
                >
                    <div
                        style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "50%",
                            background: "rgba(34, 197, 94, 0.12)",
                            border: "1.5px solid rgba(34, 197, 94, 0.4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 18px"
                        }}
                    >
                        <CheckCircle size={30} color="#22c55e" />
                    </div>

                    <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#ffffff", marginBottom: "6px" }}>
                        Ticket Reservation Confirmed
                    </h1>
                    <p style={{ color: "#22c55e", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
                        Reserve Now, Pay at Venue
                    </p>
                    <p style={{ color: "#94a3b8", fontSize: "14.5px", marginBottom: "24px" }}>
                        A confirmation email has been dispatched to <strong>{confirmedBooking.attendeeEmail}</strong>.
                    </p>

                    {/* QR Code Card */}
                    {confirmedBooking.qrCode && (
                        <div
                            style={{
                                background: "#0d0d12",
                                border: "1px solid #23232c",
                                borderRadius: "12px",
                                padding: "24px",
                                margin: "0 auto 28px",
                                maxWidth: "280px"
                            }}
                        >
                            <p style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "600", marginBottom: "12px" }}>
                                Scan at Venue Gate
                            </p>
                            <img
                                src={confirmedBooking.qrCode}
                                alt="Verification QR Code"
                                style={{ width: "200px", height: "200px", background: "#ffffff", padding: "10px", borderRadius: "10px", display: "block", margin: "0 auto" }}
                            />
                            <p style={{ fontFamily: "monospace", fontSize: "15px", color: "#22c55e", fontWeight: "800", marginTop: "12px", letterSpacing: "0.05em" }}>
                                {confirmedBooking.bookingReference}
                            </p>
                        </div>
                    )}

                    <div
                        style={{
                            background: "#14141c",
                            border: "1px solid #23232c",
                            borderRadius: "12px",
                            padding: "20px 24px",
                            textAlign: "left",
                            marginBottom: "28px",
                            fontSize: "14px"
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #23232c" }}>
                            <span style={{ color: "#64748b" }}>Event:</span>
                            <span style={{ color: "#ffffff", fontWeight: "600" }}>{event.title}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                            <span style={{ color: "#64748b" }}>Attendee:</span>
                            <span style={{ color: "#ffffff" }}>{confirmedBooking.attendeeName}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                            <span style={{ color: "#64748b" }}>Tier & Quantity:</span>
                            <span style={{ color: "#ffffff" }}>{confirmedBooking.quantity} x {selectedTicket?.type}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                            <span style={{ color: "#64748b" }}>Payment Status:</span>
                            <span style={{ color: "#facc15", fontWeight: "600" }}>PENDING (Pay at Venue)</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", borderTop: "1px solid #23232c" }}>
                            <span style={{ color: "#64748b", fontWeight: "700" }}>Total Due at Venue:</span>
                            <span style={{ color: "#22c55e", fontWeight: "800", fontSize: "17px" }}>${confirmedBooking.totalPrice}</span>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                        <Link to="/events" className="btn-secondary">
                            Browse More Events
                        </Link>
                        {user && (
                            <Link to="/bookings" className="btn-neon">
                                View My Bookings
                            </Link>
                        )}
                    </div>
                </div>
            ) : (
                /* Event View & Booking Form */
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "40px", alignItems: "start" }}>

                    {/* Left: Event Details */}
                    <div>
                        {event.image?.url && (
                            <div style={{ borderRadius: "14px", overflow: "hidden", marginBottom: "24px", maxHeight: "360px" }}>
                                <img
                                    src={event.image.url}
                                    alt={event.title}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            </div>
                        )}

                        <span className="badge-neon" style={{ marginBottom: "14px" }}>
                            {event.category || "General Event"}
                        </span>

                        <h1 style={{ fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: "800", color: "#ffffff", marginBottom: "16px", lineHeight: "1.2" }}>
                            {event.title}
                        </h1>

                        <div style={{ display: "flex", gap: "20px", color: "#94a3b8", fontSize: "14.5px", marginBottom: "28px", flexWrap: "wrap" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                <Calendar size={16} color="#22c55e" />
                                {new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                <MapPin size={16} color="#60a5fa" />
                                {event.location || "Online"}
                            </span>
                        </div>

                        {event.isExpired && (
                            <div
                                style={{
                                    background: "rgba(239, 68, 68, 0.1)",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                    color: "#f87171",
                                    padding: "12px 16px",
                                    borderRadius: "8px",
                                    marginBottom: "24px",
                                    fontSize: "14px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                }}
                            >
                                <AlertCircle size={16} /> This event has concluded. Ticket reservations are closed.
                            </div>
                        )}

                        <div className="glass-panel" style={{ padding: "24px", marginBottom: "28px" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff", marginBottom: "12px" }}>
                                About This Event
                            </h3>
                            <p style={{ color: "#94a3b8", fontSize: "14.5px", lineHeight: "1.7", whiteSpace: "pre-line" }}>
                                {event.description}
                            </p>
                        </div>

                        {/* Pay at Venue Guarantee Badge */}
                        <div
                            style={{
                                background: "rgba(34, 197, 94, 0.05)",
                                border: "1px solid rgba(34, 197, 94, 0.2)",
                                borderRadius: "10px",
                                padding: "16px 20px",
                                display: "flex",
                                alignItems: "center",
                                gap: "14px"
                            }}
                        >
                            <ShieldCheck size={22} color="#22c55e" style={{ flexShrink: 0 }} />
                            <div>
                                <p style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>
                                    Reserve Now, Pay at Venue
                                </p>
                                <p style={{ fontSize: "12.5px", color: "#94a3b8", marginTop: "2px" }}>
                                    Lock in your ticket reservation today with zero card details required online. Complete your payment directly at the door.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Ticket Selection & Pay-at-Venue Checkout */}
                    <div>
                        <div className="glass-panel" style={{ padding: "28px", position: "sticky", top: "24px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff" }}>
                                    Reserve Tickets
                                </h3>
                                <span className="badge-neon" style={{ fontSize: "10.5px" }}>
                                    Pay at Venue
                                </span>
                            </div>

                            {/* Ticket Tier Selection */}
                            <div style={{ marginBottom: "24px" }}>
                                <label style={{ display: "block", fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600", marginBottom: "10px" }}>
                                    Select Ticket Tier
                                </label>

                                {tickets.length === 0 ? (
                                    <p style={{ color: "#64748b", fontSize: "13.5px" }}>No ticket tiers available for this event.</p>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        {tickets.map((t) => {
                                            const avail = t.totalQuantity - t.soldQuantity;
                                            const isSoldOut = avail <= 0;
                                            const isSelected = selectedTicket?._id === t._id;

                                            return (
                                                <div
                                                    key={t._id}
                                                    onClick={() => !isSoldOut && setSelectedTicket(t)}
                                                    style={{
                                                        padding: "14px 16px",
                                                        borderRadius: "10px",
                                                        border: isSelected ? "1.5px solid #22c55e" : "1px solid #23232c",
                                                        background: isSelected ? "rgba(34, 197, 94, 0.08)" : "#14141c",
                                                        cursor: isSoldOut ? "not-allowed" : "pointer",
                                                        opacity: isSoldOut ? 0.5 : 1,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        transition: "all 0.15s ease"
                                                    }}
                                                >
                                                    <div>
                                                        <p style={{ fontWeight: "700", color: isSelected ? "#22c55e" : "#ffffff", fontSize: "14px" }}>
                                                            {t.type}
                                                        </p>
                                                        <p style={{ fontSize: "12px", color: isSoldOut ? "#f87171" : "#64748b", marginTop: "2px" }}>
                                                            {isSoldOut ? "Sold Out" : `${avail} spots available`}
                                                        </p>
                                                    </div>
                                                    <div style={{ textAlign: "right" }}>
                                                        <span style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff" }}>
                                                            ${t.price}
                                                        </span>
                                                        <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>due at gate</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Checkout Form */}
                            {selectedTicket && (
                                <form onSubmit={handleBook} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Attendee Name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "11px 14px",
                                                background: "#101016",
                                                border: "1px solid #262634",
                                                borderRadius: "8px",
                                                color: "#ffffff",
                                                fontSize: "14px",
                                                outline: "none"
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            placeholder="Email Address (for ticket QR receipt)"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "11px 14px",
                                                background: "#101016",
                                                border: "1px solid #262634",
                                                borderRadius: "8px",
                                                color: "#ffffff",
                                                fontSize: "14px",
                                                outline: "none"
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
                                            Quantity (Max {available})
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={available || 1}
                                            required
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, Math.min(available, parseInt(e.target.value) || 1)))}
                                            style={{
                                                width: "100%",
                                                padding: "11px 14px",
                                                background: "#101016",
                                                border: "1px solid #262634",
                                                borderRadius: "8px",
                                                color: "#ffffff",
                                                fontSize: "14px",
                                                outline: "none"
                                            }}
                                        />
                                    </div>

                                    {/* Order Summary */}
                                    <div style={{ background: "#101016", border: "1px solid #1c1c24", borderRadius: "8px", padding: "14px 16px", marginTop: "8px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>
                                            <span>Tier:</span>
                                            <span style={{ color: "#ffffff" }}>{selectedTicket?.type || "None"}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>
                                            <span>Quantity:</span>
                                            <span style={{ color: "#ffffff" }}>{quantity}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#facc15", marginBottom: "8px" }}>
                                            <span>Payment Term:</span>
                                            <span style={{ fontWeight: "600" }}>Pay at Venue</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: "700", paddingTop: "8px", borderTop: "1px solid #1c1c24" }}>
                                            <span style={{ color: "#ffffff" }}>Total Due at Venue:</span>
                                            <span style={{ color: "#22c55e", fontSize: "17px", fontWeight: "800" }}>${totalPrice}</span>
                                        </div>
                                    </div>

                                    {bookingError && (
                                        <div style={{ color: "#f87171", fontSize: "13px", background: "rgba(239, 68, 68, 0.1)", padding: "10px", borderRadius: "6px" }}>
                                            {bookingError}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={booking || !selectedTicket || available <= 0}
                                        className="btn-neon"
                                        style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "15px", marginTop: "8px" }}
                                    >
                                        {booking ? "Reserving Ticket..." : `Reserve Now, Pay at Venue — $${totalPrice}`}
                                    </button>

                                    <p style={{ fontSize: "12px", color: "#64748b", textAlign: "center", marginTop: "4px" }}>
                                        No online credit card required. Receive instant QR ticket confirmation.
                                    </p>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EventDetails;
