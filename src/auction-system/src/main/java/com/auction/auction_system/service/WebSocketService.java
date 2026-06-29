package com.auction.auction_system.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void sendBidUpdate(Long auctionId, String message) {

        messagingTemplate.convertAndSend(
                "/topic/auction/" + auctionId,
                message
        );
    }
}