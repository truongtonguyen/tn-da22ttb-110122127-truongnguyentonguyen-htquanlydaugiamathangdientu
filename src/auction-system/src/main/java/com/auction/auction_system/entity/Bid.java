package com.auction.auction_system.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "bids",
    indexes = {
        @Index(name = "idx_bid_auction", columnList = "auction_id"),
        @Index(name = "idx_bid_bidder", columnList = "bidder_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Giá đặt
    @Column(nullable = false)
    private Double amount;

    // Thời gian đặt
    @Column(nullable = false)
    private LocalDateTime bidTime;

    // Quan hệ với Auction
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;

    // Quan hệ với User (người đặt giá)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidder_id", nullable = false)
    private User bidder;
}
