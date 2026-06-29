package com.auction.auction_system.repository;

import com.auction.auction_system.entity.AuctionImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuctionImageRepository
        extends JpaRepository<AuctionImage, Long> {
}