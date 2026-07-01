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

### 3. Yêu cầu môi trường
Cần cài đặt các phần mềm sau:
- JDK 17 hoặc cao hơn
- NodeJS 18 hoặc cao hơn kèm npm
- MySQL Server 8.0
- Maven 3.8 hoặc cao hơn
- Git

### 4. Hướng dẫn cài đặt

**Bước 1: Clone source code**

git clone <repository_url>

**Bước 2: Tạo database rỗng**

```sql
CREATE DATABASE auction_db;
```

**Bước 3: Cấu hình Backend**

Mở file `src/backend/src/main/resources/application.properties` và sửa:
```properties
spring.datasource.username=root
spring.datasource.password=your_password
```

**Bước 4: Chạy Backend lần đầu để tạo bảng**

```
cd src/auction-system
mvn spring-boot:run
```

Sau khi thấy `Started AuctionSystemApplication` trong log → **dừng server (Ctrl+C)**.
Lúc này Hibernate đã tự tạo toàn bộ bảng trong `auction_db`.

**Bước 5: Import dữ liệu mẫu**

Mở MySQL, chọn database `auction_db` và import file: src/database/DbReset_full.sql

**Bước 6: Chạy lại Backend**

```
cd src/auction-system
mvn spring-boot:run
```

Backend chạy tại: http://localhost:8080

**Bước 7: Chạy Frontend**

```
cd src/auction-system/auction-ui
npm install
npm start
```

Frontend chạy tại: http://localhost:3000

### 5. Tài khoản thử nghiệm
| Vai trò       | Email              | Mật khẩu |
|---------------|--------------------|-----------|
| Quản trị viên | admin@gmail.com    | 123456    |
| Người dùng    | buyer1@gmail.com   | 123456    |
| Người bán     | shopabc@gmail.com  | 123456    |
