import React from "react";
import { useNavigate } from "react-router-dom";
import { Gavel } from "lucide-react";

const Footer = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer style={styles.footer}>
      <style>{`
        .footer-link:hover { color: #ff5722 !important; }
        @media (max-width: 768px) {
          .footer-container { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
      <div style={styles.container} className="footer-container">
        {/* Cột 1: Giới thiệu */}
        <div style={styles.col}>
          <div style={styles.logo}>
            <Gavel size={20} style={{ verticalAlign: "middle", marginRight: 6 }} /> Auction
          </div>
          <p style={styles.desc}>
            Nền tảng đấu giá trực tuyến uy tín, minh bạch — nơi bạn tìm thấy sản phẩm
            điện tử ưng ý với mức giá hợp lý nhất qua hình thức đấu giá công khai.
          </p>
          <p style={styles.desc}>
            Liên hệ: <a href="https://mail.google.com/mail/?view=cm&to=auctionsystemdatn@gmail.com"
            target="_blank"
            rel="noopener noreferrer"style={{ color: "#b8b8d4" }}>auctionsystemdatn@gmail.com</a>
          </p>
        </div>

        {/* Cột 2: Liên kết nhanh */}
        <div style={styles.col}>
          <h4 style={styles.colTitle}>Liên kết nhanh</h4>
          <span className="footer-link" style={styles.link} onClick={() => navigate("/")}>Sàn đấu giá</span>
          <span className="footer-link" style={styles.link} onClick={() => navigate("/create")}>Đăng bán</span>
          <span className="footer-link" style={styles.link} onClick={() => navigate("/my-auctions")}>Phiên đấu giá của tôi</span>
          <span className="footer-link" style={styles.link} onClick={() => navigate("/my-bids")}>Lịch sử đặt giá</span>
        </div>

        {/* Cột 3: Hỗ trợ */}
        <div style={styles.col}>
          <h4 style={styles.colTitle}>Hỗ trợ</h4>
          <span className="footer-link" style={styles.link} onClick={() => navigate("/profile")}>Hồ sơ cá nhân</span>
          <span className="footer-link" style={styles.link} onClick={() => navigate("/login")}>Đăng nhập</span>
          <span className="footer-link" style={styles.link} onClick={() => navigate("/register")}>Đăng ký tài khoản</span>
          <span className="footer-link" style={styles.link} onClick={() => navigate("/terms")}>Điều khoản & hướng dẫn</span>
        </div>

        {/* Cột 4: Cách thức hoạt động */}
        <div style={styles.col}>
          <h4 style={styles.colTitle}>Quy trình đấu giá</h4>
          <div style={styles.step}>1. Người bán đăng sản phẩm</div>
          <div style={styles.step}>2. Admin duyệt phiên đấu giá</div>
          <div style={styles.step}>3. Người mua đặt giá</div>
          <div style={styles.step}>4. Thanh toán & nhận hàng</div>
        </div>
      </div>

      <div style={styles.divider} />

      <div style={styles.bottom}>
        <span>© {year} Auction Platform — Đồ án tốt nghiệp</span>
        <span style={styles.bottomNote}>Sản phẩm minh họa, không sử dụng cho mục đích thương mại</span>
      </div>
    </footer>
  );
};

export default Footer;

const styles = {
  footer: {
    backgroundColor: "#1a1a2e",
    color: "#cfcfe0",
  },

  container: {
    maxWidth: "1300px",
    margin: "0 auto",
    padding: "40px 24px 24px",
    display: "grid",
    gridTemplateColumns: "1.6fr 1fr 1fr 1.2fr",
    gap: "32px",
  },

  col: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  logo: {
    fontSize: 20,
    fontWeight: 800,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },

  logoIcon: {
    fontSize: 20,
  },

  desc: {
    fontSize: 13,
    lineHeight: 1.7,
    color: "#9a9ab8",
    margin: 0,
    maxWidth: 320,
  },

  colTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    margin: "0 0 6px",
  },

  link: {
    fontSize: 13,
    color: "#b8b8d4",
    cursor: "pointer",
    transition: "color 0.15s",
  },

  step: {
    fontSize: 13,
    color: "#9a9ab8",
    lineHeight: 1.6,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    margin: "0 24px",
  },

  bottom: {
    maxWidth: "1300px",
    margin: "0 auto",
    padding: "18px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 12,
    color: "#7a7a9a",
    flexWrap: "wrap",
    gap: 8,
  },

  bottomNote: {
    color: "#5f5f80",
    fontStyle: "italic",
  },
};