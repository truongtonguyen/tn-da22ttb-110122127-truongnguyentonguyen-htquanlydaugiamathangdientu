package com.auction.auction_system.controller;

import com.auction.auction_system.service.WebSocketService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private final WebSocketService webSocketService;

    public TestController(WebSocketService webSocketService) {
        this.webSocketService = webSocketService;
    }

    @PostMapping("/send")
    public String sendMessage() {

        webSocketService.sendBidUpdate(
                1L,
                "HELLO REALTIME"
        );

        return "sent";
    }
}