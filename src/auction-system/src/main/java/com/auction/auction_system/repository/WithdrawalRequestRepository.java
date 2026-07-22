package com.auction.auction_system.repository;

import com.auction.auction_system.entity.User;
import com.auction.auction_system.entity.WithdrawalRequest;
import com.auction.auction_system.entity.WithdrawalStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, Long> {
    List<WithdrawalRequest> findByUserOrderByCreatedAtDesc(User user);
    List<WithdrawalRequest> findByStatusOrderByCreatedAtDesc(WithdrawalStatus status);
    List<WithdrawalRequest> findAllByOrderByCreatedAtDesc();
}