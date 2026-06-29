package com.auction.auction_system.service;

import com.auction.auction_system.dto.ForgotPasswordRequest;
import com.auction.auction_system.dto.LoginRequest;
import com.auction.auction_system.dto.RegisterRequest;
import com.auction.auction_system.dto.ResetPasswordRequest;
import com.auction.auction_system.entity.Role;
import com.auction.auction_system.entity.User;
import com.auction.auction_system.repository.UserRepository;
import com.auction.auction_system.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Override
    public User register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email này đã được đăng ký");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setRole(Role.USER);
        user.setEmailVerified(false);

        String token = UUID.randomUUID().toString();
        user.setEmailVerificationToken(token);
        user.setEmailVerificationTokenExpiry(LocalDateTime.now().plusHours(24));

        User savedUser = userRepository.save(user);
        String verificationLink = "http://localhost:3000/verify-email?token=" + token;
        emailService.sendEmailVerificationEmail(user.getEmail(), verificationLink);
        return savedUser;
    }

    @Override
    public String login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống"));

        if (!user.isEmailVerified()) {
            throw new RuntimeException("Vui lòng xác thực email trước khi đăng nhập");
        }
        if (user.isBanned()) {
            throw new RuntimeException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu không chính xác");
        }

        return jwtService.generateToken(user.getEmail());
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống"));

        String token = UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        user.setResetPasswordTokenExpiry(LocalDateTime.now().plusHours(24));
        userRepository.save(user);

        String resetLink = "http://localhost:3000/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByResetPasswordToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("TOKEN_INVALID"));

        if (user.getResetPasswordTokenExpiry() == null ||
                LocalDateTime.now().isAfter(user.getResetPasswordTokenExpiry())) {
            throw new RuntimeException("TOKEN_EXPIRED");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);
        userRepository.save(user);
    }

    @Override
    public void verifyEmail(String token) {
        // ✅ Trước tiên tìm user theo token
        var userOpt = userRepository.findByEmailVerificationToken(token);

        if (userOpt.isEmpty()) {
            // Token không tồn tại — có thể đã xác thực rồi
            // Tìm xem có user nào có token này không (đã bị xóa sau xác thực)
            // → không thể phân biệt "sai token" vs "đã dùng rồi" nếu không lưu lịch sử
            // Tạm thời: throw TOKEN_ALREADY_VERIFIED để frontend hỏi email
            throw new RuntimeException("TOKEN_NOT_FOUND");
        }

        User user = userOpt.get();

        // ✅ Nếu đã xác thực rồi → trả về trạng thái riêng
        if (user.isEmailVerified()) {
            throw new RuntimeException("TOKEN_ALREADY_VERIFIED");
        }

        if (user.getEmailVerificationTokenExpiry() == null ||
                LocalDateTime.now().isAfter(user.getEmailVerificationTokenExpiry())) {
            throw new RuntimeException("TOKEN_EXPIRED");
        }

        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationTokenExpiry(null);
        userRepository.save(user);
    }

    @Override
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống"));

        if (user.isEmailVerified()) {
            throw new RuntimeException("EMAIL_ALREADY_VERIFIED");
        }

        String token = UUID.randomUUID().toString();
        user.setEmailVerificationToken(token);
        user.setEmailVerificationTokenExpiry(LocalDateTime.now().plusHours(24));
        userRepository.save(user);

        String verificationLink = "http://localhost:3000/verify-email?token=" + token;
        emailService.sendEmailVerificationEmail(user.getEmail(), verificationLink);
    }
}