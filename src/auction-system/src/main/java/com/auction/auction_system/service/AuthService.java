package com.auction.auction_system.service;

import com.auction.auction_system.dto.ForgotPasswordRequest;
import com.auction.auction_system.dto.LoginRequest;
import com.auction.auction_system.dto.RegisterRequest;
import com.auction.auction_system.dto.ResetPasswordRequest;
import com.auction.auction_system.entity.User;

public interface AuthService {
    User register(RegisterRequest request);
    String login(LoginRequest request);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
    void verifyEmail(String token);
    void resendVerificationEmail(String email);
}