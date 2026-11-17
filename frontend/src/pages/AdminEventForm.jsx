import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { ArrowLeft, Upload, AlertCircle, Sparkles } from "lucide-react";

function AdminEventForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Tech");
    const [date, setDate] = useState("");
    const [location, setLocation] = useState("");
    const [imageFile, setImageFile] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [upgradeRequired, setUpgradeRequired] = useState(false);

    useEffect(() => {
        if (isEdit) {
            async function fetchEvent() {
                try {
                    const res = await api.get(`/events/${id}`);
                    const ev = res.data.data;
                    setTitle(ev.title || "");
                    setDescription(ev.description || "");
                    setCategory(ev.category || "Other");
                    setDate(ev.date ? new Date(ev.date).toISOString().split("T")[0] : "");
                    setLocation(ev.location || "");
                } catch (err) {
                    setError("Failed to load event for editing.");
                }
            }
            fetchEvent();
        }
    }, [id, isEdit]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setUpgradeRequired(false);
        setLoading(true);

        try {
            const payload = {
                title,
                description,
                category,
                date,
                location
            };

            let eventId = id;
            if (isEdit) {
                await api.put(`/events/${id}`, payload);
            } else {
                const res = await api.post("/events", payload);
                eventId = res.data.data._id;
            }

            // Upload image if selected
            if (imageFile && eventId) {
                const formData = new FormData();
                formData.append("image", imageFile);
                await api.post(`/events/${eventId}/image`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            }

            navigate("/dashboard");
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.code === "UPGRADE_REQUIRED") {
                setUpgradeRequired(true);
            }
            setError(err.response?.data?.message || "Failed to save event.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: "680px", margin: "40px auto 80px", padding: "0 24px" }}>
            <Link
                to="/dashboard"
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#94a3b8",
                    textDecoration: "none",
                    fontSize: "14px",
                    marginBottom: "24px"
                }}
            >
                <ArrowLeft size={16} /> Back to Org Hub
            </Link>

            <div className="glass-panel" style={{ padding: "36px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#f8fafc", marginBottom: "8px" }}>
                    {isEdit ? "Edit Event" : "Create New Event"}
                </h1>
                <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "28px" }}>
                    Configure the details and media for your organization's event
                </p>

                {error && (
                    <div
                        style={{
                            background: "rgba(239, 68, 68, 0.12)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#f87171",
                            padding: "14px",
                            borderRadius: "8px",
                            fontSize: "13.5px",
                            marginBottom: "20px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px"
                        }}
                    >
                        <AlertCircle size={18} />
                        <div>
                            <div>{error}</div>
                            {upgradeRequired && (
                                <Link
                                    to="/pricing"
                                    style={{
                                        color: "#22c55e",
                                        fontWeight: "700",
                                        display: "inline-block",
                                        marginTop: "6px"
                                    }}
                                >
                                    Upgrade to Pro Plan for Unlimited Events →
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#94a3b8", marginBottom: "6px" }}>
                            Event Title
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Annual Tech Developer Summit"
                            style={{
                                width: "100%",
                                padding: "11px 14px",
                                background: "#16161d",
                                border: "1px solid #282834",
                                borderRadius: "8px",
                                color: "#ffffff",
                                fontSize: "14px",
                                outline: "none"
                            }}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#94a3b8", marginBottom: "6px" }}>
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "11px 14px",
                                    background: "#16161d",
                                    border: "1px solid #282834",
                                    borderRadius: "8px",
                                    color: "#ffffff",
                                    fontSize: "14px",
                                    outline: "none"
                                }}
                            >
                                <option value="Music">Music</option>
                                <option value="Tech">Tech</option>
                                <option value="Sports">Sports</option>
                                <option value="Art">Art</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#94a3b8", marginBottom: "6px" }}>
                                Event Date
                            </label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "11px 14px",
                                    background: "#16161d",
                                    border: "1px solid #282834",
                                    borderRadius: "8px",
                                    color: "#ffffff",
                                    fontSize: "14px",
                                    outline: "none"
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#94a3b8", marginBottom: "6px" }}>
                            Location or Venue
                        </label>
                        <input
                            type="text"
                            required
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Convention Center or Virtual Link"
                            style={{
                                width: "100%",
                                padding: "11px 14px",
                                background: "#16161d",
                                border: "1px solid #282834",
                                borderRadius: "8px",
                                color: "#ffffff",
                                fontSize: "14px",
                                outline: "none"
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#94a3b8", marginBottom: "6px" }}>
                            Description
                        </label>
                        <textarea
                            required
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detailed overview of what attendees can expect..."
                            style={{
                                width: "100%",
                                padding: "11px 14px",
                                background: "#16161d",
                                border: "1px solid #282834",
                                borderRadius: "8px",
                                color: "#ffffff",
                                fontSize: "14px",
                                outline: "none",
                                resize: "vertical"
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#94a3b8", marginBottom: "6px" }}>
                            Banner Image (Optional)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files[0])}
                            style={{
                                width: "100%",
                                padding: "10px",
                                background: "#16161d",
                                border: "1px solid #282834",
                                borderRadius: "8px",
                                color: "#94a3b8",
                                fontSize: "13px"
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-neon"
                        style={{ width: "100%", padding: "12px", marginTop: "10px" }}
                    >
                        {loading ? "Saving Event..." : isEdit ? "Update Event" : "Publish Event"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AdminEventForm;
