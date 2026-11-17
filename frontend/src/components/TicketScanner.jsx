import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api from "../api/axios";
import {
    Camera,
    CheckCircle,
    AlertCircle,
    ScanLine,
    ArrowRight,
    RefreshCw,
    User,
    Calendar,
    DollarSign,
    Ticket
} from "lucide-react";

function TicketScanner({ onCheckedIn }) {
    const [manualCode, setManualCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState("");
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState("");

    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    async function handleVerify(tokenToVerify) {
        const token = (tokenToVerify || manualCode).trim();
        if (!token) {
            setScanError("Please enter or scan a ticket token or reference code.");
            return;
        }

        setLoading(true);
        setScanError("");
        setScanResult(null);

        try {
            const res = await api.post("/bookings/verify-ticket", { qrCodeToken: token });
            setScanResult(res.data.data);
            setManualCode("");
            if (onCheckedIn) onCheckedIn();
        } catch (err) {
            setScanError(err.response?.data?.message || "Verification failed. Invalid or already used ticket.");
        } finally {
            setLoading(false);
        }
    }

    // Toggle Camera Scanner using Html5Qrcode
    async function startCamera() {
        setCameraError("");
        setCameraActive(true);

        try {
            const qrCodeScanner = new Html5Qrcode("reader-container");
            html5QrCodeRef.current = qrCodeScanner;

            await qrCodeScanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    // Success callback
                    handleVerify(decodedText);
                    // Temporarily stop to avoid duplicate scans
                    stopCamera();
                },
                (errorMessage) => {
                    // Scan error or no QR in frame — normal during frame searching
                }
            );
        } catch (err) {
            setCameraError(err.message || "Failed to access camera. Check device permissions or use manual entry.");
            setCameraActive(false);
        }
    }

    async function stopCamera() {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
            } catch (err) {
                // Ignore stop error
            }
            html5QrCodeRef.current = null;
        }
        setCameraActive(false);
    }

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    return (
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
            <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#ffffff" }}>
                    Gate Ticket Scanner & Check-in
                </h2>
                <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
                    Scan attendee QR codes at entrance to verify tickets, check them in, and mark payment as collected.
                </p>
            </div>

            {/* Camera Scanner Panel */}
            <div className="glass-panel" style={{ padding: "28px", marginBottom: "28px", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div style={{ textAlign: "left" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff" }}>
                            Live Camera Scanner
                        </h3>
                        <p style={{ fontSize: "13px", color: "#64748b" }}>
                            Point camera at attendee phone or printed QR pass
                        </p>
                    </div>

                    {!cameraActive ? (
                        <button
                            onClick={startCamera}
                            className="btn-neon"
                            style={{ padding: "8px 16px", fontSize: "13px" }}
                        >
                            <Camera size={15} /> Start Camera
                        </button>
                    ) : (
                        <button
                            onClick={stopCamera}
                            className="btn-secondary"
                            style={{ padding: "8px 16px", fontSize: "13px", color: "#f87171" }}
                        >
                            Stop Camera
                        </button>
                    )}
                </div>

                {/* Video Container for Html5Qrcode */}
                <div
                    id="reader-container"
                    ref={scannerRef}
                    style={{
                        width: "100%",
                        maxWidth: "420px",
                        minHeight: cameraActive ? "300px" : "180px",
                        margin: "0 auto",
                        borderRadius: "12px",
                        overflow: "hidden",
                        background: "#0d0d12",
                        border: "1.5px dashed #23232c",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#64748b"
                    }}
                >
                    {!cameraActive && (
                        <div style={{ padding: "32px 16px" }}>
                            <ScanLine size={36} color="#64748b" style={{ margin: "0 auto 12px" }} />
                            <p style={{ fontSize: "14px", color: "#94a3b8" }}>Camera is idle</p>
                            <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                                Click "Start Camera" above or type ticket reference below
                            </p>
                        </div>
                    )}
                </div>

                {cameraError && (
                    <div style={{ marginTop: "14px", padding: "10px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", color: "#f87171", fontSize: "13px" }}>
                        {cameraError}
                    </div>
                )}
            </div>

            {/* Instant Manual Input Fallback */}
            <div className="glass-panel" style={{ padding: "24px", marginBottom: "28px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#ffffff", marginBottom: "6px" }}>
                    Manual Code Verification
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
                    If attendee camera scan is unavailable, enter the Booking Reference (e.g. EVT-XXXXXX) or QR Token.
                </p>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleVerify();
                    }}
                    style={{ display: "flex", gap: "10px" }}
                >
                    <input
                        type="text"
                        placeholder="Enter Booking Reference or UUID Token..."
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        style={{
                            flex: 1,
                            padding: "11px 14px",
                            background: "#101016",
                            border: "1px solid #262634",
                            borderRadius: "8px",
                            color: "#ffffff",
                            fontSize: "14px",
                            fontFamily: "monospace",
                            outline: "none"
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-neon"
                        style={{ padding: "0 20px" }}
                    >
                        {loading ? "Verifying..." : "Verify Ticket"}
                    </button>
                </form>
            </div>

            {/* Verification Result: Success Card */}
            {scanResult && (
                <div
                    className="glass-panel"
                    style={{
                        padding: "24px 28px",
                        border: "1.5px solid #22c55e",
                        background: "rgba(34, 197, 94, 0.04)",
                        marginBottom: "24px"
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                        <div
                            style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "50%",
                                background: "rgba(34, 197, 94, 0.15)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
                            <CheckCircle size={22} color="#22c55e" />
                        </div>
                        <div>
                            <h4 style={{ fontSize: "17px", fontWeight: "800", color: "#ffffff" }}>
                                Ticket Verified & Checked In!
                            </h4>
                            <p style={{ fontSize: "12.5px", color: "#22c55e", fontWeight: "600" }}>
                                Payment Collected & Check-in Timestamp Recorded
                            </p>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: "16px",
                            background: "#14141c",
                            border: "1px solid #23232c",
                            borderRadius: "10px",
                            padding: "16px 20px"
                        }}
                    >
                        <div>
                            <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Attendee</span>
                            <p style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff", marginTop: "2px" }}>
                                {scanResult.attendeeName}
                            </p>
                            <p style={{ fontSize: "12px", color: "#94a3b8" }}>{scanResult.attendeeEmail}</p>
                        </div>

                        <div>
                            <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Reference</span>
                            <p style={{ fontSize: "14px", fontWeight: "800", color: "#22c55e", fontFamily: "monospace", marginTop: "2px" }}>
                                {scanResult.bookingReference}
                            </p>
                            <span className="badge-neon" style={{ fontSize: "9.5px", marginTop: "4px" }}>PAID & CHECKED IN</span>
                        </div>

                        <div>
                            <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Event</span>
                            <p style={{ fontSize: "14px", fontWeight: "600", color: "#ffffff", marginTop: "2px" }}>
                                {scanResult.event?.title || "Event"}
                            </p>
                            <p style={{ fontSize: "12px", color: "#64748b" }}>
                                {scanResult.quantity} x {scanResult.ticket?.type || "Standard"}
                            </p>
                        </div>

                        <div>
                            <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Amount Collected</span>
                            <p style={{ fontSize: "18px", fontWeight: "800", color: "#22c55e", marginTop: "2px" }}>
                                ${scanResult.totalPrice}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setScanResult(null)}
                        className="btn-secondary"
                        style={{ marginTop: "16px", fontSize: "12.5px", padding: "6px 14px" }}
                    >
                        Scan Next Attendee
                    </button>
                </div>
            )}

            {/* Verification Result: Error Card */}
            {scanError && (
                <div
                    style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1.5px solid rgba(239, 68, 68, 0.4)",
                        borderRadius: "10px",
                        padding: "18px 22px",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        marginBottom: "24px"
                    }}
                >
                    <AlertCircle size={22} color="#f87171" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#f87171" }}>
                            Check-in Rejected
                        </h4>
                        <p style={{ fontSize: "13.5px", color: "#fca5a5", marginTop: "2px" }}>
                            {scanError}
                        </p>
                    </div>
                    <button
                        onClick={() => setScanError("")}
                        className="btn-secondary"
                        style={{ padding: "5px 12px", fontSize: "12px" }}
                    >
                        Dismiss
                    </button>
                </div>
            )}
        </div>
    );
}

export default TicketScanner;

