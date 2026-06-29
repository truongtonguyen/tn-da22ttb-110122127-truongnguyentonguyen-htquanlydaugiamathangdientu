-- =============================================================
-- KHÔI PHỤC TOÀN BỘ DỮ LIỆU (users, category, auctions, images)
-- Khớp đúng với các file ảnh thực tế đang có trong uploads/
-- Mật khẩu mọi tài khoản: 123456
-- =============================================================

-- -------------------------------------------------------------
-- BƯỚC 1: XÓA SẠCH DỮ LIỆU CŨ (đúng thứ tự khóa ngoại)
-- -------------------------------------------------------------
DELETE FROM orders;
DELETE FROM bids;
DELETE FROM reports;
DELETE FROM notifications;
DELETE FROM auction_images;
DELETE FROM auctions;
DELETE FROM category;
DELETE FROM users;

ALTER TABLE orders          AUTO_INCREMENT = 1;
ALTER TABLE bids            AUTO_INCREMENT = 1;
ALTER TABLE reports         AUTO_INCREMENT = 1;
ALTER TABLE notifications   AUTO_INCREMENT = 1;
ALTER TABLE auction_images  AUTO_INCREMENT = 1;
ALTER TABLE auctions        AUTO_INCREMENT = 1;
ALTER TABLE category        AUTO_INCREMENT = 1;
ALTER TABLE users           AUTO_INCREMENT = 1;

-- -------------------------------------------------------------
-- BƯỚC 2: TẠO LẠI USERS
-- id = 1 LUÔN LÀ ADMIN — không gán làm seller/bidder cho sản phẩm nào
-- Mật khẩu "123456" đã mã hóa BCrypt sẵn, dùng được ngay để đăng nhập
-- -------------------------------------------------------------
INSERT INTO users (
  id, username, email, password, full_name, phone, address,
  role, is_banned, is_email_verified
) VALUES
(1, 'admin',    'admin@gmail.com',    '$2b$10$Vb0lnH.PB7P.220AF1rLzu6D9IGKThR/2V2Ix/2aRDDjDJLWZU2i.', 'Quản Trị Viên',        '0900000001', 'Vĩnh Long',  'ADMIN', false, true),
(2, 'shopabc',  'shopabc@gmail.com',  '$2b$10$Vb0lnH.PB7P.220AF1rLzu6D9IGKThR/2V2Ix/2aRDDjDJLWZU2i.', 'Nguyễn Văn An',        '0900000002', 'TP.HCM',     'USER',  false, true),
(3, 'techstore','techstore@gmail.com','$2b$10$Vb0lnH.PB7P.220AF1rLzu6D9IGKThR/2V2Ix/2aRDDjDJLWZU2i.', 'Trần Thị Bình',        '0900000003', 'Hà Nội',     'USER',  false, true),
(4, 'gadgethub','gadgethub@gmail.com','$2b$10$Vb0lnH.PB7P.220AF1rLzu6D9IGKThR/2V2Ix/2aRDDjDJLWZU2i.', 'Lê Văn Cường',         '0900000004', 'Đà Nẵng',    'USER',  false, true),
(5, 'buyer1',   'buyer1@gmail.com',   '$2b$10$Vb0lnH.PB7P.220AF1rLzu6D9IGKThR/2V2Ix/2aRDDjDJLWZU2i.', 'Phạm Thị Dung',        '0900000005', 'Cần Thơ',    'USER',  false, true);

-- -------------------------------------------------------------
-- BƯỚC 3: TẠO LẠI DANH MỤC (4 danh mục đúng, bỏ 3 danh mục sai)
-- -------------------------------------------------------------
INSERT INTO category (id, name) VALUES
(1, 'Điện thoại'),
(2, 'Laptop'),
(3, 'Tablet'),
(4, 'Phụ kiện');

-- -------------------------------------------------------------
-- BƯỚC 4: TẠO LẠI SẢN PHẨM ĐẤU GIÁ (14 sản phẩm)
-- Chỉ dùng sản phẩm có ảnh thật trong uploads/
-- seller_id luôn là 2, 3 hoặc 4 — KHÔNG BAO GIỜ là 1 (admin)
-- -------------------------------------------------------------
INSERT INTO auctions (
  title, description,
  starting_price, current_price, highest_bid,
  reserve_price, buy_now_price, bid_increment_step,
  start_time, end_time,
  status, seller_id, category_id
) VALUES

