import React, { useState, useEffect, useRef } from "react";
import axiosClient from "../api/axiosClient";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { ShieldCheck, Smartphone } from "lucide-react";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // giây

const Login = () => {
  const navigate = useNavigate();

  // Bước 1: nhập email + password
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  // Bước 2: nhập OTP
  const [step, setStep]       = useState(1); // 1 | 2
  const [otp, setOtp]         = useState(["","","","","",""]);
  const [otpError, setOtpError] = useState("");
  const [otpStatus, setOtpStatus] = useState(""); // "LOCKED" | "EXPIRED" | ""
  const [remaining, setRemaining] = useState(null); // số lần còn lại
  const [lockedMinutes, setLockedMinutes] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Đếm ngược nút gửi lại OTP
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendLoading, setResendLoading]     = useState(false);
  const timerRef = useRef(null);

  const otpRefs = useRef([]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // ── Bước 1: gửi email + password ──
  const handleLogin = async () => {
    if (!form.email || !form.password) { setError("Vui lòng nhập đầy đủ thông tin."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await axiosClient.post("/auth/login", form);

      if (res.data?.status === "SUCCESS") {
        // OTP đang tắt ở server (app.otp.enabled=false) -> đăng nhập thành công luôn, bỏ qua bước OTP
        localStorage.setItem("token", res.data.token);
        navigate("/");
        window.location.reload();
        return;
      }

      if (res.data?.status === "OTP_SENT") {
        setStep(2);
        startResendCountdown();
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // ── Xử lý nhập OTP từng ô ──
  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);
    setOtpError("");

    // Tự chuyển sang ô tiếp
    if (cleaned && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }

    // Tự submit khi nhập đủ 6 số
    if (cleaned && index === OTP_LENGTH - 1) {
      const fullOtp = [...newOtp.slice(0, -1), cleaned].join("");
      if (fullOtp.length === OTP_LENGTH) handleVerifyOtp(fullOtp);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") handleVerifyOtp();
  };

  // ── Bước 2: xác minh OTP ──
  const handleVerifyOtp = async (otpValue) => {
    const otpStr = otpValue || otp.join("");
    if (otpStr.length < OTP_LENGTH) { setOtpError("Vui lòng nhập đủ 6 số OTP."); return; }

    setVerifying(true);
    setOtpError("");
    try {
      const res = await axiosClient.post("/auth/verify-otp", { email: form.email, otp: otpStr });
      // Thành công — res.data là JWT token string
      localStorage.setItem("token", res.data);
      navigate("/");
      window.location.reload();
    } catch (err) {
      const data = err?.response?.data;
      const status = data?.status;

      if (status === "OTP_LOCKED") {
        setOtpStatus("LOCKED");
        setLockedMinutes(data.lockedMinutes);
        setOtpError(data.message);
      } else if (status === "OTP_WRONG") {
        setRemaining(data.remaining);
        setOtpError(data.message);
        // Reset ô OTP
        setOtp(["","","","","",""]);
        otpRefs.current[0]?.focus();
      } else if (data?.message?.includes("hết hạn")) {
        setOtpStatus("EXPIRED");
        setOtpError("Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại.");
      } else {
        setOtpError(data?.message || "Có lỗi xảy ra.");
      }
    } finally {
      setVerifying(false);
    }
  };

  // ── Gửi lại OTP ──
  const handleResend = async () => {
    if (resendCountdown > 0) return;
    setResendLoading(true);
    setOtpError("");
    setOtpStatus("");
    try {
      await axiosClient.post("/auth/resend-otp", { email: form.email });
      setOtp(["","","","","",""]);
      setRemaining(null);
      otpRefs.current[0]?.focus();
      startResendCountdown();
    } catch (err) {
      setOtpError(err?.response?.data?.message || "Không thể gửi lại OTP.");
    } finally {
      setResendLoading(false);
    }
  };

  const startResendCountdown = () => {
    setResendCountdown(RESEND_COOLDOWN);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── UI Bước 1 ──
  const renderStep1 = () => (
    <>
      <h2 style={styles.title}>Đăng nhập</h2>
      <input name="email" type="email" placeholder="Email" value={form.email}
        onChange={handleChange} style={styles.input}
        onKeyDown={e => e.key === "Enter" && handleLogin()} />
      <input name="password" type="password" placeholder="Mật khẩu" value={form.password}
        onChange={handleChange} style={styles.input}
        onKeyDown={e => e.key === "Enter" && handleLogin()} />

      {error && <div style={styles.errorBox}>
        {error}
        {error.includes("xác thực email") && (
          <div style={{ marginTop: 8 }}>
            <span style={styles.resendLink} onClick={() => navigate("/verify-email-resend")}>
              Gửi lại email xác thực →
            </span>
          </div>
        )}
      </div>}

      <button onClick={handleLogin} disabled={loading}
        style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}>
        {loading ? "Đang xử lý..." : "Tiếp theo →"}
      </button>

      <div style={styles.linkRow}>
        <span style={styles.smallLink} onClick={() => navigate("/forgot-password")}>Quên mật khẩu?</span>
      </div>
      <div style={styles.bottomText}>
        Chưa có tài khoản?{" "}
        <span style={styles.link} onClick={() => navigate("/register")}>Đăng ký</span>
      </div>
    </>
  );

  // ── UI Bước 2 ──
  const renderStep2 = () => (
    <>
      <div style={styles.otpHeader}>
        <Smartphone size={32} color="#ff5722" />
        <h2 style={{ ...styles.title, marginTop: 8 }}>Xác thực số điện thoại</h2>
        <p style={styles.otpDesc}>
          Mã OTP 6 số đã được gửi đến số điện thoại đăng ký của <strong>{form.email}</strong>.
          Mã hết hạn sau <strong>5 phút</strong>.
        </p>
      </div>

      {/* Ô nhập OTP */}
      <div style={styles.otpRow}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => otpRefs.current[i] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleOtpChange(i, e.target.value)}
            onKeyDown={e => handleOtpKeyDown(i, e)}
            style={{
              ...styles.otpInput,
              borderColor: otpStatus === "LOCKED" ? "#e53935"
                         : digit ? "#ff5722" : "#ddd",
              backgroundColor: digit ? "#fff8f0" : "#fff",
            }}
            disabled={otpStatus === "LOCKED" || verifying}
          />
        ))}
      </div>

      {/* Thông báo lỗi OTP */}
      {otpError && (
        <div style={{
          ...styles.errorBox,
          backgroundColor: otpStatus === "LOCKED" ? "#fce4ec" : "#fff8e1",
          color: otpStatus === "LOCKED" ? "#e53935" : "#e65100",
        }}>
          {otpStatus === "LOCKED" && "🔒 "}{otpError}
        </div>
      )}

      {/* Nút xác nhận */}
      {otpStatus !== "LOCKED" && (
        <button
          onClick={() => handleVerifyOtp()}
          disabled={verifying || otp.join("").length < OTP_LENGTH}
          style={{ ...styles.button, opacity: (verifying || otp.join("").length < OTP_LENGTH) ? 0.6 : 1 }}>
          {verifying ? "Đang xác minh..." : "Xác nhận OTP"}
        </button>
      )}

      {/* Gửi lại OTP */}
      <div style={styles.resendRow}>
        {resendCountdown > 0 ? (
          <span style={styles.resendCountdown}>Gửi lại sau {resendCountdown}s</span>
        ) : (
          <span
            style={{ ...styles.smallLink, opacity: resendLoading ? 0.6 : 1 }}
            onClick={handleResend}>
            {resendLoading ? "Đang gửi..." : "Gửi lại mã OTP"}
          </span>
        )}
      </div>

      {/* Quay lại bước 1 */}
      <div style={styles.bottomText}>
        <span style={styles.smallLink} onClick={() => { setStep(1); setOtp(["","","","","",""]); setOtpError(""); setOtpStatus(""); }}>
          ← Đăng nhập bằng tài khoản khác
        </span>
      </div>
    </>
  );

  return (
    <div style={styles.page}>
      <Header />
      <div style={styles.container}>
        {/* Step indicator */}
        <div style={styles.stepIndicator}>
          <div style={{ ...styles.stepDot, backgroundColor: "#ff5722" }}>1</div>
          <div style={{ ...styles.stepLine, backgroundColor: step === 2 ? "#ff5722" : "#ddd" }} />
          <div style={{ ...styles.stepDot, backgroundColor: step === 2 ? "#ff5722" : "#ddd" }}>2</div>
        </div>
        <div style={styles.stepLabels}>
          <span style={{ color: "#ff5722", fontWeight: 600, fontSize: 12 }}>Tài khoản</span>
          <span style={{ color: step === 2 ? "#ff5722" : "#bbb", fontWeight: 600, fontSize: 12 }}>Xác thực OTP</span>
        </div>

        {step === 1 ? renderStep1() : renderStep2()}
      </div>
    </div>
  );
};

