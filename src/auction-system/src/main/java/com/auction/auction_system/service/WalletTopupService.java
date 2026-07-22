package com.auction.auction_system.service;

import com.auction.auction_system.entity.*;
import com.auction.auction_system.repository.UserRepository;
import com.auction.auction_system.repository.WalletTopupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class WalletTopupService {

    private final WalletTopupRepository walletTopupRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public WalletTopupService(
            WalletTopupRepository walletTopupRepository,
            UserRepository userRepository,
            NotificationService notificationService) {
        this.walletTopupRepository = walletTopupRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // Người dùng tạo yêu cầu nạp tiền
    @Transactional
    public WalletTopupRequest createTopupRequest(User user, Double amount, String note) {
        if (amount == null || amount <= 0) {
            throw new RuntimeException("Số tiền nạp phải lớn hơn 0");
        }

        WalletTopupRequest request = WalletTopupRequest.builder()
                .user(user)
                .amount(amount)
                .status(WalletTopupStatus.PENDING)
                .note(note)
                .createdAt(LocalDateTime.now())
                .build();

        WalletTopupRequest saved = walletTopupRepository.save(request);

        // Thông báo admin
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        for (User admin : admins) {
            notificationService.sendWinnerNotification(
                    admin.getId(),
                    "Yêu cầu nạp tiền #" + saved.getId() + " từ " + user.getUsername()
                            + " — " + String.format("%,.0f", amount) + " VNĐ cần xác nhận"
            );
        }

        return saved;
    }

    public List<WalletTopupRequest> getMyTopups(User user) {
        return walletTopupRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<WalletTopupRequest> getAllTopups() {
        return walletTopupRepository.findAllByOrderByCreatedAtDesc();
    }

    // Admin xác nhận đã nhận tiền → cộng vào balance
    @Transactional
    public WalletTopupRequest approveTopup(Long requestId) {
        WalletTopupRequest request = walletTopupRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu nạp tiền"));

        if (request.getStatus() != WalletTopupStatus.PENDING) {
            throw new RuntimeException("Yêu cầu này đã được xử lý trước đó");
        }

        User user = userRepository.findById(request.getUser().getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        double currentBalance = user.getBalance() != null ? user.getBalance() : 0.0;
        user.setBalance(currentBalance + request.getAmount());
        userRepository.save(user);

        request.setStatus(WalletTopupStatus.APPROVED);
        request.setConfirmedAt(LocalDateTime.now());
        walletTopupRepository.save(request);

        notificationService.sendWinnerNotification(
                user.getId(),
                "Yêu cầu nạp tiền #" + requestId + " đã được xác nhận. Số dư của bạn: "
                        + String.format("%,.0f", user.getBalance()) + " VNĐ"
        );

        return request;
    }

    // Admin từ chối
    @Transactional
    public WalletTopupRequest rejectTopup(Long requestId) {
        WalletTopupRequest request = walletTopupRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu nạp tiền"));

        if (request.getStatus() != WalletTopupStatus.PENDING) {
            throw new RuntimeException("Yêu cầu này đã được xử lý trước đó");
        }

        request.setStatus(WalletTopupStatus.REJECTED);
        request.setConfirmedAt(LocalDateTime.now());
        walletTopupRepository.save(request);

        notificationService.sendWinnerNotification(
                request.getUser().getId(),
                "Yêu cầu nạp tiền #" + requestId + " đã bị từ chối. Vui lòng kiểm tra lại thông tin chuyển khoản."
        );

        return request;
    }
}