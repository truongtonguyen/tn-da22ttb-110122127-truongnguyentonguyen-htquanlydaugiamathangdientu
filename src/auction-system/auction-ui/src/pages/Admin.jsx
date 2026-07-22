import React, { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import Header from "../components/Header";
import {
  BarChart3, Search, Package, ShieldAlert, Users, Settings, X,
  Hourglass, Flame, CheckCircle2, XCircle, PartyPopper, Check,
  Truck, Lock, Unlock, Gavel, TrendingUp, ClipboardList,
  Landmark, Wallet, Banknote, Tag, Plus, Pencil, Trash2,
  CreditCard, ArrowDownToLine,
} from "lucide-react";

const orderStatusConfig = {
  PENDING:              { label: "Chờ thanh toán",     color: "#ff9800", bg: "#fff8e1" },
  PENDING_CONFIRMATION: { label: "Chờ xác nhận",       color: "#2196f3", bg: "#e3f2fd" },
  SHIPPING:             { label: "Đang giao hàng",      color: "#9c27b0", bg: "#f3e5f5" },
  PAID:                 { label: "Hoàn thành",          color: "#43a047", bg: "#e8f5e9" },
  CANCELLED:            { label: "Đã hủy",              color: "#9e9e9e", bg: "#f5f5f5" },
};

const paymentMethodLabel = {
  BANK_TRANSFER: <><Landmark size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Chuyển khoản</>,
  MOMO:          <><Wallet   size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />MoMo</>,
  COD:           <><Banknote size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />COD</>,
};

const Admin = () => {
  const [activeTab, setActiveTab]             = useState("stats");
  const [stats, setStats]                     = useState(null);
  const [pendingAuctions, setPendingAuctions] = useState([]);
  const [users, setUsers]                     = useState([]);
  const [orders, setOrders]                   = useState([]);
  const [reports, setReports]                 = useState([]);
  const [reportFilter, setReportFilter]       = useState("PENDING");
  const [orderFilter, setOrderFilter]         = useState("ALL");
  const [loading, setLoading]                 = useState(false);
  const [message, setMessage]                 = useState({ text: "", type: "info" });
  const [bids, setBids]                       = useState([]);
  const [rejectingAuction, setRejectingAuction] = useState(null);
  const [rejectReasonKey, setRejectReasonKey] = useState("");
  const [rejectNote, setRejectNote]           = useState("");

  // ✅ Bộ lọc lịch sử đặt giá
  const [bidFilters, setBidFilters] = useState({
    product: "", user: "", onlySuspicious: false, minAmount: "", maxAmount: "",
  });

  // ✅ Nạp tiền / Rút tiền (Admin xem)
  const [topups, setTopups]               = useState([]);
  const [topupFilter, setTopupFilter]     = useState("ALL");
  const [withdrawals, setWithdrawals]     = useState([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState("ALL");

  // ✅ Danh mục
  const [categories, setCategories]       = useState([]);
  const [categoryName, setCategoryName]   = useState("");
  const [editingCategory, setEditingCategory] = useState(null); // {id, name}

  useEffect(() => {
    loadStats(); loadPendingAuctions(); loadUsers(); loadOrders(); loadReports(); loadBids(); loadCategories(); loadTopups(); loadWithdrawals();
  }, []);

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "info" }), 3000);
  };

  const loadStats           = async () => { try { const r = await axiosClient.get("/admin/stats");           setStats(r.data);           } catch (e) { console.error(e); } };
  const loadPendingAuctions = async () => { try { const r = await axiosClient.get("/admin/auctions/pending"); setPendingAuctions(r.data); } catch (e) { console.error(e); } };
  const loadUsers           = async () => { try { const r = await axiosClient.get("/admin/users");           setUsers(r.data);           } catch (e) { console.error(e); } };
  const loadOrders          = async () => { try { const r = await axiosClient.get("/orders");                setOrders(r.data);          } catch (e) { console.error(e); } };
  const loadReports         = async () => { try { const r = await axiosClient.get("/reports");               setReports(r.data);         } catch (e) { console.error(e); } };
  const loadBids            = async () => { try { const r = await axiosClient.get("/admin/bids");            setBids(r.data);            } catch (e) { console.error(e); } };
  const loadCategories      = async () => { try { const r = await axiosClient.get("/categories");           setCategories(r.data);      } catch (e) { console.error(e); } };
  const loadTopups          = async () => { try { const r = await axiosClient.get("/wallet/topups");          setTopups(r.data);          } catch (e) { console.error(e); } };
  const loadWithdrawals     = async () => { try { const r = await axiosClient.get("/withdrawals");            setWithdrawals(r.data);     } catch (e) { console.error(e); } };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) { showMsg("Vui lòng nhập tên danh mục", "error"); return; }
    setLoading(true);
    try {
      await axiosClient.post("/categories", { name: categoryName.trim() });
      showMsg("Đã thêm danh mục");
      setCategoryName("");
      loadCategories();
    } catch (e) { showMsg("Lỗi: " + (e.response?.data?.message || e.message), "error"); }
    finally { setLoading(false); }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory?.name?.trim()) { showMsg("Vui lòng nhập tên danh mục", "error"); return; }
    setLoading(true);
    try {
      await axiosClient.put(`/categories/${editingCategory.id}`, { name: editingCategory.name.trim() });
      showMsg("Đã cập nhật danh mục");
      setEditingCategory(null);
      loadCategories();
    } catch (e) { showMsg("Lỗi: " + (e.response?.data?.message || e.message), "error"); }
    finally { setLoading(false); }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Xóa danh mục "${name}"? Các sản phẩm thuộc danh mục này sẽ bị ảnh hưởng.`)) return;
    setLoading(true);
    try {
      await axiosClient.delete(`/categories/${id}`);
      showMsg("Đã xóa danh mục");
      loadCategories();
    } catch (e) { showMsg("Lỗi: " + (e.response?.data?.message || e.message), "error"); }
    finally { setLoading(false); }
  };

  const handleApproveAuction = async (id) => {
    setLoading(true);
    try { await axiosClient.put(`/admin/auctions/${id}/approve`); showMsg("Đã duyệt phiên đấu giá"); loadPendingAuctions(); loadStats(); }
    catch (e) { showMsg("Lỗi: " + (e.response?.data?.message || e.message), "error"); }
    finally { setLoading(false); }
  };

  const openRejectModal = (auction) => {
    setRejectingAuction(auction);
    setRejectReasonKey("");
    setRejectNote("");
  };

  const handleConfirmReject = async () => {
    if (!rejectReasonKey) { showMsg("Vui lòng chọn lý do từ chối", "error"); return; }
    const reasonLabel  = REJECT_REASONS.find(r => r.key === rejectReasonKey)?.label || "";
    const suggestion   = REJECT_REASONS.find(r => r.key === rejectReasonKey)?.suggestion || "";
    const fullReason   = [reasonLabel, suggestion, rejectNote].filter(Boolean).join(" — ");
    setLoading(true);
    try {
      await axiosClient.put(`/admin/auctions/${rejectingAuction.id}/reject`, { reason: fullReason });
      showMsg("Đã từ chối phiên đấu giá");
      setRejectingAuction(null);
      loadPendingAuctions(); loadStats();
    } catch (e) { showMsg("Lỗi: " + (e.response?.data?.message || e.message), "error"); }
    finally { setLoading(false); }
  };

  const handleBanUser   = async (id) => {
    if (!window.confirm("Khóa tài khoản người dùng này?")) return;
    setLoading(true);
    try { await axiosClient.put(`/admin/users/${id}/ban`); showMsg("Đã khóa tài khoản"); loadUsers(); }
    catch (e) { showMsg("Lỗi: " + (e.response?.data?.message || e.message), "error"); }
    finally { setLoading(false); }
  };

  const handleUnbanUser = async (id) => {
    setLoading(true);
    try { await axiosClient.put(`/admin/users/${id}/unban`); showMsg("Đã mở khóa tài khoản"); loadUsers(); }
    catch (e) { showMsg("Lỗi: " + (e.response?.data?.message || e.message), "error"); }
    finally { setLoading(false); }
  };

  const handleConfirmShipping = async (id) => {
    setLoading(true);
    try { await axiosClient.post(`/orders/${id}/confirm-shipping`); showMsg("Đã xác nhận giao hàng — Chờ người mua xác nhận nhận hàng"); loadOrders(); }
    catch (e) { showMsg("Lỗi: " + (e.response?.data?.message || e.message), "error"); }
    finally { setLoading(false); }
  };

  const handleResolveReport = async (id, action, adminNote = "") => {
    const confirmMsg = action === "BAN" ? "Xác nhận Khóa người dùng này?" : "Bỏ qua báo cáo này?";
    if (!window.confirm(confirmMsg)) return;
    setLoading(true);
    try {
      await axiosClient.put(`/reports/${id}/resolve`, { action, adminNote });
      showMsg(action === "BAN" ? "Đã khóa người dùng" : "Đã bỏ qua báo cáo");
      loadReports(); loadUsers();
    } catch (e) { showMsg("Lỗi: " + (e.response?.data?.message || e.message), "error"); }
    finally { setLoading(false); }
  };

  const pendingReports = reports.filter(r => r.status === "PENDING").length;

  const filteredOrders  = orderFilter === "ALL"  ? orders  : orders.filter(o => o.status === orderFilter);
  const filteredReports = reportFilter === "ALL" ? reports : reports.filter(r => r.status === reportFilter);

  const filteredBids = bids.filter((bid) => {
    if (bidFilters.product && !(`${bid.auctionTitle} #${bid.auctionId}`.toLowerCase().includes(bidFilters.product.toLowerCase()))) return false;
    if (bidFilters.user    && !(`${bid.bidderName} ${bid.bidderEmail}`.toLowerCase().includes(bidFilters.user.toLowerCase())))    return false;
    if (bidFilters.onlySuspicious && !(bid.suspiciousSellerIp || bid.suspiciousMultiAccount)) return false;
    if (bidFilters.minAmount && bid.amount < Number(bidFilters.minAmount)) return false;
    if (bidFilters.maxAmount && bid.amount > Number(bidFilters.maxAmount)) return false;
    return true;
  });

  const REJECT_REASONS = [
    { key: "MISLEADING_TITLE",  label: "Tiêu đề gây hiểu nhầm hoặc không rõ ràng",         suggestion: "Hãy đặt tiêu đề mô tả đúng và cụ thể về sản phẩm." },
    { key: "POOR_DESCRIPTION",  label: "Mô tả sản phẩm quá sơ sài hoặc thiếu thông tin",   suggestion: "Bổ sung mô tả chi tiết: tình trạng, xuất xứ, thông số kỹ thuật..." },
    { key: "LOW_QUALITY_IMAGE", label: "Hình ảnh mờ, thiếu, hoặc không đúng sản phẩm",     suggestion: "Đăng tải ảnh chụp thật, rõ nét, đúng sản phẩm đang bán." },
    { key: "INVALID_PRICE",     label: "Giá khởi điểm/giá mua ngay không hợp lý",          suggestion: "Điều chỉnh giá phù hợp với giá trị thực tế của sản phẩm." },
    { key: "PROHIBITED_ITEM",   label: "Sản phẩm thuộc danh mục bị cấm/hạn chế",           suggestion: "Vui lòng không đăng các mặt hàng vi phạm quy định của nền tảng." },
    { key: "SUSPECTED_FAKE",    label: "Nghi ngờ hàng giả / hàng nhái",                     suggestion: "Cung cấp thêm bằng chứng xác thực nguồn gốc sản phẩm nếu muốn đăng lại." },
    { key: "DUPLICATE",         label: "Trùng lặp với phiên đấu giá khác đã đăng",          suggestion: "Kiểm tra lại các phiên đã đăng trước khi tạo mới." },
    { key: "OTHER",             label: "Khác",                                               suggestion: "" },
  ];

  const orderStats = {
    pending:  orders.filter(o => o.status === "PENDING").length,
    confirm:  orders.filter(o => o.status === "PENDING_CONFIRMATION").length,
    shipping: orders.filter(o => o.status === "SHIPPING").length,
    paid:     orders.filter(o => o.status === "PAID").length,
    totalCommission: orders.filter(o => o.status === "PAID" && o.commissionFee != null).reduce((sum, o) => sum + o.commissionFee, 0),
  };

  // ✅ Bỏ tab Nạp Tiền và Rút Tiền — không cần admin xử lý nữa
  const tabs = [
    { key: "stats",       icon: BarChart3,        label: "Tổng Quan" },
    { key: "auctions",    icon: Search,           label: "Duyệt Phiên Đấu Giá", badge: pendingAuctions.length },
    { key: "orders",      icon: Package,          label: "Đơn Hàng",             badge: orderStats.confirm },
    { key: "bids",        icon: Gavel,            label: "Lịch Sử Đặt Giá" },
    { key: "reports",     icon: ShieldAlert,      label: "Báo Cáo",              badge: pendingReports },
    { key: "users",       icon: Users,            label: "Người Dùng" },
    { key: "categories",  icon: Tag,              label: "Danh Mục" },
    { key: "topups",      icon: CreditCard,       label: "Nạp Tiền" },
    { key: "withdrawals", icon: ArrowDownToLine,  label: "Rút Tiền" },
  ];

  return (
    <>
      {/* Modal từ chối */}
      {rejectingAuction && (
        <div style={rejectModalStyles.overlay} onClick={() => setRejectingAuction(null)}>
          <div style={rejectModalStyles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={rejectModalStyles.title}>Từ chối: {rejectingAuction.title}</h3>
            <label style={rejectModalStyles.label}>Chọn lý do *</label>
            <div style={rejectModalStyles.reasonList}>
              {REJECT_REASONS.map(r => (
                <div key={r.key} onClick={() => setRejectReasonKey(r.key)}
                  style={{ ...rejectModalStyles.reasonItem, ...(rejectReasonKey === r.key ? rejectModalStyles.reasonItemActive : {}) }}>
                  {r.label}
                </div>
              ))}
            </div>
            {rejectReasonKey && REJECT_REASONS.find(r => r.key === rejectReasonKey)?.suggestion && (
              <div style={rejectModalStyles.suggestionBox}>
                💡 {REJECT_REASONS.find(r => r.key === rejectReasonKey).suggestion}
              </div>
            )}
            <label style={rejectModalStyles.label}>Ghi chú thêm (tuỳ chọn)</label>
            <textarea style={rejectModalStyles.textarea} placeholder="Chi tiết cụ thể hơn..."
              value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
            <div style={rejectModalStyles.actions}>
              <button style={rejectModalStyles.cancelBtn} onClick={() => setRejectingAuction(null)}>Hủy</button>
              <button style={rejectModalStyles.confirmBtn} onClick={handleConfirmReject} disabled={loading}>
                {loading ? "Đang gửi..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.page}>
        <Header />
        <div style={styles.container}>
          <h1 style={styles.pageTitle}>
            <Settings size={26} style={{ verticalAlign: "middle", marginRight: 8 }} />
            Quản Trị Hệ Thống
          </h1>

          {message.text && (
            <div style={{ ...styles.toast, borderColor: message.type === "error" ? "#f44336" : "#4caf50", backgroundColor: message.type === "error" ? "#fce4ec" : "#e8f5e9" }}>
              {message.text}
              <span style={styles.closeBtn} onClick={() => setMessage({ text: "" })}><X size={16} /></span>
            </div>
          )}

          <div style={styles.tabs}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{ ...styles.tabBtn, backgroundColor: activeTab === t.key ? "#1976d2" : "#e0e0e0", color: activeTab === t.key ? "#fff" : "#333" }}>
                <t.icon size={16} />{t.label}
                {t.badge > 0 && <span style={styles.tabBadge}>{t.badge}</span>}
              </button>
            ))}
          </div>

          {/* ===== THỐNG KÊ ===== */}
          {activeTab === "stats" && (
            <div style={styles.tabContent}>
              {stats ? (
                <div style={styles.statsGrid}>
                  {[
                    { label: "Tổng Người Dùng",   value: stats.totalUsers,      color: "#1565c0", icon: Users },
                    { label: "Tổng Phiên Đấu Giá", value: stats.totalAuctions,  color: "#6a1b9a", icon: Gavel },
                    { label: "Chờ Duyệt",          value: stats.pendingAuctions, color: "#e65100", icon: Hourglass },
                    { label: "Đang Diễn Ra",       value: stats.activeAuctions,  color: "#2196f3", icon: Flame },
                    { label: "Đã Bán",             value: stats.soldAuctions,    color: "#2e7d32", icon: CheckCircle2 },
                    { label: "Thất Bại",           value: stats.failedAuctions,  color: "#c62828", icon: XCircle },
                    { label: "Tổng Lượt Đặt Giá", value: stats.totalBids,       color: "#00838f", icon: TrendingUp },
                    { label: "Chờ Xác Nhận TT",   value: orderStats.confirm,    color: "#ff9800", icon: ClipboardList },
                  ].map(s => (
                    <div key={s.label} style={styles.statCard}>
                      <div style={styles.statIcon}><s.icon size={28} color={s.color} /></div>
                      <div style={{ ...styles.statNumber, color: s.color }}>{s.value}</div>
                      <div style={styles.statLabel}>{s.label}</div>
                    </div>
                  ))}
                </div>
              ) : <p style={{ textAlign: "center", color: "#999" }}>Đang tải...</p>}
            </div>
          )}

          {/* ===== DUYỆT ĐẤU GIÁ ===== */}
          {activeTab === "auctions" && (
            <div style={styles.tabContent}>
              <h2 style={styles.sectionTitle}>Phiên Đấu Giá Chờ Duyệt ({pendingAuctions.length})</h2>
              {pendingAuctions.length === 0 ? (
                <div style={styles.emptyBox}><PartyPopper size={36} color="#aaa" /><p style={{ color: "#999" }}>Không có đấu giá nào chờ duyệt</p></div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {pendingAuctions.map(a => (
                    <div key={a.id} style={auctionCardStyle.card}>
                      <div style={auctionCardStyle.cardHeader}>
                        <span style={auctionCardStyle.idBadge}>#{a.id}</span>
                        <span style={auctionCardStyle.categoryBadge}>{a.categoryName}</span>
                        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                          <button onClick={() => handleApproveAuction(a.id)} disabled={loading}
                            style={{ ...styles.actionBtn, backgroundColor: "#4caf50", padding: "8px 18px" }}>
                            <Check size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Duyệt
                          </button>
                          <button onClick={() => openRejectModal(a)} disabled={loading}
                            style={{ ...styles.actionBtn, backgroundColor: "#f44336", padding: "8px 18px" }}>
                            <X size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Từ Chối
                          </button>
                        </div>
                      </div>
                      <div style={auctionCardStyle.cardBody}>
                        <div style={auctionCardStyle.imgWrap}>
                          {a.imageUrl ? <img src={`http://localhost:8080/api/auctions/uploads/${a.imageUrl}`} alt={a.title} style={auctionCardStyle.img} onError={e => { e.target.src = "https://via.placeholder.com/120x120?text=No+img"; }} /> : <div style={auctionCardStyle.noImg}>📷</div>}
                        </div>
                        <div style={auctionCardStyle.info}>
                          <div style={auctionCardStyle.auctionTitle}>{a.title}</div>
                          <div style={auctionCardStyle.desc}>
                            {a.description ? (a.description.length > 200 ? a.description.slice(0, 200) + "..." : a.description) : <span style={{ color: "#bbb" }}>Không có mô tả</span>}
                          </div>
                          <div style={auctionCardStyle.metaGrid}>
                            <div style={auctionCardStyle.metaItem}><span style={auctionCardStyle.metaLabel}>Người bán</span><span style={auctionCardStyle.metaValue}>{a.sellerName}</span><span style={auctionCardStyle.metaSub}>{a.sellerEmail}</span></div>
                            <div style={auctionCardStyle.metaItem}><span style={auctionCardStyle.metaLabel}>Giá khởi điểm</span><span style={{ ...auctionCardStyle.metaValue, color: "#1565c0" }}>{a.startingPrice?.toLocaleString("vi-VN")} VNĐ</span></div>
                            <div style={auctionCardStyle.metaItem}><span style={auctionCardStyle.metaLabel}>Giá mua ngay</span><span style={{ ...auctionCardStyle.metaValue, color: "#e65100" }}>{a.buyNowPrice != null ? a.buyNowPrice.toLocaleString("vi-VN") + " VNĐ" : <span style={{ color: "#bbb", fontWeight: 400 }}>Không thiết lập</span>}</span></div>
                            <div style={auctionCardStyle.metaItem}><span style={auctionCardStyle.metaLabel}>Giá mong muốn</span><span style={{ ...auctionCardStyle.metaValue, color: "#6a1b9a" }}>{a.reservePrice != null && a.reservePrice > 0 ? a.reservePrice.toLocaleString("vi-VN") + " VNĐ" : <span style={{ color: "#bbb", fontWeight: 400 }}>Không thiết lập</span>}</span></div>
                            <div style={auctionCardStyle.metaItem}><span style={auctionCardStyle.metaLabel}>Bắt đầu</span><span style={auctionCardStyle.metaValue}><span style={{ color: "#bbb", fontWeight: 400, fontStyle: "italic" }}>Sau khi được duyệt</span></span></div>
                            <div style={auctionCardStyle.metaItem}><span style={auctionCardStyle.metaLabel}>Thời hạn đấu giá</span><span style={{ ...auctionCardStyle.metaValue, color: "#c62828" }}>{a.endTime ? `${Math.round((new Date(a.endTime) - new Date(a.startTime)) / (1000 * 60 * 60 * 24))} ngày` : "—"}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== ĐƠN HÀNG ===== */}
          {activeTab === "orders" && (
            <div style={styles.tabContent}>
              <h2 style={styles.sectionTitle}>Quản Lý Đơn Hàng</h2>
              <div style={styles.orderStatsRow}>
                {[
                  { label: "Chờ thanh toán", value: orderStats.pending,  color: "#ff9800" },
                  { label: "Chờ xác nhận",   value: orderStats.confirm,  color: "#2196f3" },
                  { label: "Đang giao",       value: orderStats.shipping, color: "#9c27b0" },
                  { label: "Hoàn thành",      value: orderStats.paid,     color: "#43a047" },
                ].map(s => (
                  <div key={s.label} style={styles.orderStatCard}>
                    <div style={{ ...styles.orderStatNum, color: s.color }}>{s.value}</div>
                    <div style={styles.orderStatLabel}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={styles.commissionBox}>
                <span style={{ fontSize: 13, color: "#555" }}>💰 Tổng phí hoa hồng đã thu (5%):</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#e53935", marginLeft: 12 }}>{orderStats.totalCommission.toLocaleString("vi-VN")} VNĐ</span>
                <span style={{ fontSize: 12, color: "#aaa", marginLeft: 8 }}>({orders.filter(o => o.status === "PAID").length} đơn hoàn thành)</span>
              </div>
              <div style={styles.filterRow}>
                {[
                  { key: "ALL", label: "Tất cả" }, { key: "PENDING", label: "Chờ thanh toán" },
                  { key: "PENDING_CONFIRMATION", label: "Chờ xác nhận" }, { key: "SHIPPING", label: "Đang giao" },
                  { key: "PAID", label: "Hoàn thành" }, { key: "CANCELLED", label: "Đã hủy" },
                ].map(f => (
                  <button key={f.key} style={{ ...styles.filterBtn, ...(orderFilter === f.key ? styles.filterBtnActive : {}) }} onClick={() => setOrderFilter(f.key)}>{f.label}</button>
                ))}
              </div>
              {filteredOrders.length === 0 ? (
                <div style={styles.emptyBox}><p style={{ color: "#999" }}>Không có đơn hàng nào</p></div>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeader}>
                        {["ID","Sản phẩm","Người mua","SĐT","Địa chỉ","Giá cuối","Phí HH (5%)","Thực nhận","Phương thức","Ghi chú","Trạng thái","Hành động"].map(h => <th key={h} style={styles.th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order, i) => {
                        const s = orderStatusConfig[order.status] || orderStatusConfig.PENDING;
                        return (
                          <tr key={order.id} style={{ ...styles.tableRow, backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                            <td style={styles.td}>#{order.id}</td>
                            <td style={{ ...styles.td, ...styles.titleCell }}>{order.auction?.title || "—"}</td>
                            <td style={styles.td}><div style={{ fontWeight: 600 }}>{order.buyer?.fullName || order.buyer?.username}</div><div style={{ fontSize: 12, color: "#888" }}>{order.buyer?.email}</div></td>
                            <td style={styles.td}>{order.buyer?.phone || "—"}</td>
                            <td style={{ ...styles.td, maxWidth: 160, fontSize: 12 }}>{order.buyer?.address || "—"}</td>
                            <td style={{ ...styles.td, color: "#e53935", fontWeight: 700 }}>{order.finalPrice?.toLocaleString("vi-VN")} VNĐ</td>
                            <td style={{ ...styles.td, color: "#e53935", fontSize: 13 }}>{order.status === "PAID" && order.commissionFee != null ? `${order.commissionFee.toLocaleString("vi-VN")} VNĐ` : <span style={{ color: "#ccc" }}>—</span>}</td>
                            <td style={{ ...styles.td, color: "#43a047", fontWeight: 700, fontSize: 13 }}>{order.status === "PAID" && order.sellerReceives != null ? `${order.sellerReceives.toLocaleString("vi-VN")} VNĐ` : <span style={{ color: "#ccc" }}>—</span>}</td>
                            <td style={styles.td}>{paymentMethodLabel[order.paymentMethod] || "—"}</td>
                            <td style={{ ...styles.td, fontSize: 12, maxWidth: 140, color: "#666" }}>{order.paymentNote || "—"}</td>
                            <td style={styles.td}><span style={{ ...styles.statusBadge, color: s.color, backgroundColor: s.bg }}>{s.label}</span></td>
                            <td style={styles.td}>
                              {order.status === "PENDING_CONFIRMATION" && (
                                <button onClick={() => handleConfirmShipping(order.id)} disabled={loading}
                                  style={{ ...styles.actionBtn, backgroundColor: "#9c27b0", display: "block" }}>
                                  <Truck size={14} style={{ verticalAlign: "middle", marginRight: 3 }} />Xác nhận giao
                                </button>
                              )}
                              {order.status === "SHIPPING" && <span style={{ color: "#9c27b0", fontSize: 12 }}>⏳ Chờ người mua<br/>xác nhận nhận hàng</span>}
                              {(order.status === "PAID" || order.status === "CANCELLED") && <span style={{ color: "#bbb", fontSize: 13 }}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===== LỊCH SỬ ĐẶT GIÁ ===== */}
          {activeTab === "bids" && (
            <div style={styles.tabContent}>
              <h2 style={styles.sectionTitle}>Lịch Sử Đặt Giá ({filteredBids.length}/{bids.length})</h2>
              <div style={bidFilterStyles.filterBar}>
                <input style={bidFilterStyles.filterInput} placeholder="Lọc theo sản phẩm..." value={bidFilters.product} onChange={e => setBidFilters({ ...bidFilters, product: e.target.value })} />
                <input style={bidFilterStyles.filterInput} placeholder="Lọc theo người đặt..." value={bidFilters.user} onChange={e => setBidFilters({ ...bidFilters, user: e.target.value })} />
                <input style={{ ...bidFilterStyles.filterInput, width: 130 }} placeholder="Giá từ..." type="number" value={bidFilters.minAmount} onChange={e => setBidFilters({ ...bidFilters, minAmount: e.target.value })} />
                <input style={{ ...bidFilterStyles.filterInput, width: 130 }} placeholder="Giá đến..." type="number" value={bidFilters.maxAmount} onChange={e => setBidFilters({ ...bidFilters, maxAmount: e.target.value })} />
                <label style={bidFilterStyles.checkboxLabel}>
                  <input type="checkbox" checked={bidFilters.onlySuspicious} onChange={e => setBidFilters({ ...bidFilters, onlySuspicious: e.target.checked })} />
                  Chỉ hiện cảnh báo
                </label>
                {(bidFilters.product || bidFilters.user || bidFilters.minAmount || bidFilters.maxAmount || bidFilters.onlySuspicious) && (
                  <button style={bidFilterStyles.clearBtn} onClick={() => setBidFilters({ product: "", user: "", onlySuspicious: false, minAmount: "", maxAmount: "" })}>Xóa lọc</button>
                )}
              </div>
              {filteredBids.length === 0 ? (
                <p style={{ textAlign: "center", color: "#999" }}>{bids.length === 0 ? "Chưa có lượt đặt giá nào" : "Không có kết quả khớp bộ lọc"}</p>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead><tr style={styles.tableHeader}>{["ID","Phiên đấu giá","Người đặt","Giá đặt","Thời gian","IP","Cảnh báo"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {filteredBids.map((bid, i) => {
                        const suspicious = bid.suspiciousSellerIp || bid.suspiciousMultiAccount;
                        return (
                          <tr key={bid.id} style={{ ...styles.tableRow, backgroundColor: suspicious ? "#fce4ec" : (i % 2 === 0 ? "#fff" : "#fafafa") }}>
                            <td style={styles.td}>#{bid.id}</td>
                            <td style={{ ...styles.td, ...styles.titleCell }}>#{bid.auctionId} {bid.auctionTitle}</td>
                            <td style={styles.td}><div style={{ fontWeight: 600 }}>{bid.bidderName}</div><div style={{ fontSize: 12, color: "#888" }}>{bid.bidderEmail}</div></td>
                            <td style={{ ...styles.td, color: "#e53935", fontWeight: 700 }}>{bid.amount?.toLocaleString("vi-VN")} VNĐ</td>
                            <td style={{ ...styles.td, fontSize: 12 }}>{new Date(bid.bidTime).toLocaleString("vi-VN")}</td>
                            <td style={{ ...styles.td, fontSize: 12, fontFamily: "monospace" }}>{bid.ipAddress || "—"}</td>
                            <td style={styles.td}>
                              {bid.suspiciousSellerIp && <span style={{ ...styles.statusBadge, color: "#c62828", backgroundColor: "#fce4ec", display: "block", marginBottom: 4 }}><ShieldAlert size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />Cùng IP người bán</span>}
                              {bid.suspiciousMultiAccount && <span style={{ ...styles.statusBadge, color: "#c62828", backgroundColor: "#fce4ec", display: "block" }}><ShieldAlert size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />Trùng IP người khác</span>}
                              {!suspicious && <span style={{ color: "#bbb", fontSize: 12 }}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===== BÁO CÁO ===== */}
          {activeTab === "reports" && (
            <div style={styles.tabContent}>
              <h2 style={styles.sectionTitle}>Quản Lý Báo Cáo</h2>
              <div style={styles.orderStatsRow}>
                {[
                  { label: "Tổng báo cáo", value: reports.length,                                       color: "#1565c0" },
                  { label: "Chờ xử lý",    value: reports.filter(r => r.status === "PENDING").length,   color: "#ff9800" },
                  { label: "Đã khóa",       value: reports.filter(r => r.status === "BANNED").length,    color: "#e53935" },
                  { label: "Bỏ qua",        value: reports.filter(r => r.status === "DISMISSED").length, color: "#9e9e9e" },
                ].map(s => (
                  <div key={s.label} style={styles.orderStatCard}>
                    <div style={{ ...styles.orderStatNum, color: s.color }}>{s.value}</div>
                    <div style={styles.orderStatLabel}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={styles.filterRow}>
                {[{ key: "ALL", label: "Tất cả" }, { key: "PENDING", label: "Chờ xử lý" }, { key: "BANNED", label: "Đã khóa" }, { key: "DISMISSED", label: "Bỏ qua" }]
                  .map(f => <button key={f.key} style={{ ...styles.filterBtn, ...(reportFilter === f.key ? styles.filterBtnActive : {}) }} onClick={() => setReportFilter(f.key)}>{f.label}</button>)}
              </div>
              {filteredReports.length === 0 ? (
                <div style={styles.emptyBox}><PartyPopper size={36} color="#aaa" /><p style={{ color: "#999" }}>Không có báo cáo nào</p></div>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead><tr style={styles.tableHeader}>{["ID","Người báo cáo","Người bị báo cáo","Lý do","Mô tả","Sản phẩm","Ngày tạo","Trạng thái","Hành động"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {filteredReports.map((report, i) => {
                        const reasonLabel = { WRONG_DESCRIPTION: "Hàng không đúng mô tả", NO_RESPONSE: "Không phản hồi", FRAUD: "Gian lận / lừa đảo", INAPPROPRIATE: "Nội dung không phù hợp", FAKE_PRODUCT: "Hàng giả / nhái", OTHER: "Khác" }[report.reason] || report.reason;
                        const statusStyle = { PENDING: { label: "Chờ xử lý", icon: Hourglass, color: "#ff9800", bg: "#fff8e1" }, BANNED: { label: "Đã khóa", icon: Lock, color: "#e53935", bg: "#fce4ec" }, DISMISSED: { label: "Bỏ qua", icon: Check, color: "#9e9e9e", bg: "#f5f5f5" } }[report.status] || {};
                        return (
                          <tr key={report.id} style={{ ...styles.tableRow, backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                            <td style={styles.td}>{report.id}</td>
                            <td style={styles.td}><div style={{ fontWeight: 600 }}>{report.reporter?.username}</div><div style={{ fontSize: 12, color: "#888" }}>{report.reporter?.email}</div></td>
                            <td style={styles.td}><div style={{ fontWeight: 600, color: "#e53935" }}>{report.reportedUser?.username}</div><div style={{ fontSize: 12, color: "#888" }}>{report.reportedUser?.email}</div></td>
                            <td style={{ ...styles.td, fontWeight: 600 }}>{reasonLabel}</td>
                            <td style={{ ...styles.td, maxWidth: 180, fontSize: 12, color: "#555" }}>{report.description || "—"}</td>
                            <td style={{ ...styles.td, fontSize: 12 }}>{report.auction ? `#${report.auction.id} ${report.auction.title}` : "—"}</td>
                            <td style={{ ...styles.td, fontSize: 12 }}>{new Date(report.createdAt).toLocaleString("vi-VN")}</td>
                            <td style={styles.td}>
                              <span style={{ ...styles.statusBadge, color: statusStyle.color, backgroundColor: statusStyle.bg }}>
                                {statusStyle.icon && <statusStyle.icon size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />}{statusStyle.label}
                              </span>
                              {report.adminNote && <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{report.adminNote}</div>}
                            </td>
                            <td style={styles.td}>
                              {report.status === "PENDING" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  <button onClick={() => handleResolveReport(report.id, "BAN", `Khóa do vi phạm: ${reasonLabel}`)} disabled={loading} style={{ ...styles.actionBtn, backgroundColor: "#f44336" }}><Lock size={14} style={{ verticalAlign: "middle", marginRight: 3 }} />Khóa</button>
                                  <button onClick={() => handleResolveReport(report.id, "DISMISS")} disabled={loading} style={{ ...styles.actionBtn, backgroundColor: "#9e9e9e" }}><Check size={14} style={{ verticalAlign: "middle", marginRight: 3 }} />Bỏ qua</button>
                                </div>
                              )}
                              {report.status !== "PENDING" && <span style={{ color: "#bbb", fontSize: 12 }}>Đã xử lý</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===== NGƯỜI DÙNG ===== */}
          {/* ===== DANH MỤC ===== */}
          {activeTab === "categories" && (
            <div style={styles.tabContent}>
              <h2 style={styles.sectionTitle}>Quản Lý Danh Mục ({categories.length})</h2>

              {/* Thêm danh mục mới */}
              <div style={catStyles.addBox}>
                <input
                  style={catStyles.input}
                  placeholder="Tên danh mục mới..."
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddCategory()}
                />
                <button onClick={handleAddCategory} disabled={loading || !categoryName.trim()}
                  style={{ ...styles.actionBtn, backgroundColor: "#1976d2", padding: "10px 18px", opacity: (!categoryName.trim() || loading) ? 0.6 : 1 }}>
                  <Plus size={15} style={{ verticalAlign: "middle", marginRight: 4 }} />Thêm
                </button>
              </div>

              {categories.length === 0 ? (
                <div style={styles.emptyBox}><p style={{ color: "#999" }}>Chưa có danh mục nào</p></div>
              ) : (
                <div style={catStyles.list}>
                  {categories.map(cat => (
                    <div key={cat.id} style={catStyles.item}>
                      {editingCategory?.id === cat.id ? (
                        <>
                          <input
                            style={{ ...catStyles.input, flex: 1 }}
                            value={editingCategory.name}
                            onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            onKeyDown={e => e.key === "Enter" && handleUpdateCategory()}
                            autoFocus
                          />
                          <button onClick={handleUpdateCategory} disabled={loading}
                            style={{ ...styles.actionBtn, backgroundColor: "#43a047" }}>
                            <Check size={14} style={{ verticalAlign: "middle", marginRight: 3 }} />Lưu
                          </button>
                          <button onClick={() => setEditingCategory(null)}
                            style={{ ...styles.actionBtn, backgroundColor: "#9e9e9e" }}>
                            <X size={14} style={{ verticalAlign: "middle", marginRight: 3 }} />Hủy
                          </button>
                        </>
                      ) : (
                        <>
                          <span style={catStyles.idBadge}>#{cat.id}</span>
                          <span style={catStyles.name}>{cat.name}</span>
                          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                            <button onClick={() => setEditingCategory({ id: cat.id, name: cat.name })}
                              style={{ ...styles.actionBtn, backgroundColor: "#ff9800" }}>
                              <Pencil size={13} style={{ verticalAlign: "middle", marginRight: 3 }} />Sửa
                            </button>
                            <button onClick={() => handleDeleteCategory(cat.id, cat.name)} disabled={loading}
                              style={{ ...styles.actionBtn, backgroundColor: "#f44336" }}>
                              <Trash2 size={13} style={{ verticalAlign: "middle", marginRight: 3 }} />Xóa
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "users" && (
            <div style={styles.tabContent}>
              <h2 style={styles.sectionTitle}>Quản Lý Người Dùng ({users.length})</h2>
              {users.length === 0 ? <p style={{ textAlign: "center", color: "#999" }}>Không có người dùng</p> : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead><tr style={styles.tableHeader}>{["ID","Tên tài khoản","Email","Họ tên","Số điện thoại","Vai trò","Xác thực","Trạng thái","Hành động"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {users.map((user, i) => (
                        <tr key={user.id} style={{ ...styles.tableRow, backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={styles.td}>{user.id}</td>
                          <td style={styles.td}><strong>{user.username}</strong></td>
                          <td style={styles.td}>{user.email}</td>
                          <td style={styles.td}>{user.fullName || "—"}</td>
                          <td style={styles.td}>{user.phone || "—"}</td>
                          <td style={styles.td}><span style={{ ...styles.roleBadge, backgroundColor: user.role === "ADMIN" ? "#d32f2f" : "#1565c0" }}>{user.role}</span></td>
                          <td style={styles.td}><span style={{ ...styles.badge, backgroundColor: user.emailVerified ? "#4caf50" : "#ff9800" }}>{user.emailVerified ? <><Check size={13} style={{ verticalAlign: "middle", marginRight: 3 }} />Đã xác thực</> : <><X size={13} style={{ verticalAlign: "middle", marginRight: 3 }} />Chưa xác thực</>}</span></td>
                          <td style={styles.td}><span style={{ ...styles.badge, backgroundColor: user.banned ? "#f44336" : "#4caf50" }}>{user.banned ? <><Lock size={13} style={{ verticalAlign: "middle", marginRight: 3 }} />Bị Khóa</> : <><Unlock size={13} style={{ verticalAlign: "middle", marginRight: 3 }} />Bình thường</>}</span></td>
                          <td style={styles.td}>
                            {user.role !== "ADMIN" && (user.banned
                              ? <button onClick={() => handleUnbanUser(user.id)} disabled={loading} style={{ ...styles.actionBtn, backgroundColor: "#4caf50" }}><Unlock size={14} style={{ verticalAlign: "middle", marginRight: 3 }} />Mở Khóa</button>
                              : <button onClick={() => handleBanUser(user.id)}   disabled={loading} style={{ ...styles.actionBtn, backgroundColor: "#f44336" }}><Lock   size={14} style={{ verticalAlign: "middle", marginRight: 3 }} />Khóa</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===== NẠP TIỀN ===== */}
          {activeTab === "topups" && (
            <div style={styles.tabContent}>
              <h2 style={styles.sectionTitle}>Lịch Sử Nạp Tiền</h2>
              <div style={styles.orderStatsRow}>
                {[
                  { label: "Tổng giao dịch", value: topups.length,                                        color: "#1565c0" },
                  { label: "Thành công",      value: topups.filter(t => t.status === "APPROVED").length,  color: "#43a047" },
                  { label: "Thất bại/Hủy",   value: topups.filter(t => t.status === "REJECTED").length,  color: "#e53935" },
                  { label: "Đang chờ",        value: topups.filter(t => t.status === "PENDING").length,   color: "#ff9800" },
                ].map(s => (
                  <div key={s.label} style={styles.orderStatCard}>
                    <div style={{ ...styles.orderStatNum, color: s.color }}>{s.value}</div>
                    <div style={styles.orderStatLabel}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={styles.filterRow}>
                {[
                  { key: "ALL", label: "Tất cả" },
                  { key: "APPROVED", label: "Thành công" },
                  { key: "REJECTED", label: "Thất bại/Hủy" },
                  { key: "PENDING", label: "Đang chờ" },
                ].map(f => (
                  <button key={f.key}
                    style={{ ...styles.filterBtn, ...(topupFilter === f.key ? styles.filterBtnActive : {}) }}
                    onClick={() => setTopupFilter(f.key)}>{f.label}
                  </button>
                ))}
              </div>
              {topups.length === 0 ? (
                <div style={styles.emptyBox}><p style={{ color: "#999" }}>Chưa có giao dịch nạp tiền nào</p></div>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeader}>
                        {["ID","Người dùng","Email","Số tiền","Ghi chú","Mã GD VNPay","Thời gian","Xác nhận lúc","Trạng thái"].map(h => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(topupFilter === "ALL" ? topups : topups.filter(t => t.status === topupFilter)).map((t, i) => {
                        const s = {
                          APPROVED: { label: "Thành công", color: "#43a047", bg: "#e8f5e9" },
                          REJECTED: { label: "Thất bại",   color: "#e53935", bg: "#fce4ec" },
                          PENDING:  { label: "Đang chờ",   color: "#ff9800", bg: "#fff8e1" },
                        }[t.status] || { label: t.status, color: "#666", bg: "#f5f5f5" };
                        return (
                          <tr key={t.id} style={{ ...styles.tableRow, backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                            <td style={styles.td}>#{t.id}</td>
                            <td style={styles.td}><strong>{t.user?.username}</strong></td>
                            <td style={{ ...styles.td, fontSize: 12, color: "#888" }}>{t.user?.email}</td>
                            <td style={{ ...styles.td, color: "#1565c0", fontWeight: 700 }}>{t.amount?.toLocaleString("vi-VN")} VNĐ</td>
                            <td style={{ ...styles.td, fontSize: 12 }}>{t.note || "—"}</td>
                            <td style={{ ...styles.td, fontSize: 11, fontFamily: "monospace" }}>{t.vnpTxnRef || "—"}</td>
                            <td style={{ ...styles.td, fontSize: 12 }}>{t.createdAt ? new Date(t.createdAt).toLocaleString("vi-VN") : "—"}</td>
                            <td style={{ ...styles.td, fontSize: 12 }}>{t.confirmedAt ? new Date(t.confirmedAt).toLocaleString("vi-VN") : "—"}</td>
                            <td style={styles.td}>
                              <span style={{ ...styles.statusBadge, color: s.color, backgroundColor: s.bg }}>{s.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===== RÚT TIỀN ===== */}
          {activeTab === "withdrawals" && (
            <div style={styles.tabContent}>
              <h2 style={styles.sectionTitle}>Lịch Sử Rút Tiền</h2>
              <div style={styles.orderStatsRow}>
                {[
                  { label: "Tổng yêu cầu", value: withdrawals.length,                                          color: "#1565c0" },
                  { label: "Hoàn thành",    value: withdrawals.filter(w => w.status === "COMPLETED").length,   color: "#43a047" },
                  { label: "Tổng đã rút",   value: withdrawals.filter(w => w.status === "COMPLETED").reduce((s, w) => s + (w.amount || 0), 0), color: "#e53935", isAmount: true },
                ].map(s => (
                  <div key={s.label} style={styles.orderStatCard}>
                    <div style={{ ...styles.orderStatNum, color: s.color, fontSize: s.isAmount ? 18 : 24 }}>
                      {s.isAmount ? `${s.value.toLocaleString("vi-VN")} VNĐ` : s.value}
                    </div>
                    <div style={styles.orderStatLabel}>{s.label}</div>
                  </div>
                ))}
                <div style={styles.orderStatCard} />
              </div>
              <div style={styles.filterRow}>
                {[
                  { key: "ALL", label: "Tất cả" },
                  { key: "COMPLETED", label: "Hoàn thành" },
                  { key: "PENDING", label: "Đang chờ" },
                  { key: "REJECTED", label: "Thất bại" },
                ].map(f => (
                  <button key={f.key}
                    style={{ ...styles.filterBtn, ...(withdrawalFilter === f.key ? styles.filterBtnActive : {}) }}
                    onClick={() => setWithdrawalFilter(f.key)}>{f.label}
                  </button>
                ))}
              </div>
              {withdrawals.length === 0 ? (
                <div style={styles.emptyBox}><p style={{ color: "#999" }}>Chưa có yêu cầu rút tiền nào</p></div>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeader}>
                        {["ID","Người dùng","Email","Số tiền","Ngân hàng","Số TK","Tên chủ TK","Thời gian","Xử lý lúc","Trạng thái"].map(h => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(withdrawalFilter === "ALL" ? withdrawals : withdrawals.filter(w => w.status === withdrawalFilter)).map((w, i) => {
                        const s = {
                          COMPLETED: { label: "Hoàn thành", color: "#43a047", bg: "#e8f5e9" },
                          PENDING:   { label: "Đang chờ",   color: "#ff9800", bg: "#fff8e1" },
                          REJECTED:  { label: "Thất bại",   color: "#e53935", bg: "#fce4ec" },
                        }[w.status] || { label: w.status, color: "#666", bg: "#f5f5f5" };
                        return (
                          <tr key={w.id} style={{ ...styles.tableRow, backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                            <td style={styles.td}>#{w.id}</td>
                            <td style={styles.td}><strong>{w.user?.username}</strong></td>
                            <td style={{ ...styles.td, fontSize: 12, color: "#888" }}>{w.user?.email}</td>
                            <td style={{ ...styles.td, color: "#e53935", fontWeight: 700 }}>{w.amount?.toLocaleString("vi-VN")} VNĐ</td>
                            <td style={styles.td}>{w.bankName || "—"}</td>
                            <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 13 }}>{w.bankAccountNumber || "—"}</td>
                            <td style={styles.td}>{w.bankAccountName || "—"}</td>
                            <td style={{ ...styles.td, fontSize: 12 }}>{w.createdAt ? new Date(w.createdAt).toLocaleString("vi-VN") : "—"}</td>
                            <td style={{ ...styles.td, fontSize: 12 }}>{w.processedAt ? new Date(w.processedAt).toLocaleString("vi-VN") : "—"}</td>
                            <td style={styles.td}>
                              <span style={{ ...styles.statusBadge, color: s.color, backgroundColor: s.bg }}>{s.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Admin;

const styles = {
  page:           { backgroundColor: "#f5f5f5", minHeight: "100vh", paddingBottom: 40 },
  container:      { maxWidth: "1500px", margin: "0 auto", padding: 20 },
  pageTitle:      { textAlign: "center", color: "#333", marginBottom: 24, fontSize: 28 },
  toast:          { padding: "12px 16px", borderRadius: 8, marginBottom: 16, border: "1px solid", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, fontWeight: 500 },
  closeBtn:       { cursor: "pointer", fontSize: 18, color: "#999", marginLeft: 12 },
  tabs:           { display: "flex", gap: 8, marginBottom: 20, borderBottom: "2px solid #e0e0e0", flexWrap: "wrap" },
  tabBtn:         { padding: "11px 22px", border: "none", borderRadius: "8px 8px 0 0", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
  tabBadge:       { backgroundColor: "#e53935", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 11, fontWeight: 700 },
  tabContent:     { backgroundColor: "#fff", padding: 24, borderRadius: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  sectionTitle:   { color: "#333", marginBottom: 20, fontSize: 20 },
  statsGrid:      { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 },
  statCard:       { background: "#f9f9f9", padding: "20px 16px", borderRadius: 10, textAlign: "center", border: "1px solid #e0e0e0" },
  statIcon:       { fontSize: 28, marginBottom: 8 },
  statNumber:     { fontSize: 30, fontWeight: 700, marginBottom: 6 },
  statLabel:      { fontSize: 13, color: "#666" },
  orderStatsRow:  { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 },
  orderStatCard:  { background: "#f9f9f9", padding: "14px 16px", borderRadius: 8, textAlign: "center", border: "1px solid #e0e0e0" },
  orderStatNum:   { fontSize: 24, fontWeight: 700 },
  orderStatLabel: { fontSize: 12, color: "#888", marginTop: 4 },
  commissionBox:  { display: "flex", alignItems: "center", flexWrap: "wrap", backgroundColor: "#fff8e1", border: "1px solid #ffe082", borderRadius: 8, padding: "10px 16px", marginBottom: 12 },
  filterRow:      { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  filterBtn:      { padding: "6px 14px", border: "1px solid #ddd", borderRadius: 20, cursor: "pointer", background: "#fff", fontSize: 13, color: "#555" },
  filterBtnActive:{ background: "#1976d2", color: "#fff", border: "1px solid #1976d2", fontWeight: 700 },
  emptyBox:       { textAlign: "center", padding: "40px 20px", color: "#999" },
  tableWrapper:   { overflowX: "auto" },
  table:          { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  tableHeader:    { backgroundColor: "#1976d2", color: "#fff" },
  th:             { padding: "10px 12px", textAlign: "left", fontWeight: 600, whiteSpace: "nowrap" },
  tableRow:       { borderBottom: "1px solid #f0f0f0" },
  td:             { padding: "10px 12px", verticalAlign: "middle" },
  titleCell:      { maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  actionBtn:      { padding: "6px 12px", border: "none", borderRadius: 4, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" },
  statusBadge:    { padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" },
  badge:          { display: "inline-block", padding: "3px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700, color: "#fff" },
  roleBadge:      { display: "inline-block", padding: "3px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700, color: "#fff" },
};

const bidFilterStyles = {
  filterBar:     { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 },
  filterInput:   { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, minWidth: 180 },
  checkboxLabel: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#555", cursor: "pointer" },
  clearBtn:      { padding: "8px 14px", border: "1px solid #e53935", borderRadius: 6, background: "#fff", color: "#e53935", fontSize: 13, cursor: "pointer", fontWeight: 600 },
};

const catStyles = {
  addBox: { display: "flex", gap: 10, marginBottom: 20, alignItems: "center" },
  input:  { flex: 1, padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, outline: "none" },
  list:   { display: "flex", flexDirection: "column", gap: 8 },
  item:   { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", backgroundColor: "#fafafa", borderRadius: 8, border: "1px solid #e0e0e0" },
  idBadge:{ backgroundColor: "#e3f2fd", color: "#1565c0", fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 10, flexShrink: 0 },
  name:   { fontSize: 15, fontWeight: 600, color: "#333" },
};

const auctionCardStyle = {
  card:         { backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e0e0e0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  cardHeader:   { display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", backgroundColor: "#f5f5f5", borderBottom: "1px solid #e0e0e0" },
  idBadge:      { backgroundColor: "#1976d2", color: "#fff", fontSize: 13, fontWeight: 700, padding: "2px 10px", borderRadius: 12 },
  categoryBadge:{ backgroundColor: "#e3f2fd", color: "#1565c0", fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 12 },
  cardBody:     { display: "flex", gap: 20, padding: 20 },
  imgWrap:      { flexShrink: 0, width: 120, height: 120, borderRadius: 10, overflow: "hidden", border: "1px solid #eee", backgroundColor: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center" },
  img:          { width: "100%", height: "100%", objectFit: "cover" },
  noImg:        { fontSize: 36, color: "#ccc" },
  info:         { flex: 1, minWidth: 0 },
  auctionTitle: { fontSize: 17, fontWeight: 700, color: "#222", marginBottom: 8 },
  desc:         { fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 14, backgroundColor: "#fafafa", padding: "8px 12px", borderRadius: 8, border: "1px solid #f0f0f0" },
  metaGrid:     { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px 20px" },
  metaItem:     { display: "flex", flexDirection: "column", gap: 2 },
  metaLabel:    { fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 0.5 },
  metaValue:    { fontSize: 14, fontWeight: 600, color: "#333" },
  metaSub:      { fontSize: 11, color: "#aaa" },
};

const rejectModalStyles = {
  overlay:         { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" },
  modal:           { background: "#fff", borderRadius: 12, width: 480, maxWidth: "90vw", padding: 24, maxHeight: "85vh", overflowY: "auto" },
  title:           { fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 16, color: "#333" },
  label:           { fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 8, marginTop: 12 },
  reasonList:      { display: "flex", flexDirection: "column", gap: 6 },
  reasonItem:      { padding: "9px 12px", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#444" },
  reasonItemActive:{ border: "1px solid #f44336", background: "#fce4ec", color: "#c62828", fontWeight: 600 },
  suggestionBox:   { fontSize: 12, color: "#2e7d32", background: "#e8f5e9", padding: "8px 12px", borderRadius: 6, marginTop: 10 },
  textarea:        { width: "100%", minHeight: 70, padding: 10, border: "1px solid #ddd", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box" },
  actions:         { display: "flex", gap: 10, marginTop: 18 },
  cancelBtn:       { flex: 1, padding: 11, border: "1px solid #ddd", borderRadius: 8, background: "#fff", color: "#555", cursor: "pointer", fontSize: 14 },
  confirmBtn:      { flex: 1, padding: 11, border: "none", borderRadius: 8, background: "#f44336", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 },
};