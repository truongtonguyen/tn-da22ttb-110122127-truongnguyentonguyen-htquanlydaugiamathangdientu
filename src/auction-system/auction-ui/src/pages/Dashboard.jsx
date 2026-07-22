import React from "react";
import Header from "../components/Header";

const Dashboard = () => {

  // demo data
  const stats = {
    totalAuctions: 12,
    activeAuctions: 5,
    soldAuctions: 2,
    failedAuctions: 1,
  };

  return (
    <div style={styles.page}>

      <Header />

      <div style={styles.container}>

        <h2 style={styles.title}>
          Dashboard
        </h2>

        {/* STATS */}
        <div style={styles.grid}>

          <div style={styles.card}>
            <p style={styles.label}>
              Tổng sản phẩm
            </p>

            <h3 style={styles.value}>
              {stats.totalAuctions}
            </h3>
          </div>

          <div style={styles.card}>
            <p style={styles.label}>
              Đang đấu giá
            </p>

            <h3 style={styles.value}>
              {stats.activeAuctions}
            </h3>
          </div>

          <div style={styles.card}>
            <p style={styles.label}>
              Đã thắng
            </p>

            <h3 style={styles.value}>
              {stats.soldAuctions}
            </h3>
          </div>

          <div style={styles.card}>
            <p style={styles.label}>
              Thất bại
            </p>

            <h3 style={styles.value}>
              {stats.failedAuctions}
            </h3>
          </div>

        </div>

        {/* QUICK ACTION */}
        <div style={styles.section}>

          <h3 style={styles.sectionTitle}>
            Thao tác nhanh
          </h3>

          <div style={styles.actions}>

            <button style={styles.button}>
              Tạo đấu giá
            </button>

            <button style={styles.button}>
              Xem sản phẩm của tôi
            </button>

            <button style={styles.button}>
              Hồ sơ cá nhân
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;

const styles = {

  page: {
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
  },

  container: {
    padding: "30px",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  title: {
    fontSize: "30px",
    marginBottom: "30px",
    color: "#333",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },

  card: {
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "14px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },

  label: {
    color: "#777",
    marginBottom: "10px",
    fontSize: "15px",
  },

  value: {
    fontSize: "28px",
    color: "#ff5722",
    margin: 0,
  },

  section: {
    marginTop: "40px",
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "14px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },

  sectionTitle: {
    marginBottom: "20px",
    color: "#333",
  },

  actions: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
  },

  button: {
    padding: "12px 20px",
    border: "none",
    backgroundColor: "#ff5722",
    color: "white",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};