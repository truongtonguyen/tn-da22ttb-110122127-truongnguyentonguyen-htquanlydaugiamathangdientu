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

    // ✅ Hoa hồng 5% trên finalPrice — tính khi PAID
    private Double commissionFee;

    // ✅ Số tiền người bán thực nhận = finalPrice - commissionFee
    private Double sellerReceives;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    private LocalDateTime createdAt;

    // Phương thức thanh toán: BANK_TRANSFER, MOMO, COD
    private String paymentMethod;

    // Ghi chú của người mua khi xác nhận đã chuyển khoản
    private String paymentNote;

    // Thời điểm người mua xác nhận đã thanh toán
    private LocalDateTime confirmedAt;

    // Thời điểm admin xác nhận và chuyển sang SHIPPING
    private LocalDateTime shippedAt;

    // Thời điểm hoàn thành
    private LocalDateTime completedAt;
}