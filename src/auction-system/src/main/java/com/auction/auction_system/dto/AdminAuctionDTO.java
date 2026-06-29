package com.auction.auction_system.dto;

import com.auction.auction_system.entity.AuctionStatus;

public class AdminAuctionDTO {
    private Long id;
    private String title;
    private String description;
    private Double startingPrice;
    private Double currentPrice;
    private Double buyNowPrice;   // null nếu người dùng không thiết lập
    private Double reservePrice;
    private AuctionStatus status;
    private String sellerName;
    private String sellerEmail;
    private String categoryName;
    private java.time.LocalDateTime startTime;
    private java.time.LocalDateTime endTime;
    private String imageUrl;

    public AdminAuctionDTO() {}

    public AdminAuctionDTO(
            Long id,
            String title,
            String description,
            Double startingPrice,
            Double currentPrice,
            Double buyNowPrice,
            Double reservePrice,
            AuctionStatus status,
            String sellerName,
            String sellerEmail,
            String categoryName,
            java.time.LocalDateTime startTime,
            java.time.LocalDateTime endTime,
            String imageUrl
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.startingPrice = startingPrice;
        this.currentPrice = currentPrice;
        this.buyNowPrice = buyNowPrice;
        this.reservePrice = reservePrice;
        this.status = status;
        this.sellerName = sellerName;
        this.sellerEmail = sellerEmail;
        this.categoryName = categoryName;
        this.startTime = startTime;
        this.endTime = endTime;
        this.imageUrl = imageUrl;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Double getStartingPrice() { return startingPrice; }
    public void setStartingPrice(Double startingPrice) { this.startingPrice = startingPrice; }

    public Double getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(Double currentPrice) { this.currentPrice = currentPrice; }

    public Double getBuyNowPrice() { return buyNowPrice; }
    public void setBuyNowPrice(Double buyNowPrice) { this.buyNowPrice = buyNowPrice; }

    public Double getReservePrice() { return reservePrice; }
    public void setReservePrice(Double reservePrice) { this.reservePrice = reservePrice; }

    public AuctionStatus getStatus() { return status; }
    public void setStatus(AuctionStatus status) { this.status = status; }

    public String getSellerName() { return sellerName; }
    public void setSellerName(String sellerName) { this.sellerName = sellerName; }

    public String getSellerEmail() { return sellerEmail; }
    public void setSellerEmail(String sellerEmail) { this.sellerEmail = sellerEmail; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public java.time.LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(java.time.LocalDateTime startTime) { this.startTime = startTime; }

    public java.time.LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(java.time.LocalDateTime endTime) { this.endTime = endTime; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}