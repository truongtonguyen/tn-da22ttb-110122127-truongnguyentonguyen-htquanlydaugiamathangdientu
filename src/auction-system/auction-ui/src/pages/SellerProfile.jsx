import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import Header from "../components/Header";
import { useToastContext } from "../context/ToastContext";
import {
  ShieldAlert, Package, VenetianMask, VolumeX, AlertTriangle,
  MessageCircle, Star, Lock, X,
} from "lucide-react";

const REASONS = [
  { key: "FRAUD",             icon: ShieldAlert, label: "Gian lận / lừa đảo" },
  { key: "WRONG_DESCRIPTION", icon: Package, label: "Hàng không đúng mô tả" },
  { key: "FAKE_PRODUCT",      icon: VenetianMask, label: "Hàng giả / nhái" },
  { key: "NO_RESPONSE",       icon: VolumeX, label: "Người bán không phản hồi" },
  { key: "INAPPROPRIATE",     icon: AlertTriangle, label: "Nội dung không phù hợp" },
  { key: "OTHER",             icon: MessageCircle, label: "Khác" },
];

const creditColor = (score) =>
  score >= 80 ? "#2e7d32" :
  score >= 60 ? "#1565c0" :
  score >= 40 ? "#f57f17" : "#c62828";

const creditBg = (score) =>
  score >= 80 ? "#e8f5e9" :
  score >= 60 ? "#e3f2fd" :
  score >= 40 ? "#fff8e1" : "#fce4ec";

const SellerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reporting, setReporting] = useState(false);
  const token = localStorage.getItem("token");
  const toast = useToastContext();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosClient.get(`/sellers/${id}`);
        setSeller(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleReport = async () => {
    if (!reportReason) { toast.warning("Vui lòng chọn lý do báo cáo"); return; }
    setReporting(true);
    try {
      await axiosClient.post("/reports", {
        reportedUserId: id,
        reason: reportReason,
        description: reportDesc,
      });
      toast.success("Đã gửi báo cáo. Admin sẽ xem xét sớm nhất.");
      setShowReport(false);
      setReportReason("");
      setReportDesc("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gửi báo cáo thất bại");
    } finally {
      setReporting(false);
    }
  };

  if (loading) return (
    <div style={styles.page}><Header />
      <p style={{ textAlign: "center", marginTop: 60 }}>Đang tải...</p>
    </div>
  );

  if (!seller) return (
    <div style={styles.page}><Header />
      <p style={{ textAlign: "center", marginTop: 60 }}>Không tìm thấy người bán</p>
    </div>
  );

  const stats = [
    { label: "Tổng sản phẩm đăng",  value: seller.totalAuctions },
    { label: "Giao dịch hoàn thành", value: seller.completedAuctions },
    { label: "Đang đấu giá",         value: seller.activeAuctions },
    { label: "Tỉ lệ thành công",     value: `${seller.successRate}%`,
      color: seller.successRate >= 70 ? "#2e7d32" : "#e53935" },
  ];

  return (
    <div style={styles.page}>
      <Header />

      {/* Report Modal */}
      {showReport && (
        <div style={styles.modalOverlay} onClick={() => setShowReport(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: 17 }}><ShieldAlert size={18} style={{ verticalAlign: "middle", marginRight: 6 }} />Báo cáo người bán</h3>
              <span style={{ cursor: "pointer", fontSize: 20, color: "#999" }}
                onClick={() => setShowReport(false)}><X size={20} /></span>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.modalDesc}>
                Báo cáo của bạn sẽ được admin xem xét. Vui lòng chọn lý do phù hợp.
              </p>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Lý do báo cáo *</label>
                <div style={styles.reasonList}>
                  {REASONS.map(r => (
                    <div
                      key={r.key}
                      style={{
                        ...styles.reasonItem,
                        ...(reportReason === r.key ? styles.reasonItemActive : {}),
                      }}
                      onClick={() => setReportReason(r.key)}
                    >
                      <r.icon size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
                      {r.label}
                    </div>
                  ))}
                </div>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Mô tả thêm (tuỳ chọn)</label>
                <textarea
                  style={styles.textarea}
                  rows={3}
                  placeholder="Mô tả chi tiết về vấn đề bạn gặp phải..."
                  value={reportDesc}
                  onChange={e => setReportDesc(e.target.value)}
                />
              </div>
              <button
                style={{ ...styles.submitBtn, opacity: reporting ? 0.6 : 1 }}
                onClick={handleReport}
                disabled={reporting}
              >
                {reporting ? "Đang gửi..." : "Gửi báo cáo"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.container}>
        {/* Hero */}
        <div style={styles.hero}>
          <div style={styles.avatar}>
            {seller.displayName?.charAt(0).toUpperCase()}
          </div>
          <div style={styles.heroInfo}>
            <h1 style={styles.displayName}>{seller.displayName}</h1>
            <div style={styles.username}>@{seller.username}</div>
            <div style={{
              ...styles.creditBadge,
              color: creditColor(seller.creditScore),
              backgroundColor: creditBg(seller.creditScore),
            }}>
              <Star size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Điểm tín nhiệm: {seller.creditScore}/100 — {seller.creditLevel}
            </div>
          </div>
          {/* Nút báo cáo — chỉ hiện khi đã đăng nhập */}
          {token && (
            <button
              style={styles.reportBtn}
              onClick={() => setShowReport(true)}
            >
              <ShieldAlert size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Báo cáo
            </button>
          )}
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          {stats.map(s => (
            <div key={s.label} style={styles.statCard}>
              <div style={{ ...styles.statValue, color: s.color || "#222" }}>
                {s.value}
              </div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={styles.privateNote}>
          <Lock size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Thông tin liên hệ (email, số điện thoại, địa chỉ) được bảo mật và không hiển thị công khai.
        </div>

        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Quay lại
        </button>
      </div>
    </div>
  );
};

export default SellerProfile;

const styles = {
  page: { background: "#f5f5f5", minHeight: "100vh", paddingBottom: 40 },

  container: {
    maxWidth: "680px", margin: "30px auto",
    padding: "0 20px", display: "flex",
    flexDirection: "column", gap: 20,
  },

  hero: {
    background: "#fff", borderRadius: 12,
    padding: "28px 24px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
    display: "flex", alignItems: "center", gap: 20,
  },

  avatar: {
    width: 80, height: 80, borderRadius: "50%",
    backgroundColor: "#ff5722", color: "#fff",
    fontSize: 34, fontWeight: 700, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  },

  heroInfo: { display: "flex", flexDirection: "column", gap: 6 },

  displayName: { fontSize: 22, fontWeight: 700, margin: 0 },

  username: { fontSize: 14, color: "#888" },

  creditBadge: {
    display: "inline-block", padding: "5px 14px",
    borderRadius: 20, fontSize: 13, fontWeight: 700,
    marginTop: 4,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 14,
  },

  statCard: {
    background: "#fff", borderRadius: 10,
    padding: "18px 20px", textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },

  statValue: { fontSize: 28, fontWeight: 700, marginBottom: 4 },

  statLabel: { fontSize: 13, color: "#888" },

  privateNote: {
    background: "#f5f5f5", border: "1px solid #e0e0e0",
    borderRadius: 8, padding: "12px 16px",
    fontSize: 13, color: "#757575",
  },

  backBtn: {
    alignSelf: "flex-start",
    padding: "10px 20px", background: "#fff",
    border: "1px solid #ddd", borderRadius: 8,
    cursor: "pointer", fontSize: 14, color: "#555",
  },

  reportBtn: {
    marginLeft: "auto", alignSelf: "flex-start",
    padding: "8px 16px", background: "#fff",
    border: "1px solid #e53935", borderRadius: 8,
    cursor: "pointer", fontSize: 13,
    color: "#e53935", fontWeight: 600,
  },

  // Modal
  modalOverlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 2000, display: "flex",
    alignItems: "center", justifyContent: "center",
    padding: 20,
  },

  modal: {
    background: "#fff", borderRadius: 14,
    width: "100%", maxWidth: 480,
    boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
    overflow: "hidden",
  },

  modalHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", padding: "18px 24px",
    borderBottom: "1px solid #f0f0f0",
  },

  modalBody: { padding: "20px 24px 24px" },

  modalDesc: { fontSize: 13, color: "#666", marginBottom: 16, marginTop: 0 },

  fieldGroup: { marginBottom: 16 },

  label: { fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 8 },

  reasonList: { display: "flex", flexDirection: "column", gap: 8 },

  reasonItem: {
    padding: "10px 14px", border: "1px solid #e0e0e0",
    borderRadius: 8, cursor: "pointer",
    fontSize: 14, color: "#444",
    transition: "all 0.15s",
  },

  reasonItemActive: {
    border: "1px solid #e53935",
    background: "#fce4ec", color: "#c62828",
    fontWeight: 600,
  },

  textarea: {
    width: "100%", padding: "10px 12px",
    border: "1px solid #ddd", borderRadius: 8,
    fontSize: 13, resize: "vertical",
    outline: "none", boxSizing: "border-box",
  },

  submitBtn: {
    width: "100%", padding: 12,
    background: "#e53935", color: "#fff",
    border: "none", borderRadius: 8,
    cursor: "pointer", fontWeight: 700,
    fontSize: 15, marginTop: 8,
  },
};