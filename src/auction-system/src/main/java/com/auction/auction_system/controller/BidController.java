package com.auction.auction_system.controller;

import com.auction.auction_system.dto.BidResponseDTO;
import com.auction.auction_system.dto.CreateBidRequest;
import com.auction.auction_system.entity.Bid;
import com.auction.auction_system.entity.User;
import com.auction.auction_system.service.BidService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auctions")
public class BidController {

    private final BidService bidService;

    public BidController(BidService bidService) {
        this.bidService = bidService;
    }

    // Đặt giá
    @PostMapping("/{auctionId}/bids")
    public Bid placeBid(
            @PathVariable Long auctionId,
            @RequestBody CreateBidRequest request,
            Authentication authentication
    ) {

        // lấy amount từ DTO
        Double amount = request.getAmount();

        // lấy user từ security context
        User user = (User) authentication.getPrincipal();

        // Kiểm tra email đã được xác thực
        if (!user.isEmailVerified()) {
            throw new RuntimeException("Your email must be verified before you can place a bid. Please check your email for the verification link.");
        }

        return bidService.placeBid(auctionId, amount, user);
    }

    // Xem lịch sử bid
    @GetMapping("/{auctionId}/bids")
    public List<BidResponseDTO> getBidHistory(
            @PathVariable Long auctionId
    ) {
        return bidService.getBidHistory(auctionId);
    }

    // Xem lịch sử bid của mình
    @GetMapping("/my-bids")
    public List<BidResponseDTO> getMyBids(Authentication authentication) {

        User bidder = (User) authentication.getPrincipal();

        return bidService.getMyBids(bidder);
    }
}