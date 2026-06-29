package com.auction.auction_system.repository;

import com.auction.auction_system.entity.Report;
import com.auction.auction_system.entity.ReportStatus;
import com.auction.auction_system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findAllByOrderByCreatedAtDesc();

    List<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status);

    // Kiểm tra user đã báo cáo người này chưa (tránh spam)
    boolean existsByReporterAndReportedUser(User reporter, User reportedUser);

    // Đếm số report pending của một user
    long countByReportedUserAndStatus(User reportedUser, ReportStatus status);
}