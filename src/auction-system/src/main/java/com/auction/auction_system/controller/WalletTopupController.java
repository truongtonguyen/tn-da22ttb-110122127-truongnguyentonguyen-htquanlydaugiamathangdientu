package com.auction.auction_system.controller;

import com.auction.auction_system.entity.User;
import com.auction.auction_system.entity.WalletTopupRequest;
import com.auction.auction_system.service.WalletTopupService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
public class WalletTopupController {

    private final WalletTopupService walletTopupService;

    public WalletTopupController(WalletTopupService walletTopupService) {
        this.walletTopupService = walletTopupService;
    }

    // Xem số dư hiện tại
    @GetMapping("/balance")
    public Map<String, Double> getBalance(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return Map.of("balance", user.getBalance() != null ? user.getBalance() : 0.0);
    }

    // Xem lịch sử nạp tiền của mình
    @GetMapping("/my-topups")
    public List<WalletTopupRequest> getMyTopups(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return walletTopupService.getMyTopups(user);
    }

    // Admin: xem tất cả lịch sử nạp tiền (chỉ đọc)
    @GetMapping("/topups")
    public List<WalletTopupRequest> getAllTopups() {
        return walletTopupService.getAllTopups();
    }
}