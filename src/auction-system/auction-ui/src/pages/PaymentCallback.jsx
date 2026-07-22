import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

const PaymentCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing");

  useEffect(() => {
    const handleCallback = async () => {
      const queryString = window.location.search;
      const params = new URLSearchParams(queryString);
      const isVNPay = params.has("vnp_TxnRef");

      if (!isVNPay) {
        setStatus("failed");
        setTimeout(() => navigate("/wallet?paymentStatus=failed"), 1500);
        return;
      }

      try {
        const res = await axiosClient.get(`/payment/vnpay-callback${queryString}`);
        const { success, type } = res.data;

        if (success) {
          setStatus("success");
          setTimeout(() => {
            navigate(type === "wallet"
              ? "/wallet?paymentStatus=success"
              : "/profile?paymentStatus=success"
            );
          }, 1500);
        } else {
          setStatus("failed");
          setTimeout(() => {
            navigate(type === "wallet"
              ? "/wallet?paymentStatus=failed"
              : "/profile?paymentStatus=failed"
            );
          }, 1500);
        }
      } catch (err) {
        console.error("Payment callback error:", err);
        setStatus("failed");
        setTimeout(() => navigate("/wallet?paymentStatus=failed"), 1500);
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={styles.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={styles.card}>
        {status === "processing" && (
          <>
            <div style={styles.spinner} />
            <p style={styles.text}>Đang xử lý kết quả thanh toán...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div style={styles.iconSuccess}>✓</div>
            <p style={{ ...styles.text, color: "#43a047" }}>Thanh toán thành công!</p>
            <p style={styles.sub}>Đang chuyển hướng...</p>
          </>
        )}
        {status === "failed" && (
          <>
            <div style={styles.iconFailed}>✗</div>
            <p style={{ ...styles.text, color: "#e53935" }}>Thanh toán thất bại hoặc bị hủy.</p>
            <p style={styles.sub}>Đang chuyển hướng...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;

const styles = {
  page:        { minHeight: "100vh", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" },
  card:        { backgroundColor: "#fff", borderRadius: 14, padding: "40px 48px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", textAlign: "center", minWidth: 300 },
  spinner:     { width: 48, height: 48, border: "4px solid #f0f0f0", borderTop: "4px solid #ff5722", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" },
  iconSuccess: { fontSize: 48, color: "#43a047", marginBottom: 12 },
  iconFailed:  { fontSize: 48, color: "#e53935", marginBottom: 12 },
  text:        { fontSize: 18, fontWeight: 700, margin: "0 0 8px" },
  sub:         { fontSize: 13, color: "#aaa", margin: 0 },
};