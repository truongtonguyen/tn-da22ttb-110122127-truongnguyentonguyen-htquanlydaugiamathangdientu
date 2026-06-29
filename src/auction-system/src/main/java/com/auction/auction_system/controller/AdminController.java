package com.auction.auction_system.controller;

import com.auction.auction_system.dto.AdminAuctionDTO;
import com.auction.auction_system.dto.AdminStatsDTO;
import com.auction.auction_system.dto.AdminUserDTO;
import com.auction.auction_system.entity.Auction;
import com.auction.auction_system.entity.AuctionStatus;
import com.auction.auction_system.entity.User;
import com.auction.auction_system.service.AuctionService;
import com.auction.auction_system.service.BidService;
import com.auction.auction_system.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuctionService auctionService;
    private final UserService userService;
    private final BidService bidService;

    public AdminController(
            AuctionService auctionService,
            UserService userService,
            BidService bidService
    ) {
        this.auctionService = auctionService;
        this.userService = userService;
        this.bidService = bidService;
    }

    // ========================================
    // AUCTION MANAGEMENT
    // ========================================

    @GetMapping("/auctions/pending")
    public List<AdminAuctionDTO> getPendingAuctions() {
        return auctionService.getPendingAuctions()
                .stream()
                .map(this::convertToAdminAuctionDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/auctions")
    public List<AdminAuctionDTO> getAllAuctions() {
        return auctionService.getAuctionsByStatus(AuctionStatus.ACTIVE)
                .stream()
                .map(this::convertToAdminAuctionDTO)
                .collect(Collectors.toList());
    }

    @PutMapping("/auctions/{id}/approve")
    public Auction approveAuction(@PathVariable Long id) {
        return auctionService.approveAuction(id);
    }

    @PutMapping("/auctions/{id}/reject")
    public Auction rejectAuction(@PathVariable Long id) {
        return auctionService.rejectAuction(id);
    }

    // ========================================
    // USER MANAGEMENT
    // ========================================

    @GetMapping("/users")
    public List<AdminUserDTO> getAllUsers() {
        return userService.getAllUsers()
                .stream()
                .map(this::convertToAdminUserDTO)
                .collect(Collectors.toList());
    }

    @PutMapping("/users/{id}/ban")
    public AdminUserDTO banUser(@PathVariable Long id) {
        User user = userService.banUser(id);
        return convertToAdminUserDTO(user);
    }

    @PutMapping("/users/{id}/unban")
    public AdminUserDTO unbanUser(@PathVariable Long id) {
        User user = userService.unbanUser(id);
        return convertToAdminUserDTO(user);
    }

    // ========================================
    // STATISTICS & REPORTS
    // ========================================

    @GetMapping("/stats")
    public AdminStatsDTO getStatistics() {
        Long totalUsers = userService.getUserCount();
        Long totalAuctions = (long) auctionService.getAuctionsByStatus(AuctionStatus.ACTIVE).size()
                + auctionService.getPendingAuctions().size()
                + auctionService.getAuctionsByStatus(AuctionStatus.ENDED).size();
        Long pendingAuctions = (long) auctionService.getPendingAuctions().size();
        Long activeAuctions = (long) auctionService.getAuctionsByStatus(AuctionStatus.ACTIVE).size();
        Long soldAuctions = (long) auctionService.getAuctionsByStatus(AuctionStatus.SOLD).size();
        Long failedAuctions = (long) auctionService.getAuctionsByStatus(AuctionStatus.FAILED).size();
        Long totalBids = (long) bidService.getAllBids().size();

        return new AdminStatsDTO(
                totalUsers,
                totalAuctions,
                pendingAuctions,
                activeAuctions,
                soldAuctions,
                failedAuctions,
                totalBids
        );
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    private AdminAuctionDTO convertToAdminAuctionDTO(Auction auction) {
        // Lấy ảnh đầu tiên nếu có
        String imageUrl = (auction.getImages() != null && !auction.getImages().isEmpty())
                ? auction.getImages().get(0).getImageUrl()
                : null;

        return new AdminAuctionDTO(
                auction.getId(),
                auction.getTitle(),
                auction.getDescription(),
                auction.getStartingPrice(),
                auction.getCurrentPrice(),
                auction.getBuyNowPrice(),   // null nếu không thiết lập
                auction.getReservePrice(),
                auction.getStatus(),
                auction.getSeller().getFullName() != null
                        ? auction.getSeller().getFullName()
                        : auction.getSeller().getUsername(),
                auction.getSeller().getEmail(),
                auction.getCategory().getName(),
                auction.getStartTime(),
                auction.getEndTime(),
                imageUrl
        );
    }

    private AdminUserDTO convertToAdminUserDTO(User user) {
        return new AdminUserDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole(),
                user.isEmailVerified(),
                user.isBanned()
        );
    }
}