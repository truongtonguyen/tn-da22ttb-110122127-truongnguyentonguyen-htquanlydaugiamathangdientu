import React from "react";

// CSS animation dùng chung — chỉ cần import 1 lần ở component cha hoặc tự chứa trong mỗi skeleton
const shimmerCSS = `
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .skeleton-box {
    background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
    background-size: 800px 100%;
    animation: shimmer 1.4s infinite linear;
    border-radius: 8px;
  }
`;

// Khung skeleton cơ bản — dùng để build các loại khác
export const SkeletonBox = ({ width = "100%", height = 16, style = {} }) => (
  <div className="skeleton-box" style={{ width, height, ...style }} />
);

// Skeleton cho card sản phẩm (dùng trong AuctionList, MyAuctions)
export const AuctionCardSkeleton = () => (
  <div style={cardStyles.card}>
    <style>{shimmerCSS}</style>
    <SkeletonBox height={200} style={{ borderRadius: "12px 12px 0 0" }} />
    <div style={cardStyles.content}>
      <SkeletonBox height={18} width="85%" style={{ marginBottom: 10 }} />
      <SkeletonBox height={26} width="60%" style={{ marginBottom: 14 }} />
      <SkeletonBox height={13} width="100%" style={{ marginBottom: 8 }} />
      <SkeletonBox height={13} width="70%" style={{ marginBottom: 14 }} />
      <SkeletonBox height={38} width="100%" />
    </div>
  </div>
);

// Grid nhiều card skeleton cùng lúc
export const AuctionGridSkeleton = ({ count = 8 }) => (
  <div style={cardStyles.grid}>
    {Array.from({ length: count }).map((_, i) => (
      <AuctionCardSkeleton key={i} />
    ))}
  </div>
);

// Skeleton cho trang chi tiết (AuctionDetail)
export const AuctionDetailSkeleton = () => (
  <div style={detailStyles.container}>
    <style>{shimmerCSS}</style>
    <div style={detailStyles.left}>
      <SkeletonBox height={360} style={{ borderRadius: 12, marginBottom: 20 }} />
      <SkeletonBox height={100} style={{ borderRadius: 12 }} />
    </div>
    <div style={detailStyles.right}>
      <SkeletonBox height={28} width="80%" style={{ marginBottom: 12 }} />
      <SkeletonBox height={20} width="40%" style={{ marginBottom: 20 }} />
      <SkeletonBox height={160} style={{ borderRadius: 12, marginBottom: 16 }} />
      <SkeletonBox height={140} style={{ borderRadius: 12, marginBottom: 16 }} />
      <SkeletonBox height={180} style={{ borderRadius: 12 }} />
    </div>
  </div>
);

// Skeleton cho dòng trong bảng (Admin, MyBids)
export const TableRowSkeleton = ({ columns = 5 }) => (
  <tr>
    <style>{shimmerCSS}</style>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} style={{ padding: "10px 12px" }}>
        <SkeletonBox height={14} width={i === 0 ? "40px" : "100%"} />
      </td>
    ))}
  </tr>
);

export const TableSkeleton = ({ rows = 5, columns = 5 }) => (
  <tbody>
    {Array.from({ length: rows }).map((_, i) => (
      <TableRowSkeleton key={i} columns={columns} />
    ))}
  </tbody>
);

// Skeleton cho list item đơn giản (MyBids card, NotificationBell)
export const ListItemSkeleton = () => (
  <div style={listStyles.item}>
    <style>{shimmerCSS}</style>
    <SkeletonBox width={72} height={72} style={{ borderRadius: 8, flexShrink: 0 }} />
    <div style={{ flex: 1 }}>
      <SkeletonBox height={16} width="70%" style={{ marginBottom: 8 }} />
      <SkeletonBox height={13} width="40%" style={{ marginBottom: 6 }} />
      <SkeletonBox height={13} width="50%" />
    </div>
  </div>
);

const cardStyles = {
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },
  content: { padding: 15 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 20,
  },
};

const detailStyles = {
  container: {
    maxWidth: "1200px",
    margin: "30px auto",
    padding: "0 20px",
    display: "flex",
    gap: 28,
  },
  left: { flex: "0 0 45%" },
  right: { flex: 1 },
};

const listStyles = {
  item: {
    display: "flex",
    gap: 14,
    padding: "16px 20px",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
    marginBottom: 12,
  },
};