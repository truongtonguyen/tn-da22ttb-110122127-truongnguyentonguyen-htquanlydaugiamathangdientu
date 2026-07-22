package com.auction.auction_system.controller;

import com.auction.auction_system.entity.Order;
import com.auction.auction_system.entity.User;
import com.auction.auction_system.repository.BidRepository;
import com.auction.auction_system.repository.OrderRepository;
import com.auction.auction_system.repository.UserRepository;
import com.auction.auction_system.service.CreditScoreService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/buyers")
public class BuyerProfileController {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final BidRepository bidRepository;
    private final CreditScoreService creditScoreService;   // ✅ thêm mới

    public BuyerProfileController(
            UserRepository userRepository,
            OrderRepository orderRepository,
            BidRepository bidRepository,
            CreditScoreService creditScoreService) {       // ✅ thêm mới
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.bidRepository = bidRepository;
        this.creditScoreService = creditScoreService;
    }

    @GetMapping("/{buyerId}")
    public Map<String, Object> getBuyerProfile(@PathVariable Long buyerId) {
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new RuntimeException("Buyer not found"));

        List<Order> orders = orderRepository.findByBuyerOrderByCreatedAtDesc(buyer);
        long totalBids = bidRepository.findByBidderOrderByBidTimeDesc(buyer).size();

        long cancelledOrders = orders.stream()
                .filter(o -> o.getStatus() == com.auction.auction_system.entity.OrderStatus.CANCELLED)
                .count();
        long inProgressOrders = orders.size() - cancelledOrders
                - orders.stream().filter(o -> o.getStatus() == com.auction.auction_system.entity.OrderStatus.PAID).count();

        CreditScoreService.BuyerCreditResult credit = creditScoreService.computeBuyerCredit(buyer);

        return Map.ofEntries(
                Map.entry("id", buyer.getId()),
                Map.entry("displayName", buyer.getFullName() != null ? buyer.getFullName() : buyer.getUsername()),
                Map.entry("username", buyer.getUsername()),
                Map.entry("creditScore", credit.creditScore()),
                Map.entry("creditLevel", credit.creditLevel()),
                Map.entry("paymentRate", credit.paymentRate()),
                Map.entry("totalBids", totalBids),
                Map.entry("totalOrders", orders.size()),
                Map.entry("paidOrders", credit.paidOrders()),
                Map.entry("cancelledOrders", cancelledOrders),
                Map.entry("overdueCancelledOrders", credit.overdueCancelled()),
                Map.entry("inProgressOrders", inProgressOrders)
        );
    }
}