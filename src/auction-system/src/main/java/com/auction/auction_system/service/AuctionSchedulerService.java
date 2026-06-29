package com.auction.auction_system.service;

import com.auction.auction_system.entity.*;
import com.auction.auction_system.repository.AuctionRepository;
import com.auction.auction_system.repository.OrderRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuctionSchedulerService {

    private final AuctionRepository auctionRepository;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public AuctionSchedulerService(
            AuctionRepository auctionRepository,
            OrderRepository orderRepository,
            NotificationService notificationService,
            EmailService emailService) {
        this.auctionRepository = auctionRepository;
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @Scheduled(fixedRate = 30000) // chạy mỗi 30 giây
    public void updateAuctionStatus() {
        LocalDateTime now = LocalDateTime.now();

        // =====================
        // UPCOMING → ACTIVE
        // =====================
        List<Auction> upcoming = auctionRepository.findByStatus(AuctionStatus.UPCOMING);
        for (Auction auction : upcoming) {
            if (now.isAfter(auction.getStartTime())) {
                auction.setStatus(AuctionStatus.ACTIVE);
                auctionRepository.save(auction);
                System.out.println("Activated auction: " + auction.getTitle());
            }
        }

        // =====================
        // ACTIVE → SOLD / FAILED
        // =====================
        List<Auction> expired = auctionRepository.findByStatusAndEndTimeBefore(
                AuctionStatus.ACTIVE, now
        );

        for (Auction auction : expired) {
            User winner = null;
            boolean reserveMet = auction.getReservePrice() == null
                    || auction.getCurrentPrice() >= auction.getReservePrice();

            if (auction.getHighestBidder() != null && reserveMet) {
                winner = auction.getHighestBidder();
                auction.setStatus(AuctionStatus.SOLD);
            } else {
                auction.setStatus(AuctionStatus.FAILED);
            }

            auction.setWinner(winner);
            auctionRepository.save(auction);

            // =====================
            // TẠO ORDER nếu có winner
            // =====================
            if (winner != null) {
                // Tránh tạo order trùng nếu scheduler chạy lại
                boolean orderExists = orderRepository.existsByAuction(auction);
                if (!orderExists) {
                    Order order = new Order();
                    order.setAuction(auction);
                    order.setBuyer(winner);
                    order.setFinalPrice(auction.getCurrentPrice());
                    order.setStatus(OrderStatus.PENDING);
                    order.setCreatedAt(LocalDateTime.now());
                    orderRepository.save(order);

                    System.out.println("Order created for auction: " + auction.getTitle()
                            + " | winner: " + winner.getEmail());

                    // Thông báo trong app cho người thắng
                    notificationService.sendWinnerNotification(
                            winner.getId(),
                            "Chúc mừng! Bạn đã thắng đấu giá: " + auction.getTitle()
                    );

                    // Thông báo trong app cho người bán
                    notificationService.sendAuctionEndedWinnerNotification(
                            auction.getSeller().getId(),
                            auction.getTitle()
                    );

                    // Gửi email cho người thắng
                    try {
                        emailService.sendWinnerNotification(
                                winner.getEmail(),
                                auction.getTitle(),
                                String.format("%,.0f", auction.getCurrentPrice())
                        );
                    } catch (Exception e) {
                        System.err.println("Failed to send winner email: " + e.getMessage());
                    }
                }
            } else {
                System.out.println("Auction ended with no winner: " + auction.getTitle());

                // Thông báo cho người bán biết phiên không đạt giá sàn
                notificationService.sendAuctionFailedNotification(
                        auction.getSeller().getId(),
                        auction.getTitle()
                );
            }
        }
    }
}