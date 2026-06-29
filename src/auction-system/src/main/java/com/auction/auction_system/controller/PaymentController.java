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

    // ✅ Người bán: lấy đơn hàng từ phiên đấu giá của mình
    @GetMapping("/seller-orders")
    public List<Order> getSellerOrders(Authentication authentication) {
        User seller = (User) authentication.getPrincipal();
        return paymentService.getOrdersBySeller(seller);
    }

    // Người mua: xác nhận đã thanh toán
    @PostMapping("/{orderId}/confirm-payment")
    public Order confirmPayment(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        User buyer  = (User) authentication.getPrincipal();
        String method = body.get("paymentMethod");
        String note   = body.get("paymentNote");
        return paymentService.confirmPayment(orderId, method, note, buyer);
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

    // Admin: xác nhận giao hàng
    @PostMapping("/{orderId}/confirm-shipping")
    public Order confirmShipping(@PathVariable Long orderId) {
        return paymentService.confirmShipping(orderId);
    }

    // Admin: xác nhận giao xong → PAID + tính hoa hồng
    @PostMapping("/{orderId}/complete")
    public Order completeOrder(@PathVariable Long orderId) {
        return paymentService.completeOrder(orderId);
    }
}