import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import Header from "../components/Header";
import { useToastContext } from "../context/ToastContext";
import { AuctionDetailSkeleton } from "../components/Skeleton";
import { Lock, User, Zap } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const translateError = (message) => {
  if (!message) return "Đặt giá thất bại";

  const bidMinMatch = message.match(/Bid must be at least ([0-9.E+]+)/i);
  if (bidMinMatch) {
    const raw = parseFloat(bidMinMatch[1]);
    return `Giá đặt tối thiểu phải là ${raw.toLocaleString("vi-VN")} VNĐ`;
  }

  const errorMap = {
    "Auction not found": "Không tìm thấy phiên đấu giá",
    "Auction has ended": "Phiên đấu giá đã kết thúc",
    "Auction is not active": "Phiên đấu giá không còn hoạt động",
    "You cannot bid on your own auction": "Bạn không thể đặt giá cho sản phẩm của chính mình",
    "You are already the highest bidder": "Bạn đang là người trả giá cao nhất",
    "Another user placed a bid before you. Please try again.": "Có người vừa đặt giá trước bạn. Vui lòng thử lại",
    "Your email must be verified before you can place a bid. Please check your email for the verification link.": "Bạn cần xác thực email trước khi đặt giá. Vui lòng kiểm tra hộp thư",
    "Admin cannot place bids": "Quản trị viên không thể tham gia đấu giá",
    "Admin cannot buy items": "Quản trị viên không thể mua sản phẩm",
    "Có người vừa mua sản phẩm này. Vui lòng thử lại.": "Có người vừa mua sản phẩm này. Vui lòng thử lại",
    "BID_REACHES_BUYNOW": "Giá bạn nhập đã đạt hoặc vượt giá mua ngay. Có thể dùng chức năng Mua ngay thay vì đặt giá",
    "You cannot buy your own auction": "Bạn không thể mua sản phẩm của chính mình",
    "This auction does not have a buy-now price": "Phiên đấu giá này không có giá mua ngay",
    "Auction has already been purchased": "Sản phẩm đã được người khác mua trước",
    "USER_PROFILE_INCOMPLETE": "Bạn chưa cập nhật đầy đủ thông tin cá nhân. Vui lòng cập nhật trước khi mua",
    "MAX_BID_LIMIT_REACHED": "Bạn đã đạt số lần đặt giá tối đa cho phiên đấu giá này",
    "INSUFFICIENT_BALANCE_FOR_FEE": "Số dư không đủ để đóng phí tham gia đấu giá. Vui lòng nạp thêm tiền vào ví trước khi đặt giá.",
    "SHILL_BIDDING_SUSPECTED_SELLER_IP": "Hệ thống phát hiện bạn đang dùng cùng thiết bị/mạng với người bán. Không thể đặt giá để đảm bảo tính minh bạch.",
    "SHILL_BIDDING_SUSPECTED_MULTI_ACCOUNT": "Hệ thống phát hiện tài khoản này đang dùng cùng thiết bị/mạng với một người tham gia khác trong phiên này. Không thể đặt giá.",
  };

  return errorMap[message] || message;
};

