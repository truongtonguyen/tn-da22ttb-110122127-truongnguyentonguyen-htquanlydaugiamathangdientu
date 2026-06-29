package com.auction.auction_system.service;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final boolean mailEnabled;

    @Value("${spring.mail.username:noreply@auction-system.com}")
    private String fromEmail;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.mailEnabled = this.mailSender != null;
    }

    public void sendPasswordResetEmail(String to, String resetLink) {
        if (!mailEnabled) {
            System.out.println("=== PASSWORD RESET EMAIL (Console Mode) ===");
            System.out.println("To: " + to);
            System.out.println("Reset Link: " + resetLink);
            System.out.println("==========================================");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Đặt lại mật khẩu - Auction System");

            String htmlContent = buildPasswordResetHtml(resetLink);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            System.out.println("Password reset email sent to: " + to);
        } catch (MessagingException e) {
            System.err.println("Failed to send password reset email: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }

    public void sendEmailVerificationEmail(String to, String verificationLink) {
        if (!mailEnabled) {
            System.out.println("=== EMAIL VERIFICATION EMAIL (Console Mode) ===");
            System.out.println("To: " + to);
            System.out.println("Verification Link: " + verificationLink);
            System.out.println("================================================");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Xác thực email - Auction System");

            String htmlContent = buildEmailVerificationHtml(verificationLink);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            System.out.println("Email verification email sent to: " + to);
        } catch (MessagingException e) {
            System.err.println("Failed to send email verification: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send email verification", e);
        }
    }

    public void sendWinnerNotification(String to, String auctionTitle, String price) {
        if (!mailEnabled) {
            System.out.println("=== WINNER NOTIFICATION EMAIL (Console Mode) ===");
            System.out.println("To: " + to);
            System.out.println("Auction: " + auctionTitle);
            System.out.println("Price: " + price);
            System.out.println("================================================");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Chúc mừng! Bạn đã thắng đấu giá - Auction System");

            String htmlContent = buildWinnerNotificationHtml(auctionTitle, price);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            System.out.println("Winner notification email sent to: " + to);
        } catch (MessagingException e) {
            System.err.println("Failed to send winner notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String buildPasswordResetHtml(String resetLink) {
        return "<html>" +
                "<body style='font-family: Arial, sans-serif; color: #333;'>" +
                "<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>" +
                "<h2 style='color: #ff5722;'>Đặt lại mật khẩu</h2>" +
                "<p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>" +
                "<p>Vui lòng nhấp vào liên kết bên dưới để tiếp tục:</p>" +
                "<a href='" + resetLink + "' style='display: inline-block; padding: 12px 24px; background-color: #ff5722; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;'>Đặt lại mật khẩu</a>" +
                "<p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>" +
                "<p>Lưu ý: Liên kết này sẽ hết hạn trong 1 giờ.</p>" +
                "<hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'>" +
                "<p style='font-size: 12px; color: #999;'>Auction System - Hệ thống đấu giá trực tuyến</p>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    private String buildWinnerNotificationHtml(String auctionTitle, String price) {
        return "<html>" +
                "<body style='font-family: Arial, sans-serif; color: #333;'>" +
                "<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>" +
                "<h2 style='color: #4caf50;'>🏆 Chúc mừng!</h2>" +
                "<p>Bạn đã thắng trong cuộc đấu giá:</p>" +
                "<div style='background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;'>" +
                "<p><strong>Sản phẩm:</strong> " + auctionTitle + "</p>" +
                "<p><strong>Giá cuối cùng:</strong> " + price + " VND</p>" +
                "</div>" +
                "<p>Vui lòng đăng nhập vào tài khoản của bạn để xem chi tiết đơn hàng và hoàn tất thanh toán.</p>" +
                "<a href='http://localhost:3000/profile' style='display: inline-block; padding: 12px 24px; background-color: #ff5722; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;'>Xem đơn hàng</a>" +
                "<hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'>" +
                "<p style='font-size: 12px; color: #999;'>Auction System - Hệ thống đấu giá trực tuyến</p>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    private String buildEmailVerificationHtml(String verificationLink) {
        return "<html>" +
                "<body style='font-family: Arial, sans-serif; color: #333;'>" +
                "<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>" +
                "<h2 style='color: #2196F3;'>✉️ Xác thực email của bạn</h2>" +
                "<p>Cảm ơn bạn đã đăng ký tài khoản Auction System!</p>" +
                "<p>Vui lòng nhấp vào liên kết bên dưới để xác thực email của bạn:</p>" +
                "<a href='" + verificationLink + "' style='display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;'>Xác thực Email</a>" +
                "<p style='font-size: 14px; color: #666;'>Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.</p>" +
                "<p style='font-size: 12px; color: #999;'>Lưu ý: Liên kết này sẽ hết hạn trong 24 giờ.</p>" +
                "<hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'>" +
                "<p style='font-size: 12px; color: #999;'>Auction System - Hệ thống đấu giá trực tuyến</p>" +
                "</div>" +
                "</body>" +
                "</html>";
    }
}
