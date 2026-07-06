package com.auction.auction_system.controller;

import com.auction.auction_system.entity.Order;
import com.auction.auction_system.entity.OrderStatus;
import com.auction.auction_system.entity.User;
import com.auction.auction_system.repository.BidRepository;
import com.auction.auction_system.repository.OrderRepository;
import com.auction.auction_system.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/buyers")
public class BuyerProfileController {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final BidRepository bidRepository;

    public BuyerProfileController(
            UserRepository userRepository,
            OrderRepository orderRepository,
            BidRepository bidRepository) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.bidRepository = bidRepository;
    }

    @GetMapping("/{buyerId}")
    public Map<String, Object> getBuyerProfile(@PathVariable Long buyerId) {
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new RuntimeException("Buyer not found"));

        List<Order> orders = orderRepository.findByBuyerOrderByCreatedAtDesc(buyer);
        long totalBids = bidRepository.findByBidderOrderByBidTimeDesc(buyer).size();

        long paidOrders = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.PAID)
                .count();
        long cancelledOrders = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.CANCELLED)
                .count();
        long inProgressOrders = orders.size() - paidOrders - cancelledOrders;

        // Chỉ tính tỉ lệ trên các đơn đã có kết quả rõ ràng (PAID hoặc CANCELLED)
        // Đơn đang xử lý (PENDING/PENDING_CONFIRMATION/SHIPPING) chưa nói lên được gì
        long resolvedOrders = paidOrders + cancelledOrders;
        double paymentRate = resolvedOrders > 0
                ? (double) paidOrders / resolvedOrders * 100
                : 100; // chưa có đơn nào để đánh giá -> mặc định coi là ổn

        // Tính điểm tín dụng (0-100)
        // +5 mỗi đơn đã thanh toán, tối đa 70đ từ số lượng
        // +30đ nếu tỉ lệ thanh toán >= 80%
        int scoreFromCompleted = (int) Math.min(paidOrders * 5, 70);
        int scoreFromRate = paymentRate >= 80 ? 30
                : paymentRate >= 60 ? 20
                : paymentRate >= 40 ? 10 : 0;
        int creditScore = Math.min(scoreFromCompleted + scoreFromRate, 100);

        String creditLevel = creditScore >= 80 ? "Xuất sắc"
                : creditScore >= 60 ? "Tốt"
                : creditScore >= 40 ? "Khá"
                : creditScore >= 20 ? "Trung bình"
                : "Mới";

        // Chỉ trả về thông tin công khai — KHÔNG có email, phone, address
        return Map.ofEntries(
        Map.entry("id", buyer.getId()),
        Map.entry("displayName", buyer.getFullName() != null ? buyer.getFullName() : buyer.getUsername()),
        Map.entry("username", buyer.getUsername()),
        Map.entry("creditScore", creditScore),
        Map.entry("creditLevel", creditLevel),
        Map.entry("paymentRate", Math.round(paymentRate)),
        Map.entry("totalBids", totalBids),
        Map.entry("totalOrders", orders.size()),
        Map.entry("paidOrders", paidOrders),
        Map.entry("cancelledOrders", cancelledOrders),
        Map.entry("inProgressOrders", inProgressOrders)
);
    }
}