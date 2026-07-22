package com.auction.auction_system.service;

import com.auction.auction_system.entity.*;
import com.auction.auction_system.repository.OrderRepository;
import com.auction.auction_system.repository.UserRepository;
import com.auction.auction_system.repository.AuctionEntryFeeRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class PaymentService {

    private static final double COMMISSION_RATE = 0.05;
    private static final int AUTO_CONFIRM_DAYS = 7;
    private static final String PAYMENT_METHOD_WALLET = "WALLET";
    private static final int SELLER_SHIPPING_DEADLINE_HOURS = 24;

    // ✅ Các phương thức được phép gọi qua confirm-payment
    // VNPAY không có đây vì xử lý riêng qua PaymentGatewayController
    private static final Set<String> ALLOWED_PAYMENT_METHODS = Set.of("WALLET", "COD");

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final AuctionEntryFeeRepository auctionEntryFeeRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final CreditScoreService creditScoreService;

    public PaymentService(
            OrderRepository orderRepository,
            UserRepository userRepository,
            AuctionEntryFeeRepository auctionEntryFeeRepository,
            NotificationService notificationService,
            EmailService emailService,
            CreditScoreService creditScoreService) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.auctionEntryFeeRepository = auctionEntryFeeRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.creditScoreService = creditScoreService;
    }

    public List<Order> getOrdersByBuyer(User buyer) {
        return orderRepository.findByBuyerOrderByCreatedAtDesc(buyer);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Order> getOrdersBySeller(User seller) {
        return orderRepository.findBySellerOrderByCreatedAtDesc(seller);
    }

    // =============================================
    // Bước 1 (Người mua): PENDING → PENDING_CONFIRMATION
    // Chỉ dùng cho WALLET và COD — VNPAY xử lý riêng qua callback
    // =============================================
    @Transactional
    public Order confirmPayment(Long orderId, String paymentMethod, String paymentNote, User buyer) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (!order.getBuyer().getId().equals(buyer.getId()))
            throw new RuntimeException("Bạn không có quyền thao tác đơn hàng này");
        if (order.getStatus() != OrderStatus.PENDING)
            throw new RuntimeException("Đơn hàng không ở trạng thái chờ thanh toán");

        // ✅ Chặn BANK_TRANSFER, MOMO và VNPAY — không còn hỗ trợ
        if (paymentMethod == null || !ALLOWED_PAYMENT_METHODS.contains(paymentMethod.toUpperCase())) {
            throw new RuntimeException("Phương thức thanh toán không hợp lệ. Vui lòng chọn Ví hoặc COD.");
        }

        User freshBuyer = userRepository.findById(buyer.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        if (freshBuyer.getFullName() == null || freshBuyer.getFullName().isBlank()
                || freshBuyer.getPhone() == null || freshBuyer.getPhone().isBlank()
                || freshBuyer.getAddress() == null || freshBuyer.getAddress().isBlank()) {
            throw new RuntimeException("PROFILE_INCOMPLETE");
        }

        if (PAYMENT_METHOD_WALLET.equalsIgnoreCase(paymentMethod)) {
            double balance = freshBuyer.getBalance() != null ? freshBuyer.getBalance() : 0.0;
            if (balance < order.getFinalPrice()) {
                throw new RuntimeException("INSUFFICIENT_BALANCE_FOR_PAYMENT");
            }
            freshBuyer.setBalance(balance - order.getFinalPrice());
            userRepository.save(freshBuyer);
        }

        order.setPaymentMethod(paymentMethod);
        order.setPaymentNote(paymentNote);
        order.setStatus(OrderStatus.PENDING_CONFIRMATION);
        order.setConfirmedAt(LocalDateTime.now());
        orderRepository.save(order);

        notificationService.sendWinnerNotification(
                order.getAuction().getSeller().getId(),
                "Đơn hàng #" + orderId + " đã được thanh toán"
                        + (PAYMENT_METHOD_WALLET.equalsIgnoreCase(paymentMethod)
                            ? " qua ví (xác thực tự động). Vui lòng xác nhận giao hàng."
                            : " theo hình thức COD. Vui lòng xác nhận giao hàng.")
        );

        return order;
    }

    // =============================================
    // Bước 2 (Người bán): PENDING_CONFIRMATION → SHIPPING
    // =============================================
    @Transactional
    public Order confirmShipping(Long orderId, User seller) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (!order.getAuction().getSeller().getId().equals(seller.getId()))
            throw new RuntimeException("Bạn không có quyền thao tác đơn hàng này");
        if (order.getStatus() != OrderStatus.PENDING_CONFIRMATION)
            throw new RuntimeException("Đơn hàng không ở trạng thái chờ xác nhận");

        order.setStatus(OrderStatus.SHIPPING);
        order.setShippedAt(LocalDateTime.now());
        orderRepository.save(order);

        notificationService.sendWinnerNotification(
                order.getBuyer().getId(),
                "Đơn hàng #" + orderId + " đang được giao đến bạn! Sau khi nhận hàng, vui lòng xác nhận."
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
    // Bước 3 (Người mua): SHIPPING → PAID
    // =============================================
    @Transactional
    public Order completeOrder(Long orderId, User buyer) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (!order.getBuyer().getId().equals(buyer.getId()))
            throw new RuntimeException("Bạn không có quyền xác nhận đơn hàng này");
        if (order.getStatus() != OrderStatus.SHIPPING)
            throw new RuntimeException("Đơn hàng chưa ở trạng thái đang giao");

        return finalizeOrderCompletion(order, false);
    }

    @Transactional
    public Order autoCompleteOrder(Order order) {
        return finalizeOrderCompletion(order, true);
    }

    @Scheduled(fixedRate = 3600000)
    public void checkAutoCompleteOrders() {
        LocalDateTime deadline = LocalDateTime.now().minusDays(AUTO_CONFIRM_DAYS);
        List<Order> overdueShipping = orderRepository.findByStatusAndShippedAtBefore(OrderStatus.SHIPPING, deadline);
        for (Order order : overdueShipping) {
            autoCompleteOrder(order);
        }
    }

    private Order finalizeOrderCompletion(Order order, boolean autoConfirmed) {
        double commission     = Math.round(order.getFinalPrice() * COMMISSION_RATE * 100.0) / 100.0;
        double sellerReceives = Math.round((order.getFinalPrice() - commission) * 100.0) / 100.0;

        order.setCommissionFee(commission);
        order.setSellerReceives(sellerReceives);
        order.setStatus(OrderStatus.PAID);
        order.setCompletedAt(LocalDateTime.now());
        orderRepository.save(order);

        User seller = userRepository.findById(order.getAuction().getSeller().getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người bán"));
        double sellerBalance = seller.getBalance() != null ? seller.getBalance() : 0.0;
        seller.setBalance(sellerBalance + sellerReceives);
        userRepository.save(seller);

        User buyer = order.getBuyer();
        auctionEntryFeeRepository
                .findByAuctionIdAndBidderId(order.getAuction().getId(), buyer.getId())
                .filter(fee -> !fee.getRefunded())
                .ifPresent(fee -> {
                    User freshBuyer = userRepository.findById(buyer.getId())
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
                    double balance = freshBuyer.getBalance() != null ? freshBuyer.getBalance() : 0.0;
                    freshBuyer.setBalance(balance + fee.getFeeAmount());
                    userRepository.save(freshBuyer);
                    fee.setRefunded(true);
                    fee.setRefundedAt(LocalDateTime.now());
                    auctionEntryFeeRepository.save(fee);
                });

        notificationService.sendWinnerNotification(buyer.getId(),
                autoConfirmed
                ? "Đơn hàng #" + order.getId() + " đã được hệ thống tự động xác nhận hoàn thành sau " + AUTO_CONFIRM_DAYS + " ngày không có phản hồi từ bạn."
                : "Cảm ơn bạn đã xác nhận! Đơn hàng #" + order.getId() + " đã hoàn thành.");

        notificationService.sendWinnerNotification(seller.getId(),
                autoConfirmed
                ? String.format("Đơn #%d đã được hệ thống tự xác nhận sau %d ngày. Bạn nhận được %,.0f VNĐ (sau phí 5%% hoa hồng) đã cộng vào ví.", order.getId(), AUTO_CONFIRM_DAYS, sellerReceives)
                : String.format("Người mua đã xác nhận nhận hàng! Đơn #%d hoàn thành. Bạn nhận được %,.0f VNĐ (sau phí 5%% hoa hồng) đã cộng vào ví.", order.getId(), sellerReceives));

        return order;
    }

    // =============================================
    // Hủy đơn (người mua tự hủy)
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

        // ✅ Hoàn tiền ví nếu đã thanh toán qua ví
        if (PAYMENT_METHOD_WALLET.equalsIgnoreCase(order.getPaymentMethod())
                && order.getStatus() == OrderStatus.PENDING_CONFIRMATION) {
            User freshBuyer = userRepository.findById(buyer.getId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
            double balance = freshBuyer.getBalance() != null ? freshBuyer.getBalance() : 0.0;
            freshBuyer.setBalance(balance + order.getFinalPrice());
            userRepository.save(freshBuyer);
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        auctionEntryFeeRepository
                .findByAuctionIdAndBidderId(order.getAuction().getId(), buyer.getId())
                .filter(fee -> !fee.getRefunded())
                .ifPresent(fee -> {
                    User seller = userRepository.findById(order.getAuction().getSeller().getId())
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy người bán"));
                    double sellerBalance = seller.getBalance() != null ? seller.getBalance() : 0.0;
                    seller.setBalance(sellerBalance + fee.getFeeAmount());
                    userRepository.save(seller);
                    fee.setRefunded(true);
                    fee.setRefundedAt(LocalDateTime.now());
                    auctionEntryFeeRepository.save(fee);
                    notificationService.sendWinnerNotification(seller.getId(),
                            "Người mua đã hủy đơn hàng #" + orderId + ". Bạn nhận được "
                                    + String.format("%,.0f", fee.getFeeAmount()) + " VNĐ bồi thường từ phí tham gia.");
                });

        return order;
    }

    // =============================================
    // Hủy đơn TỰ ĐỘNG do quá hạn thanh toán
    // =============================================
    @Transactional
    public void cancelOverdueOrder(Order order) {
        order.setStatus(OrderStatus.CANCELLED);
        order.setIsOverdueCancel(true);
        orderRepository.save(order);

        User buyer = userRepository.findById(order.getBuyer().getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (creditScoreService.shouldAutoBan(buyer)) {
            buyer.setBanned(true);
            userRepository.save(buyer);
        }

        auctionEntryFeeRepository
                .findByAuctionIdAndBidderId(order.getAuction().getId(), buyer.getId())
                .filter(fee -> !fee.getRefunded())
                .ifPresent(fee -> {
                    User seller = userRepository.findById(order.getAuction().getSeller().getId())
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy người bán"));
                    double sellerBalance = seller.getBalance() != null ? seller.getBalance() : 0.0;
                    seller.setBalance(sellerBalance + fee.getFeeAmount());
                    userRepository.save(seller);
                    fee.setRefunded(true);
                    fee.setRefundedAt(LocalDateTime.now());
                    auctionEntryFeeRepository.save(fee);
                });

        notificationService.sendWinnerNotification(buyer.getId(),
                "Đơn hàng #" + order.getId() + " đã bị hủy do quá hạn thanh toán 48 giờ."
                        + (Boolean.TRUE.equals(buyer.isBanned()) ? " Tài khoản của bạn đã bị khóa do vi phạm nhiều lần." : ""));

        notificationService.sendWinnerNotification(order.getAuction().getSeller().getId(),
                "Người mua không thanh toán đúng hạn cho đơn #" + order.getId() + ". Bạn đã nhận được bồi thường từ phí tham gia.");
    }

    @Scheduled(fixedRate = 1800000)
    public void checkLateShippingOrders() {
        LocalDateTime deadline = LocalDateTime.now().minusHours(SELLER_SHIPPING_DEADLINE_HOURS);
        List<Order> lateOrders = orderRepository.findByStatusAndConfirmedAtBeforeAndLatePenaltyAppliedFalse(
                OrderStatus.PENDING_CONFIRMATION, deadline);

        for (Order order : lateOrders) {
            order.setLatePenaltyApplied(true);
            orderRepository.save(order);

            User seller = userRepository.findById(order.getAuction().getSeller().getId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người bán"));

            boolean shouldBan = creditScoreService.shouldAutoBanSeller(seller);
            if (shouldBan) { seller.setBanned(true); userRepository.save(seller); }

            notificationService.sendWinnerNotification(seller.getId(),
                    "Cảnh cáo: Đơn hàng #" + order.getId() + " đã quá " + SELLER_SHIPPING_DEADLINE_HOURS
                            + " giờ mà bạn chưa xác nhận giao hàng. Uy tín của bạn đã bị giảm."
                            + (shouldBan ? " Tài khoản của bạn đã bị khóa do vi phạm nhiều lần." : ""));

            notificationService.sendWinnerNotification(order.getBuyer().getId(),
                    "Đơn hàng #" + order.getId() + " của bạn đang bị chậm giao. Chúng tôi đã nhắc nhở người bán.");
        }
    }
}