import React, { useState, useEffect } from "react";
import { searchAuctions, getAllAuctions } from "../api/auctionApi";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import NotificationBell from "./NotificationBell";
import { Search, Settings, UserCircle2, ArrowDownToLine } from "lucide-react";

const Header = ({ setAuctions = null }) => {
  const [keyword, setKeyword] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isAdmin = userRole === "ADMIN";
  const isUser = userRole === "USER";

  useEffect(() => {
    if (token) fetchUserProfile();
    else { setUser(null); setUserRole(null); }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await axiosClient.get("/users/profile");
      setUser(response.data);
      setUserRole(response.data.role);
    } catch (err) { console.error(err); }
  };

  const handleSearch = async () => {
    try {
      const res = await searchAuctions(keyword, null);
      if (setAuctions) setAuctions(res.data.content);
    } catch (err) { console.log(err); }
  };

  const handleReset = async () => {
    navigate("/");
    if (!setAuctions) return;
    try {
      const res = await getAllAuctions();
      setAuctions(res.data.content);
      setKeyword("");
    } catch (err) { console.log(err); }
  };

  return (
    <div style={styles.header}>
      {/* LOGO */}
      <div style={styles.logo} onClick={handleReset}>Auction</div>

      {/* SEARCH */}
      {!isAdmin && (
        <>
          <input
            style={styles.input}
            placeholder="Tìm phiên đấu giá..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
          <button onClick={handleSearch} style={styles.searchBtn}>
            <Search size={15} style={{ verticalAlign: "middle", marginRight: 4 }} />Tìm
          </button>
        </>
      )}

      {/* MENU */}
      <div style={styles.menu}>
        {!isAdmin && (
          <span style={styles.link} onClick={() => navigate("/terms")}>Điều khoản</span>
        )}

        {isUser && (
          <>
            <span style={styles.link} onClick={() => navigate("/create")}>Đăng bán</span>
            <span style={styles.link} onClick={() => navigate("/my-auctions")}>Phiên đấu giá của tôi</span>
            <span style={styles.link} onClick={() => navigate("/my-bids")}>Lịch sử đặt giá</span>
            <span style={styles.link} onClick={() => navigate("/wallet")}>
              Ví
            </span>
          </>
        )}

        {isAdmin && (
          <>
            <span style={styles.adminBtn} onClick={() => navigate("/admin")}>
              <Settings size={15} style={{ verticalAlign: "middle", marginRight: 5 }} />Quản Trị
            </span>
          </>
        )}

        {!token ? (
          <>
            <span style={styles.link} onClick={() => navigate("/login")}>Đăng nhập</span>
            <span style={styles.link} onClick={() => navigate("/register")}>Đăng ký</span>
          </>
        ) : (
          <div style={styles.userGroup}>
            <span style={styles.userBtn} onClick={() => navigate("/profile")} title="Xem hồ sơ cá nhân">
              <UserCircle2 size={18} style={{ verticalAlign: "middle", marginRight: 5 }} />
              {user?.username || "Tài khoản"}
            </span>
            <span style={styles.divider}>|</span>
            <NotificationBell userId={user?.id} whiteIcon />
            <span style={styles.link} onClick={() => { localStorage.removeItem("token"); navigate("/"); window.location.reload(); }}>
              Đăng xuất
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;

const styles = {
  header:    { display: "flex", alignItems: "center", gap: "12px", padding: "12px 24px", backgroundColor: "#ff5722", position: "sticky", top: 0, zIndex: 1000 },
  logo:      { fontSize: "24px", fontWeight: "bold", color: "white", cursor: "pointer", marginRight: "10px", flexShrink: 0 },
  input:     { flex: 1, maxWidth: "420px", padding: "10px 16px", borderRadius: "8px", border: "none", outline: "none", fontSize: "14px" },
  searchBtn: { padding: "10px 16px", backgroundColor: "#2196f3", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", flexShrink: 0 },
  menu:      { display: "flex", alignItems: "center", gap: "18px", marginLeft: "auto", flexShrink: 0 },
  link:      { color: "white", cursor: "pointer", fontWeight: "500", fontSize: "15px", whiteSpace: "nowrap" },
  userBtn:   { color: "white", cursor: "pointer", fontWeight: "600", fontSize: "14px", whiteSpace: "nowrap", display: "flex", alignItems: "center", padding: "4px 10px", borderRadius: "20px", backgroundColor: "rgba(255,255,255,0.15)" },
  userGroup: { display: "flex", alignItems: "center", gap: "12px", paddingLeft: "12px", borderLeft: "1px solid rgba(255,255,255,0.3)" },
  divider:   { color: "rgba(255,255,255,0.3)", fontSize: "16px" },
  adminBtn:  { color: "white", cursor: "pointer", fontWeight: "600", fontSize: "15px", backgroundColor: "#d32f2f", padding: "6px 14px", borderRadius: "6px", whiteSpace: "nowrap" },
};