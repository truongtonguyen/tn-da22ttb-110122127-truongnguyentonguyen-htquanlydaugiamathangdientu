package com.auction.auction_system.controller;

import com.auction.auction_system.entity.Order;
import com.auction.auction_system.entity.User;
import com.auction.auction_system.service.PaymentService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // Người mua: lấy đơn hàng của mình
    @GetMapping("/my-orders")
    public List<Order> getMyOrders(Authentication authentication) {
        User buyer = (User) authentication.getPrincipal();
        return paymentService.getOrdersByBuyer(buyer);
    }

    // Người bán: lấy đơn hàng từ phiên của mình
    @GetMapping("/seller-orders")
    public List<Order> getSellerOrders(Authentication authentication) {
        User seller = (User) authentication.getPrincipal();
        return paymentService.getOrdersBySeller(seller);
    }

    // Người mua: xác nhận đã thanh toán (PENDING → PENDING_CONFIRMATION)
    @PostMapping("/{orderId}/confirm-payment")
    public Order confirmPayment(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        User buyer  = (User) authentication.getPrincipal();
        return paymentService.confirmPayment(orderId, body.get("paymentMethod"), body.get("paymentNote"), buyer);
    }

    // ✅ Người mua: xác nhận đã nhận hàng OK (SHIPPING → PAID)
    @PostMapping("/{orderId}/complete")
    public Order completeOrder(
            @PathVariable Long orderId,
            Authentication authentication
    ) {
        User buyer = (User) authentication.getPrincipal();
        return paymentService.completeOrder(orderId, buyer);
    }

    // Người mua: hủy đơn
    @PostMapping("/{orderId}/cancel")
    public Order cancelOrder(
            @PathVariable Long orderId,
            Authentication authentication
    ) {
        User buyer = (User) authentication.getPrincipal();
        return paymentService.cancelOrder(orderId, buyer);
    }

    // Admin: lấy tất cả đơn hàng
    @GetMapping
    public List<Order> getAllOrders() {
        return paymentService.getAllOrders();
    }

    // ✅ Người bán: xác nhận giao hàng (PENDING_CONFIRMATION → SHIPPING)
    @PostMapping("/{orderId}/confirm-shipping")
    public Order confirmShipping(
            @PathVariable Long orderId,
            Authentication authentication
    ) {
        User seller = (User) authentication.getPrincipal();
        return paymentService.confirmShipping(orderId, seller);
    }
}