package com.auction.auction_system.service;

import com.auction.auction_system.entity.*;
import com.auction.auction_system.repository.AuctionEntryFeeRepository;
import com.auction.auction_system.repository.AuctionRepository;
import com.auction.auction_system.repository.BidRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.auction.auction_system.dto.BidResponseDTO;
import com.auction.auction_system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BidService {

    private final BidRepository bidRepository;
    private final AuctionRepository auctionRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final AuctionEntryFeeRepository auctionEntryFeeRepository;

    private static final int MAX_BIDS_PER_USER = 10;
    private static final int ANTI_SNIPING_WINDOW_MINUTES = 1; 
    private static final int MAX_EXTENSIONS = 5;         
    private static final double ENTRY_FEE_FIXED = 500000.0;
    private double entryFee = ENTRY_FEE_FIXED;
    @Value("${app.shill-bidding-check-enabled:true}")
    private boolean shillBiddingCheckEnabled;   

    public BidService(
            BidRepository bidRepository,
            AuctionRepository auctionRepository,
            SimpMessagingTemplate messagingTemplate,
            NotificationService notificationService,
            UserRepository userRepository,
            AuctionEntryFeeRepository auctionEntryFeeRepository) {

        this.bidRepository = bidRepository;
        this.auctionRepository = auctionRepository;
        this.messagingTemplate = messagingTemplate;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.auctionEntryFeeRepository = auctionEntryFeeRepository;
    }

    private String maskName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "***";
        }
        if (fullName.length() <= 2) {
            return fullName.charAt(0) + "***";
        }
        return fullName.charAt(0) + "***" + fullName.charAt(fullName.length() - 1);
    }

    @Transactional
    public Bid placeBid(Long auctionId, Double amount, User bidder, String clientIp) {

        try {

            Auction auction = auctionRepository.findById(auctionId)
                    .orElseThrow(() -> new RuntimeException("Auction not found"));

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
                throw new RuntimeException("Auction is not active");
            }

            // seller không được bid
            if (auction.getSeller().getId().equals(bidder.getId())) {
                throw new RuntimeException("You cannot bid on your own auction");
            }

        // ✅ CHỐNG SHILL BIDDING
        if (shillBiddingCheckEnabled) {
        String sellerLastIp = auction.getSeller().getLastLoginIp();
        if (clientIp != null && clientIp.equals(sellerLastIp)) {
                throw new RuntimeException("SHILL_BIDDING_SUSPECTED_SELLER_IP");
        }

        boolean sameIpDifferentBidder = bidRepository.existsByAuctionIdAndIpAddressAndBidderIdNot(
                auctionId, clientIp, bidder.getId()
        );
        if (clientIp != null && sameIpDifferentBidder) {
                throw new RuntimeException("SHILL_BIDDING_SUSPECTED_MULTI_ACCOUNT");
        }
        }

                if (auction.getHighestBidder() != null
                        && auction.getHighestBidder().getId().equals(bidder.getId())) {
                throw new RuntimeException("You are already the highest bidder");
                }

            // đang là người thắng
            if (auction.getHighestBidder() != null
                    && auction.getHighestBidder().getId().equals(bidder.getId())) {
                throw new RuntimeException("You are already the highest bidder");
            }

            // ✅ giới hạn số lần đặt giá mỗi người / phiên
            long bidCount = bidRepository.countByAuctionIdAndBidderId(auctionId, bidder.getId());
            if (bidCount >= MAX_BIDS_PER_USER) {
                throw new RuntimeException("MAX_BID_LIMIT_REACHED");
            }

            // bước giá
            double step = auction.getBidIncrementStep() != null
                    ? auction.getBidIncrementStep()
                    : 100000.0;

            double currentPrice = auction.getCurrentPrice() != null
                    ? auction.getCurrentPrice()
                    : auction.getStartingPrice();

            double minValidBid = currentPrice + step;

            if (amount < minValidBid) {
                throw new RuntimeException("Bid must be at least " + minValidBid);
            }

            // MỚI: chặn đặt giá bằng/vượt giá mua ngay
            if (auction.getBuyNowPrice() != null && amount >= auction.getBuyNowPrice()) {
                throw new RuntimeException("BID_REACHES_BUYNOW");
            }

            // ✅ PHÍ THAM GIA — chỉ tính ở lần bid ĐẦU TIÊN của user trong phiên này
        if (bidCount == 0) {

        User freshBidder = userRepository.findById(bidder.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        double balance = freshBidder.getBalance() != null ? freshBidder.getBalance() : 0.0;

        if (balance < ENTRY_FEE_FIXED) {                    // ✅ đổi entryFee → ENTRY_FEE_FIXED
                throw new RuntimeException("INSUFFICIENT_BALANCE_FOR_FEE");
        }

        freshBidder.setBalance(balance - ENTRY_FEE_FIXED);   // ✅ đổi entryFee → ENTRY_FEE_FIXED
        userRepository.save(freshBidder);

        AuctionEntryFee feeRecord = AuctionEntryFee.builder()
                .auction(auction)
                .bidder(bidder)
                .feeAmount(ENTRY_FEE_FIXED)                   // ✅ đổi entryFee → ENTRY_FEE_FIXED
                .refunded(false)
                .paidAt(now)
                .build();
        auctionEntryFeeRepository.save(feeRecord);
        }

            // người thắng cũ
            User previousWinner = auction.getHighestBidder();

                long minutesLeft = java.time.Duration.between(now, auction.getEndTime()).toMinutes();

                if (minutesLeft <= ANTI_SNIPING_WINDOW_MINUTES) {

                int currentExtensions = auction.getExtensionCount() != null
                        ? auction.getExtensionCount()
                        : 0;

                if (currentExtensions < MAX_EXTENSIONS) {
                        auction.setEndTime(now.plusMinutes(ANTI_SNIPING_WINDOW_MINUTES));
                        auction.setExtensionCount(currentExtensions + 1);

                        messagingTemplate.convertAndSend(
                                "/topic/auction/" + auctionId,
                                "EXTENDED:" + auction.getEndTime()
                        );
                }
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
                    .ipAddress(clientIp)
                    .build();

            Bid savedBid = bidRepository.save(bid);

            // realtime bid
            messagingTemplate.convertAndSend("/topic/auction/" + auctionId, savedBid);

            // thông báo bị vượt giá
            if (previousWinner != null && !previousWinner.getId().equals(bidder.getId())) {
                notificationService.sendOutbidNotification(
                        previousWinner.getId(),
                        "You have been outbid on: " + auction.getTitle()
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
            throw new RuntimeException("Another user placed a bid before you. Please try again.");
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