package com.auction.auction_system.service;

import com.auction.auction_system.entity.*;
import com.auction.auction_system.repository.UserRepository;
import com.auction.auction_system.repository.WithdrawalRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class WithdrawalService {

    private static final double MIN_WITHDRAWAL_AMOUNT = 100000.0;

    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public WithdrawalService(
            WithdrawalRequestRepository withdrawalRequestRepository,
            UserRepository userRepository,
            NotificationService notificationService) {
        this.withdrawalRequestRepository = withdrawalRequestRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // ✅ Giả lập rút tiền — tự động COMPLETED ngay lập tức, không cần admin
    @Transactional
    public WithdrawalRequest createWithdrawalRequest(
            User user, Double amount, String bankName, String bankAccountNumber, String bankAccountName) {

        if (amount == null || amount < MIN_WITHDRAWAL_AMOUNT) {
            throw new RuntimeException("Số tiền rút tối thiểu là " + String.format("%,.0f", MIN_WITHDRAWAL_AMOUNT) + " VNĐ");
        }
        if (bankName == null || bankName.isBlank()
                || bankAccountNumber == null || bankAccountNumber.isBlank()
                || bankAccountName == null || bankAccountName.isBlank()) {
            throw new RuntimeException("Vui lòng nhập đầy đủ thông tin ngân hàng nhận tiền");
        }

        User freshUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        double balance = freshUser.getBalance() != null ? freshUser.getBalance() : 0.0;
        if (balance < amount) {
            throw new RuntimeException("Số dư không đủ để rút số tiền này");
        }

        // Trừ balance ngay
        freshUser.setBalance(balance - amount);
        userRepository.save(freshUser);

        // ✅ Tạo record với status COMPLETED luôn — giả lập chuyển khoản thành công
        WithdrawalRequest request = WithdrawalRequest.builder()
                .user(freshUser)
                .amount(amount)
                .bankName(bankName)
                .bankAccountNumber(bankAccountNumber)
                .bankAccountName(bankAccountName)
                .status(WithdrawalStatus.COMPLETED)
                .createdAt(LocalDateTime.now())
                .processedAt(LocalDateTime.now())
                .adminNote("Giả lập chuyển khoản thành công")
                .build();

        WithdrawalRequest saved = withdrawalRequestRepository.save(request);

        // Thông báo user
        notificationService.sendWinnerNotification(
                freshUser.getId(),
                String.format("Rút tiền thành công! %,.0f VNĐ đã được chuyển đến %s - %s (%s)",
                        amount, bankName, bankAccountNumber, bankAccountName)
        );

        return saved;
    }

    public List<WithdrawalRequest> getMyWithdrawals(User user) {
        return withdrawalRequestRepository.findByUserOrderByCreatedAtDesc(user);
    }

    // Admin xem lịch sử (chỉ đọc, không cần xử lý nữa)
    public List<WithdrawalRequest> getAllWithdrawals() {
        return withdrawalRequestRepository.findAllByOrderByCreatedAtDesc();
    }
}