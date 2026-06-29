# tn-da22ttb-110122127-truongnguyentonguyen-htquanlydaugiamathangdientu


### 1. Giới thiệu đề tài

Đồ án xây dựng một hệ thống đấu giá trực tuyến cho phép người dùng đăng bán sản phẩm điện tử và tổ chức đấu giá công khai trên nền tảng web.

Hệ thống hỗ trợ các vai trò khác nhau gồm: người dùng và quản trị viên.

Mục tiêu là xây dựng một nền tảng giao dịch minh bạch, hỗ trợ đấu giá thời gian thực và quản lý giao dịch hiệu quả. 

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
Bước 1: Clone source code: git clone <repository_url>

Bước 2: Tạo database

  Mở MySQL và tạo database:

  CREATE DATABASE auction_db;

  Import file SQL trong thư mục: src/database/

Bước 3: Chạy Backend

  Đi tới thư mục backend: cd src/backend

  Chạy project: mvn spring-boot:run

  Backend mặc định chạy tại: http://localhost:8080

Bước 4: Chạy Frontend

  Đi tới thư mục frontend: cd src/frontend

  Cài dependencies: npm install

  Khởi động: npm start

  Frontend mặc định chạy tại: http://localhost:3000
