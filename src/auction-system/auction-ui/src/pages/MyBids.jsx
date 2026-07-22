import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { ListItemSkeleton } from "../components/Skeleton";
import { Trophy, Frown, Flame, ClipboardList } from "lucide-react";

const statusConfig = {
  ACTIVE:           { label: "Đang đấu giá", color: "#2196f3", bg: "#e3f2fd" },
  UPCOMING:         { label: "Sắp diễn ra",  color: "#ff9800", bg: "#fff8e1" },
  ENDED:            { label: "Đã kết thúc",  color: "#9e9e9e", bg: "#f5f5f5" },
  PENDING_APPROVAL: { label: "Chờ duyệt",    color: "#ff9800", bg: "#fff8e1" },
  REJECTED:         { label: "Đã từ chối",   color: "#e53935", bg: "#fce4ec" },
};

const MyBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosClient.get("/auctions/my-bids");
        setBids(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Group theo auctionId — dùng auctionId thay vì auction?.id
  const grouped = bids.reduce((acc, bid) => {
    const key = bid.auctionId;
    if (!acc[key]) {
      acc[key] = {
        auctionId:           bid.auctionId,
        auctionTitle:        bid.auctionTitle,
        auctionStatus:       bid.auctionStatus,
        auctionCurrentPrice: bid.auctionCurrentPrice,
        auctionEndTime:      bid.auctionEndTime,
        auctionImages:       bid.auctionImages || [],
        winnerId:            bid.winnerId,
        winnerName:          bid.winnerName,
        bids: [],
      };
    }
    acc[key].bids.push(bid);
    return acc;
  }, {});

  const groups = Object.values(grouped);

  // Tách: đang active vs đã kết thúc (chỉ hiện ended nếu user có liên quan — họ đã bid rồi thì đã liên quan)
  const activeGroups = groups.filter(g => g.auctionStatus !== "ENDED");
  const endedGroups  = groups.filter(g => g.auctionStatus === "ENDED");

  if (loading) return (
    <div style={styles.page}>
      <Header />
      <div style={styles.container}>
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
      </div>
    </div>
  );

  const renderGroup = (group) => {
    const s = statusConfig[group.auctionStatus] || statusConfig.ENDED;
    const isEnded = group.auctionStatus === "ENDED";
    const iWon = group.winnerName === "Bạn";
    const imgUrl = group.auctionImages.length > 0
      ? `http://localhost:8080/api/auctions/uploads/${group.auctionImages[0]}`
      : "https://via.placeholder.com/72x72?text=No+img";

    // Sắp xếp bids mới nhất lên đầu
    const sortedBids = [...group.bids].sort(
      (a, b) => new Date(b.bidTime) - new Date(a.bidTime)
    );

    return (
      <div key={group.auctionId} style={styles.card}>
        {/* Header */}
        <div style={styles.cardHeader}>
          <div style={styles.cardLeft}>
            <img src={imgUrl} alt={group.auctionTitle} style={styles.thumb} />
            <div>
              <div
                style={styles.auctionTitle}
                onClick={() => navigate(`/auction/${group.auctionId}`)}
              >
                {group.auctionTitle}
              </div>
              <div style={styles.auctionMeta}>
                {isEnded ? "Giá cuối:" : "Giá hiện tại:"}{" "}
                <strong style={{ color: "#e53935" }}>
                  {group.auctionCurrentPrice?.toLocaleString("vi-VN")} VNĐ
                </strong>
              </div>
              <div style={styles.auctionMeta}>
                {isEnded ? "Kết thúc lúc:" : "Kết thúc:"}{" "}
                {new Date(group.auctionEndTime).toLocaleString("vi-VN")}
              </div>
            </div>
          </div>
          <span style={{
            ...styles.statusBadge,
            color: s.color,
            backgroundColor: s.bg,
          }}>
            {s.label}
          </span>
        </div>

        {/* Bid list */}
        <div style={styles.bidList}>
          <div style={styles.bidListTitle}>
            Các lượt đặt giá của bạn ({group.bids.length})
          </div>
          {sortedBids.map((bid, idx) => (
            <div key={bid.id} style={styles.bidRow}>
              <span style={styles.bidIndex}>#{group.bids.length - idx}</span>
              <span style={styles.bidAmt}>
                {bid.amount?.toLocaleString("vi-VN")} VNĐ
              </span>
              <span style={styles.bidTime}>
                {new Date(bid.bidTime).toLocaleString("vi-VN")}
              </span>
              {idx === 0 && !isEnded && (
                <span style={styles.latestBadge}>Giá mới nhất</span>
              )}
            </div>
          ))}
        </div>

        {/* Kết quả khi ENDED */}
        {isEnded && (
          <div style={{
            ...styles.resultBanner,
            backgroundColor: iWon ? "#e8f5e9" : group.winnerId ? "#fce4ec" : "#fafafa",
            borderTop: `3px solid ${iWon ? "#43a047" : group.winnerId ? "#e53935" : "#e0e0e0"}`,
          }}>
            {iWon ? (
              <span style={{ color: "#2e7d32", fontWeight: 700 }}>
                <Trophy size={15} style={{ verticalAlign: "middle", marginRight: 5 }} />Bạn đã thắng phiên đấu giá này!
              </span>
            ) : group.winnerId ? (
              <span style={{ color: "#c62828" }}>
                <Frown size={15} style={{ verticalAlign: "middle", marginRight: 5 }} />Người thắng: <strong>{group.winnerName}</strong> — Bạn chưa thắng lần này
              </span>
            ) : (
              <span style={{ color: "#757575" }}>
                Phiên đấu giá kết thúc — Không có người thắng
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <Header />
      <div style={styles.container}>
        <h2 style={styles.title}>Lịch sử đặt giá của tôi</h2>

        {groups.length === 0 ? (
          <div style={styles.emptyBox}>
            <p style={styles.emptyText}>Bạn chưa tham gia đấu giá nào</p>
            <button style={styles.browseBtn} onClick={() => navigate("/")}>
              Xem sản phẩm đấu giá
            </button>
          </div>
        ) : (
          <>
            {/* Đang diễn ra */}
            {activeGroups.length > 0 && (
              <div>
                <h3 style={styles.sectionTitle}><Flame size={16} style={{ verticalAlign: "middle", marginRight: 5 }} />Đang đặt giá ({activeGroups.length})</h3>
                {activeGroups.map(renderGroup)}
              </div>
            )}

            {/* Đã kết thúc */}
            {endedGroups.length > 0 && (
              <div>
                <h3 style={styles.sectionTitle}><ClipboardList size={16} style={{ verticalAlign: "middle", marginRight: 5 }} />Phiên đã kết thúc ({endedGroups.length})</h3>
                {endedGroups.map(renderGroup)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyBids;

const styles = {
  page: { background: "#f5f5f5", minHeight: "100vh", paddingBottom: 40 },

  container: {
    maxWidth: "860px", margin: "30px auto",
    padding: "0 20px", display: "flex",
    flexDirection: "column", gap: "16px",
  },

  title: { fontSize: "24px", fontWeight: "700", margin: 0 },

  sectionTitle: {
    fontSize: "15px", fontWeight: "700",
    color: "#555", margin: "8px 0 12px",
    paddingBottom: "8px", borderBottom: "2px solid #f0f0f0",
  },

  card: {
    background: "#fff", borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
    overflow: "hidden",
  },

  cardHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", padding: "16px 20px", gap: "16px",
  },

  cardLeft: { display: "flex", gap: "14px", alignItems: "flex-start", flex: 1 },

  thumb: { width: 72, height: 72, objectFit: "cover", borderRadius: 8, flexShrink: 0 },

  auctionTitle: {
    fontSize: "16px", fontWeight: "600", cursor: "pointer",
    color: "#333", marginBottom: "4px",
  },

  auctionMeta: { fontSize: "13px", color: "#666", marginTop: "2px" },

  statusBadge: {
    padding: "4px 12px", borderRadius: 20,
    fontSize: 12, fontWeight: 700, flexShrink: 0,
  },

  bidList: {
    borderTop: "1px solid #f0f0f0",
    padding: "12px 20px", backgroundColor: "#fafafa",
  },

  bidListTitle: { fontSize: "13px", fontWeight: "600", color: "#888", marginBottom: "8px" },

  bidRow: {
    display: "flex", alignItems: "center", gap: "16px",
    padding: "6px 0", borderBottom: "1px solid #efefef", fontSize: "14px",
  },

  bidIndex: { color: "#bbb", fontSize: "12px", width: "30px" },

  bidAmt: { fontWeight: "600", color: "#e53935", flex: 1 },

  bidTime: { color: "#999", fontSize: "12px" },

  latestBadge: {
    backgroundColor: "#e3f2fd", color: "#1976d2",
    fontSize: "11px", padding: "2px 8px",
    borderRadius: "10px", fontWeight: 600,
  },

  resultBanner: { padding: "12px 20px", fontSize: "14px" },

  emptyBox: {
    textAlign: "center", padding: "60px 20px",
    background: "#fff", borderRadius: "12px",
  },

  emptyText: { color: "#999", fontSize: "16px", marginBottom: "16px" },

  browseBtn: {
    padding: "10px 24px", background: "#ff5722", color: "#fff",
    border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold",
  },
};