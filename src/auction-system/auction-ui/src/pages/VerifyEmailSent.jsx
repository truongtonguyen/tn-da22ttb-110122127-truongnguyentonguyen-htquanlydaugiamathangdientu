import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import Header from "../components/Header";

const VerifyEmailSent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";
  
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState("");

  const handleResendEmail = async () => {
    if (!email) {
      setMessage("Email không tìm thấy. Vui lòng đăng ký lại.");
      return;
    }

    setIsResending(true);
    try {
      await axiosClient.post("/auth/resend-verification-email", { email });
      setMessage("✅ Email xác thực đã được gửi lại!");
    } catch (err) {
      setMessage("❌ Lỗi: " + (err.response?.data || err.message));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div style={styles.page}>
      <Header />

      <div style={styles.container}>
        <div style={styles.icon}>✉️</div>

        <h2 style={styles.title}>Xác thực Email</h2>

        <p style={styles.subtitle}>
          Chúng tôi đã gửi một email xác thực đến:
        </p>

        <p style={styles.email}>{email}</p>

        <p style={styles.description}>
          Vui lòng kiểm tra email của bạn (bao gồm thư mục spam) 
          và nhấp vào liên kết xác thực để kích hoạt tài khoản.
        </p>

        <p style={styles.hint}>
          💡 Liên kết xác thực sẽ hết hạn trong 24 giờ.
        </p>

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}

        <button
          onClick={handleResendEmail}
          disabled={isResending}
          style={{
            ...styles.button,
            opacity: isResending ? 0.6 : 1,
            cursor: isResending ? "not-allowed" : "pointer",
          }}
        >
          {isResending ? "Đang gửi..." : "Gửi lại email xác thực"}
        </button>

        <div style={styles.bottomText}>
          Đã xác thực email?

          <span
            style={styles.link}
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </span>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailSent;

const styles = {
  page: {
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
  },

  container: {
    width: "420px",
    margin: "60px auto",
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    textAlign: "center",
  },

  icon: {
    fontSize: "48px",
    marginBottom: "10px",
  },

  title: {
    color: "#2196F3",
    marginBottom: "5px",
    fontSize: "24px",
  },

  subtitle: {
    color: "#666",
    fontSize: "14px",
    marginTop: "15px",
  },

  email: {
    backgroundColor: "#e3f2fd",
    padding: "12px",
    borderRadius: "8px",
    color: "#1976d2",
    fontWeight: "bold",
    fontSize: "15px",
    margin: "10px 0",
    wordBreak: "break-all",
  },

  description: {
    color: "#666",
    fontSize: "14px",
    lineHeight: "1.6",
    marginTop: "15px",
  },

  hint: {
    color: "#ff9800",
    fontSize: "13px",
    backgroundColor: "#fff3e0",
    padding: "10px",
    borderRadius: "8px",
    marginTop: "15px",
  },

  message: {
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "#f5f5f5",
    color: "#333",
    marginTop: "10px",
  },

  button: {
    marginTop: "20px",
    padding: "12px",
    backgroundColor: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },

  bottomText: {
    marginTop: "15px",
    fontSize: "14px",
    color: "#666",
    display: "flex",
    justifyContent: "center",
    gap: "5px",
  },

  link: {
    color: "#2196F3",
    fontWeight: "bold",
    cursor: "pointer",
    textDecoration: "underline",
  },
};
