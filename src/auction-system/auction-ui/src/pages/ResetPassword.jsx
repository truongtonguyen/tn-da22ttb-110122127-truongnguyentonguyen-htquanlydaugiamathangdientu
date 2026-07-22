import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import axiosClient from "../api/axiosClient";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken]                 = useState("");
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage]             = useState({ text: "", type: "error" });
  const [success, setSuccess]             = useState(false);
  const [tokenExpired, setTokenExpired]   = useState(false);
  const [tokenInvalid, setTokenInvalid]   = useState(false);

  const [resendEmail, setResendEmail]     = useState("");
  const [resendSent, setResendSent]       = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setToken(params.get("token") || "");
  }, [location.search]);

  const validatePassword = () => {
    if (!newPassword || !confirmPassword) {
      setMessage({ text: "Vui lòng nhập mật khẩu mới và xác nhận.", type: "error" });
      return false;
    }
    if (newPassword.length < 6) {
      setMessage({ text: "Mật khẩu phải có ít nhất 6 ký tự.", type: "error" });
      return false;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ text: "Mật khẩu xác nhận không khớp.", type: "error" });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!token) {
      setTokenInvalid(true);
      return;
    }
    if (!validatePassword()) return;

    try {
      const res = await axiosClient.post("/auth/reset-password", { token, newPassword });
      // ✅ Backend trả JSON { status: "SUCCESS" / "TOKEN_EXPIRED" / "TOKEN_INVALID" }
      const status = res.data?.status;
      if (status === "SUCCESS") {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2500);
      } else if (status === "TOKEN_EXPIRED") {
        setTokenExpired(true);
      } else {
        setTokenInvalid(true);
      }
    } catch (err) {
      // Fallback nếu backend trả 400
      const status = err?.response?.data?.status || err?.response?.data;
      if (status === "TOKEN_EXPIRED") {
        setTokenExpired(true);
      } else {
        setTokenInvalid(true);
      }
    }
  };

  const handleResend = async () => {
    if (!resendEmail) {
      setMessage({ text: "Vui lòng nhập email của bạn.", type: "error" });
      return;
    }
    setResendLoading(true);
    try {
      await axiosClient.post("/auth/forgot-password", { email: resendEmail });
      setResendSent(true);
      setMessage({ text: "", type: "error" });
    } catch (err) {
      setMessage({
        text: err?.response?.data?.message || "Không thể gửi email. Vui lòng thử lại.",
        type: "error",
      });
    } finally {
      setResendLoading(false);
    }
  };

  // ✅ Hết hạn — rõ ràng, có form gửi lại
  if (tokenExpired) return (
    <div style={styles.page}>
      <Header />
      <div style={styles.container}>
        <div style={styles.iconWrap}>⏰</div>
        <h2 style={{ ...styles.title, color: "#ff9800" }}>Liên kết đã hết hạn</h2>
        <p style={styles.desc}>Liên kết đặt lại mật khẩu chỉ có hiệu lực 24 giờ. Nhập email để nhận liên kết mới:</p>
        {!resendSent ? (
          <>
            <input type="email" placeholder="Nhập email của bạn" value={resendEmail}
              onChange={e => setResendEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleResend()}
              style={styles.input} />
            {message.text && <div style={styles.errorBox}>{message.text}</div>}
            <button onClick={handleResend} disabled={resendLoading}
              style={{ ...styles.button, backgroundColor: "#ff9800", opacity: resendLoading ? 0.6 : 1 }}>
              {resendLoading ? "Đang gửi..." : "Gửi lại liên kết"}
            </button>
          </>
        ) : (
          <div style={styles.successBox}>✅ Đã gửi! Vui lòng kiểm tra hộp thư.</div>
        )}
        <span style={styles.backLink} onClick={() => navigate("/login")}>← Quay lại đăng nhập</span>
      </div>
    </div>
  );

  // ✅ Không hợp lệ — rõ ràng khác với hết hạn
  if (tokenInvalid) return (
    <div style={styles.page}>
      <Header />
      <div style={styles.container}>
        <div style={styles.iconWrap}>❌</div>
        <h2 style={{ ...styles.title, color: "#e53935" }}>Liên kết không hợp lệ</h2>
        <p style={styles.desc}>Liên kết này không đúng hoặc đã được sử dụng. Vui lòng yêu cầu gửi lại:</p>
        {!resendSent ? (
          <>
            <input type="email" placeholder="Nhập email của bạn" value={resendEmail}
              onChange={e => setResendEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleResend()}
              style={styles.input} />
            {message.text && <div style={styles.errorBox}>{message.text}</div>}
            <button onClick={handleResend} disabled={resendLoading}
              style={{ ...styles.button, backgroundColor: "#e53935", opacity: resendLoading ? 0.6 : 1 }}>
              {resendLoading ? "Đang gửi..." : "Gửi lại liên kết"}
            </button>
          </>
        ) : (
          <div style={styles.successBox}>✅ Đã gửi! Vui lòng kiểm tra hộp thư.</div>
        )}
        <span style={styles.backLink} onClick={() => navigate("/login")}>← Quay lại đăng nhập</span>
      </div>
    </div>
  );

  // ✅ Thành công
  if (success) return (
    <div style={styles.page}>
      <Header />
      <div style={styles.container}>
        <div style={styles.iconWrap}>✅</div>
        <h2 style={{ ...styles.title, color: "#43a047" }}>Đặt lại mật khẩu thành công!</h2>
        <div style={styles.successBox}>Đang chuyển đến trang đăng nhập...</div>
      </div>
    </div>
  );

  // Form đặt lại mật khẩu
  return (
    <div style={styles.page}>
      <Header />
      <div style={styles.container}>
        <h2 style={styles.title}>Đặt lại mật khẩu</h2>
        <input type="password" placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
          value={newPassword} onChange={e => setNewPassword(e.target.value)}
          style={styles.input} />
        <input type="password" placeholder="Xác nhận mật khẩu mới"
          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={styles.input} />
        {message.text && (
          <div style={{ ...styles.errorBox,
            backgroundColor: message.type === "success" ? "#e8f5e9" : "#fce4ec",
            color: message.type === "success" ? "#43a047" : "#e53935" }}>
            {message.text}
          </div>
        )}
        <button onClick={handleSubmit} style={styles.button}>Đặt lại mật khẩu</button>
        <span style={styles.backLink} onClick={() => navigate("/login")}>← Quay lại đăng nhập</span>
      </div>
    </div>
  );
};

export default ResetPassword;

const styles = {
  page:       { backgroundColor: "#f5f5f5", minHeight: "100vh" },
  container:  { width: "420px", margin: "60px auto", backgroundColor: "white", padding: "36px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  iconWrap:   { textAlign: "center", fontSize: 48, marginBottom: 4 },
  title:      { textAlign: "center", margin: "0 0 4px", color: "#333" },
  desc:       { color: "#555", fontSize: 14, lineHeight: 1.6, textAlign: "center", margin: 0 },
  input:      { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", outline: "none" },
  button:     { padding: "12px", border: "none", backgroundColor: "#ff5722", color: "white", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "15px" },
  errorBox:   { backgroundColor: "#fce4ec", color: "#e53935", borderRadius: "8px", padding: "10px 14px", fontSize: "13px" },
  successBox: { backgroundColor: "#e8f5e9", color: "#2e7d32", borderRadius: "8px", padding: "12px 14px", fontSize: "14px", textAlign: "center" },
  backLink:   { color: "#ff5722", cursor: "pointer", fontSize: 13, textAlign: "center" },
};