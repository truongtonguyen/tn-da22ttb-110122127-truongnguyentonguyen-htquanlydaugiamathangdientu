import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import { useToastContext } from "../context/ToastContext";
import { AuctionGridSkeleton } from "../components/Skeleton";
import {
  PackageOpen, Trophy, TrendingUp,
  CheckCircle2, Clock, XCircle,
} from "lucide-react";

const statusConfig = {
  ACTIVE:           { label: "Đang đấu giá", color: "#2196f3", bg: "#e3f2fd" },
  UPCOMING:         { label: "Sắp diễn ra",  color: "#ff9800", bg: "#fff8e1" },
  SOLD:             { label: "Đã bán",        color: "#43a047", bg: "#e8f5e9" },
  FAILED:           { label: "Không thành công",   color: "#e53935", bg: "#fce4ec" },
  PENDING_APPROVAL: { label: "Chờ duyệt",     color: "#ff9800", bg: "#fff8e1" },
  REJECTED:         { label: "Đã từ chối",    color: "#e53935", bg: "#fce4ec" },
};

const orderStatusConfig = {
  PENDING:              { label: "Chờ thanh toán", color: "#ff9800", bg: "#fff8e1" },
  PENDING_CONFIRMATION: { label: "Chờ xác nhận",   color: "#2196f3", bg: "#e3f2fd" },
  SHIPPING:             { label: "Đang giao",       color: "#9c27b0", bg: "#f3e5f5" },
  PAID:                 { label: "Hoàn thành",      color: "#43a047", bg: "#e8f5e9" },
  CANCELLED:            { label: "Đã hủy",          color: "#9e9e9e", bg: "#f5f5f5" },
};

// Filter phiên đấu giá — có icon
const auctionFilters = [
  { key: "ALL",              label: "Tất cả" },
  { key: "ACTIVE",           label: "Đang đấu giá" },
  { key: "PENDING_APPROVAL", label: "Chờ duyệt" },
  { key: "UPCOMING",         label: "Sắp diễn ra" },
  { key: "SOLD",             label: "Đã bán" },
  { key: "FAILED",           label: "Không thành" },
  { key: "REJECTED",         label: "Đã từ chối" },
];

const orderFilters = [
  { key: "ALL",                  label: "Tất cả" },
  { key: "PENDING",              label: "Chờ thanh toán" },
  { key: "PENDING_CONFIRMATION", label: "Chờ xác nhận" },
  { key: "SHIPPING",             label: "Đang giao" },
  { key: "PAID",                 label: "Hoàn thành" },
  { key: "CANCELLED",            label: "Đã hủy" },
];