-- ===== ĐIỆN THOẠI (category_id = 1) =====
(
  'iPhone 15 Pro Max 256GB',
  'Máy mới 99%, còn bảo hành 11 tháng, full hộp phụ kiện. Màu titan tự nhiên.',
  25000000, 25000000, 25000000,
  27000000, 30000000, 500000,
  DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY),
  'ACTIVE', 2, 1
),
(
  'Samsung Galaxy S24 Ultra',
  'Bản 512GB, màu đen titan. Máy còn bảo hành 10 tháng, kèm S-Pen.',
  28000000, 28000000, 28000000,
  30000000, 33000000, 500000,
  DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 4 DAY),
  'ACTIVE', 2, 1
),
(
  'Xiaomi 14 Ultra',
  'Camera Leica chuyên nghiệp, chip Snapdragon 8 Gen 3. Mới 100% chưa active.',
  22000000, 22000000, 22000000,
  24000000, 26000000, 300000,
  DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY),
  'ACTIVE', 2, 1
),
(
  'OPPO Find X7 Ultra',
  'Camera Hasselblad, 16GB RAM 512GB. Màu xanh biển, mới 99%.',
  20000000, 20000000, 20000000,
  22000000, NULL, 300000,
  NOW(), DATE_ADD(NOW(), INTERVAL 4 DAY),
  'PENDING_APPROVAL', 2, 1
),

-- ===== LAPTOP (category_id = 2) =====
(
  'Dell XPS 15',
  'Core i7 Gen 13, 32GB RAM, 1TB SSD, màn hình OLED 4K. Bảo hành 12 tháng.',
  32000000, 32000000, 32000000,
  34000000, 37000000, 500000,
  DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 6 DAY),
  'ACTIVE', 3, 2
),
(
  'Dell XPS 15 9530',
  'Core i9 Gen 13, 32GB RAM, 1TB SSD, màn OLED 3.5K cảm ứng. Mới 98%, ít sử dụng.',
  30000000, 30000000, 30000000,
  32000000, 35000000, 500000,
  DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY),
  'ACTIVE', 4, 2
),
(
  'ASUS ROG Strix G16',
  'RTX 4070, Core i9 Gen 13, 32GB RAM, 1TB SSD. Gaming laptop cao cấp.',
  35000000, 35000000, 35000000,
  38000000, 42000000, 500000,
  DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY),
  'ACTIVE', 3, 2
),
(
  'Lenovo ThinkPad X1 Carbon Gen 11',
  'Core i7, 16GB RAM, 512GB SSD. Siêu nhẹ 1.12kg, pin 15 giờ. Mới 99%.',
  28000000, 28000000, 28000000,
  30000000, NULL, 500000,
  NOW(), DATE_ADD(NOW(), INTERVAL 6 DAY),
  'PENDING_APPROVAL', 3, 2
),
(
  'MacBook Pro M3',
  '16GB RAM 512GB SSD, màu Space Gray. Mới 100% nguyên seal, chưa active.',
  38000000, 38000000, 38000000,
  40000000, 45000000, 500000,
  DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 9 DAY),
  'ACTIVE', 4, 2
),

-- ===== TABLET (category_id = 3) =====
(
  'iPad Pro M4 11 inch WiFi',
  'Chip M4 mạnh mẽ, màn hình OLED 120Hz. Kèm Apple Pencil Pro. Mới 100%.',
  26000000, 26000000, 26000000,
  28000000, 31000000, 300000,
  NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY),
  'ACTIVE', 2, 3
),
(
  'Samsung Galaxy Tab S9 Ultra',
  '12GB RAM 256GB, màn hình 14.6 inch AMOLED. Kèm bút S-Pen. Mới 99%.',
  24000000, 24000000, 24000000,
  26000000, 28000000, 300000,
  DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY),
  'ACTIVE', 2, 3
),

-- ===== PHỤ KIỆN (category_id = 4) =====
(
  'AirPods Pro 2',
  'Chống ồn chủ động ANC, chip H2, sạc USB-C. Mới 100% chưa khui hộp.',
  4500000, 4500000, 4500000,
  5000000, 5800000, 100000,
  DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 4 DAY),
  'ACTIVE', 4, 4
),
(
  'Logitech MX Master 3S',
  'Chuột không dây cao cấp, 8000 DPI, sạc USB-C, kết nối đa thiết bị. Mới 100%.',
  2500000, 2500000, 2500000,
  3000000, 3500000, 50000,
  DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY),
  'ACTIVE', 4, 4
),
(
  'Apple Watch Series 9 45mm',
  'GPS + Cellular, viền nhôm, dây sport. Mới 100% nguyên seal.',
  10000000, 10000000, 10000000,
  11000000, NULL, 200000,
  NOW(), DATE_ADD(NOW(), INTERVAL 6 DAY),
  'PENDING_APPROVAL', 4, 4
);

-- -------------------------------------------------------------
-- BƯỚC 5: GẮN ẢNH THẬT — đúng tên file đang có trong uploads/
-- auction_id tương ứng đúng thứ tự VALUES bên trên (1-14)
-- -------------------------------------------------------------
INSERT INTO auction_images (image_url, auction_id) VALUES

