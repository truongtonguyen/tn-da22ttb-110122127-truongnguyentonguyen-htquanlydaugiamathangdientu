package com.auction.auction_system.repository;

import com.auction.auction_system.entity.Auction;
import com.auction.auction_system.entity.AuctionStatus;
import com.auction.auction_system.entity.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface AuctionRepository extends JpaRepository<Auction, Long> {

    List<Auction> findBySeller(User seller);

    List<Auction> findByStatus(AuctionStatus status);

    List<Auction> findByStatusAndEndTimeBefore(AuctionStatus status, LocalDateTime now);

    @Query("""
        SELECT a FROM Auction a
        WHERE (:keyword IS NULL
               OR LOWER(a.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
        AND (:status IS NULL OR a.status = :status)
    """)
    Page<Auction> search(
            @Param("keyword") String keyword,
            @Param("status") AuctionStatus status,
            Pageable pageable
    );
}