const MyAuctions = () => {
  const [auctions, setAuctions]         = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState("ALL");
  const [activeTab, setActiveTab]       = useState("auctions");
  const [orderFilter, setOrderFilter]   = useState("ALL");
  const navigate = useNavigate();
  const toast = useToastContext();

  const loadMyAuctions = async () => {
    try {
      const res = await axiosClient.get("/auctions/my-auctions");
      setAuctions(res.data);
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const loadSellerOrders = async () => {
    try {
      const res = await axiosClient.get("/orders/seller-orders");
      setSellerOrders(res.data);
    } catch (err) { console.log(err); }
  };

  const handleConfirmShipping = async (orderId) => {
    if (!window.confirm("Xác nhận đã bắt đầu giao hàng?")) return;
    try {
      await axiosClient.post(`/orders/${orderId}/confirm-shipping`);
      toast.success("Đã xác nhận giao hàng!");
      loadSellerOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Xác nhận thất bại");
    }
  };

  useEffect(() => {
    loadMyAuctions();
    loadSellerOrders();
  }, []);

  const filtered = filter === "ALL"
    ? auctions
    : auctions.filter(a => a.status === filter);

  const filteredOrders = orderFilter === "ALL"
    ? sellerOrders
    : sellerOrders.filter(o => o.status === orderFilter);

  const auctionStats = {
    total:   auctions.length,
    active:  auctions.filter(a => a.status === "ACTIVE").length,
    pending: auctions.filter(a => a.status === "PENDING_APPROVAL").length,
    sold:    auctions.filter(a => a.status === "SOLD").length,
  };

  const paidOrders      = sellerOrders.filter(o => o.status === "PAID");
  const totalRevenue    = paidOrders.reduce((sum, o) => sum + (o.finalPrice     || 0), 0);
  const totalCommission = paidOrders.reduce((sum, o) => sum + (o.commissionFee  || 0), 0);
  const totalReceived   = paidOrders.reduce((sum, o) => sum + (o.sellerReceives || 0), 0);
  const pendingOrders   = sellerOrders.filter(o => ["PENDING","PENDING_CONFIRMATION","SHIPPING"].includes(o.status)).length;

  if (loading) return (
    <div style={styles.page}>
      <Header />
      <div style={styles.container}><AuctionGridSkeleton count={6} /></div>
    </div>
  );

  return (
    <div style={styles.page}>
      <Header />

      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <h2 style={styles.title}>Phiên đấu giá của tôi</h2>
          <button style={styles.createBtn} onClick={() => navigate("/create")}>
            + Đăng phiên đấu giá
          </button>
        </div>

        {/* Tab switch */}
        <div style={styles.tabRow}>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === "auctions" ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab("auctions")}
          >
            <PackageOpen size={15} style={{ verticalAlign: "middle", marginRight: 5 }} />
            Phiên đấu giá đã đăng
          </button>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === "revenue" ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab("revenue")}
          >
            <TrendingUp size={15} style={{ verticalAlign: "middle", marginRight: 5 }} />
            Đơn hàng từ các phiên đấu giá
            {pendingOrders > 0 && (
              <span style={styles.tabBadge}>{pendingOrders}</span>
            )}
          </button>
        </div>

        {/* ══ TAB: PHIÊN ĐẤU GIÁ ══ */}
        {activeTab === "auctions" && (
          <>
            <div style={styles.statsRow}>
              {[
                { label: "Tổng sản phẩm", value: auctionStats.total,   color: "#1565c0" },
                { label: "Đang đấu giá",  value: auctionStats.active,  color: "#2196f3" },
                { label: "Chờ duyệt",     value: auctionStats.pending, color: "#ff9800" },
                { label: "Đã bán",        value: auctionStats.sold,    color: "#43a047" },
              ].map(s => (
                <div key={s.label} style={styles.statCard}>
                  <div style={{ ...styles.statNum, color: s.color }}>{s.value}</div>
                  <div style={styles.statLabel}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filter phiên đấu giá */}
            <div style={styles.filterRow}>
              {auctionFilters.map(f => (
                <button key={f.key}
                  style={{ ...styles.filterBtn, ...(filter === f.key ? styles.filterBtnActive : {}) }}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={styles.emptyBox}>
                <div style={{ marginBottom: 12 }}><PackageOpen size={40} color="#bbb" /></div>
                <p style={{ color: "#999", margin: 0 }}>
                  {filter === "ALL" ? "Bạn chưa tạo sản phẩm nào" : "Không có sản phẩm nào ở trạng thái này"}
                </p>
              </div>
            ) : (
              <div style={styles.grid}>
                {filtered.map((auction) => {
                  const s = statusConfig[auction.status] || { label: auction.status, color: "#555", bg: "#f5f5f5" };
                  const imgUrl = auction.images?.length > 0
                    ? `http://localhost:8080/api/auctions/uploads/${auction.images[0].imageUrl}`
                    : "https://via.placeholder.com/300x220?text=No+Image";
                  const isEnded = ["SOLD","FAILED","REJECTED"].includes(auction.status);

                  return (
                    <div key={auction.id} style={{ ...styles.card, opacity: isEnded ? 0.8 : 1 }}>
                      <div style={{ position: "relative" }}>
                        <img src={imgUrl} alt={auction.title}
                          style={{ ...styles.image, filter: isEnded ? "grayscale(30%)" : "none" }} />
                        <span style={{ ...styles.statusBadge, color: s.color, backgroundColor: s.bg }}>
                          {s.label}
                        </span>
                      </div>
                      <div style={styles.content}>
                        <h3 style={styles.productName}>{auction.title}</h3>
                        <div style={styles.priceRow}>
                          <span style={styles.price}>
                            {(auction.currentPrice ?? auction.startingPrice)?.toLocaleString("vi-VN")} VNĐ
                          </span>
                          {auction.currentPrice > auction.startingPrice && (
                            <span style={styles.priceUp}>↑ từ {auction.startingPrice?.toLocaleString("vi-VN")}</span>
                          )}
                        </div>
                        <div style={styles.infoRow}>
                          <span style={styles.infoLabel}>Kết thúc</span>
                          <span style={{ fontSize: 13 }}>{new Date(auction.endTime).toLocaleString("vi-VN")}</span>
                        </div>
                        {auction.winner && (
                          <div style={styles.winnerRow}>
                            <Trophy size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                            Người thắng: <strong>{auction.winner.fullName || auction.winner.username}</strong>
                          </div>
                        )}
                        {auction.status === "REJECTED" && auction.rejectReason && (
                          <div style={{
                            fontSize: 12, color: "#c62828", background: "#fce4ec",
                            padding: "8px 10px", borderRadius: 6, marginTop: 8, marginBottom: 8,
                          }}>
                            <strong>Lý do từ chối:</strong> {auction.rejectReason}
                          </div>
                        )}
                        <button style={styles.detailBtn} onClick={() => navigate(`/auction/${auction.id}`)}>
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══ TAB: DOANH THU & ĐƠN HÀNG ══ */}
        {activeTab === "revenue" && (
          <>
            <div style={revenueStyles.summaryGrid}>
              <div style={revenueStyles.summaryCard}>
                <div style={{ ...revenueStyles.summaryNum, color: "#1565c0" }}>
                  {totalRevenue.toLocaleString("vi-VN")} VNĐ
                </div>
                <div style={revenueStyles.summaryLabel}>Tổng doanh thu</div>
              </div>
              <div style={revenueStyles.summaryCard}>
                <div style={{ ...revenueStyles.summaryNum, color: "#e53935" }}>
                  {totalCommission.toLocaleString("vi-VN")} VNĐ
                </div>
                <div style={revenueStyles.summaryLabel}>Phí hoa hồng (5%)</div>
              </div>
              <div style={revenueStyles.summaryCard}>
                <div style={{ ...revenueStyles.summaryNum, color: "#43a047" }}>
                  {totalReceived.toLocaleString("vi-VN")} VNĐ
                </div>
                <div style={revenueStyles.summaryLabel}>Thực nhận</div>
              </div>
              <div style={revenueStyles.summaryCard}>
                <div style={{ ...revenueStyles.summaryNum, color: "#ff9800" }}>
                  {paidOrders.length}
                </div>
                <div style={revenueStyles.summaryLabel}>Đơn hoàn thành</div>
              </div>
            </div>

            <div style={revenueStyles.noteBox}>
              💡 Nền tảng thu <strong>5% phí hoa hồng</strong> trên giá cuối mỗi đơn hàng hoàn thành.
              Số tiền thực nhận = Giá cuối − Phí hoa hồng.
            </div>

            {/* Filter đơn hàng */}
            <div style={styles.filterRow}>
              {orderFilters.map(f => (
                <button key={f.key}
                  style={{ ...styles.filterBtn, ...(orderFilter === f.key ? styles.filterBtnActive : {}) }}
                  onClick={() => setOrderFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div style={styles.emptyBox}>
                <div style={{ marginBottom: 12 }}><Clock size={40} color="#bbb" /></div>
                <p style={{ color: "#999", margin: 0 }}>Chưa có đơn hàng nào</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={revenueStyles.table}>
                  <thead>
                    <tr style={revenueStyles.thead}>
                      {["ID","Sản phẩm","Người mua","Giá cuối","Phí HH (5%)","Thực nhận","Trạng thái","Ngày", "Hành động"].map(h => (
                        <th key={h} style={revenueStyles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, i) => {
                      const s = orderStatusConfig[order.status] || orderStatusConfig.PENDING;
                      const isPaid = order.status === "PAID";
                      return (
                        <tr key={order.id} style={{ ...revenueStyles.tr, backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={revenueStyles.td}>#{order.id}</td>
                          <td style={{ ...revenueStyles.td, maxWidth: 180, fontWeight: 600 }}>
                            <span
                              style={{ cursor: "pointer", color: "#1565c0" }}
                              onClick={() => navigate(`/auction/${order.auction?.id}`)}
                            >
                              {order.auction?.title || "—"}
                            </span>
                          </td>
                          <td style={revenueStyles.td}>
                            <div style={{ fontWeight: 600 }}>{order.buyer?.fullName || order.buyer?.username}</div>
                            <div style={{ fontSize: 11, color: "#aaa" }}>{order.buyer?.phone || ""}</div>
                          </td>
                          <td style={{ ...revenueStyles.td, fontWeight: 700, color: "#333" }}>
                            {order.finalPrice?.toLocaleString("vi-VN")} VNĐ
                          </td>
                          <td style={{ ...revenueStyles.td, color: "#e53935" }}>
                            {isPaid && order.commissionFee != null
                              ? `${order.commissionFee.toLocaleString("vi-VN")} VNĐ`
                              : <span style={{ color: "#bbb" }}>—</span>}
                          </td>
                          <td style={{ ...revenueStyles.td, fontWeight: 700, color: "#43a047" }}>
                            {isPaid && order.sellerReceives != null
                              ? `${order.sellerReceives.toLocaleString("vi-VN")} VNĐ`
                              : <span style={{ color: "#bbb" }}>—</span>}
                          </td>
                          <td style={revenueStyles.td}>
                            <span style={{ ...revenueStyles.badge, color: s.color, backgroundColor: s.bg }}>
                              {s.label}
                            </span>
                          </td>
                          <td style={{ ...revenueStyles.td, fontSize: 12, color: "#888" }}>
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString("vi-VN")
                              : "—"}
                          </td>
                          <td style={revenueStyles.td}>
                            {order.status === "PENDING_CONFIRMATION" ? (
                              <button
                                onClick={() => handleConfirmShipping(order.id)}
                                style={revenueStyles.confirmBtn}
                              >
                                Xác nhận giao hàng
                              </button>
                            ) : (
                              <span style={{ color: "#bbb", fontSize: 12 }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyAuctions;

const styles = {
  page:      { minHeight: "100vh", backgroundColor: "#f5f5f5", paddingBottom: 40 },
  container: { maxWidth: "1400px", margin: "0 auto", padding: "24px 20px" },
  pageHeader:{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title:     { fontSize: 24, fontWeight: 700, margin: 0 },
  createBtn: { padding: "10px 20px", background: "#ff5722", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14 },

  tabRow:       { display: "flex", gap: 8, marginBottom: 20, borderBottom: "2px solid #e0e0e0" },
  tabBtn:       { padding: "10px 20px", border: "none", borderRadius: "8px 8px 0 0", fontSize: 14, fontWeight: 600, cursor: "pointer", backgroundColor: "#e0e0e0", color: "#555", display: "flex", alignItems: "center", position: "relative" },
  tabBtnActive: { backgroundColor: "#ff5722", color: "#fff" },
  tabBadge:     { marginLeft: 8, backgroundColor: "#fff", color: "#ff5722", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 },

  statsRow:  { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 },
  statCard:  { background: "#fff", borderRadius: 10, padding: "16px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  statNum:   { fontSize: 28, fontWeight: 700 },
  statLabel: { fontSize: 13, color: "#888", marginTop: 4 },

  filterRow:      { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 },
  filterBtn:      { padding: "7px 16px", border: "1px solid #ddd", borderRadius: 20, cursor: "pointer", background: "#fff", fontSize: 13, color: "#555" },
  filterBtnActive:{ background: "#ff5722", color: "#fff", border: "1px solid #ff5722", fontWeight: 700 },

  emptyBox:    { background: "#fff", borderRadius: 12, padding: "60px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },

  grid:        { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 },
  card:        { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" },
  image:       { width: "100%", height: 200, objectFit: "cover", display: "block" },
  statusBadge: { position: "absolute", top: 10, left: 10, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 },
  content:     { padding: 15 },
  productName: { fontSize: 16, fontWeight: 600, marginBottom: 8, minHeight: 44, lineHeight: 1.4 },
  priceRow:    { display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 },
  price:       { color: "#e53935", fontSize: 22, fontWeight: 700 },
  priceUp:     { fontSize: 12, color: "#888" },
  infoRow:     { display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 },
  infoLabel:   { color: "#888" },
  winnerRow:   { fontSize: 13, color: "#2e7d32", background: "#e8f5e9", padding: "6px 10px", borderRadius: 6, marginBottom: 8 },
  detailBtn:   { width: "100%", marginTop: 8, padding: 10, border: "none", backgroundColor: "#ff5722", color: "#fff", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700 },
};

const revenueStyles = {
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 16 },
  summaryCard: { background: "#fff", borderRadius: 12, padding: "20px 16px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" },
  summaryNum:  { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  summaryLabel:{ fontSize: 13, color: "#888" },

  noteBox: { backgroundColor: "#fff8e1", border: "1px solid #ffe082", borderRadius: 8, padding: "10px 16px", fontSize: 13, color: "#795548", marginBottom: 20 },

  table: { width: "100%", borderCollapse: "collapse", fontSize: 13, backgroundColor: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  thead: { backgroundColor: "#ff5722", color: "#fff" },
  th:    { padding: "11px 14px", textAlign: "left", fontWeight: 600, whiteSpace: "nowrap" },
  tr:    { borderBottom: "1px solid #f5f5f5" },
  td:    { padding: "11px 14px", verticalAlign: "middle" },
  badge: { padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" },
  confirmBtn: {
    padding: "6px 14px", border: "none", borderRadius: 6,
    backgroundColor: "#9c27b0", color: "#fff", cursor: "pointer",
    fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  },
};