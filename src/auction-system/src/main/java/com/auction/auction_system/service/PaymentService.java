package com.auction.auction_system.service;

import com.auction.auction_system.entity.*;
import com.auction.auction_system.repository.OrderRepository;
import com.auction.auction_system.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentService {

    private static final double COMMISSION_RATE = 0.05; // 5%

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public PaymentService(
            OrderRepository orderRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            EmailService emailService) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    public List<Order> getOrdersByBuyer(User buyer) {
        return orderRepository.findByBuyerOrderByCreatedAtDesc(buyer);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    // ✅ Lấy đơn hàng theo người bán (để hiển thị doanh thu cho seller)
    public List<Order> getOrdersBySeller(User seller) {
        return orderRepository.findBySellerOrderByCreatedAtDesc(seller);
    }

    // =============================================
    // Bước 1 (Người mua): PENDING → PENDING_CONFIRMATION
    // =============================================
    @Transactional
    public Order confirmPayment(Long orderId, String paymentMethod, String paymentNote, User buyer) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (!order.getBuyer().getId().equals(buyer.getId()))
            throw new RuntimeException("Bạn không có quyền thao tác đơn hàng này");
        if (order.getStatus() != OrderStatus.PENDING)
            throw new RuntimeException("Đơn hàng không ở trạng thái chờ thanh toán");

        User freshBuyer = userRepository.findById(buyer.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        if (freshBuyer.getFullName() == null || freshBuyer.getFullName().isBlank()
                || freshBuyer.getPhone() == null || freshBuyer.getPhone().isBlank()
                || freshBuyer.getAddress() == null || freshBuyer.getAddress().isBlank()) {
            throw new RuntimeException("PROFILE_INCOMPLETE");
        }

        order.setPaymentMethod(paymentMethod);
        order.setPaymentNote(paymentNote);
        order.setStatus(OrderStatus.PENDING_CONFIRMATION);
        order.setConfirmedAt(LocalDateTime.now());
        orderRepository.save(order);

        notificationService.sendWinnerNotification(1L,
                "Đơn hàng #" + orderId + " cần xác nhận thanh toán — " +
                order.getAuction().getTitle());

        return order;
    }

    // =============================================
    // Bước 2 (Admin): PENDING_CONFIRMATION → SHIPPING
    // =============================================
    @Transactional
    public Order confirmShipping(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (order.getStatus() != OrderStatus.PENDING_CONFIRMATION)
            throw new RuntimeException("Đơn hàng không ở trạng thái chờ xác nhận");

        order.setStatus(OrderStatus.SHIPPING);
        order.setShippedAt(LocalDateTime.now());
        orderRepository.save(order);

        notificationService.sendWinnerNotification(
                order.getBuyer().getId(),
                "Đơn hàng #" + orderId + " đang được giao đến bạn!"
        );
        try {
            emailService.sendWinnerNotification(
                    order.getBuyer().getEmail(),
                    "Đơn hàng đang giao: " + order.getAuction().getTitle(),
                    String.format("%,.0f", order.getFinalPrice())
            );
        } catch (Exception e) {
            System.err.println("Failed to send shipping email: " + e.getMessage());
        }

        return order;
    }

    // =============================================
    // Bước 3 (Admin): SHIPPING → PAID
    // ✅ Tính hoa hồng 5% tại đây
    // =============================================
    @Transactional
    public Order completeOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (order.getStatus() != OrderStatus.SHIPPING)
            throw new RuntimeException("Đơn hàng chưa ở trạng thái đang giao");

        // ✅ Tính hoa hồng 5% trên giá cuối
        double commission    = Math.round(order.getFinalPrice() * COMMISSION_RATE * 100.0) / 100.0;
        double sellerReceives = Math.round((order.getFinalPrice() - commission) * 100.0) / 100.0;

        order.setCommissionFee(commission);
        order.setSellerReceives(sellerReceives);
        order.setStatus(OrderStatus.PAID);
        order.setCompletedAt(LocalDateTime.now());
        orderRepository.save(order);

        // Thông báo người mua
        notificationService.sendWinnerNotification(
                order.getBuyer().getId(),
                "Đơn hàng #" + orderId + " đã hoàn thành. Cảm ơn bạn!"
        );

        // ✅ Thông báo người bán về doanh thu
        notificationService.sendWinnerNotification(
                order.getAuction().getSeller().getId(),
                String.format("Đơn hàng #%d hoàn thành! Bạn nhận được %,.0f VNĐ (sau phí 5%% hoa hồng)",
                        orderId, sellerReceives)
        );

        return order;
    }

    // =============================================
    // Hủy đơn
    // =============================================
    @Transactional
    public Order cancelOrder(Long orderId, User buyer) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (!order.getBuyer().getId().equals(buyer.getId()))
            throw new RuntimeException("Bạn không có quyền hủy đơn hàng này");
        if (order.getStatus() == OrderStatus.SHIPPING || order.getStatus() == OrderStatus.PAID)
            throw new RuntimeException("Không thể hủy đơn hàng đang giao hoặc đã hoàn thành");
        if (order.getStatus() == OrderStatus.CANCELLED)
            throw new RuntimeException("Đơn hàng đã bị hủy trước đó");

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
        return order;
    }
}