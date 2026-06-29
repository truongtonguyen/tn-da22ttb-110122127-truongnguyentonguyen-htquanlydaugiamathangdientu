package com.auction.auction_system.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Người báo cáo
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id")
    private User reporter;

    // Người bị báo cáo
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_user_id")
    private User reportedUser;

    // Auction liên quan (tuỳ chọn)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id")
    private Auction auction;

    // Lý do
    @Enumerated(EnumType.STRING)
    private ReportReason reason;

    // Mô tả thêm
    @Column(length = 1000)
    private String description;

    // Trạng thái xử lý
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ReportStatus status = ReportStatus.PENDING;

    // Ghi chú của admin khi xử lý
    private String adminNote;

    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}