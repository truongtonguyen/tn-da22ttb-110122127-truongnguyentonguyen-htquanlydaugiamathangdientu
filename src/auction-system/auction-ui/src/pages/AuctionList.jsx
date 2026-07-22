import React, { useEffect, useState, useMemo } from "react";
import { getAllAuctions, getAllCategories } from "../api/auctionApi";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import { AuctionGridSkeleton } from "../components/Skeleton";
import { Home } from "lucide-react";

const AuctionList = () => {
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [endingSoon, setEndingSoon] = useState(false);
  const [hasBid, setHasBid] = useState(false);
  const [categories, setCategories] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  // selectedCategory luôn khớp với URL — không dùng state riêng
  // tránh race condition giữa useState khởi tạo và useEffect đọc URL
  const selectedCategory = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get("categoryId");
    return cat ? Number(cat) : null;
  }, [location.search]);

  // Đổi category: chỉ cần navigate — selectedCategory tự tính từ URL
  const handleCategoryChange = (catId) => {
    setPage(0);
    if (catId === null) {
      navigate("/");
    } else {
      navigate(`/?categoryId=${catId}`);
    }
  };

  // Load danh mục 1 lần
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getAllCategories();
        setCategories(res.data);
      } catch (err) {
        console.log("Lỗi load categories:", err);
      }
    };
    loadCategories();
  }, []);

  // Scroll khi có categoryId trong URL
  useEffect(() => {
    if (selectedCategory !== null) {
      setTimeout(() => {
        document.getElementById("auction-grid-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [selectedCategory]);

  // Load auction khi page hoặc category thay đổi
  useEffect(() => {
    const loadAuctions = async () => {
      setLoading(true);
      try {
        const res = await getAllAuctions(page, 12, selectedCategory);
        setAuctions(res.data.content);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    loadAuctions();
  }, [page, selectedCategory]);

  const renderStatus = (status) => {
    const map = {
      ACTIVE:           "Đang diễn ra",
      UPCOMING:         "Sắp diễn ra",
      SOLD:             "Đã bán",
      FAILED:           "Không thành",
      PENDING_APPROVAL: "Chờ duyệt",
      REJECTED:         "Đã từ chối",
    };
    return map[status] || status;
  };

  // Các filter phụ (giá, trạng thái, có bid) vẫn áp client-side
  let filteredAuctions = Array.isArray(auctions) ? [...auctions] : [];

  if (priceFrom)  filteredAuctions = filteredAuctions.filter(a => (a.currentPrice || 0) >= Number(priceFrom));
  if (priceTo)    filteredAuctions = filteredAuctions.filter(a => (a.currentPrice || 0) <= Number(priceTo));
  if (onlyActive) filteredAuctions = filteredAuctions.filter(a => a.status === "ACTIVE");
  if (hasBid)     filteredAuctions = filteredAuctions.filter(a => (a.bidCount || 0) > 0);

  // Phiên đang hoạt động lên trước, kết thúc xuống sau
  const activeAuctions = filteredAuctions.filter(a => ["ACTIVE", "UPCOMING"].includes(a.status));
  const otherAuctions  = filteredAuctions.filter(a => !["ACTIVE", "UPCOMING"].includes(a.status));

  if (endingSoon) {
    activeAuctions.sort((a, b) => new Date(a.endTime) - new Date(b.endTime));
  }

  otherAuctions.sort((a, b) => {
    const order = { SOLD: 0, FAILED: 1, REJECTED: 2, PENDING_APPROVAL: 3 };
    return (order[a.status] ?? 4) - (order[b.status] ?? 4);
  });

  filteredAuctions = [...activeAuctions, ...otherAuctions];

  const activeCategoryName = selectedCategory !== null
    ? categories.find(c => c.id === selectedCategory)?.name
    : null;

  return (
    <div style={styles.page}>
      <Header setAuctions={setAuctions} />

      <div style={styles.titleSection}>
        <h2 style={styles.title}>Sàn đấu giá</h2>
      </div>

      <div style={styles.bodyLayout}>

        {/* Sidebar danh mục */}
        <aside style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Danh mục</h3>
          <ul style={styles.categoryList}>
            <li
              style={{ ...styles.categoryItem, ...(selectedCategory === null ? styles.categoryItemActive : {}) }}
              onClick={() => handleCategoryChange(null)}
            >
              <Home size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Tất cả
            </li>
            {categories.map((cat) => (
              <li
                key={cat.id}
                style={{ ...styles.categoryItem, ...(selectedCategory === cat.id ? styles.categoryItemActive : {}) }}
                onClick={() => handleCategoryChange(cat.id)}
              >
                {cat.name}
              </li>
            ))}
          </ul>
        </aside>

        <main style={styles.mainContent} id="auction-grid-section">
          {activeCategoryName && (
            <div style={styles.filterBanner}>
              <span>Đang lọc theo danh mục: <strong>{activeCategoryName}</strong></span>
              <span
                style={styles.clearFilterLink}
                onClick={() => handleCategoryChange(null)}
              >
                ✕ Bỏ lọc
              </span>
            </div>
          )}

          {/* Filter bar */}
          <div style={styles.filterBar}>
            <div style={styles.priceGroup}>
              <span style={styles.filterLabel}>Giá từ</span>
              <input type="number" placeholder="0" value={priceFrom} onChange={e => setPriceFrom(e.target.value)} style={styles.input} />
              <span style={styles.filterLabel}>Đến</span>
              <input type="number" placeholder="999999999" value={priceTo} onChange={e => setPriceTo(e.target.value)} style={styles.input} />
            </div>

            <div style={styles.checkboxGroup}>
              <label style={styles.checkbox}>
                <input type="checkbox" checked={onlyActive} onChange={e => setOnlyActive(e.target.checked)} />Đang diễn ra
              </label>
              <label style={styles.checkbox}>
                <input type="checkbox" checked={endingSoon} onChange={e => setEndingSoon(e.target.checked)} />Sắp kết thúc
              </label>
              <label style={styles.checkbox}>
                <input type="checkbox" checked={hasBid} onChange={e => setHasBid(e.target.checked)} />Có người trả giá
              </label>
            </div>
          </div>

          {loading ? (
            <AuctionGridSkeleton count={8} />
          ) : filteredAuctions.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{ color: "#999", margin: 0 }}>
                {activeCategoryName
                  ? `Không có sản phẩm nào trong danh mục "${activeCategoryName}"`
                  : "Không có sản phẩm nào phù hợp"}
              </p>
            </div>
          ) : (
            <div style={styles.grid}>
              {filteredAuctions.map((auction) => {
                const isFinished = !["ACTIVE", "UPCOMING"].includes(auction.status);
                return (
                  <div key={auction.id} style={{ ...styles.card, opacity: isFinished ? 0.65 : 1 }}>
                    <div style={{ position: "relative" }}>
                      <img
                        src={auction.images?.length > 0
                          ? `http://localhost:8080/api/auctions/uploads/${auction.images[0].imageUrl}`
                          : "https://via.placeholder.com/300x220?text=Khong+co+anh"}
                        alt={auction.title}
                        style={{ ...styles.image, filter: isFinished ? "grayscale(60%)" : "none" }}
                      />
                      {isFinished && (
                        <div style={styles.endedOverlay}>
                          {renderStatus(auction.status)}
                        </div>
                      )}
                    </div>
                    <div style={styles.cardContent}>
                      <h3 style={styles.productName}>{auction.title}</h3>
                      <p style={styles.price}>{auction.currentPrice?.toLocaleString("vi-VN")} VNĐ</p>
                      <div style={styles.infoRow}>
                        <span>Trạng thái:</span>
                        <span style={{ ...styles.status, color: isFinished ? "#9e9e9e" : "#2196f3" }}>
                          {renderStatus(auction.status)}
                        </span>
                      </div>
                      <div style={styles.infoRow}>
                        <span>Kết thúc:</span>
                        <span>{new Date(auction.endTime).toLocaleString("vi-VN")}</span>
                      </div>
                      <button
                        style={{ ...styles.detailBtn, background: isFinished ? "#9e9e9e" : "#ff5722" }}
                        onClick={() => navigate(`/auction/${auction.id}`)}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={styles.pagination}>
            <button disabled={page === 0} onClick={() => setPage(page - 1)}>← Trước</button>
            <span>Trang {page + 1} / {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Sau →</button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuctionList;

const styles = {
  page: { background: "#f5f5f5", minHeight: "100vh", paddingBottom: "30px" },

  titleSection: { textAlign: "center", padding: "24px 20px 0" },
  title: { fontSize: "28px", fontWeight: "bold", margin: 0 },

  bodyLayout: {
    display: "flex",
    maxWidth: "1600px",
    margin: "0 auto",
    padding: "20px 20px 24px",
    gap: "24px",
    alignItems: "flex-start",
  },

  sidebar: {
    width: "220px",
    flexShrink: 0,
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    padding: "20px 0",
    position: "sticky",
    top: "16px",
    maxHeight: "calc(100vh - 32px)",
    overflowY: "auto",
  },

  sidebarTitle: { fontSize: "16px", fontWeight: "700", color: "#333", padding: "0 20px 12px", borderBottom: "2px solid #ff5722", marginBottom: "8px" },
  categoryList: { listStyle: "none", margin: 0, padding: 0 },
  categoryItem: { padding: "10px 20px", fontSize: "14px", fontWeight: "500", cursor: "pointer", color: "#555", borderLeft: "3px solid transparent", transition: "all 0.15s ease" },
  categoryItemActive: { backgroundColor: "#fff3f0", color: "#ff5722", borderLeft: "3px solid #ff5722", fontWeight: "700" },

  mainContent: { flex: 1, minWidth: 0 },

  filterBanner: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff3f0", border: "1px solid #ffccbc", borderRadius: "10px", padding: "10px 16px", marginBottom: "16px", fontSize: "14px", color: "#e64a19" },
  clearFilterLink: { cursor: "pointer", fontWeight: "600", color: "#e53935" },

  filterBar: {
    background: "#fff",
    padding: "16px 24px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "20px",
    position: "sticky",
    top: "16px",
    zIndex: 10,
  },

  priceGroup: { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
  filterLabel: { fontSize: "14px", color: "#555", whiteSpace: "nowrap" },
  input: { width: "110px", padding: "8px 10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px" },

  checkboxGroup: { display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" },
  checkbox: { display: "flex", alignItems: "center", gap: "8px", fontWeight: "500", fontSize: "14px", cursor: "pointer", whiteSpace: "nowrap" },

  emptyState: { textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" },
  card: { background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" },
  image: { width: "100%", height: "220px", objectFit: "cover" },
  endedOverlay: { position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },
  cardContent: { padding: "15px" },
  productName: { fontSize: "18px", minHeight: "50px" },
  price: { color: "#ee4d2d", fontWeight: "bold", fontSize: "24px" },
  infoRow: { display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "14px" },
  status: { color: "#2196f3", fontWeight: "bold" },
  detailBtn: { width: "100%", marginTop: "15px", padding: "10px", border: "none", borderRadius: "8px", background: "#ff5722", color: "#fff", cursor: "pointer", fontWeight: "bold" },
  pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginTop: "30px" },
};