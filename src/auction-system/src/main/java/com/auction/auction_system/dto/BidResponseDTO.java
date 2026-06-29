package com.auction.auction_system.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class BidResponseDTO {

    private Long id;
    private Double amount;
    private LocalDateTime bidTime;

    // bidder info
    private Long bidderId;
    private String bidderName;

    // auction info — đủ để hiển thị trong MyBids
    private Long auctionId;
    private String auctionTitle;
    private String auctionStatus;
    private Double auctionCurrentPrice;
    private LocalDateTime auctionEndTime;
    private List<String> auctionImages; // chỉ lấy imageUrl, không cần object đầy đủ

    // winner info (chỉ hiện khi ENDED)
    private Long winnerId;
    private String winnerName;
}