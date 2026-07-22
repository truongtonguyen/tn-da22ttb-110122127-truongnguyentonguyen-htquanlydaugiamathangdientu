import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import axiosClient from "../api/axiosClient";
import { CheckCircle2, XCircle, Clock, Loader, PartyPopper } from "lucide-react";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus]               = useState("loading");
  const [resendEmail, setResendEmail]     = useState("");
  const [resendSent, setResendSent]       = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError]     = useState("");

  useEffect(() => {
    const token = new URLSearchParams(location.search).get("token");
    if (!token) { setStatus("no_token"); return; }

    axiosClient.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(res => {
        const s = res.data?.status;
        switch (s) {
          case "SUCCESS":          setStatus("success");          break;
          case "TOKEN_EXPIRED":    setStatus("expired");          break;
          case "ALREADY_VERIFIED": setStatus("already_verified"); break;
          case "TOKEN_INVALID":    setStatus("invalid");          break;
          default:                 setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [location.search]);

  const handleResend = async () => {
    if (!resendEmail.trim()) { setResendError("Vui lòng nhập email"); return; }
    setResendLoading(true);
    setResendError("");
    try {
      await axiosClient.post("/auth/resend-verification-email", { email: resendEmail });
      setResendSent(true);
    } catch (err) {
      setResendError(err?.response?.data?.message || "Không thể gửi lại. Vui lòng thử lại.");
    } finally {
      setResendLoading(false);
    }
  };

  const ResendForm = () => (
    !resendSent ? (
      <div style={{ width: "100%" }}>
        <input
          style={s.input}
          type="email"
          placeholder="Nhập email đã đăng ký"
          value={resendEmail}
          onChange={e => setResendEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleResend()}
        />
        {resendError && <p style={s.error}>{resendError}</p>}
        <button
          style={{ ...s.btn, opacity: resendLoading ? 0.6 : 1 }}
          onClick={handleResend}
          disabled={resendLoading}
        >
          {resendLoading ? "Đang gửi..." : "Gửi lại email xác thực"}
        </button>
      </div>
    ) : (
      <div style={s.successBox}>
        ✅ Đã gửi! Vui lòng kiểm tra hộp thư và nhấp vào liên kết mới.
      </div>
    )
  );

  const renderContent = () => {
    switch (status) {

      case "loading":
        return (
          <div style={s.card}>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
              <Loader size={48} color="#ff5722" style={{ animation: "spin 1s linear infinite" }} />
            </div>
            <h2 style={s.title}>Đang xác thực...</h2>
            <p style={s.desc}>Vui lòng chờ trong giây lát.</p>
          </div>
        );

      case "success":
        return (
          <div style={s.card}>
            <CheckCircle2 size={56} color="#43a047" style={{ marginBottom: 16 }} />
            <h2 style={{ ...s.title, color: "#43a047" }}>Xác thực thành công!</h2>
            <p style={s.desc}>Email của bạn đã được xác thực. Bạn có thể đăng nhập ngay.</p>
            <button style={s.btn} onClick={() => navigate("/login")}>Đăng nhập ngay</button>
          </div>
        );

      // ✅ Đã xác thực trước đó — không phải lỗi, hướng dẫn đăng nhập
      case "already_verified":
        return (
          <div style={s.card}>
            <PartyPopper size={56} color="#43a047" style={{ marginBottom: 16 }} />
            <h2 style={{ ...s.title, color: "#43a047" }}>Email đã được xác thực</h2>
            <p style={s.desc}>
              Tài khoản của bạn đã được xác thực trước đó rồi.
              Bạn có thể đăng nhập bình thường.
            </p>
            <button style={s.btn} onClick={() => navigate("/login")}>Đăng nhập</button>
          </div>
        );

      case "expired":
        return (
          <div style={s.card}>
            <Clock size={56} color="#ff9800" style={{ marginBottom: 16 }} />
            <h2 style={{ ...s.title, color: "#ff9800" }}>Liên kết đã hết hạn</h2>
            <p style={s.desc}>
              Liên kết xác thực chỉ có hiệu lực 24 giờ. Nhập email để nhận liên kết mới:
            </p>
            <ResendForm />
          </div>
        );

      // ✅ Token sai hoàn toàn — không tồn tại trong DB
      case "invalid":
        return (
          <div style={s.card}>
            <XCircle size={56} color="#e53935" style={{ marginBottom: 16 }} />
            <h2 style={{ ...s.title, color: "#e53935" }}>Liên kết không hợp lệ</h2>
            <p style={s.desc}>
              Liên kết xác thực này không đúng. Vui lòng kiểm tra lại email hoặc yêu cầu gửi lại:
            </p>
            <ResendForm />
            <p style={s.hint}>
              <span style={s.link} onClick={() => navigate("/login")}>← Quay lại đăng nhập</span>
            </p>
          </div>
        );

      case "no_token":
      case "error":
      default:
        return (
          <div style={s.card}>
            <XCircle size={56} color="#e53935" style={{ marginBottom: 16 }} />
            <h2 style={{ ...s.title, color: "#e53935" }}>Có lỗi xảy ra</h2>
            <p style={s.desc}>
              Không thể xử lý liên kết này. Vui lòng kiểm tra lại email hoặc yêu cầu gửi lại:
            </p>
            <ResendForm />
            <p style={s.hint}>
              <span style={s.link} onClick={() => navigate("/login")}>← Quay lại đăng nhập</span>
            </p>
          </div>
        );
    }
  };

  return (
    <div style={s.page}>
      <Header />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={s.wrap}>{renderContent()}</div>
    </div>
  );
};

export default VerifyEmail;

const s = {
  page:       { backgroundColor: "#f5f5f5", minHeight: "100vh" },
  wrap:       { display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 20px" },
  card:       { backgroundColor: "#fff", borderRadius: 16, padding: "40px 36px", maxWidth: 460, width: "100%", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.09)", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 },
  title:      { fontSize: 22, fontWeight: 700, color: "#222", margin: "0 0 12px" },
  desc:       { fontSize: 14, color: "#555", lineHeight: 1.7, margin: "0 0 20px", width: "100%" },
  input:      { width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 10 },
  btn:        { width: "100%", padding: "12px", backgroundColor: "#ff5722", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 15 },
  successBox: { backgroundColor: "#e8f5e9", color: "#2e7d32", borderRadius: 8, padding: "14px 16px", fontSize: 14, lineHeight: 1.6, width: "100%", boxSizing: "border-box" },
  error:      { color: "#e53935", fontSize: 13, marginBottom: 8, textAlign: "left" },
  hint:       { marginTop: 16, fontSize: 13, color: "#888", width: "100%" },
  link:       { color: "#ff5722", cursor: "pointer", fontWeight: 600 },
};