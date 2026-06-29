package com.auction.auction_system.controller;

import com.auction.auction_system.entity.Auction;
import com.auction.auction_system.entity.AuctionStatus;
import com.auction.auction_system.entity.User;
import com.auction.auction_system.repository.AuctionRepository;
import com.auction.auction_system.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sellers")
public class SellerProfileController {

    private final UserRepository userRepository;
    private final AuctionRepository auctionRepository;

    public SellerProfileController(UserRepository userRepository, AuctionRepository auctionRepository) {
        this.userRepository = userRepository;
        this.auctionRepository = auctionRepository;
    }

    @GetMapping("/{sellerId}")
    public Map<String, Object> getSellerProfile(@PathVariable Long sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found"));

        List<Auction> allAuctions = auctionRepository.findBySeller(seller);

        long totalAuctions = allAuctions.size();
        long completedAuctions = allAuctions.stream()
                .filter(a -> a.getStatus() == AuctionStatus.ENDED && a.getWinner() != null)
                .count();
        long activeAuctions = allAuctions.stream()
                .filter(a -> a.getStatus() == AuctionStatus.ACTIVE)
                .count();

        // Tính điểm tín dụng (0-100)
        // +5 mỗi auction hoàn thành, tối đa 70đ từ số lượng
        // +30đ nếu tỉ lệ thành công >= 80%
        int scoreFromCompleted = (int) Math.min(completedAuctions * 5, 70);
        double successRate = totalAuctions > 0
                ? (double) completedAuctions / totalAuctions * 100
                : 0;
        int scoreFromRate = successRate >= 80 ? 30
                : successRate >= 60 ? 20
                : successRate >= 40 ? 10 : 0;
        int creditScore = Math.min(scoreFromCompleted + scoreFromRate, 100);

        String creditLevel = creditScore >= 80 ? "Xuất sắc"
                : creditScore >= 60 ? "Tốt"
                : creditScore >= 40 ? "Khá"
                : creditScore >= 20 ? "Trung bình"
                : "Mới";

        // Chỉ trả về thông tin công khai — KHÔNG có email, phone, address
        return Map.of(
                "id", seller.getId(),
                "displayName", seller.getFullName() != null ? seller.getFullName() : seller.getUsername(),
                "username", seller.getUsername(),
                "creditScore", creditScore,
                "creditLevel", creditLevel,
                "successRate", Math.round(successRate),
                "totalAuctions", totalAuctions,
                "completedAuctions", completedAuctions,
                "activeAuctions", activeAuctions
        );
    }
}