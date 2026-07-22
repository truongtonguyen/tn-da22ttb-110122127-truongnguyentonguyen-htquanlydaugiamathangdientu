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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final SmsService smsService;

    // app.otp.enabled=false trong application.properties sẽ tắt bước OTP khi đăng nhập
    @Value("${app.otp.enabled:true}")
    private boolean otpEnabled;

    private static final int OTP_EXPIRE_MINUTES = 5;
    private static final int MAX_OTP_FAIL       = 5;
    private static final int LOCK_MINUTES       = 15; // khóa tạm 15 phút

    // ── Sinh OTP 6 số ──
    private String generateOtp() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    @Override
    public User register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail()))
            throw new RuntimeException("Email này đã được đăng ký");
        if (request.getPhone() == null || request.getPhone().isBlank())
            throw new RuntimeException("Số điện thoại là bắt buộc để bật xác thực 2 bước");

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

    // ── Bước 1 đăng nhập: xác minh email + mật khẩu → gửi OTP SMS ──
    // Trả về: JWT nếu OTP đang TẮT (đăng nhập xong luôn); null nếu OTP đang BẬT (nghĩa là "đã gửi OTP, chờ verify")
    @Override
    public String login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống"));

        if (!user.isEmailVerified())
            throw new RuntimeException("Vui lòng xác thực email trước khi đăng nhập");
        if (user.isBanned())
            throw new RuntimeException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên");
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword()))
            throw new RuntimeException("Mật khẩu không chính xác");

        // Nếu OTP đang TẮT: bỏ qua hoàn toàn bước SMS, đăng nhập thành công ngay
        if (!otpEnabled) {
            user.setLastLoginIp(null); // clientIp không có ở bước này; nếu cần lưu IP, truyền thêm tham số vào login()
            userRepository.save(user);
            return jwtService.generateToken(user.getEmail());
        }

        if (user.getPhone() == null || user.getPhone().isBlank())
            throw new RuntimeException("Tài khoản chưa có số điện thoại. Vui lòng cập nhật hồ sơ");

        // Sinh OTP và lưu vào DB
        String otp = generateOtp();
        user.setLoginOtp(passwordEncoder.encode(otp)); // ✅ lưu dạng hash, không lưu thô
        user.setLoginOtpExpiry(LocalDateTime.now().plusMinutes(OTP_EXPIRE_MINUTES));
        user.setLoginOtpFailCount(0);
        user.setLoginOtpLockedUntil(null);
        userRepository.save(user);

        // Gửi OTP qua SMS
        smsService.sendOtp(user.getPhone(), otp);
        return null;
    }

    // ── Bước 2 đăng nhập: xác minh OTP → trả về JWT ──
    @Override
    public String verifyLoginOtp(String email, String otp, String clientIp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));

        // Kiểm tra đang bị khóa tạm
        if (user.getLoginOtpLockedUntil() != null &&
                LocalDateTime.now().isBefore(user.getLoginOtpLockedUntil())) {
            long minutesLeft = java.time.Duration.between(
                LocalDateTime.now(), user.getLoginOtpLockedUntil()).toMinutes() + 1;
            throw new RuntimeException(
                "OTP_LOCKED:" + minutesLeft
            );
        }

        if (user.getLoginOtp() == null)
            throw new RuntimeException("OTP_NOT_FOUND");

        if (user.getLoginOtpExpiry() == null ||
                LocalDateTime.now().isAfter(user.getLoginOtpExpiry())) {
            throw new RuntimeException("OTP_EXPIRED");
        }

        if (!passwordEncoder.matches(otp, user.getLoginOtp())) {
            int failCount = user.getLoginOtpFailCount() + 1;
            user.setLoginOtpFailCount(failCount);

            if (failCount >= MAX_OTP_FAIL) {
                user.setLoginOtpLockedUntil(LocalDateTime.now().plusMinutes(LOCK_MINUTES));
                user.setLoginOtp(null);
                user.setLoginOtpExpiry(null);
                userRepository.save(user);
                throw new RuntimeException("OTP_LOCKED:" + LOCK_MINUTES);
            }

            userRepository.save(user);
            throw new RuntimeException("OTP_WRONG:" + (MAX_OTP_FAIL - failCount));
        }

        // OTP đúng — xóa OTP, reset fail count, LƯU IP, trả về JWT
        user.setLoginOtp(null);
        user.setLoginOtpExpiry(null);
        user.setLoginOtpFailCount(0);
        user.setLoginOtpLockedUntil(null);
        user.setLastLoginIp(clientIp);      // ✅ THÊM DÒNG NÀY — lưu IP đăng nhập thành công
        userRepository.save(user);

        return jwtService.generateToken(user.getEmail());
    }

    // ── Gửi lại OTP ──
    @Override
    public void resendLoginOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));

        // Không gửi lại nếu đang bị khóa
        if (user.getLoginOtpLockedUntil() != null &&
                LocalDateTime.now().isBefore(user.getLoginOtpLockedUntil())) {
            throw new RuntimeException("Tài khoản đang bị khóa tạm. Vui lòng thử lại sau.");
        }

        String otp = generateOtp();
        user.setLoginOtp(passwordEncoder.encode(otp));
        user.setLoginOtpExpiry(LocalDateTime.now().plusMinutes(OTP_EXPIRE_MINUTES));
        user.setLoginOtpFailCount(0);
        userRepository.save(user);

        smsService.sendOtp(user.getPhone(), otp);
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
                LocalDateTime.now().isAfter(user.getResetPasswordTokenExpiry()))
            throw new RuntimeException("TOKEN_EXPIRED");

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);
        userRepository.save(user);
    }

    @Override
    public void verifyEmail(String token) {
        User user = userRepository.findByEmailVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("TOKEN_INVALID"));

        if (user.isEmailVerified())
            throw new RuntimeException("TOKEN_ALREADY_VERIFIED");

        if (user.getEmailVerificationTokenExpiry() == null ||
                LocalDateTime.now().isAfter(user.getEmailVerificationTokenExpiry()))
            throw new RuntimeException("TOKEN_EXPIRED");

        user.setEmailVerified(true);
        userRepository.save(user);
    }

    @Override
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống"));

        if (user.isEmailVerified())
            throw new RuntimeException("EMAIL_ALREADY_VERIFIED");

        String token = UUID.randomUUID().toString();
        user.setEmailVerificationToken(token);
        user.setEmailVerificationTokenExpiry(LocalDateTime.now().plusHours(24));
        userRepository.save(user);

        String verificationLink = "http://localhost:3000/verify-email?token=" + token;
        emailService.sendEmailVerificationEmail(user.getEmail(), verificationLink);
    }
}