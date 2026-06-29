package com.auction.auction_system.service;

import com.auction.auction_system.entity.Notification;
import com.auction.auction_system.entity.User;
import com.auction.auction_system.repository.NotificationRepository;
import com.auction.auction_system.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(
            SimpMessagingTemplate messagingTemplate,
            NotificationRepository notificationRepository,
            UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    // Gửi thông báo thắng đấu giá / mua ngay
    public void sendWinnerNotification(Long userId, String message) {
        saveAndSend(userId, message);
    }

    // Gửi thông báo bị vượt giá
    public void sendOutbidNotification(Long userId, String message) {
        // Dịch sang tiếng Việt trước khi lưu
        String msgVi = message.replace(
            "You have been outbid on: ",
            "Bạn vừa bị vượt giá trên: "
        );
        saveAndSend(userId, msgVi);
    }

    // =====================
    // Private helper
    // =====================
    private void saveAndSend(Long userId, String message) {
        // Lưu vào DB
        userRepository.findById(userId).ifPresent(user -> {
            Notification notif = Notification.builder()
                    .user(user)
                    .message(message)
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            Notification saved = notificationRepository.save(notif);

            // Gửi realtime qua WebSocket
            try {
                messagingTemplate.convertAndSend(
                        "/topic/notifications/" + userId,
                        saved
                );
            } catch (Exception e) {
                System.err.println("WS notification failed: " + e.getMessage());
            }
        });
    }

    public void sendAuctionApprovedNotification(Long sellerId, String auctionTitle) {
        saveAndSend(sellerId,
            "Phiên đấu giá \"" + auctionTitle + "\" của bạn đã được duyệt và sẽ bắt đầu theo thời gian đã đặt.");
    }

    public void sendAuctionRejectedNotification(Long sellerId, String auctionTitle) {
        saveAndSend(sellerId,
            "Phiên đấu giá \"" + auctionTitle + "\" của bạn đã bị từ chối. Vui lòng kiểm tra lại thông tin sản phẩm.");
    }

    public void sendAuctionEndedWinnerNotification(Long sellerId, String auctionTitle) {
        saveAndSend(sellerId,
            "Phiên đấu giá \"" + auctionTitle + "\" đã kết thúc và có người thắng. Vui lòng xác nhận đơn hàng.");
    }

    public void sendAuctionFailedNotification(Long sellerId, String auctionTitle) {
        saveAndSend(sellerId,
            "Phiên đấu giá \"" + auctionTitle + "\" đã kết thúc nhưng không đạt giá sàn, không có người thắng.");
    }
}