export default Login;

const styles = {
  page:      { backgroundColor: "#f5f5f5", minHeight: "100vh" },
  container: { width: "420px", margin: "50px auto", backgroundColor: "white", padding: "32px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  title:     { textAlign: "center", margin: "0 0 4px", color: "#333", fontSize: 22 },

  // Step indicator
  stepIndicator: { display: "flex", alignItems: "center", justifyContent: "center", gap: 0 },
  stepDot:       { width: 28, height: 28, borderRadius: "50%", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" },
  stepLine:      { width: 60, height: 3, transition: "background 0.3s" },
  stepLabels:    { display: "flex", justifyContent: "space-between", paddingInline: 20, marginTop: -6 },

  input:    { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", outline: "none" },
  button:   { padding: "12px", border: "none", backgroundColor: "#ff5722", color: "white", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "15px" },
  errorBox: { backgroundColor: "#fff8e1", color: "#e65100", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", lineHeight: 1.5 },
  resendLink: { color: "#ff5722", cursor: "pointer", fontWeight: 600, fontSize: 13, textDecoration: "underline" },
  linkRow:  { textAlign: "center" },
  smallLink:{ fontSize: "13px", color: "#ff5722", cursor: "pointer", fontWeight: 600 },
  bottomText:{ textAlign: "center", fontSize: "14px", color: "#666" },
  link:     { color: "#ff5722", cursor: "pointer", fontWeight: "bold" },

  // OTP step
  otpHeader: { textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  otpDesc:   { fontSize: 13, color: "#666", lineHeight: 1.6, textAlign: "center", margin: 0 },
  otpRow:    { display: "flex", gap: 8, justifyContent: "center" },
  otpInput:  { width: 44, height: 52, textAlign: "center", fontSize: 22, fontWeight: 700, borderRadius: 8, border: "2px solid #ddd", outline: "none", transition: "border-color 0.15s", color: "#333" },
  resendRow: { textAlign: "center" },
  resendCountdown: { fontSize: 13, color: "#aaa" },
};