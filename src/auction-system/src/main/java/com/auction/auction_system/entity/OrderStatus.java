package com.auction.auction_system.entity;

public enum OrderStatus {
    PENDING,               // Chờ người mua chọn thanh toán
    PENDING_CONFIRMATION,  // Người mua đã gửi xác nhận, chờ admin duyệt
    SHIPPING,              // Admin đã xác nhận, đang giao hàng
    PAID,                  // Hoàn thành
    CANCELLED              // Đã hủy
}