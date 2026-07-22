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

    // ✅ Bước 1: kiểm tra email + mật khẩu → gửi OTP SMS (hoặc đăng nhập thẳng nếu app.otp.enabled=false)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            String token = authService.login(request);

            if (token != null) {
                // OTP đang TẮT (app.otp.enabled=false) -> đăng nhập thành công luôn, không cần bước verify-otp
                return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "token", token
                ));
            }

            // OTP đang BẬT -> giữ nguyên hành vi cũ, chờ verify-otp
            return ResponseEntity.ok(Map.of(
                "status", "OTP_SENT",
                "message", "Mã OTP đã được gửi đến số điện thoại của bạn."
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ✅ Bước 2: xác minh OTP → trả về JWT token
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(
            @RequestBody Map<String, String> body,
            jakarta.servlet.http.HttpServletRequest httpRequest   // ✅ thêm tham số
    ) {
        String email = body.get("email");
        String otp   = body.get("otp");
        try {
            String clientIp = com.auction.auction_system.util.IpUtils.getClientIp(httpRequest);   // ✅ lấy IP
            String token = authService.verifyLoginOtp(email, otp, clientIp);   // ✅ truyền IP
            return ResponseEntity.ok(token);
        } catch (RuntimeException e) {
            String msg = e.getMessage();
            if (msg.startsWith("OTP_LOCKED:")) {
                long minutes = Long.parseLong(msg.split(":")[1]);
                return ResponseEntity.badRequest().body(Map.of(
                    "status", "OTP_LOCKED",
                    "message", "Nhập sai quá 5 lần. Vui lòng thử lại sau " + minutes + " phút.",
                    "lockedMinutes", minutes
                ));
            }
            if (msg.startsWith("OTP_WRONG:")) {
                int remaining = Integer.parseInt(msg.split(":")[1]);
                return ResponseEntity.badRequest().body(Map.of(
                    "status", "OTP_WRONG",
                    "message", "Mã OTP không đúng. Còn " + remaining + " lần thử.",
                    "remaining", remaining
                ));
            }
            String friendlyMsg = switch (msg) {
                case "OTP_EXPIRED"   -> "Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại.";
                case "OTP_NOT_FOUND" -> "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.";
                default              -> msg;
            };
            return ResponseEntity.badRequest().body(Map.of(
                "status", "ERROR",
                "message", friendlyMsg
            ));
        }
    }

    // ✅ Gửi lại OTP
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        try {
            authService.resendLoginOtp(email);
            return ResponseEntity.ok(Map.of("message", "Đã gửi lại mã OTP. Vui lòng kiểm tra tin nhắn."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
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
                case "TOKEN_ALREADY_VERIFIED" -> "ALREADY_VERIFIED";
                case "TOKEN_INVALID"          -> "TOKEN_INVALID";
                default                       -> "ERROR";
            };
            return ResponseEntity.ok(Map.of("status", code));
        }
    }

    @PostMapping("/resend-verification-email")
    public ResponseEntity<?> resendVerificationEmail(@RequestBody Map<String, String> request) {
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