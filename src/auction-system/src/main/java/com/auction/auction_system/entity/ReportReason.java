package com.auction.auction_system.entity;

public enum ReportReason {
    WRONG_DESCRIPTION,   // Hàng không đúng mô tả
    NO_RESPONSE,         // Người bán không phản hồi
    FRAUD,               // Gian lận / lừa đảo
    INAPPROPRIATE,       // Nội dung không phù hợp
    FAKE_PRODUCT,        // Hàng giả / nhái
    OTHER                // Khác
}