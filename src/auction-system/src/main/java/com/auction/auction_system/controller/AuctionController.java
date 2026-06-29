package com.auction.auction_system.controller;

import com.auction.auction_system.dto.CreateAuctionRequest;
import com.auction.auction_system.entity.Auction;
import com.auction.auction_system.entity.AuctionStatus;
import com.auction.auction_system.entity.User;
import com.auction.auction_system.service.AuctionService;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/auctions")
public class AuctionController {

    private final AuctionService auctionService;

    public AuctionController(AuctionService auctionService) {
        this.auctionService = auctionService;
    }

    // =========================
    // CREATE AUCTION
    // =========================
    @PostMapping(
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public Auction createAuction(

            @RequestParam String title,
            @RequestParam String description,

            @RequestParam Long categoryId,

            @RequestParam Double startingPrice,
            @RequestParam(required = false) Double buyNowPrice,
            @RequestParam Integer durationDays,
            @RequestParam Double reservePrice,

            @RequestParam MultipartFile[] images,

            Authentication authentication
    ) {

        User seller =
                (User) authentication.getPrincipal();

        // Kiểm tra email đã được xác thực
        if (!seller.isEmailVerified()) {
            throw new RuntimeException("Your email must be verified before you can create an auction. Please check your email for the verification link.");
        }

        CreateAuctionRequest request =
                new CreateAuctionRequest(
                        title,
                        description,
                        categoryId,
                        startingPrice,
                        buyNowPrice,
                        durationDays,
                        reservePrice
                );

        return auctionService.createAuction(
                request,
                seller,
                images
        );
    }

    @PostMapping("/{auctionId}/buy-now")
        public Auction buyNow(
                @PathVariable Long auctionId,
                Authentication authentication
        ) {
        User buyer = (User) authentication.getPrincipal();
        if (!buyer.isEmailVerified()) {
                throw new RuntimeException("Your email must be verified before you can buy.");
        }
        return auctionService.buyNow(auctionId, buyer);
        }

    // =========================
    // GET ALL AUCTIONS (PAGINATION)
    // =========================
    @GetMapping
    public Page<Auction> getAll(

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size
    ) {

        return auctionService.getAllAuctions(
                page,
                size
        );
    }

    // =========================
    // GET AUCTION BY ID
    // =========================
        @GetMapping("/{id}")
        public Auction getAuctionById(@PathVariable Long id) {
        return auctionService.getAuctionById(id);
        }

    // =========================
    // GET MY AUCTIONS
    // =========================
    @GetMapping("/my-auctions")
    public List<Auction> getMyAuctions(
            Authentication authentication
    ) {

        User seller =
                (User) authentication.getPrincipal();

        return auctionService.getMyAuctions(
                seller
        );
    }

    // =========================
    // SEARCH + PAGINATION
    // =========================
    @GetMapping("/search")
    public Page<Auction> searchAuctions(

            @RequestParam(required = false)
            String keyword,

            @RequestParam(required = false)
            AuctionStatus status,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size
    ) {

        return auctionService.searchAuctions(
                keyword,
                status,
                page,
                size
        );
    }

    // =========================
    // IMAGE
    // =========================
    @GetMapping("/uploads/{filename}")
    public ResponseEntity<Resource> getImage(
            @PathVariable String filename
    ) throws Exception {

        Path filePath =
                Paths.get("uploads")
                        .resolve(filename);

        Resource resource =
                new UrlResource(filePath.toUri());

        if (!resource.exists()) {
            return ResponseEntity
                    .notFound()
                    .build();
        }

        String contentType =
                Files.probeContentType(filePath);

        if (contentType == null) {
            contentType =
                    "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(
                        MediaType.parseMediaType(
                                contentType
                        )
                )
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" +
                                filename +
                                "\""
                )
                .body(resource);
    }
}