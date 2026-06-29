package com.auction.auction_system.repository;

import com.auction.auction_system.entity.Auction;
import com.auction.auction_system.entity.Order;
import com.auction.auction_system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByBuyerOrderByCreatedAtDesc(User buyer);

    List<Order> findAllByOrderByCreatedAtDesc();

    // ✅ Thêm method này — AuctionSchedulerService và AuctionService dùng
    boolean existsByAuction(Auction auction);

    // ✅ Lấy đơn hàng theo người bán
    @Query("SELECT o FROM Order o WHERE o.auction.seller = :seller ORDER BY o.createdAt DESC")
    List<Order> findBySellerOrderByCreatedAtDesc(@Param("seller") User seller);
}