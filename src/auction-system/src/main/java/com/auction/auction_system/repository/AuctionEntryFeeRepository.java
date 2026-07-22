package com.auction.auction_system.repository;

import com.auction.auction_system.entity.AuctionEntryFee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AuctionEntryFeeRepository extends JpaRepository<AuctionEntryFee, Long> {
    boolean existsByAuctionIdAndBidderId(Long auctionId, Long bidderId);
    Optional<AuctionEntryFee> findByAuctionIdAndBidderId(Long auctionId, Long bidderId);
    List<AuctionEntryFee> findByAuctionIdAndRefundedFalse(Long auctionId);
}