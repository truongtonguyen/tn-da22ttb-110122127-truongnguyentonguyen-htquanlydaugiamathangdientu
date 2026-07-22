package com.auction.auction_system.controller;

import com.auction.auction_system.entity.Auction;
import com.auction.auction_system.entity.AuctionStatus;
import com.auction.auction_system.entity.User;
import com.auction.auction_system.repository.AuctionRepository;
import com.auction.auction_system.repository.UserRepository;
import com.auction.auction_system.service.CreditScoreService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sellers")
public class SellerProfileController {

    private final UserRepository userRepository;
    private final AuctionRepository auctionRepository;
    private final CreditScoreService creditScoreService;   // ✅ thêm mới

    public SellerProfileController(
            UserRepository userRepository,
            AuctionRepository auctionRepository,
            CreditScoreService creditScoreService) {        // ✅ thêm mới
        this.userRepository = userRepository;
        this.auctionRepository = auctionRepository;
        this.creditScoreService = creditScoreService;
    }

    @GetMapping("/{sellerId}")
    public Map<String, Object> getSellerProfile(@PathVariable Long sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found"));

        List<Auction> allAuctions = auctionRepository.findBySeller(seller);

        long totalAuctions = allAuctions.size();
        long activeAuctions = allAuctions.stream()
                .filter(a -> a.getStatus() == AuctionStatus.ACTIVE)
                .count();

        CreditScoreService.SellerCreditResult credit = creditScoreService.computeSellerCredit(seller);

        return Map.of(
                "id", seller.getId(),
                "displayName", seller.getFullName() != null ? seller.getFullName() : seller.getUsername(),
                "username", seller.getUsername(),
                "creditScore", credit.creditScore(),
                "creditLevel", credit.creditLevel(),
                "successRate", credit.successRate(),
                "totalAuctions", totalAuctions,
                "completedAuctions", credit.completedAuctions(),
                "activeAuctions", activeAuctions,
                "lateShippingCount", credit.lateShippingCount()
        );
    }
}