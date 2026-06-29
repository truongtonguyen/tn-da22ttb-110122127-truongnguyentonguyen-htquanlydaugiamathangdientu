package com.auction.auction_system.dto;

import com.auction.auction_system.entity.AuctionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AuctionResponseDTO {

    private Long id;
    private int bidCount;

    private String title;
    private String description;

    private Double startingPrice;
    private Double currentPrice;

    private Double highestBid;
    private String highestBidderName;
    private Long highestBidderId;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private AuctionStatus status;

    private Long sellerId;
    private String sellerName;
}