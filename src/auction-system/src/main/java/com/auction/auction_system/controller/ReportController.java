package com.auction.auction_system.controller;

import com.auction.auction_system.entity.*;
import com.auction.auction_system.repository.AuctionRepository;
import com.auction.auction_system.repository.ReportRepository;
import com.auction.auction_system.repository.UserRepository;
import com.auction.auction_system.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final AuctionRepository auctionRepository;
    private final UserService userService;

    public ReportController(
            ReportRepository reportRepository,
            UserRepository userRepository,
            AuctionRepository auctionRepository,
            UserService userService) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.auctionRepository = auctionRepository;
        this.userService = userService;
    }

    // =============================================
    // USER: Gửi báo cáo
    // =============================================
    @PostMapping
    public Report createReport(
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        User reporter = (User) authentication.getPrincipal();

        Long reportedUserId = Long.valueOf(body.get("reportedUserId").toString());
        String reasonStr    = body.get("reason").toString();
        String description  = body.getOrDefault("description", "").toString();
        Long auctionId      = body.containsKey("auctionId")
                ? Long.valueOf(body.get("auctionId").toString()) : null;

        User reportedUser = userRepository.findById(reportedUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Không tự báo cáo mình
        if (reporter.getId().equals(reportedUser.getId())) {
            throw new RuntimeException("Bạn không thể báo cáo chính mình");
        }

        // Tránh báo cáo trùng
        if (reportRepository.existsByReporterAndReportedUser(reporter, reportedUser)) {
            throw new RuntimeException("Bạn đã báo cáo người dùng này rồi");
        }

        Report report = Report.builder()
                .reporter(reporter)
                .reportedUser(reportedUser)
                .reason(ReportReason.valueOf(reasonStr))
                .description(description)
                .status(ReportStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        // Gắn auction nếu có
        if (auctionId != null) {
            auctionRepository.findById(auctionId).ifPresent(report::setAuction);
        }

        return reportRepository.save(report);
    }

    // =============================================
    // ADMIN: Xem tất cả báo cáo
    // =============================================
    @GetMapping
    public List<Report> getAllReports(
            @RequestParam(required = false) String status
    ) {
        if (status != null && !status.isBlank()) {
            return reportRepository.findByStatusOrderByCreatedAtDesc(
                    ReportStatus.valueOf(status)
            );
        }
        return reportRepository.findAllByOrderByCreatedAtDesc();
    }

    // =============================================
    // ADMIN: Xử lý báo cáo — Ban hoặc Dismiss
    // =============================================
    @PutMapping("/{id}/resolve")
    @Transactional
    public Report resolveReport(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        if (report.getStatus() != ReportStatus.PENDING) {
            throw new RuntimeException("Báo cáo này đã được xử lý");
        }

        String action    = body.get("action");    // "BAN" hoặc "DISMISS"
        String adminNote = body.getOrDefault("adminNote", "");

        report.setAdminNote(adminNote);
        report.setResolvedAt(LocalDateTime.now());

        if ("BAN".equals(action)) {
            // Ban người bị báo cáo
            userService.banUser(report.getReportedUser().getId());
            report.setStatus(ReportStatus.BANNED);

            // Đánh dấu tất cả report pending của user này là đã xử lý
            reportRepository.findByStatusOrderByCreatedAtDesc(ReportStatus.PENDING)
                    .stream()
                    .filter(r -> r.getReportedUser().getId()
                            .equals(report.getReportedUser().getId()))
                    .forEach(r -> {
                        r.setStatus(ReportStatus.BANNED);
                        r.setResolvedAt(LocalDateTime.now());
                        r.setAdminNote("Tự động đóng khi user bị ban");
                        reportRepository.save(r);
                    });

        } else {
            report.setStatus(ReportStatus.DISMISSED);
        }

        return reportRepository.save(report);
    }
}