-- iPhone 15 Pro Max (1) — 5 ảnh
('iphone-15-pro-max.jpg', 1),
('iphone-15-pro-max_1.jpg', 1),
('iphone-15-pro-max_2.jpg', 1),
('iphone-15-pro-max_3.jpg', 1),
('iphone-15-pro-max_4.jpg', 1),

-- Samsung Galaxy S24 Ultra (2) — 4 ảnh
('samsung-galaxy-s24-ultra-1.jpg', 2),
('samsung-galaxy-s24-ultra-2.jpg', 2),
('samsung-galaxy-s24-ultra-3.jpg', 2),
('samsung-galaxy-s24-ultra-4.jpg', 2),

-- Xiaomi 14 Ultra (3) — 4 ảnh
('xiaomi_14_ultra_1.jpg', 3),
('xiaomi_14_ultra_2.jpg', 3),
('xiaomi_14_ultra_3.jpg', 3),
('xiaomi_14_ultra_4.jpg', 3),

-- OPPO Find X7 Ultra (4) — 5 ảnh
('oppo-find-x7-ultra.jpg', 4),
('oppo-find-x7-ultra-1.jpg', 4),
('oppo-find-x7-ultra-2.jpg', 4),
('oppo-find-x7-ultra-3.jpg', 4),
('oppo-find-x7-ultra-4.jpg', 4),

-- Dell XPS 15 (5) — 5 ảnh
('dell-xps-15-1.jpg', 5),
('dell-xps-15-2.jpg', 5),
('dell-xps-15-3.jpg', 5),
('dell-xps-15-4.jpg', 5),
('dell-xps-15-5.jpg', 5),

-- Dell XPS 15 9530 (6) — 5 ảnh
('laptop_dell_xps_15_1_.jpg', 6),
('laptop_dell_xps_15_2_.jpg', 6),
('laptop_dell_xps_15_3_.jpg', 6),
('laptop_dell_xps_15_4_.jpg', 6),
('laptop_dell_xps_15_5_.jpg', 6),

-- ASUS ROG Strix G16 (7) — 9 ảnh
('asus-rog-strix-g16-1.jpg', 7),
('asus-rog-strix-g16-2.jpg', 7),
('asus-rog-strix-g16-3.jpg', 7),
('asus-rog-strix-g16-4.jpg', 7),
('asus-rog-strix-g16-5.jpg', 7),
('asus-rog-strix-g16-6.jpg', 7),
('asus-rog-strix-g16-7.jpg', 7),
('asus-rog-strix-g16-8.jpg', 7),
('asus-rog-strix-g16-9.jpg', 7),

-- Lenovo ThinkPad X1 (8) — 6 ảnh
('lenovo-thinkpad-x1-1.jpg', 8),
('lenovo-thinkpad-x1-2.jpg', 8),
('lenovo-thinkpad-x1-3.jpg', 8),
('lenovo-thinkpad-x1-4.jpg', 8),
('lenovo-thinkpad-x1-5.jpg', 8),
('lenovo-thinkpad-x1-6.jpg', 8),

-- MacBook Pro M3 (9) — 4 ảnh
('macbook-pro-m3-1.jpg', 9),
('macbook-pro-m3-2.jpg', 9),
('macbook-pro-m3-3.jpg', 9),
('macbook-pro-m3-4.jpg', 9),

-- iPad Pro M4 (10) — 3 ảnh
('ipad-pro-m4-1.jpg', 10),
('ipad-pro-m4-2.jpg', 10),
('ipad-pro-m4-3.jpg', 10),

-- Samsung Galaxy Tab S9 Ultra (11) — 4 ảnh
('samsung-galaxy-tab-s9-1.jpg', 11),
('samsung-galaxy-tabs9-2.jpg', 11),
('samsung-galaxy-tab-s9-3.jpg', 11),
('samsung-galaxy-tab-s9-4.jpg', 11),

-- AirPods Pro 2 (12) — 4 ảnh
('airpods-pro-2-1.jpg', 12),
('airpods-pro-2-2.jpg', 12),
('airpods-pro-2-3.jpg', 12),
('airpods-pro-2-4.jpg', 12),

-- Logitech MX Master 3S (13) — 6 ảnh
('logitech-mx-master-3s.jpg', 13),
('logitech-mx-master-3s_1_.jpg', 13),
('logitech-mx-master-3s_2_.jpg', 13),
('logitech-mx-master-3s_3_.jpg', 13),
('logitech-mx-master-3s_4_.jpg', 13),
('logitech-mx-master-3s_5_.jpg', 13),

-- Apple Watch Series 9 45mm (14) — 4 ảnh
('apple-watch-series-9-45mm-1.png', 14),
('apple-watch-series-9-45mm-2.png', 14),
('apple-watch-series-9-45mm-3.png', 14),
('apple-watch-series-9-45mm-4.png', 14);
