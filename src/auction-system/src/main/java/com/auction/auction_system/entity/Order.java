package com.auction.auction_system.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    private Auction auction;

    @ManyToOne
    private User buyer;

    private Double finalPrice;

    // Hoa hồng 5% trên finalPrice — tính khi PAID
    private Double commissionFee;

    // Số tiền người bán thực nhận = finalPrice - commissionFee
    private Double sellerReceives;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    private LocalDateTime createdAt;

    // Phương thức thanh toán: BANK_TRANSFER, MOMO, COD, WALLET, VNPAY
    private String paymentMethod;

    // Ghi chú của người mua khi xác nhận đã thanh toán
    private String paymentNote;

    // Thời điểm người mua xác nhận đã thanh toán
    private LocalDateTime confirmedAt;

    //Thời điểm người bán xác nhận giao hàng (bước 2)
    private LocalDateTime shippedAt;

    // Thời điểm người mua xác nhận đã nhận hàng
    private LocalDateTime completedAt;

    @Builder.Default
    private Boolean isOverdueCancel = false;

    // true nếu người bán đã bị ghi nhận vi phạm giao hàng trễ
    @Builder.Default
    private Boolean latePenaltyApplied = false;

    private String vnpTxnRef;
}