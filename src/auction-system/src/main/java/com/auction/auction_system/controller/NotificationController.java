package com.auction.auction_system.controller;

import com.auction.auction_system.entity.Notification;
import com.auction.auction_system.entity.User;
import com.auction.auction_system.repository.NotificationRepository;
import com.auction.auction_system.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationController(
            NotificationRepository notificationRepository,
            UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    // Lấy tất cả notification của user đang đăng nhập
    @GetMapping
    public List<Notification> getMyNotifications(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        // Reload để tránh lazy loading issue
        User freshUser = userRepository.findById(user.getId()).orElse(user);
        return notificationRepository.findByUserOrderByCreatedAtDesc(freshUser);
    }

    // Đánh dấu 1 notification đã đọc
    @PutMapping("/{id}/read")
    public void markOneRead(@PathVariable Long id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUser().getId().equals(user.getId())) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    // Đánh dấu tất cả đã đọc
    @PutMapping("/read-all")
    @Transactional
    public void markAllRead(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        User freshUser = userRepository.findById(user.getId()).orElse(user);
        notificationRepository.markAllReadByUser(freshUser);
    }
}