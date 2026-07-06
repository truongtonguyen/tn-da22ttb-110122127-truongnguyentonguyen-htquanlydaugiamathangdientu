package com.auction.auction_system.entity;

public enum AuctionStatus {
    PENDING_APPROVAL, //Chờ admin duyệt
    UPCOMING, //Sắp diễn ra
    ACTIVE, //Đang diễn ra
    SOLD, //Đã bán (đấu giá thành công)
    FAILED, //Đấu giá thất bại (không đạt giá mong muốn)
    REJECTED // Admin từ chối
}