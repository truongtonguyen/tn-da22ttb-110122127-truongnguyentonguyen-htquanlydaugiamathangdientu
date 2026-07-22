import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Gavel } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <Header />
      <div style={styles.container}>
        <div style={styles.number}>404</div>
        <div style={styles.icon}><Gavel size={40} color="#ffccbc" /></div>
        <h2 style={styles.title}>Không tìm thấy trang</h2>
        <p style={styles.desc}>
          Trang bạn đang tìm có thể đã bị xóa, đổi địa chỉ, hoặc không tồn tại.
        </p>
        <div style={styles.actions}>
          <button style={styles.primaryBtn} onClick={() => navigate("/")}>
            Về trang chủ
          </button>
          <button style={styles.secondaryBtn} onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f5f5f5" },

  container: {
    maxWidth: 480,
    margin: "0 auto",
    padding: "100px 20px 60px",
    textAlign: "center",
  },

  number: {
    fontSize: 90,
    fontWeight: 800,
    color: "#ffccbc",
    lineHeight: 1,
    marginBottom: -10,
  },

  icon: { fontSize: 40, marginBottom: 16 },

  title: { fontSize: 22, fontWeight: 700, color: "#333", marginBottom: 10 },

  desc: { fontSize: 14, color: "#888", marginBottom: 28, lineHeight: 1.6 },

  actions: { display: "flex", gap: 12, justifyContent: "center" },

  primaryBtn: {
    padding: "11px 24px",
    background: "#ff5722",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
  },

  secondaryBtn: {
    padding: "11px 24px",
    background: "#fff",
    color: "#555",
    border: "1px solid #ddd",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
};