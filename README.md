# tn-da22ttb-110122127-truongnguyentonguyen-htquanlydaugiamathangdientu

### 1. Giới thiệu đề tài
Đồ án xây dựng một hệ thống đấu giá trực tuyến cho phép người dùng đăng bán sản phẩm điện tử và tổ chức đấu giá công khai trên nền tảng web.
Hệ thống hỗ trợ các vai trò khác nhau gồm: người dùng và quản trị viên.
Mục tiêu là xây dựng một nền tảng giao dịch minh bạch, hỗ trợ đấu giá thời gian thực và quản lý giao dịch hiệu quả.
Hệ thống tích hợp các cơ chế kỹ thuật: đấu giá theo thời gian thực qua WebSocket, chống canh giờ chốt (Anti-Sniping), khóa lạc quan (Optimistic Locking) đảm bảo tính nhất quán khi nhiều người đặt giá đồng thời, và bộ lập lịch tự động quản lý vòng đời phiên đấu giá.

### 2. Kiến trúc hệ thống
Hệ thống được xây dựng theo mô hình Client-Server với kiến trúc REST API:
- Frontend (React.js): giao diện người dùng, gọi API qua Axios, nhận cập nhật thời gian thực qua WebSocket.
- Backend (Spring Boot): xử lý nghiệp vụ, cung cấp REST API, quản lý WebSocket.
- Database (MySQL): lưu trữ toàn bộ dữ liệu hệ thống.
- Scheduler (Bộ lập lịch tự động): chạy nền mỗi 30 giây để cập nhật trạng thái phiên đấu giá và tạo đơn hàng tự động.
- SMS Gateway (TextBee): Gửi OTP xác thực số điện thoại qua SMS miễn phí.

### 3. Yêu cầu môi trường
Cần cài đặt các phần mềm sau:
- JDK 17 hoặc cao hơn
- NodeJS 18 hoặc cao hơn kèm npm
- XAMPP (MySQL/MariaDB 10.4+)
- Maven 3.8 hoặc cao hơn
- Git
- Python 3.8 hoặc cao hơn (dùng cho script kiểm thử Mua ngay đồng thời)
  
### 4. Hướng dẫn cài đặt

### Bước 1 — Clone source code
 
```bash
git clone <repository_url>
```
 
### Bước 2 — Khởi động MySQL
 
Mở XAMPP Control Panel → bấm **Start** cạnh MySQL. MySQL chạy tại cổng 3306.
 
### Bước 3 — Tạo database rỗng
 
Mở phpMyAdmin (`http://localhost/phpmyadmin`) và chạy:
 
```sql
CREATE DATABASE auction_db;
```
 
### Bước 4 — Cấu hình Backend
 
Mở file `src/auction-system/src/main/resources/application.properties`, kiểm tra và cập nhật:
 
```properties
# Kết nối database
spring.datasource.url=jdbc:mysql://localhost:3306/auction_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh
spring.datasource.username=root
spring.datasource.password=
 
# TextBee SMS — lấy tại textbee.dev sau khi cài app trên Android
textbee.api-key=YOUR_API_KEY
textbee.device-id=YOUR_DEVICE_ID
 
# VNPay Sandbox
vnpay.tmn-code=YOUR_TMN_CODE
vnpay.hash-secret=YOUR_HASH_SECRET
vnpay.return-url=http://localhost:3000/payment/callback
```
 
### Bước 5 — Chạy Backend lần đầu để tạo bảng
 
```bash
cd src/auction-system
mvn spring-boot:run
```
 
Sau khi log hiển thị `Started AuctionSystemApplication` → **dừng server (Ctrl+C)**. Hibernate đã tự tạo toàn bộ bảng trong `auction_db`.
 
### Bước 6 — Import dữ liệu mẫu
 
Mở phpMyAdmin → chọn database `auction_db` → tab **Import** → chọn file `src/database/data_seed.sql` → bấm **Nhập**.
 
### Bước 7 — Chạy lại Backend
 
```bash
cd src/auction-system
mvn spring-boot:run
```
 
Backend chạy tại: `http://localhost:8080`
 
### Bước 8 — Chạy Frontend
 
```bash
cd src/auction-system/auction-ui
npm install
npm start
```
 
Frontend chạy tại: `http://localhost:3000`
 
---
 
## Tài khoản thử nghiệm
 
| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị viên | admin@gmail.com | 123456 |
| Người mua | buyer1@gmail.com | 123456 |
| Người mua | buyer2@gmail.com | 123456 |
| Người mua | buyer3@gmail.com | 123456 |
| Người mua | buyer4@gmail.com | 123456 |
| Người bán | shopabc@gmail.com | 123456 |
| Người bán | techstore@gmail.com | 123456 |
| Người bán | gadgethub@gmail.com | 123456 |
 
> **Lưu ý:** Tất cả tài khoản đều bật xác thực 2 bước (2FA) qua SMS. Khi đăng nhập sẽ nhận OTP qua SMS đến số điện thoại đã đăng ký qua TextBee. Nếu không muốn nhập OTP mỗi lần đăng nhập lúc test, vào `application.properties`:
 
app.otp.enabled=true → app.otp.enabled=false
 
## Thẻ test VNPay Sandbox
 
| Thông tin | Giá trị |
|---|---|
| Ngân hàng | NCB |
| Số thẻ | 9704198526191432198 |
| Tên chủ thẻ | NGUYEN VAN A |
| Ngày phát hành | 07/15 |
| OTP | 123456 |
 
> Chọn tab **Thẻ nội địa / Internet Banking → NCB** trên trang VNPay, không dùng QR.
 
---
 
## Kiểm thử Mua ngay đồng thời
 
Script `test_buy_now_concurrent.py` kiểm tra cơ chế Optimistic Locking: nhiều người cùng bấm "Mua ngay" trong một thời điểm, hệ thống chỉ cho phép đúng 1 người thành công.
 
```bash
pip install aiohttp
cd src/auction-system
python test_buy_now_concurrent.py
```
 
**Kết quả mong đợi:** đúng 1 người nhận HTTP 200, 3 người còn lại nhận HTTP 400. In ra **ĐẠT** xác nhận Optimistic Locking hoạt động đúng.
 
> Sau mỗi lần chạy cần import lại `data_seed.sql` để reset dữ liệu.
 
---
 
## Một số lỗi thường gặp
 
**MySQL không kết nối được**
- Kiểm tra XAMPP đã bật MySQL chưa
- Kiểm tra port 3306 có bị chiếm không: `netstat -ano | findstr :3306`
