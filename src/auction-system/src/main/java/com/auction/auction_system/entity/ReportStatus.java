package com.auction.auction_system.entity;

public enum ReportStatus {
    PENDING,   // Chờ admin xử lý
    BANNED,    // Đã ban người bị báo cáo
    DISMISSED  // Bỏ qua / không vi phạm
}