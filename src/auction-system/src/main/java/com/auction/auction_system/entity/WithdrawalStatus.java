package com.auction.auction_system.entity;

public enum WithdrawalStatus {
    PENDING,      // Đang xử lý (giả lập)
    COMPLETED,    // Đã chuyển khoản thành công (giả lập)
    REJECTED      // Thất bại, đã hoàn tiền lại ví
}