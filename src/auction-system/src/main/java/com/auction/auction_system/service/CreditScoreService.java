package com.auction.auction_system.service;

import com.auction.auction_system.entity.*;
import com.auction.auction_system.repository.AuctionRepository;
import com.auction.auction_system.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CreditScoreService {

    public static final int BAN_THRESHOLD = 50;

    private final OrderRepository orderRepository;
    private final AuctionRepository auctionRepository;

    public CreditScoreService(OrderRepository orderRepository, AuctionRepository auctionRepository) {
        this.orderRepository = orderRepository;
        this.auctionRepository = auctionRepository;
    }

    // ===== BUYER (giữ nguyên như trước) =====
    public BuyerCreditResult computeBuyerCredit(User buyer) {
        List<Order> orders = orderRepository.findByBuyerOrderByCreatedAtDesc(buyer);

        long paidOrders = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.PAID)
                .count();

        long manualCancelled = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.CANCELLED
                        && !Boolean.TRUE.equals(o.getIsOverdueCancel()))
                .count();

        long overdueCancelled = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.CANCELLED
                        && Boolean.TRUE.equals(o.getIsOverdueCancel()))
                .count();

        double weightedBad = manualCancelled * 1.0 + overdueCancelled * 3.0;
        double resolvedWeighted = paidOrders + weightedBad;

        double paymentRate = resolvedWeighted > 0
                ? (paidOrders / resolvedWeighted) * 100
                : 100;

        int scoreFromCompleted = (int) Math.min(paidOrders * 5, 70);
        int scoreFromRate = paymentRate >= 80 ? 30
                : paymentRate >= 60 ? 20
                : paymentRate >= 40 ? 10 : 0;

        int creditScore = Math.min(scoreFromCompleted + scoreFromRate, 100);

        String creditLevel = levelFromScore(creditScore);

        return new BuyerCreditResult(
                creditScore, creditLevel, Math.round(paymentRate),
                paidOrders, manualCancelled, overdueCancelled
        );
    }

    public boolean shouldAutoBan(User buyer) {
        return computeBuyerCredit(buyer).creditScore() < BAN_THRESHOLD;
    }

    // ===== SELLER (mới) =====
    public SellerCreditResult computeSellerCredit(User seller) {
        List<Auction> allAuctions = auctionRepository.findBySeller(seller);

        long totalAuctions = allAuctions.size();
        long completedAuctions = allAuctions.stream()
                .filter(a -> a.getStatus() == AuctionStatus.SOLD && a.getWinner() != null)
                .count();

        // Số đơn bị cảnh cáo vì trễ giao hàng
        List<Order> sellerOrders = allAuctions.stream()
                .flatMap(a -> orderRepository.findByAuction(a).stream())
                .toList();

        long lateShippingCount = sellerOrders.stream()
                .filter(o -> Boolean.TRUE.equals(o.getLatePenaltyApplied()))
                .count();

        double successRate = totalAuctions > 0
                ? (double) completedAuctions / totalAuctions * 100
                : 0;

        int scoreFromCompleted = (int) Math.min(completedAuctions * 5, 70);
        int scoreFromRate = successRate >= 80 ? 30
                : successRate >= 60 ? 20
                : successRate >= 40 ? 10 : 0;

        // ✅ Mỗi lần trễ giao hàng trừ thêm 10 điểm (ngoài công thức gốc)
        int latePenalty = (int) Math.min(lateShippingCount * 10, 50);

        int creditScore = Math.max(0, Math.min(scoreFromCompleted + scoreFromRate - latePenalty, 100));

        String creditLevel = levelFromScore(creditScore);

        return new SellerCreditResult(
                creditScore, creditLevel, Math.round(successRate),
                totalAuctions, completedAuctions, lateShippingCount
        );
    }

    public boolean shouldAutoBanSeller(User seller) {
        return computeSellerCredit(seller).creditScore() < BAN_THRESHOLD;
    }

    private String levelFromScore(int score) {
        return score >= 80 ? "Xuất sắc"
                : score >= 60 ? "Tốt"
                : score >= 40 ? "Khá"
                : score >= 20 ? "Trung bình"
                : "Mới";
    }

    public record BuyerCreditResult(
            int creditScore, String creditLevel, long paymentRate,
            long paidOrders, long manualCancelled, long overdueCancelled
    ) {}

    public record SellerCreditResult(
            int creditScore, String creditLevel, long successRate,
            long totalAuctions, long completedAuctions, long lateShippingCount
    ) {}
}