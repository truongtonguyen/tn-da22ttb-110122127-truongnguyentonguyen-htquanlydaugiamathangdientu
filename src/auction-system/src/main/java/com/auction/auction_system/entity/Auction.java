package com.auction.auction_system.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

import java.util.List;

@Entity
@Table(name = "auctions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Auction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // tiêu đề sản phẩm
    private String title;

    // mô tả sản phẩm
    @Column(length = 2000)
    private String description;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    // giá khởi điểm
    private Double startingPrice;

    // giá mua ngay
    private Double buyNowPrice;

    // giá hiện tại
    private Double currentPrice;

    // giá cao nhất
    private Double highestBid;

    // thời gian bắt đầu
    private LocalDateTime startTime;

    // thời gian kết thúc
    private LocalDateTime endTime;

    @OneToMany(mappedBy = "auction")
    @JsonManagedReference
    private List<AuctionImage> images;

    // người đăng bán
    @ManyToOne
    @JoinColumn(name = "seller_id")
    private User seller;

    // người đang thắng đấu giá
    @ManyToOne
    @JoinColumn(name = "highest_bidder_id")
    private User highestBidder;

    // trạng thái auction
    @Enumerated(EnumType.STRING)
    private AuctionStatus status;

    private Double bidIncrementStep;

    @Version
    private Long version;

    @ManyToOne
    @JoinColumn(name = "winner_id")
    private User winner;

    private Double reservePrice;
}