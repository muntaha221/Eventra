import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = "success", duration = 3500) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = {
        success: (msg) => showToast(msg, "success"),
        error: (msg) => showToast(msg, "error"),
        info: (msg) => showToast(msg, "info")
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div
                style={{
                    position: "fixed",
                    bottom: "24px",
                    right: "24px",
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    pointerEvents: "none",
                    maxWidth: "calc(100vw - 32px)"
                }}
            >
                {toasts.map((t) => {
                    const isSuccess = t.type === "success";
                    const isError = t.type === "error";

                    return (
                        <div
                            key={t.id}
                            style={{
                                pointerEvents: "auto",
                                background: "rgba(18, 18, 24, 0.94)",
                                backdropFilter: "blur(14px)",
                                WebkitBackdropFilter: "blur(14px)",
                                border: `1.5px solid ${
                                    isSuccess
                                        ? "rgba(34, 197, 94, 0.4)"
                                        : isError
                                        ? "rgba(239, 68, 68, 0.4)"
                                        : "rgba(96, 165, 250, 0.4)"
                                }`,
                                boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 16px ${
                                    isSuccess
                                        ? "rgba(34, 197, 94, 0.15)"
                                        : isError
                                        ? "rgba(239, 68, 68, 0.15)"
                                        : "rgba(96, 165, 250, 0.15)"
                                }`,
                                borderRadius: "12px",
                                padding: "12px 18px",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                color: "#f8fafc",
                                fontSize: "14px",
                                minWidth: "280px",
                                animation: "fadeInUp 0.25s ease both"
                            }}
                        >
                            {isSuccess && <CheckCircle2 size={18} color="#22c55e" style={{ flexShrink: 0 }} />}
                            {isError && <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />}
                            {!isSuccess && !isError && <Info size={18} color="#60a5fa" style={{ flexShrink: 0 }} />}

                            <span style={{ flex: 1, lineHeight: "1.4" }}>{t.message}</span>

                            <button
                                onClick={() => removeToast(t.id)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#64748b",
                                    cursor: "pointer",
                                    padding: "2px",
                                    display: "flex",
                                    alignItems: "center"
                                }}
                            >
                                <X size={15} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        return {
            success: (msg) => console.log(msg),
            error: (msg) => console.error(msg),
            info: (msg) => console.info(msg)
        };
    }
    return context;
}
