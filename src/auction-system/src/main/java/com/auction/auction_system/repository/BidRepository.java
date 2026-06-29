package com.auction.auction_system.repository;

import com.auction.auction_system.entity.Bid;
import com.auction.auction_system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BidRepository extends JpaRepository<Bid, Long> {

    List<Bid> findByAuctionIdOrderByBidTimeDesc(Long auctionId);

    List<Bid> findByBidderOrderByBidTimeDesc(User bidder);

    boolean existsByAuctionIdAndBidderId(Long auctionId, Long bidderId);

}