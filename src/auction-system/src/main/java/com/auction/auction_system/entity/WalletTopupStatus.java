package com.auction.auction_system.entity;

public enum WalletTopupStatus {
    PENDING,      // Chờ admin xác nhận
    APPROVED,     // Admin đã xác nhận, đã cộng tiền
    REJECTED      // Admin từ chối
}