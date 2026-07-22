import React, { useState } from "react";
import axiosClient from "../api/axiosClient";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const Field = ({ name, label, type = "text", value, error, hint, onChange, onEnter, maxLength }) => (
  <div style={styles.fieldGroup}>
    <label style={styles.label}>{label}</label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      style={{ ...styles.input, borderColor: error ? "#e53935" : "#ddd" }}
      onKeyDown={e => e.key === "Enter" && onEnter && onEnter()}
      maxLength={maxLength}
    />
    {error
      ? <span style={styles.fieldError}>{error}</span>
      : hint && <span style={styles.fieldHint}>{hint}</span>}
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "", email: "", password: "", confirmPassword: "", fullName: "", phone: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = name === "phone" ? value.replace(/[^0-9]/g, "").slice(0, 10) : value;
    setForm({ ...form, [name]: val });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const errs = {};
    if (!form.username.trim())         errs.username = "Vui lòng nhập tên đăng nhập";
    if (form.username.length < 3)      errs.username = "Tên đăng nhập phải ít nhất 3 ký tự";
    if (!form.email.trim())            errs.email    = "Vui lòng nhập email";
    if (!form.fullName.trim())         errs.fullName = "Vui lòng nhập họ và tên";
    if (!/^(0[35789][0-9]{8})$/.test(form.phone))
                                       errs.phone    = "Số điện thoại không hợp lệ (VD: 0901234567)";
    if (form.password.length < 6)      errs.password = "Mật khẩu phải ít nhất 6 ký tự";
    if (form.password !== form.confirmPassword)
                                       errs.confirmPassword = "Mật khẩu xác nhận không khớp";
    return errs;
  };

  const handleRegister = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await axiosClient.post("/auth/register", payload);
      navigate("/verify-email-sent", { state: { email: form.email } });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || "Đăng ký thất bại";
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <Header />
      <div style={styles.container}>
        <h2 style={styles.title}>Đăng ký</h2>

        <Field
          name="username" label="Tên đăng nhập"
          value={form.username} error={errors.username}
          hint="Ít nhất 3 ký tự"
          onChange={handleChange} onEnter={handleRegister}
        />
        <Field
          name="email" label="Email"
          value={form.email} error={errors.email}
          onChange={handleChange} onEnter={handleRegister}
        />
        <Field
          name="fullName" label="Họ và tên"
          value={form.fullName} error={errors.fullName}
          onChange={handleChange} onEnter={handleRegister}
        />

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Số điện thoại <span style={{ color: "#e53935" }}>*</span></label>
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            maxLength={10}
            style={{ ...styles.input, borderColor: errors.phone ? "#e53935" : "#ddd" }}
          />
          {errors.phone
            ? <span style={styles.fieldError}>{errors.phone}</span>
            : <span style={styles.fieldHint}>10 số, bắt đầu 03/05/07/08/09</span>}
        </div>

        <Field
          name="password" label="Mật khẩu" type="password"
          value={form.password} error={errors.password}
          hint="Ít nhất 6 ký tự"
          onChange={handleChange} onEnter={handleRegister}
        />
        <Field
          name="confirmPassword" label="Xác nhận mật khẩu" type="password"
          value={form.confirmPassword} error={errors.confirmPassword}
          onChange={handleChange} onEnter={handleRegister}
        />

        {errors.general && (
          <div style={styles.errorBox}>{errors.general}</div>
        )}

        <button onClick={handleRegister} disabled={loading}
          style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </button>

        <div style={styles.bottomText}>
          Đã có tài khoản?{" "}
          <span style={styles.link} onClick={() => navigate("/login")}>Đăng nhập</span>
        </div>
      </div>
    </div>
  );
};

export default Register;

const styles = {
  page:       { backgroundColor: "#f5f5f5", minHeight: "100vh" },
  container:  { width: "420px", margin: "40px auto", backgroundColor: "white", padding: "35px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  title: { textAlign: "center", marginTop: 0, marginBottom: "4px", color: "#333" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 4 },
  label:      { fontSize: 13, fontWeight: 600, color: "#555" },
  input:      { padding: "11px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", outline: "none" },
  fieldError: { color: "#e53935", fontSize: 12 },
  fieldHint:  { color: "#aaa", fontSize: 11 },
  errorBox:   { backgroundColor: "#fce4ec", color: "#e53935", borderRadius: 8, padding: "10px 14px", fontSize: 13 },
  button:     { padding: "12px", border: "none", backgroundColor: "#ff5722", color: "white", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "15px" },
  bottomText: { textAlign: "center", fontSize: "14px", color: "#666" },
  link:       { color: "#ff5722", cursor: "pointer", fontWeight: "bold" },
};