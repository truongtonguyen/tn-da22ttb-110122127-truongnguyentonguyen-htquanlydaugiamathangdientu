package com.auction.auction_system.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderResponseDTO {
        private Long id;

    private Long auctionId;
    private String auctionTitle;

    private String buyerName;

    private Double finalPrice;

    private String status;
}
