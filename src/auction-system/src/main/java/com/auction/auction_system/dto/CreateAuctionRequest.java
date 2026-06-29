package com.auction.auction_system.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateAuctionRequest {
    private String title;
    private String description;
    private Long categoryId;
    private Double startingPrice;
    private Double buyNowPrice;
    private Integer durationDays;
    private Double reservePrice;
}