// Hook đếm ngược thời gian kết thúc phiên đấu giá
const useCountdown = (endTime) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!endTime) return;

    const tick = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) {
        setTimeLeft("Đã kết thúc");
        setIsUrgent(false);
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      // Cảnh báo khi còn dưới 10 phút
      setIsUrgent(diff < 10 * 60 * 1000);

      if (h > 0) {
        setTimeLeft(`${h} giờ ${m} phút ${s} giây`);
      } else if (m > 0) {
        setTimeLeft(`${m} phút ${s} giây`);
      } else {
        setTimeLeft(`${s} giây`);
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  return { timeLeft, isUrgent };
};

const AuctionDetail = () => {
  const { id } = useParams();

  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [bidHistory, setBidHistory] = useState([]);
  const navigate = useNavigate();
  const toast = useToastContext();
  const stompRef = useRef(null);

  const { timeLeft, isUrgent } = useCountdown(auction?.endTime);

  const loadAuction = async () => {
    try {
      const res = await axiosClient.get(`/auctions/${id}`);
      setAuction(res.data);
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (msg === "AUCTION_ENDED_NO_ACCESS") {
        setAuction("NO_ACCESS");
      }
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBidHistory = async () => {
    try {
      const res = await axiosClient.get(`/auctions/${id}/bids`);
      setBidHistory(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadAuction();
    loadBidHistory();

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/auction/${id}`, () => {
          loadAuction();
          loadBidHistory();
        });
      },
    });
    client.activate();
    stompRef.current = client;

    return () => {
      if (stompRef.current) stompRef.current.deactivate();
    };
  }, [id]);

  const handleBuyNow = async () => {
    if (!window.confirm(
      `Xác nhận mua ngay với giá ${auction.buyNowPrice?.toLocaleString("vi-VN")} VNĐ?`
    )) return;
    try {
      await axiosClient.post(`/auctions/${id}/buy-now`);
      toast.success("Mua ngay thành công! Vui lòng kiểm tra đơn hàng và hoàn tất thanh toán.");
      navigate("/profile", { state: { tab: "orders" } });
    } catch (err) {
      const raw = err?.response?.data?.message || err?.message || "";
      if (raw === "USER_PROFILE_INCOMPLETE") {
        toast.warning("Bạn chưa cập nhật đầy đủ thông tin cá nhân (họ tên, số điện thoại, địa chỉ). Vui lòng cập nhật trước khi mua.");
        navigate("/profile");
        return;
      }
      toast.error(translateError(raw));
    }
  };

  const handleBid = async () => {
    const amountNum = Number(bidAmount);

    if (auction.buyNowPrice && amountNum >= auction.buyNowPrice) {
      const wantsBuyNow = window.confirm(
        `Giá bạn nhập (${amountNum.toLocaleString("vi-VN")} VNĐ) đã đạt hoặc vượt giá mua ngay ` +
        `(${auction.buyNowPrice.toLocaleString("vi-VN")} VNĐ).\n\n` +
        `Bấm OK để Mua ngay với giá ${auction.buyNowPrice.toLocaleString("vi-VN")} VNĐ, ` +
        `hoặc Hủy để quay lại nhập giá tốt hơn.`
      );
      if (wantsBuyNow) {
        handleBuyNow();
      }
      return;
    }

    try {
      await axiosClient.post(`/auctions/${id}/bids`, {
        amount: amountNum,
      });

      toast.success("Đặt giá thành công!");
      loadAuction();
      loadBidHistory();
      setBidAmount("");
    } catch (err) {
      const raw =
        err?.response?.data?.message ||
        err?.message ||
        "";
      toast.error(translateError(raw));
    }
  };

  const buyNowWarningPct = auction?.buyNowPrice && auction?.currentPrice
    ? Math.round((auction.currentPrice / auction.buyNowPrice) * 100)
    : 0;

  const renderStatus = (status) => {
    const map = {
      ACTIVE: "Đang đấu giá",
      UPCOMING: "Sắp diễn ra",
      SOLD: "Đã bán",
      FAILED: "Đấu giá thất bại",
      PENDING_APPROVAL: "Chờ duyệt",
      REJECTED: "Đã từ chối",
    };
    return map[status] || status;
  };

  if (loading) return (
    <div style={styles.page}>
      <Header />
      <AuctionDetailSkeleton />
    </div>
  );
  if (!auction) return <h2 style={{ textAlign: "center", marginTop: 60 }}>Không tìm thấy sản phẩm</h2>;
  if (auction === "NO_ACCESS") return (
    <div style={{ textAlign: "center", marginTop: 80 }}>
      <div style={{ marginBottom: 16 }}><Lock size={48} color="#bbb" /></div>
      <h2 style={{ color: "#555" }}>Phiên đấu giá đã kết thúc</h2>
      <p style={{ color: "#999" }}>Bạn không có quyền xem phiên đấu giá này vì không tham gia.</p>
    </div>
  );

  const isFinished = auction.status === "SOLD" || auction.status === "FAILED";

  const minNextBid =
    (auction.currentPrice ?? auction.startingPrice ?? 0) +
    (auction.bidIncrementStep ?? 100000);

  return (
    <div style={styles.page}>
      <Header />

      <div style={styles.container}>
        <div style={styles.left}>
          <div style={styles.swiperWrapper}>
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              loop={auction.images?.length > 1}
            >
              {auction.images?.length > 0 ? (
                auction.images.map((img) => (
                  <SwiperSlide key={img.id}>
                    <img
                      src={`http://localhost:8080/api/auctions/uploads/${img.imageUrl}`}
                      alt={auction.title}
                      style={styles.slideImage}
                    />
                  </SwiperSlide>
                ))
              ) : (
                <SwiperSlide>
                  <img
                    src="https://via.placeholder.com/600x380?text=Khong+co+anh"
                    alt="placeholder"
                    style={styles.slideImage}
                  />
                </SwiperSlide>
              )}
            </Swiper>
          </div>

          <div style={styles.descriptionBox}>
            <h3 style={styles.boxTitle}>Mô tả sản phẩm</h3>
            <p style={styles.descText}>{auction.description}</p>
          </div>
        </div>

        <div style={styles.right}>
          <h1 style={styles.title}>{auction.title}</h1>
          <div style={styles.titleMeta}>
            {auction.category && (
              <span
                style={styles.categoryBadge}
                onClick={() => navigate(`/?categoryId=${auction.category.id}`)}
                title={`Xem tất cả sản phẩm danh mục "${auction.category.name}"`}
              >
                {auction.category.name}
              </span>
            )}
            {auction.seller && (
              <span
                style={styles.sellerLink}
                onClick={() => navigate(`/seller/${auction.seller.id}`)}
              >
                <User size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />{auction.seller.fullName || auction.seller.username}
              </span>
            )}
          </div>

          <div style={styles.infoBox}>
            <div style={styles.currentPrice}>
              {(auction.currentPrice ?? auction.startingPrice)?.toLocaleString("vi-VN")} VNĐ
            </div>
            <p style={styles.subPrice}>
              Giá khởi điểm:{" "}
              <strong>
                {auction.startingPrice?.toLocaleString("vi-VN")} VNĐ
              </strong>
            </p>

            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Trạng thái</span>
              <span style={styles.statusBadge}>{renderStatus(auction.status)}</span>
            </div>

            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Kết thúc</span>
              <span style={{ color: isUrgent ? "#e53935" : "inherit", fontWeight: isUrgent ? 700 : 400 }}>
                {isFinished
                  ? new Date(auction.endTime).toLocaleString("vi-VN")
                  : timeLeft || new Date(auction.endTime).toLocaleString("vi-VN")}
              </span>
            </div>

            {auction.highestBidder && !isFinished && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Người trả cao nhất</span>
                <span
                  style={{ fontWeight: 600, color: "#ff5722", cursor: "pointer" }}
                  onClick={() => navigate(`/buyer/${auction.highestBidder.id}`)}
                >
                  {auction.highestBidder.fullName || auction.highestBidder.username}
                </span>
              </div>
            )}

            {isFinished && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Người thắng</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: auction.winner ? "#2e7d32" : "#9e9e9e",
                    cursor: auction.winner ? "pointer" : "default",
                  }}
                  onClick={() => auction.winner && navigate(`/buyer/${auction.winner.id}`)}
                >
                  {auction.winner
                    ? (auction.winner.fullName || auction.winner.username)
                    : "Không có người thắng"}
                </span>
              </div>
            )}

            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Bước giá tối thiểu</span>
              <span style={{ color: "#e53935", fontWeight: 600 }}>
                +{(auction.bidIncrementStep ?? 100000).toLocaleString("vi-VN")} VNĐ
              </span>
            </div>

            {auction.buyNowPrice && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Giá mua ngay</span>
                <span style={{ color: "#ff5722", fontWeight: 700 }}>
                  {auction.buyNowPrice.toLocaleString("vi-VN")} VNĐ
                </span>
              </div>
            )}
          </div>

          {auction.status === "ACTIVE" && (
            <div style={styles.bidBox}>
              <h3 style={styles.boxTitle}>Đặt giá</h3>
              <p style={{ fontSize: 12, color: "#e65100", marginTop: -4, marginBottom: 10 }}>
              Lưu ý: lần đặt giá đầu tiên sẽ tính phí tham gia 500.000 VNĐ, trừ trực tiếp từ số dư ví. Phí sẽ được hoàn lại nếu bạn không thắng.
            </p>

              {isUrgent && (
                <div style={styles.urgentWarning}>
                  Phiên đấu giá sắp kết thúc! Còn <strong>{timeLeft}</strong>
                </div>
              )}

              {auction.buyNowPrice && buyNowWarningPct >= 80 && buyNowWarningPct < 100 && (
                <div style={styles.buyNowWarning}>
                  <Zap size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Giá hiện tại đã đạt <strong>{buyNowWarningPct}%</strong> giá mua ngay!
                  Chỉ còn <strong style={{ color: "#e53935" }}>
                    {(auction.buyNowPrice - auction.currentPrice).toLocaleString("vi-VN")} VNĐ
                  </strong> nữa là có thể mua ngay.
                </div>
              )}

              {auction.buyNowPrice && auction.currentPrice >= auction.buyNowPrice && (
                <div style={styles.buyNowWarning}>
                  <Zap size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Giá hiện tại đã đạt giá mua ngay. Hãy dùng nút <strong>Mua ngay</strong> bên dưới để chốt giao dịch.
                </div>
              )}

              <p style={styles.bidHint}>
                Giá tối thiểu:{" "}
                <strong style={{ color: "#e53935" }}>
                  {minNextBid.toLocaleString("vi-VN")} VNĐ
                </strong>
              </p>
              <div style={styles.bidInputRow}>
                <input
                  type="text"
                  value={bidAmount}
                  placeholder={minNextBid.toLocaleString("vi-VN") + " VNĐ"}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setBidAmount(raw);
                  }}
                  style={styles.input}
                />
                <button onClick={handleBid} style={styles.button}>
                  Đặt giá ngay
                </button>
              </div>
              {bidAmount && (
                <p style={styles.bidPreview}>
                  ≈ {Number(bidAmount).toLocaleString("vi-VN")} VNĐ
                </p>
              )}

              {auction.buyNowPrice && (
                <div style={styles.buyNowBox}>
                  <div style={styles.buyNowInfo}>
                    <span style={styles.buyNowLabel}>Giá mua ngay</span>
                    <span style={styles.buyNowPrice}>
                      {auction.buyNowPrice.toLocaleString("vi-VN")} VNĐ
                    </span>
                  </div>
                  <button onClick={handleBuyNow} style={styles.buyNowBtn}>
                    <Zap size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Mua ngay
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={styles.historyBox}>
            <h3 style={styles.boxTitle}>5 lượt đặt giá gần nhất</h3>
            {bidHistory.length === 0 ? (
              <p style={{ color: "#999", fontSize: 14 }}>Chưa có lượt đấu giá nào</p>
            ) : (
              bidHistory.map((bid) => (
                <div key={bid.id} style={styles.bidItem}>
                  <div style={styles.bidderName}>{bid.bidderName}</div>
                  <div style={styles.bidAmount}>
                    {bid.amount.toLocaleString("vi-VN")} VNĐ
                  </div>
                  <div style={styles.bidTime}>
                    {new Date(bid.bidTime).toLocaleString("vi-VN")}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail;

const styles = {
  page: { background: "#f5f5f5", minHeight: "100vh", paddingBottom: 40 },
  container: { maxWidth: "1200px", margin: "30px auto", padding: "0 20px", display: "flex", gap: "28px", alignItems: "flex-start" },
  left: { flex: "0 0 45%", minWidth: 0, display: "flex", flexDirection: "column", gap: "20px" },
  swiperWrapper: { borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", overflow: "hidden", lineHeight: 0 },
  slideImage: { width: "100%", height: "360px", objectFit: "cover", display: "block" },
  descriptionBox: { background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)" },
  right: { flex: 1, display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 },
  title: { fontSize: "24px", fontWeight: "700", margin: 0, lineHeight: 1.3 },
  categoryBadge: { display: "inline-block", padding: "4px 14px", borderRadius: "20px", background: "#fff3f0", color: "#ff5722", fontWeight: "600", fontSize: "13px", border: "1px solid #ffccbc", cursor: "pointer" },
  infoBox: { background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)" },
  currentPrice: { fontSize: "32px", fontWeight: "700", color: "#e53935", marginBottom: "6px" },
  subPrice: { fontSize: "14px", color: "#666", marginBottom: "16px" },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid #f0f0f0", fontSize: "14px" },
  infoLabel: { color: "#888" },
  statusBadge: { color: "#2196f3", fontWeight: "600" },
  bidBox: { background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)" },
  boxTitle: { fontSize: "16px", fontWeight: "700", marginBottom: "12px", marginTop: 0 },
  bidHint: { fontSize: "13px", color: "#555", marginBottom: "12px" },
  bidPreview: { fontSize: "13px", color: "#388e3c", fontWeight: 600, marginTop: "8px" },
  buyNowBox: { marginTop: "14px", padding: "14px", background: "#fff8f0", borderRadius: "10px", border: "1px solid #ffccbc", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" },
  buyNowInfo: { display: "flex", flexDirection: "column", gap: "2px" },
  buyNowLabel: { fontSize: "12px", color: "#888" },
  buyNowPrice: { fontSize: "18px", fontWeight: "700", color: "#ff5722" },
  buyNowBtn: { padding: "10px 20px", border: "none", borderRadius: "8px", backgroundColor: "#ff5722", color: "#fff", cursor: "pointer", fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap" },
  bidInputRow: { display: "flex", gap: "10px" },
  input: { flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", outline: "none" },
  button: { padding: "10px 20px", border: "none", borderRadius: "8px", backgroundColor: "#ff5722", color: "#fff", cursor: "pointer", fontWeight: "bold", whiteSpace: "nowrap" },
  historyBox: { background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)" },
  bidItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0", fontSize: "14px" },
  bidderName: { fontWeight: "600", minWidth: "100px" },
  bidAmount: { color: "#e53935", fontWeight: "600" },
  bidTime: { color: "#999", fontSize: "12px" },
  descText: { fontSize: "14px", lineHeight: 1.7, color: "#444", margin: 0 },
  titleMeta: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 },
  sellerLink: { fontSize: 13, color: "#ff5722", cursor: "pointer", fontWeight: 600, padding: "3px 10px", background: "#fff3f0", borderRadius: 20, border: "1px solid #ffccbc" },
  buyNowWarning: { background: "#fff3e0", border: "1px solid #ffb74d", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#e65100", marginBottom: 12 },
  urgentWarning: { background: "#ffebee", border: "1px solid #ef9a9a", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#c62828", marginBottom: 12, fontWeight: 500 },
};