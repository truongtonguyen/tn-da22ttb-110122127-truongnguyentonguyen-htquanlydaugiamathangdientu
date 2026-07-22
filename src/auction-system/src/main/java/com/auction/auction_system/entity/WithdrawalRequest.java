package com.auction.auction_system.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "withdrawal_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WithdrawalRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private User user;

    private Double amount;

    // Thông tin ngân hàng nhận tiền
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountName;

    @Enumerated(EnumType.STRING)
    private WithdrawalStatus status;

    // Ghi chú hệ thống (giả lập chuyển khoản thành công)
    private String adminNote;

    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
}