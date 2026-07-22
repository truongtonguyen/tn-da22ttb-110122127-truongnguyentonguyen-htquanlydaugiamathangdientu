package com.auction.auction_system.service;

import com.auction.auction_system.entity.*;
import com.auction.auction_system.repository.AuctionEntryFeeRepository;
import com.auction.auction_system.repository.AuctionRepository;
import com.auction.auction_system.repository.OrderRepository;
import com.auction.auction_system.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuctionSchedulerService {

    private final AuctionRepository auctionRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final AuctionEntryFeeRepository auctionEntryFeeRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final SimpMessagingTemplate messagingTemplate;

    public AuctionSchedulerService(
            AuctionRepository auctionRepository,
            OrderRepository orderRepository,
            UserRepository userRepository,
            AuctionEntryFeeRepository auctionEntryFeeRepository,
            NotificationService notificationService,
            EmailService emailService,
            SimpMessagingTemplate messagingTemplate) {
        this.auctionRepository = auctionRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.auctionEntryFeeRepository = auctionEntryFeeRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.messagingTemplate = messagingTemplate;
    }

    @Scheduled(fixedRate = 30000)
    public void updateAuctionStatus() {
        LocalDateTime now = LocalDateTime.now();

        // ACTIVE → SOLD / FAILED
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

            // ✅ HOÀN PHÍ cho tất cả người KHÔNG thắng
            List<AuctionEntryFee> feeRecords =
                    auctionEntryFeeRepository.findByAuctionIdAndRefundedFalse(auction.getId());

            for (AuctionEntryFee fee : feeRecords) {
                boolean isWinner = winner != null && fee.getBidder().getId().equals(winner.getId());

                if (!isWinner) {
                    User freshUser = userRepository.findById(fee.getBidder().getId())
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

                    double balance = freshUser.getBalance() != null ? freshUser.getBalance() : 0.0;
                    freshUser.setBalance(balance + fee.getFeeAmount());
                    userRepository.save(freshUser);

                    fee.setRefunded(true);
                    fee.setRefundedAt(LocalDateTime.now());
                    auctionEntryFeeRepository.save(fee);

                    notificationService.sendWinnerNotification(
                            freshUser.getId(),
                            "Bạn không thắng phiên \"" + auction.getTitle()
                                    + "\". Phí tham gia " + String.format("%,.0f", fee.getFeeAmount())
                                    + " VNĐ đã được hoàn lại vào ví."
                    );
                }
                // Nếu là winner → giữ nguyên, không hoàn (refunded vẫn false, coi như đã "tiêu")
            }

            messagingTemplate.convertAndSend("/topic/auction/" + auction.getId(), "ENDED");

            // TẠO ORDER — như code gốc, không còn phụ thuộc điều kiện phí nữa
            if (winner != null) {
                boolean orderExists = orderRepository.existsByAuction(auction);
                if (!orderExists) {
                    Order order = new Order();
                    order.setAuction(auction);
                    order.setBuyer(winner);
                    order.setFinalPrice(auction.getCurrentPrice());
                    order.setStatus(OrderStatus.PENDING);
                    order.setCreatedAt(LocalDateTime.now());
                    orderRepository.save(order);

                    notificationService.sendWinnerNotification(
                            winner.getId(),
                            "Chúc mừng! Bạn đã thắng đấu giá: " + auction.getTitle()
                    );

                    notificationService.sendAuctionEndedWinnerNotification(
                            auction.getSeller().getId(),
                            auction.getTitle()
                    );

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
                notificationService.sendAuctionFailedNotification(
                        auction.getSeller().getId(),
                        auction.getTitle()
                );
            }
        }
    }
}