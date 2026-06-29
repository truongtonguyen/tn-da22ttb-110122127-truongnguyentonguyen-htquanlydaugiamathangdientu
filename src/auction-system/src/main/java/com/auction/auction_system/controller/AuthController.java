package com.auction.auction_system.controller;

import com.auction.auction_system.dto.ForgotPasswordRequest;
import com.auction.auction_system.dto.LoginRequest;
import com.auction.auction_system.dto.RegisterRequest;
import com.auction.auction_system.dto.ResetPasswordRequest;
import com.auction.auction_system.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok("Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String token = authService.login(request);
        return ResponseEntity.ok(token);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok("Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request);
            return ResponseEntity.ok("Đặt lại mật khẩu thành công.");
        } catch (RuntimeException e) {
            // ✅ Tách rõ 2 trường hợp reset password
            String msg = switch (e.getMessage()) {
                case "TOKEN_INVALID" -> "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.";
                case "TOKEN_EXPIRED" -> "Liên kết đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu gửi lại email.";
                default              -> e.getMessage();
            };
            return ResponseEntity.badRequest().body(msg);
        }
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        try {
            authService.verifyEmail(token);
            return ResponseEntity.ok("EMAIL_VERIFIED");
        } catch (RuntimeException e) {
            // ✅ Tách rõ 2 trường hợp xác thực email
            String code = switch (e.getMessage()) {
                case "TOKEN_INVALID" -> "EMAIL_TOKEN_INVALID";
                case "TOKEN_EXPIRED" -> "EMAIL_TOKEN_EXPIRED";
                default              -> "ERROR";
            };
            return ResponseEntity.badRequest().body(code);
        }
    }

    @PostMapping("/resend-verification-email")
    public ResponseEntity<?> resendVerificationEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        try {
            authService.resendVerificationEmail(email);
            return ResponseEntity.ok("Email xác thực đã được gửi lại.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}