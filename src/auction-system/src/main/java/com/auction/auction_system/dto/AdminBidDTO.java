package com.auction.auction_system.dto;

import java.time.LocalDateTime;

public record AdminBidDTO(
        Long id,
        Long auctionId,
        String auctionTitle,
        Long bidderId,
        String bidderName,
        String bidderEmail,
        Double amount,
        LocalDateTime bidTime,
        String ipAddress,
        boolean suspiciousSellerIp,      // IP trùng với seller của phiên đó
        boolean suspiciousMultiAccount   // IP trùng với 1 bidder khác trong cùng phiên
) {}