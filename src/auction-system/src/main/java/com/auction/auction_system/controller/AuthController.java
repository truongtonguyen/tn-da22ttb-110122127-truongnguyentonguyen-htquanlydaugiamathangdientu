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
        return ResponseEntity.ok(Map.of("message", "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String token = authService.login(request);
        return ResponseEntity.ok(token);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(Map.of("message", "Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request);
            return ResponseEntity.ok(Map.of("status", "SUCCESS"));
        } catch (RuntimeException e) {
            String code = switch (e.getMessage()) {
                case "TOKEN_EXPIRED" -> "TOKEN_EXPIRED";
                case "TOKEN_INVALID" -> "TOKEN_INVALID";
                default              -> "ERROR";
            };
            return ResponseEntity.ok(Map.of("status", code));
        }
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        try {
            authService.verifyEmail(token);
            return ResponseEntity.ok(Map.of("status", "SUCCESS"));
        } catch (RuntimeException e) {
            String code = switch (e.getMessage()) {
                case "TOKEN_EXPIRED"          -> "TOKEN_EXPIRED";
                // ✅ Đã xác thực rồi → trạng thái riêng
                case "TOKEN_ALREADY_VERIFIED" -> "ALREADY_VERIFIED";
                // Token không tìm thấy (đã dùng và bị xóa, hoặc sai)
                case "TOKEN_NOT_FOUND"        -> "TOKEN_NOT_FOUND";
                default                       -> "ERROR";
            };
            return ResponseEntity.ok(Map.of("status", code));
        }
    }

    @PostMapping("/resend-verification-email")
    public ResponseEntity<?> resendVerificationEmail(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        try {
            authService.resendVerificationEmail(email);
            return ResponseEntity.ok(Map.of("message", "Email xác thực đã được gửi lại."));
        } catch (RuntimeException e) {
            String msg = switch (e.getMessage()) {
                case "EMAIL_ALREADY_VERIFIED" -> "Email này đã được xác thực rồi. Bạn có thể đăng nhập.";
                default                       -> e.getMessage();
            };
            return ResponseEntity.badRequest().body(Map.of("message", msg));
        }
    }
}