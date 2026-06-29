package com.auction.auction_system.service;

import com.auction.auction_system.dto.OrderResponseDTO;
import com.auction.auction_system.entity.Auction;
import com.auction.auction_system.entity.Order;
import com.auction.auction_system.entity.OrderStatus;
import com.auction.auction_system.repository.OrderRepository;
import com.auction.auction_system.entity.User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public Order createOrder(Auction auction, User winner) {

        Order order = new Order();
        order.setAuction(auction);
        order.setBuyer(winner);
        order.setFinalPrice(auction.getCurrentPrice());
        order.setStatus(OrderStatus.PENDING);
        order.setCreatedAt(LocalDateTime.now());

        return orderRepository.save(order);
    }

    public List<OrderResponseDTO> getAllOrders() {

    return orderRepository.findAll()
            .stream()
            .map(order -> OrderResponseDTO.builder()
                    .id(order.getId())
                    .auctionId(order.getAuction().getId())
                    .auctionTitle(order.getAuction().getTitle())
                    .buyerName(order.getBuyer().getUsername())
                    .finalPrice(order.getFinalPrice())
                    .status(order.getStatus().name())
                    .build())
            .toList();
}
}