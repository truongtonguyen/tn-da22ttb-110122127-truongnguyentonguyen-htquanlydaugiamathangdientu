import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { forgotPassword } from "../api/authApi";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    try {
      await forgotPassword({ email });
      setMessage(
        "Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra email hoặc console."
      );
    } catch (err) {
      console.log(err);
      setMessage("Không thể gửi yêu cầu. Vui lòng thử lại sau.");
    }
  };

  return (
    <div style={styles.page}>
      <Header />

      <div style={styles.container}>
        <h2 style={styles.title}>Quên mật khẩu</h2>

        <input
          name="email"
          type="email"
          placeholder="Nhập email của bạn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <button onClick={handleSubmit} style={styles.button}>
          Gửi liên kết
        </button>

        {message && <div style={styles.message}>{message}</div>}

        <div style={styles.bottomText}>
          Đã nhớ mật khẩu?
          <span style={styles.link} onClick={() => navigate("/login")}>Đăng nhập</span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

const styles = {
  page: {
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
  },
  container: {
    width: "400px",
    margin: "60px auto",
    backgroundColor: "white",
    padding: "35px",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  title: {
    textAlign: "center",
    marginBottom: "10px",
    color: "#333",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
  },
  button: {
    padding: "12px",
    border: "none",
    backgroundColor: "#ff5722",
    color: "white",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
  },
  message: {
    marginTop: "10px",
    color: "#333",
    fontSize: "14px",
    textAlign: "center",
  },
  bottomText: {
    textAlign: "center",
    fontSize: "14px",
    color: "#666",
    marginTop: "5px",
  },
  link: {
    marginLeft: "6px",
    color: "#ff5722",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
