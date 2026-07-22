import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export const ToastContainer = ({ toasts, removeToast }) => (
  <div style={styles.container}>
    {toasts.map(t => (
      <div
        key={t.id}
        style={{
          ...styles.toast,
          ...typeStyles[t.type] || typeStyles.info,
          animation: t.leaving ? "slideOut 0.3s ease forwards" : "slideIn 0.3s ease",
        }}
      >
        <span style={styles.icon}>{typeIcons[t.type] || <Info size={18} />}</span>
        <span style={styles.msg}>{t.message}</span>
        <button style={styles.close} onClick={() => removeToast(t.id)}><X size={14} /></button>
      </div>
    ))}
    <style>{`
      @keyframes slideIn {
        from { transform: translateX(110%); opacity: 0; }
        to   { transform: translateX(0);   opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0);   opacity: 1; }
        to   { transform: translateX(110%); opacity: 0; }
      }
    `}</style>
  </div>
);

const typeIcons = {
  success: <CheckCircle2 size={18} color="#43a047" />,
  error:   <XCircle size={18} color="#e53935" />,
  warning: <AlertTriangle size={18} color="#ff9800" />,
  info:    <Info size={18} color="#2196f3" />,
};

const typeStyles = {
  success: { borderLeft: "4px solid #43a047", backgroundColor: "#f1f8e9" },
  error:   { borderLeft: "4px solid #e53935", backgroundColor: "#fce4ec" },
  warning: { borderLeft: "4px solid #ff9800", backgroundColor: "#fff8e1" },
  info:    { borderLeft: "4px solid #2196f3", backgroundColor: "#e3f2fd" },
};

const styles = {
  container: {
    position: "fixed",
    top: 80, right: 20,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    maxWidth: 360,
    width: "100%",
    pointerEvents: "none",
  },
  toast: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    borderRadius: 10,
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    pointerEvents: "all",
    background: "#fff",
    minWidth: 280,
  },
  icon:  { fontSize: 18, flexShrink: 0 },
  msg:   { flex: 1, fontSize: 14, color: "#333", lineHeight: 1.4 },
  close: {
    background: "none", border: "none",
    cursor: "pointer", color: "#aaa",
    fontSize: 14, flexShrink: 0, padding: 0,
  },
};