package com.auction.auction_system.service;

import com.auction.auction_system.entity.*;
import com.auction.auction_system.repository.AuctionRepository;
import com.auction.auction_system.repository.BidRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.auction.auction_system.dto.BidResponseDTO;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BidService {

    private final BidRepository bidRepository;
    private final AuctionRepository auctionRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    public BidService(
            BidRepository bidRepository,
            AuctionRepository auctionRepository,
            SimpMessagingTemplate messagingTemplate,
            NotificationService notificationService) {

        this.bidRepository = bidRepository;
        this.auctionRepository = auctionRepository;
        this.messagingTemplate = messagingTemplate;
        this.notificationService = notificationService;

    }

    private String maskName(String fullName) {

        if (fullName == null || fullName.isBlank()) {
                return "***";
        }

        if (fullName.length() <= 2) {
                return fullName.charAt(0) + "***";
        }

        return fullName.charAt(0)
                + "***"
                + fullName.charAt(fullName.length() - 1);
        }

@Transactional
public Bid placeBid(Long auctionId,
                    Double amount,
                    User bidder) {

    try {

        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() ->
                        new RuntimeException("Auction not found"));

        LocalDateTime now = LocalDateTime.now();

        if (bidder.getRole() == com.auction.auction_system.entity.Role.ADMIN) {
                throw new RuntimeException("Admin cannot place bids");
                }

        // đấu giá đã kết thúc
        if (now.isAfter(auction.getEndTime())) {

            boolean reserveMet = auction.getHighestBid() != null
                    && auction.getReservePrice() != null
                    && auction.getHighestBid() >= auction.getReservePrice();

            if (reserveMet) {
                auction.setWinner(auction.getHighestBidder());
                auction.setStatus(AuctionStatus.SOLD);
            } else {
                auction.setWinner(null);
                auction.setStatus(AuctionStatus.FAILED);
            }

            auctionRepository.save(auction);

            throw new RuntimeException("Auction has ended");
        }

        // chỉ ACTIVE mới được bid
        if (auction.getStatus() != AuctionStatus.ACTIVE) {
            throw new RuntimeException(
                    "Auction is not active"
            );
        }

        // seller không được bid
        if (auction.getSeller().getId()
                .equals(bidder.getId())) {

            throw new RuntimeException(
                    "You cannot bid on your own auction"
            );
        }

        // đang là người thắng
        if (auction.getHighestBidder() != null
                && auction.getHighestBidder()
                .getId()
                .equals(bidder.getId())) {

            throw new RuntimeException(
                    "You are already the highest bidder"
            );
        }

        // bước giá
        double step = auction.getBidIncrementStep() != null
                ? auction.getBidIncrementStep()
                : 100000.0;

        double currentPrice =
                auction.getCurrentPrice() != null
                        ? auction.getCurrentPrice()
                        : auction.getStartingPrice();

        double minValidBid =
                currentPrice + step;

        if (amount < minValidBid) {
            throw new RuntimeException(
                    "Bid must be at least " + minValidBid
            );
        }

        // MỚI: chặn đặt giá bằng/vượt giá mua ngay — nên dùng chức năng Mua ngay thay vì đặt giá
        if (auction.getBuyNowPrice() != null && amount >= auction.getBuyNowPrice()) {
            throw new RuntimeException("BID_REACHES_BUYNOW");
        }

        // người thắng cũ
        User previousWinner =
                auction.getHighestBidder();

        // ======================
        // ANTI-SNIPING
        // Nếu còn <= 5 phút
        // gia hạn thêm 5 phút
        // ======================
        long minutesLeft =
                java.time.Duration.between(
                        now,
                        auction.getEndTime()
                ).toMinutes();

        if (minutesLeft <= 5) {

            auction.setEndTime(
                    now.plusMinutes(5)
            );

            messagingTemplate.convertAndSend(
                    "/topic/auction/" + auctionId,
                    "EXTENDED:" + auction.getEndTime()
            );
        }

        // cập nhật auction
        auction.setCurrentPrice(amount);
        auction.setHighestBid(amount);
        auction.setHighestBidder(bidder);

        auctionRepository.saveAndFlush(auction);

        // tạo bid
        Bid bid = Bid.builder()
                .amount(amount)
                .bidTime(now)
                .auction(auction)
                .bidder(bidder)
                .build();

        Bid savedBid =
                bidRepository.save(bid);

        // realtime bid
        messagingTemplate.convertAndSend(
                "/topic/auction/" + auctionId,
                savedBid
        );

        // thông báo bị vượt giá
        if (previousWinner != null
                && !previousWinner.getId()
                .equals(bidder.getId())) {

            notificationService.sendOutbidNotification(
                    previousWinner.getId(),
                    "You have been outbid on: "
                            + auction.getTitle()
            );

            messagingTemplate.convertAndSend(
                    "/topic/auction/" + auctionId,
                    "OUTBID:" + previousWinner.getId()
            );
        }

        return savedBid;

    } catch (
            jakarta.persistence.OptimisticLockException
            | org.springframework.orm.ObjectOptimisticLockingFailureException e
    ) {

        throw new RuntimeException(
                "Another user placed a bid before you. Please try again."
        );
    }
}


    // lịch sử bid của auction
        public List<BidResponseDTO> getBidHistory(Long auctionId) {

        return bidRepository
                .findByAuctionIdOrderByBidTimeDesc(auctionId)
                .stream()
                .limit(5)
                .map(bid -> BidResponseDTO.builder()
                        .id(bid.getId())
                        .amount(bid.getAmount())
                        .bidTime(bid.getBidTime())
                        .bidderId(bid.getBidder().getId())
                        .bidderName(maskName(
                                bid.getBidder().getFullName()
                        ))
                        .auctionId(bid.getAuction().getId())
                        .auctionTitle(
                                bid.getAuction().getTitle()
                        )
                        .build())
                .toList();
        }

    // lịch sử bid của user
        public List<BidResponseDTO> getMyBids(User bidder) {
        return bidRepository.findByBidderOrderByBidTimeDesc(bidder)
                .stream()
                .map(bid -> {
                        Auction auction = bid.getAuction();

                        // Lấy danh sách imageUrl
                        List<String> images = auction.getImages() != null
                                ? auction.getImages().stream()
                                        .map(img -> img.getImageUrl())
                                        .toList()
                                : List.of();

                        // Winner info
                        Long winnerId = null;
                        String winnerName = null;
                        if (auction.getWinner() != null) {
                        winnerId = auction.getWinner().getId();
                        // Ẩn tên winner — chỉ hiện nếu là chính bidder đó
                        winnerName = auction.getWinner().getId().equals(bidder.getId())
                                ? "Bạn"
                                : maskName(auction.getWinner().getFullName());
                        }

                        return BidResponseDTO.builder()
                                .id(bid.getId())
                                .amount(bid.getAmount())
                                .bidTime(bid.getBidTime())
                                .bidderId(bid.getBidder().getId())
                                .bidderName(bid.getBidder().getFullName())
                                .auctionId(auction.getId())
                                .auctionTitle(auction.getTitle())
                                .auctionStatus(auction.getStatus().name())
                                .auctionCurrentPrice(auction.getCurrentPrice())
                                .auctionEndTime(auction.getEndTime())
                                .auctionImages(images)
                                .winnerId(winnerId)
                                .winnerName(winnerName)
                                .build();
                })
                .toList();
        }

    // Get all bids for admin
    public List<Bid> getAllBids() {
        return bidRepository.findAll();
    }
}