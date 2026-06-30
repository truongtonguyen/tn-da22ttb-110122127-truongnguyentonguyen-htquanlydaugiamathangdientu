package com.auction.auction_system.service;

import com.auction.auction_system.dto.CreateAuctionRequest;
import com.auction.auction_system.entity.*;
import com.auction.auction_system.repository.AuctionImageRepository;
import com.auction.auction_system.repository.AuctionRepository;
import com.auction.auction_system.repository.CategoryRepository;
import com.auction.auction_system.repository.OrderRepository;
import com.auction.auction_system.repository.UserRepository;
import com.auction.auction_system.repository.BidRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuctionService {

    private final AuctionRepository auctionRepository;
    private final CategoryRepository categoryRepository;
    private final AuctionImageRepository auctionImageRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final BidRepository bidRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public AuctionService(
            AuctionRepository auctionRepository,
            CategoryRepository categoryRepository,
            AuctionImageRepository auctionImageRepository,
            OrderRepository orderRepository,
            UserRepository userRepository,
            BidRepository bidRepository,
            NotificationService notificationService,
            EmailService emailService) {

        this.auctionRepository = auctionRepository;
        this.categoryRepository = categoryRepository;
        this.auctionImageRepository = auctionImageRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.bidRepository = bidRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    // =========================
    // CREATE AUCTION
    // =========================
    public Auction createAuction(
            CreateAuctionRequest request,
            User seller,
            MultipartFile[] images) {

        try {
            Category category = categoryRepository
                    .findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));

            Auction auction = Auction.builder()
                    .title(request.getTitle())
                    .description(request.getDescription())
                    .category(category)
                    .startingPrice(request.getStartingPrice())
                    .currentPrice(request.getStartingPrice())
                    .highestBid(request.getStartingPrice())
                    .reservePrice(request.getReservePrice())
                    .buyNowPrice(request.getBuyNowPrice())
                    .startTime(LocalDateTime.now())
                    .endTime(LocalDateTime.now().plusDays(request.getDurationDays()))
                    .seller(seller)
                    .status(AuctionStatus.PENDING_APPROVAL)
                    .build();

            auction = auctionRepository.save(auction);

            if (images != null) {
                Path uploadDir = Paths.get("uploads");
                if (!Files.exists(uploadDir)) {
                    Files.createDirectories(uploadDir);
                }

                for (MultipartFile image : images) {
                    if (image.isEmpty()) continue;

                    String fileName = System.currentTimeMillis() + "_" + image.getOriginalFilename();
                    Path filePath = uploadDir.resolve(fileName);
                    Files.copy(image.getInputStream(), filePath);

                    AuctionImage auctionImage = AuctionImage.builder()
                            .imageUrl(fileName)
                            .auction(auction)
                            .build();
                    auctionImageRepository.save(auctionImage);
                }
            }

            return auctionRepository.findById(auction.getId()).orElseThrow();

        } catch (IOException e) {
            throw new RuntimeException("Upload images failed", e);
        }
    }

    // =========================
    // GET ALL + PAGINATION
    // =========================
    public Page<Auction> getAllAuctions(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return auctionRepository.findAll(pageable);
    }

    // =========================
    // COUNT ALL (dùng cho thống kê admin)
    // =========================
    public long countAllAuctions() {
        return auctionRepository.count();
    }

    // =========================
    // GET BY ID
    // =========================
    public Auction getAuctionById(Long id) {
        return auctionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Auction not found"));
    }

    // =========================
    // APPROVE
    // =========================
    public Auction approveAuction(Long id) {
        Auction auction = getAuctionById(id);
        if (auction.getStatus() != AuctionStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Auction is not pending approval");
        }
        auction.setStatus(AuctionStatus.UPCOMING);
        Auction saved = auctionRepository.save(auction);

        notificationService.sendAuctionApprovedNotification(
                auction.getSeller().getId(),
                auction.getTitle()
        );

        return saved;
    }

    // =========================
    // REJECT
    // =========================
    public Auction rejectAuction(Long id) {
        Auction auction = getAuctionById(id);
        if (auction.getStatus() != AuctionStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Auction is not pending approval");
        }
        auction.setStatus(AuctionStatus.REJECTED);
        Auction saved = auctionRepository.save(auction);

        notificationService.sendAuctionRejectedNotification(
                auction.getSeller().getId(),
                auction.getTitle()
        );

        return saved;
    }

    // =========================
    // MY AUCTIONS
    // =========================
    public List<Auction> getMyAuctions(User seller) {
        return auctionRepository.findBySeller(seller);
    }

    // =========================
    // PENDING FOR ADMIN
    // =========================
    public List<Auction> getPendingAuctions() {
        return auctionRepository.findByStatus(AuctionStatus.PENDING_APPROVAL);
    }

    public List<Auction> getAuctionsByStatus(AuctionStatus status) {
        return auctionRepository.findByStatus(status);
    }

    // =========================
    // SEARCH + PAGINATION
    // =========================
    public Page<Auction> searchAuctions(
            String keyword,
            AuctionStatus status,
            int page,
            int size) {

        if (keyword != null && keyword.isBlank()) {
            keyword = null;
        }
        Pageable pageable = PageRequest.of(page, size);
        return auctionRepository.search(keyword, status, pageable);
    }

    // =========================
    // ACTIVATE (dùng trong scheduler)
    // =========================
    public void activateAuctionIfNeeded(Auction auction) {
        if (auction.getStatus() == AuctionStatus.UPCOMING
                && LocalDateTime.now().isAfter(auction.getStartTime())) {
            auction.setStatus(AuctionStatus.ACTIVE);
            auctionRepository.save(auction);
        }
    }

    // =========================
    // CLOSE (dùng trong scheduler)
    // CHÚ Ý: chưa xác nhận method này có đang được gọi ở đâu không.
    // Logic ACTIVE→SOLD/FAILED thật sự đang chạy nằm ở AuctionSchedulerService.
    // Nếu kiểm tra xác nhận không có nơi nào gọi closeAuctionIfExpired(...),
    // nên xóa method này để tránh trùng lặp logic và gây nhầm lẫn khi đọc code.
    // =========================
    public void closeAuctionIfExpired(Auction auction) {

        if (auction.getStatus() == AuctionStatus.ACTIVE
                && LocalDateTime.now().isAfter(auction.getEndTime())) {

            if (auction.getReservePrice() == null
                    || auction.getCurrentPrice() >= auction.getReservePrice()) {

                auction.setWinner(auction.getHighestBidder());
                auction.setStatus(AuctionStatus.SOLD);

            } else {

                auction.setWinner(null);
                auction.setStatus(AuctionStatus.FAILED);
            }

            auctionRepository.save(auction);
        }
    }

    // =========================
    // BUY NOW
    // =========================
    @Transactional
    public Auction buyNow(Long auctionId, User buyer) {
        int maxRetries = 3;
        int attempt = 0;

        while (attempt < maxRetries) {
            try {
                // findById load đúng @Version field
                Auction auction = auctionRepository.findById(auctionId)
                        .orElseThrow(() -> new RuntimeException("Auction not found"));

                if (auction.getStatus() != AuctionStatus.ACTIVE) {
                    throw new RuntimeException("Auction is not active");
                }
                if (auction.getBuyNowPrice() == null) {
                    throw new RuntimeException("This auction does not have a buy-now price");
                }
                if (auction.getSeller().getId().equals(buyer.getId())) {
                    throw new RuntimeException("You cannot buy your own auction");
                }
                if (buyer.getRole() == com.auction.auction_system.entity.Role.ADMIN) {
                    throw new RuntimeException("Admin cannot buy items");
                }

                // Kiểm tra order trùng (trường hợp 2 người bấm mua ngay cùng lúc)
                if (orderRepository.existsByAuction(auction)) {
                    throw new RuntimeException("Auction has already been purchased");
                }

                // Kết thúc auction
                auction.setCurrentPrice(auction.getBuyNowPrice());
                auction.setHighestBid(auction.getBuyNowPrice());
                auction.setHighestBidder(buyer);
                auction.setWinner(buyer);
                auction.setStatus(AuctionStatus.SOLD); // đổi từ ENDED để khớp với AuctionSchedulerService
                auctionRepository.saveAndFlush(auction); // flush ngay để bắt version conflict sớm

                // Tạo Order
                Order order = new Order();
                order.setAuction(auction);
                order.setBuyer(buyer);
                order.setFinalPrice(auction.getBuyNowPrice());
                order.setStatus(OrderStatus.PENDING);
                order.setCreatedAt(LocalDateTime.now());
                orderRepository.save(order);

                // Thông báo & email cho người mua
                notificationService.sendWinnerNotification(
                        buyer.getId(),
                        "Bạn đã mua thành công: " + auction.getTitle()
                );

                // Thông báo cho người bán
                notificationService.sendAuctionEndedWinnerNotification(
                        auction.getSeller().getId(),
                        auction.getTitle()
                );

                try {
                    emailService.sendWinnerNotification(
                            buyer.getEmail(),
                            auction.getTitle(),
                            String.format("%,.0f", auction.getBuyNowPrice())
                    );
                } catch (Exception e) {
                    System.err.println("Failed to send buy-now email: " + e.getMessage());
                }

                return auction;

            } catch (org.springframework.orm.ObjectOptimisticLockingFailureException
                    | jakarta.persistence.OptimisticLockException e) {
                attempt++;
                if (attempt >= maxRetries) {
                    throw new RuntimeException("Có người vừa mua sản phẩm này. Vui lòng thử lại.");
                }
                // Chờ chút rồi retry
                try { Thread.sleep(100L * attempt); } catch (InterruptedException ignored) {}
            }
        }

        throw new RuntimeException("Mua ngay thất bại. Vui lòng thử lại.");
    }

    public boolean userHasBid(Long auctionId, Long userId) {
        return bidRepository.existsByAuctionIdAndBidderId(auctionId, userId);
    }
}