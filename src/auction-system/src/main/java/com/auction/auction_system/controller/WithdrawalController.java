package com.auction.auction_system.controller;

import com.auction.auction_system.entity.User;
import com.auction.auction_system.entity.WithdrawalRequest;
import com.auction.auction_system.service.WithdrawalService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/withdrawals")
public class WithdrawalController {

    private final WithdrawalService withdrawalService;

    public WithdrawalController(WithdrawalService withdrawalService) {
        this.withdrawalService = withdrawalService;
    }

    // Người dùng tạo yêu cầu rút — giả lập COMPLETED ngay
    @PostMapping
    public WithdrawalRequest createWithdrawal(
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        Double amount            = Double.valueOf(body.get("amount").toString());
        String bankName          = (String) body.get("bankName");
        String bankAccountNumber = (String) body.get("bankAccountNumber");
        String bankAccountName   = (String) body.get("bankAccountName");
        return withdrawalService.createWithdrawalRequest(user, amount, bankName, bankAccountNumber, bankAccountName);
    }

    @GetMapping("/my-withdrawals")
    public List<WithdrawalRequest> getMyWithdrawals(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return withdrawalService.getMyWithdrawals(user);
    }

    // Admin xem lịch sử (chỉ đọc)
    @GetMapping
    public List<WithdrawalRequest> getAllWithdrawals() {
        return withdrawalService.getAllWithdrawals();
    }
}