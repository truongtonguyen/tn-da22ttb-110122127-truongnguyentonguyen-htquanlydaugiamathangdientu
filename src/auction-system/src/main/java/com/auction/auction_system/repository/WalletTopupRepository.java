package com.auction.auction_system.repository;

import com.auction.auction_system.entity.User;
import com.auction.auction_system.entity.WalletTopupRequest;
import com.auction.auction_system.entity.WalletTopupStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WalletTopupRepository extends JpaRepository<WalletTopupRequest, Long> {
    List<WalletTopupRequest> findByUserOrderByCreatedAtDesc(User user);
    List<WalletTopupRequest> findByStatusOrderByCreatedAtDesc(WalletTopupStatus status);
    List<WalletTopupRequest> findAllByOrderByCreatedAtDesc();
    Optional<WalletTopupRequest> findByVnpTxnRef(String vnpTxnRef);
}