package com.auction.auction_system.service;

import com.auction.auction_system.dto.ForgotPasswordRequest;
import com.auction.auction_system.dto.LoginRequest;
import com.auction.auction_system.dto.RegisterRequest;
import com.auction.auction_system.dto.ResetPasswordRequest;
import com.auction.auction_system.entity.User;

public interface AuthService {
    User register(RegisterRequest request);

    // Bước 1: kiểm tra email + mật khẩu → gửi OTP SMS
    String login(LoginRequest request);

    // Bước 2: xác minh OTP → trả về JWT token
    String verifyLoginOtp(String email, String otp, String clientIp);

    // Gửi lại OTP (khi hết hạn hoặc không nhận được)
    void resendLoginOtp(String email);

    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
    void verifyEmail(String token);
    void resendVerificationEmail(String email);
}