# Cấu Hình Email (Gmail SMTP)

Hệ thống Auction System hỗ trợ gửi email cho phép quên mật khẩu và thông báo người thắng. 

## Cấu hình Gmail (Khuyến Nghị)

### Bước 1: Bật 2-Step Verification trên Google Account
1. Truy cập https://myaccount.google.com/security
2. Đăng nhập với Gmail của bạn
3. Tìm mục "2-Step Verification" và bật nó
4. Làm theo hướng dẫn của Google

### Bước 2: Tạo App Password
1. Sau khi bật 2FA, quay lại https://myaccount.google.com/apppasswords
2. Chọn "Mail" và "Windows Computer" (hoặc thiết bị của bạn)
3. Google sẽ cung cấp một mật khẩu ứng dụng gồm 16 ký tự
4. **Sao chép mật khẩu này** - bạn sẽ cần sử dụng

### Bước 3: Cập nhật application.properties
Mở file `src/main/resources/application.properties` và thay đổi:

```properties
spring.mail.username=your-gmail@gmail.com
spring.mail.password=your-app-password
```

**Ví dụ:**
```properties
spring.mail.username=john@gmail.com
spring.mail.password=abcd efgh ijkl mnop
```

Lưu ý: Nó sẽ có một khoảng trắng ở giữa - copy toàn bộ

### Bước 4: Khởi động lại ứng dụng
```bash
./mvnw.cmd spring-boot:run
```

## Cấu hình SMTP khác (ví dụ: Outlook, Custom SMTP Server)

Nếu bạn muốn sử dụng SMTP khác, hãy cập nhật các giá trị sau trong `application.properties`:

```properties
spring.mail.host=smtp.server.com
spring.mail.port=587
spring.mail.username=your-email@example.com
spring.mail.password=your-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

## Testing trong Development

Nếu bạn không muốn cấu hình email ngay bây giờ:

1. Email sẽ được in vào **console** của ứng dụng
2. Link reset mật khẩu sẽ hiển thị như sau:
   ```
   === PASSWORD RESET EMAIL (Console Mode) ===
   To: user@example.com
   Reset Link: http://localhost:3000/reset-password?token=abc123...
   ==========================================
   ```
3. Copy link từ console và dán vào trình duyệt để test

## Công dụng

Khi cấu hình hoàn tất, hệ thống sẽ:

1. **Quên mật khẩu**: Gửi email với link đặt lại mật khẩu
2. **Thắng đấu giá**: Gửi email thông báo khi người dùng thắng đấu giá

## Troubleshooting

**Lỗi: "Authentication failed"**
- Kiểm tra Gmail username và app password có đúng không
- Chắc chắn bạn đã bật 2-Step Verification

**Lỗi: "Connection timeout"**
- Kiểm tra firewall/proxy của máy
- Cài đặt port timeout trong `application.properties`

**Email không gửi**
- Kiểm tra console log để xem có lỗi gì không
- Nếu không cấu hình mail, email sẽ hiển thị trên console

---

Xin cảm ơn!
