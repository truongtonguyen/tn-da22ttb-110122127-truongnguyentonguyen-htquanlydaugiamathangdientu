package com.auction.auction_system.controller;

import com.auction.auction_system.entity.*;
import com.auction.auction_system.repository.OrderRepository;
import com.auction.auction_system.repository.UserRepository;
import com.auction.auction_system.repository.WalletTopupRepository;
import com.auction.auction_system.service.NotificationService;
import com.auction.auction_system.service.VNPayService;
import com.auction.auction_system.util.IpUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentGatewayController {

    private final VNPayService vnPayService;
    private final WalletTopupRepository walletTopupRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public PaymentGatewayController(
            VNPayService vnPayService,
            WalletTopupRepository walletTopupRepository,
            OrderRepository orderRepository,
            UserRepository userRepository,
            NotificationService notificationService) {
        this.vnPayService = vnPayService;
        this.walletTopupRepository = walletTopupRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // ── Tạo URL nạp ví ──
    @PostMapping("/wallet-topup-url")
    public Map<String, String> createWalletTopupUrl(
            @RequestBody Map<String, Object> body,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        User user = (User) authentication.getPrincipal();
        Long amount = Long.valueOf(body.get("amount").toString());
        if (amount <= 0) throw new RuntimeException("Số tiền phải lớn hơn 0");

        String txnRef = "TOPUP" + user.getId() + "_" + System.currentTimeMillis();

        WalletTopupRequest request = WalletTopupRequest.builder()
                .user(user)
                .amount((double) amount)
                .status(WalletTopupStatus.PENDING)
                .note("Thanh toán qua VNPay")
                .vnpTxnRef(txnRef)
                .createdAt(LocalDateTime.now())
                .build();
        walletTopupRepository.save(request);

        String ip = IpUtils.getClientIp(httpRequest);
        String paymentUrl = vnPayService.createPaymentUrl(txnRef, amount, "Nap tien vi user " + user.getId(), ip);
        return Map.of("paymentUrl", paymentUrl);
    }

    // ── Tạo URL thanh toán đơn hàng ──
    @PostMapping("/order-payment-url/{orderId}")
        public Map<String, String> createOrderPaymentUrl(
                @PathVariable Long orderId,
                Authentication authentication,
                HttpServletRequest httpRequest
        ) {
            User buyer = (User) authentication.getPrincipal();

        // ✅ Chặn nếu thiếu thông tin giao hàng
        if (buyer.getFullName() == null || buyer.getFullName().isBlank()
                || buyer.getPhone() == null || buyer.getPhone().isBlank()
                || buyer.getAddress() == null || buyer.getAddress().isBlank()) {
            throw new RuntimeException("PROFILE_INCOMPLETE");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (!order.getBuyer().getId().equals(buyer.getId()))
            throw new RuntimeException("Bạn không có quyền thao tác đơn hàng này");
        if (order.getStatus() != OrderStatus.PENDING)
            throw new RuntimeException("Đơn hàng không ở trạng thái chờ thanh toán");

        String txnRef = "ORDERPAY" + orderId + "_" + System.currentTimeMillis();
        order.setVnpTxnRef(txnRef);
        orderRepository.save(order);

        String ip = IpUtils.getClientIp(httpRequest);
        String paymentUrl = vnPayService.createPaymentUrl(
                txnRef, order.getFinalPrice().longValue(), "Thanh toan don hang " + orderId, ip
        );
        return Map.of("paymentUrl", paymentUrl);
    }

    // ── IPN: VNPay server gọi để xác nhận giao dịch ──
    // React gọi endpoint này sau khi nhận params từ VNPay redirect
    @GetMapping("/vnpay-callback")
    public Map<String, Object> vnpayCallback(HttpServletRequest request) {
        Map<String, String> params = extractParams(request);

        String txnRef       = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        boolean validSignature = vnPayService.verifySignature(params);
        boolean vnpaySuccess   = validSignature && "00".equals(responseCode);

        System.out.println("=== VNPAY CALLBACK (from React) ===");
        System.out.println("txnRef: " + txnRef);
        System.out.println("responseCode: " + responseCode);
        System.out.println("validSignature: " + validSignature);
        System.out.println("vnpaySuccess: " + vnpaySuccess);

        if (validSignature) {
            processTransaction(txnRef, vnpaySuccess);
        }

        String type = txnRef != null && txnRef.startsWith("TOPUP") ? "wallet" : "order";
        return Map.of(
            "success", vnpaySuccess,
            "type", type,
            "txnRef", txnRef != null ? txnRef : ""
        );
    }

    @GetMapping("/vnpay-ipn")
    public Map<String, String> vnpayIpn(HttpServletRequest request) {
        Map<String, String> params = extractParams(request);
        if (!vnPayService.verifySignature(params)) {
            return Map.of("RspCode", "97", "Message", "Invalid signature");
        }
        String txnRef      = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        processTransaction(txnRef, "00".equals(responseCode));
        return Map.of("RspCode", "00", "Message", "Confirm Success");
    }

    // ── Return: redirect người dùng sau khi thanh toán ──
    @GetMapping("/vnpay-return")
    public void vnpayReturn(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setHeader("ngrok-skip-browser-warning", "true");
        Map<String, String> params = extractParams(request);

        String txnRef       = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        boolean validSignature = vnPayService.verifySignature(params);
        boolean vnpaySuccess   = validSignature && "00".equals(responseCode);

        System.out.println("=== VNPAY RETURN ===");
        System.out.println("txnRef: " + txnRef);
        System.out.println("responseCode: " + responseCode);
        System.out.println("validSignature: " + validSignature);
        System.out.println("vnpaySuccess: " + vnpaySuccess);
        System.out.println("all params: " + params);

        if (validSignature) {
            processTransaction(txnRef, vnpaySuccess);
        }

        String redirectPath = txnRef != null && txnRef.startsWith("TOPUP") ? "/wallet" : "/profile";
        response.sendRedirect("http://localhost:3000" + redirectPath
                + "?paymentStatus=" + (vnpaySuccess ? "success" : "failed"));
    }

    private void processTransaction(String txnRef, boolean success) {
        if (txnRef == null) return;

        if (txnRef.startsWith("TOPUP")) {
            walletTopupRepository.findByVnpTxnRef(txnRef).ifPresent(req -> {
                if (req.getStatus() != WalletTopupStatus.PENDING) return;

                if (success) {
                    User user = userRepository.findById(req.getUser().getId())
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
                    double balance = user.getBalance() != null ? user.getBalance() : 0.0;
                    user.setBalance(balance + req.getAmount());
                    userRepository.save(user);

                    req.setStatus(WalletTopupStatus.APPROVED);
                    req.setConfirmedAt(LocalDateTime.now());

                    notificationService.sendWinnerNotification(
                            user.getId(),
                            "Nạp tiền qua VNPay thành công! Số dư hiện tại: "
                                    + String.format("%,.0f", user.getBalance()) + " VNĐ"
                    );
                } else {
                    req.setStatus(WalletTopupStatus.REJECTED);
                    req.setConfirmedAt(LocalDateTime.now());
                }
                walletTopupRepository.save(req);
            });

        } else if (txnRef.startsWith("ORDERPAY")) {
            orderRepository.findByVnpTxnRef(txnRef).ifPresent(order -> {
                if (order.getStatus() != OrderStatus.PENDING) return;

                if (success) {
                    order.setPaymentMethod("VNPAY");
                    order.setStatus(OrderStatus.PENDING_CONFIRMATION);
                    order.setConfirmedAt(LocalDateTime.now());
                    orderRepository.save(order);

                    notificationService.sendWinnerNotification(
                            order.getAuction().getSeller().getId(),
                            "Đơn hàng #" + order.getId() + " đã được thanh toán qua VNPay."
                    );
                }
            });
        }
    }

    private Map<String, String> extractParams(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        request.getParameterMap().forEach((key, values) -> {
            if (values.length > 0) params.put(key, values[0]);
        });
        return params;
    }
}