package com.auction.auction_system.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "wallet_topup_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletTopupRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private User user;

    private Double amount;

    @Enumerated(EnumType.STRING)
    private WalletTopupStatus status;

    // Ghi chú của user khi xác nhận đã chuyển khoản
    private String note;

    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;

    private String vnpTxnRef;
}