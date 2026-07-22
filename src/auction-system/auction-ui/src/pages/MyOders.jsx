import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { CreditCard, CheckCircle2 } from "lucide-react";

const statusConfig = {
  PENDING: { label: "Chờ thanh toán", color: "#ff9800", bg: "#fff8e1" },
  PENDING_CONFIRMATION: { label: "Chờ xác nhận", color: "#1976d2", bg: "#e3f2fd" },
  SHIPPING: { label: "Đang giao hàng", color: "#7b1fa2", bg: "#f3e5f5" },
  PAID:    { label: "Hoàn thành",  color: "#43a047", bg: "#e8f5e9" },
  CANCELLED: { label: "Đã hủy",      color: "#9e9e9e", bg: "#f5f5f5" },
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null); // orderId đang xử lý
  const navigate = useNavigate();

  const loadOrders = async () => {
    try {
      const res = await axiosClient.get("/orders/my-orders");
      setOrders(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handlePay = async (orderId, title, price) => {
  const confirmed = window.confirm(
    `Xác nhận thanh toán đơn hàng:\n${title}\nSố tiền: ${Number(price).toLocaleString("vi-VN")} VNĐ`
  );
  if (!confirmed) return;

  setProcessing(orderId);
  try {
    await axiosClient.post(`/orders/${orderId}/confirm-payment`, {
      paymentMethod: "BANK_TRANSFER",
      paymentNote: "",
    });
    alert("Xác nhận thanh toán thành công! Vui lòng chờ quản trị viên xác nhận.");
    loadOrders();
  } catch (err) {
    const raw = err?.response?.data?.message || "";
    if (raw === "PROFILE_INCOMPLETE") {
      alert("Vui lòng cập nhật đầy đủ thông tin cá nhân trước khi thanh toán");
      navigate("/profile");
      return;
    }
    alert(raw || "Xác nhận thanh toán thất bại");
  } finally {
    setProcessing(null);
  }
};

  const handleCancel = async (orderId) => {
    const confirmed = window.confirm("Bạn có chắc muốn hủy đơn hàng này?");
    if (!confirmed) return;

    setProcessing(orderId);
    try {
      await axiosClient.post(`/orders/${orderId}/cancel`);
      alert("Đã hủy đơn hàng.");
      loadOrders();
    } catch (err) {
      alert(err?.response?.data?.message || "Hủy đơn thất bại");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return (
    <div style={styles.page}>
      <Header />
      <p style={styles.empty}>Đang tải...</p>
    </div>
  );

  return (
    <div style={styles.page}>
      <Header />

      <div style={styles.container}>
        <h2 style={styles.title}>Đơn hàng của tôi</h2>

        {orders.length === 0 ? (
          <div style={styles.emptyBox}>
            <p style={styles.empty}>Bạn chưa có đơn hàng nào</p>
            <button style={styles.browseBtn} onClick={() => navigate("/")}>
              Xem sản phẩm đấu giá
            </button>
          </div>
        ) : (
          orders.map((order) => {
            const s = statusConfig[order.status] || statusConfig.PENDING;
            const isProcessing = processing === order.id;

            return (
              <div key={order.id} style={styles.card}>
                {/* Header card */}
                <div style={styles.cardHeader}>
                  <span style={styles.orderId}>Đơn #{order.id}</span>
                  <span style={{
                    ...styles.statusBadge,
                    color: s.color,
                    backgroundColor: s.bg,
                  }}>
                    {s.label}
                  </span>
                </div>

                {/* Nội dung */}
                <div style={styles.cardBody}>
                  <img
                    src={
                      order.auction?.images?.length > 0
                        ? `http://localhost:8080/api/auctions/uploads/${order.auction.images[0].imageUrl}`
                        : "https://via.placeholder.com/90x90?text=No+img"
                    }
                    alt={order.auction?.title}
                    style={styles.thumb}
                  />

                  <div style={styles.info}>
                    <div
                      style={styles.auctionTitle}
                      onClick={() => navigate(`/auction/${order.auction?.id}`)}
                    >
                      {order.auction?.title}
                    </div>
                    <div style={styles.meta}>
                      Danh mục: {order.auction?.category?.name || "—"}
                    </div>
                    <div style={styles.meta}>
                      Ngày tạo: {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>

                  <div style={styles.priceBlock}>
                    <div style={styles.priceLabel}>Tổng thanh toán</div>
                    <div style={styles.price}>
                      {Number(order.finalPrice).toLocaleString("vi-VN")} VNĐ
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {order.status === "PENDING" && (
                  <div style={styles.actions}>
                    <button
                      style={{
                        ...styles.payBtn,
                        opacity: isProcessing ? 0.6 : 1,
                      }}
                      disabled={isProcessing}
                      onClick={() =>
                        handlePay(order.id, order.auction?.title, order.finalPrice)
                      }
                    >
                      {isProcessing ? "Đang xử lý..." : (<><CreditCard size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Thanh toán ngay</>)}
                    </button>
                    <button
                      style={{
                        ...styles.cancelBtn,
                        opacity: isProcessing ? 0.6 : 1,
                      }}
                      disabled={isProcessing}
                      onClick={() => handleCancel(order.id)}
                    >
                      Hủy đơn
                    </button>
                  </div>
                )}

                {order.status === "PAID" && (
                  <div style={styles.paidBanner}>
                    <CheckCircle2 size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Thanh toán thành công — Cảm ơn bạn đã mua hàng!
                  </div>
                )}

                {order.status === "CANCELLED" && (
                  <div style={styles.cancelledBanner}>
                    Đơn hàng đã bị hủy
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyOrders;

const styles = {
  page: {
    background: "#f5f5f5",
    minHeight: "100vh",
    paddingBottom: 40,
  },

  container: {
    maxWidth: "860px",
    margin: "30px auto",
    padding: "0 20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  title: {
    fontSize: "24px",
    fontWeight: "700",
    margin: 0,
  },

  card: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
    overflow: "hidden",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    borderBottom: "1px solid #f0f0f0",
    backgroundColor: "#fafafa",
  },

  orderId: {
    fontSize: "13px",
    color: "#888",
    fontWeight: 600,
  },

  statusBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: 700,
  },

  cardBody: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "16px 20px",
  },

  thumb: {
    width: "90px",
    height: "90px",
    objectFit: "cover",
    borderRadius: "8px",
    flexShrink: 0,
  },

  info: {
    flex: 1,
    minWidth: 0,
  },

  auctionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    color: "#222",
    marginBottom: "6px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  meta: {
    fontSize: "13px",
    color: "#888",
    marginTop: "3px",
  },

  priceBlock: {
    textAlign: "right",
    flexShrink: 0,
  },

  priceLabel: {
    fontSize: "12px",
    color: "#999",
    marginBottom: "4px",
  },

  price: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#e53935",
  },

  actions: {
    display: "flex",
    gap: "12px",
    padding: "14px 20px",
    borderTop: "1px solid #f0f0f0",
    backgroundColor: "#fafafa",
  },

  payBtn: {
    padding: "10px 24px",
    background: "#ff5722",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
  },

  cancelBtn: {
    padding: "10px 20px",
    background: "#fff",
    color: "#757575",
    border: "1px solid #ddd",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
  },

  paidBanner: {
    padding: "12px 20px",
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    fontWeight: 600,
    fontSize: "14px",
    borderTop: "3px solid #43a047",
  },

  cancelledBanner: {
    padding: "12px 20px",
    backgroundColor: "#f5f5f5",
    color: "#9e9e9e",
    fontSize: "14px",
    borderTop: "1px solid #e0e0e0",
  },

  emptyBox: {
    textAlign: "center",
    padding: "60px 20px",
    background: "#fff",
    borderRadius: "12px",
  },

  empty: {
    color: "#999",
    fontSize: "16px",
    marginBottom: "16px",
  },

  browseBtn: {
    padding: "10px 24px",
    background: "#ff5722",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};