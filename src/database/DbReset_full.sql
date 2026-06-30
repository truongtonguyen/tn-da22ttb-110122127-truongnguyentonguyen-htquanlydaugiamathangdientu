-- =================================================================
-- KHÔI PHỤC TOÀN BỘ DỮ LIỆU — MÔ PHỎNG WEB ĐÃ VẬN HÀNH MỘT THỜI GIAN
-- Bao gồm: users, category, auctions, bids, orders (có commission_fee
-- và seller_receives), reports, notifications, auction_images
-- Khớp đúng tên file ảnh thực tế hiện có trong uploads/
-- Mật khẩu mọi tài khoản: 123456
-- =================================================================

-- -----------------------------------------------------------------
-- BƯỚC 1: XÓA SẠCH DỮ LIỆU CŨ (đúng thứ tự khóa ngoại)
-- -----------------------------------------------------------------
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

-- -----------------------------------------------------------------
-- BƯỚC 2: USERS
-- id = 1 LUÔN LÀ ADMIN — không gán làm seller/bidder cho sản phẩm nào
-- id 2-4: người bán | id 5-8: người mua/đặt giá
-- Mật khẩu "123456" đã mã hóa BCrypt sẵn
-- -----------------------------------------------------------------
INSERT INTO users (
  id, username, email, password, full_name, phone, address,
  role, is_banned, is_email_verified
) VALUES
(1, 'admin',     'admin@gmail.com',     '$2b$10$Kr6xYeBPRpHsUXdxdBkoy.SmA8JvdS9Tnw3T8V51A9Yw8ZKDtzLdi', 'Quản Trị Viên',  '0900000001', 'Vĩnh Long',  'ADMIN', false, true),
(2, 'shopabc',   'shopabc@gmail.com',   '$2b$10$Kr6xYeBPRpHsUXdxdBkoy.SmA8JvdS9Tnw3T8V51A9Yw8ZKDtzLdi', 'Nguyễn Văn An',  '0900000002', 'TP.HCM',     'USER',  false, true),
(3, 'techstore', 'techstore@gmail.com', '$2b$10$Kr6xYeBPRpHsUXdxdBkoy.SmA8JvdS9Tnw3T8V51A9Yw8ZKDtzLdi', 'Trần Thị Bình',  '0900000003', 'Hà Nội',     'USER',  false, true),
(4, 'gadgethub', 'gadgethub@gmail.com', '$2b$10$Kr6xYeBPRpHsUXdxdBkoy.SmA8JvdS9Tnw3T8V51A9Yw8ZKDtzLdi', 'Lê Văn Cường',   '0900000004', 'Đà Nẵng',    'USER',  false, true),
(5, 'buyer1',    'buyer1@gmail.com',    '$2b$10$Kr6xYeBPRpHsUXdxdBkoy.SmA8JvdS9Tnw3T8V51A9Yw8ZKDtzLdi', 'Phạm Thị Dung',  '0900000005', 'Cần Thơ',    'USER',  false, true),
(6, 'buyer2',    'buyer2@gmail.com',    '$2b$10$Kr6xYeBPRpHsUXdxdBkoy.SmA8JvdS9Tnw3T8V51A9Yw8ZKDtzLdi', 'Hoàng Văn Em',   '0900000006', 'Hải Phòng',  'USER',  false, true),
(7, 'buyer3',    'buyer3@gmail.com',    '$2b$10$Kr6xYeBPRpHsUXdxdBkoy.SmA8JvdS9Tnw3T8V51A9Yw8ZKDtzLdi', 'Võ Thị Phương',  '0900000007', 'Huế',        'USER',  false, true),
(8, 'buyer4',    'buyer4@gmail.com',    '$2b$10$Kr6xYeBPRpHsUXdxdBkoy.SmA8JvdS9Tnw3T8V51A9Yw8ZKDtzLdi', 'Đặng Văn Giang', '0900000008', 'Nha Trang',  'USER',  false, true);

-- -----------------------------------------------------------------
-- BƯỚC 3: DANH MỤC (4 danh mục đúng)
-- -----------------------------------------------------------------
INSERT INTO category (id, name) VALUES
(1, 'Điện thoại'),
(2, 'Laptop'),
(3, 'Tablet'),
(4, 'Phụ kiện');

-- -----------------------------------------------------------------
-- BƯỚC 4: SẢN PHẨM ĐẤU GIÁ (14 sản phẩm)
-- current_price / highest_bid / highest_bidder_id / winner_id / version
-- đã được tính sẵn khớp với lịch sử đặt giá ở BƯỚC 5 bên dưới
-- seller_id luôn là 2, 3 hoặc 4 — KHÔNG BAO GIỜ là 1 (admin)
-- -----------------------------------------------------------------
INSERT INTO auctions (
  title, description,
  starting_price, current_price, highest_bid,
  reserve_price, buy_now_price, bid_increment_step,
  start_time, end_time,
  status, seller_id, category_id,
  highest_bidder_id, winner_id, version
) VALUES

-- (1) iPhone 15 Pro Max — ACTIVE, đã có 4 lượt đặt giá
(
  'iPhone 15 Pro Max 256GB',
  'Máy mới 99%, còn bảo hành 11 tháng, full hộp phụ kiện. Màu titan tự nhiên.',
  25000000, 27800000, 27800000,
  27000000, 30000000, 500000,
  DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY),
  'ACTIVE', 2, 1, 5, NULL, 4
),
-- (2) Samsung S24 Ultra — ACTIVE, 3 lượt đặt giá
(
  'Samsung Galaxy S24 Ultra',
  'Bản 512GB, màu đen titan. Máy còn bảo hành 10 tháng, kèm S-Pen.',
  28000000, 30000000, 30000000,
  30000000, 33000000, 500000,
  DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY),
  'ACTIVE', 2, 1, 6, NULL, 3
),
-- (3) Xiaomi 14 Ultra — ACTIVE, chưa có ai đặt giá
(
  'Xiaomi 14 Ultra',
  'Camera Leica chuyên nghiệp, chip Snapdragon 8 Gen 3. Mới 100% chưa active.',
  22000000, 22000000, 22000000,
  24000000, 26000000, 300000,
  DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY),
  'ACTIVE', 2, 1, NULL, NULL, 0
),
-- (4) OPPO Find X7 Ultra — chờ duyệt
(
  'OPPO Find X7 Ultra',
  'Camera Hasselblad, 16GB RAM 512GB. Màu xanh biển, mới 99%.',
  20000000, 20000000, 20000000,
  22000000, NULL, 300000,
  NOW(), DATE_ADD(NOW(), INTERVAL 4 DAY),
  'PENDING_APPROVAL', 2, 1, NULL, NULL, 0
),

-- (5) Dell XPS 15 — SOLD, đã thanh toán xong (PAID)
(
  'Dell XPS 15',
  'Core i7 Gen 13, 32GB RAM, 1TB SSD, màn hình OLED 4K. Bảo hành 12 tháng.',
  32000000, 34800000, 34800000,
  34000000, 37000000, 500000,
  DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY),
  'SOLD', 3, 2, 8, 8, 4
),
-- (6) Dell XPS 15 9530 — ACTIVE, 2 lượt đặt giá
(
  'Dell XPS 15 9530',
  'Core i9 Gen 13, 32GB RAM, 1TB SSD, màn OLED 3.5K cảm ứng. Mới 98%, ít sử dụng.',
  30000000, 31200000, 31200000,
  32000000, 35000000, 500000,
  DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 4 DAY),
  'ACTIVE', 4, 2, 5, NULL, 2
),
-- (7) ASUS ROG Strix G16 — ENDED (mua ngay), đã thanh toán xong
(
  'ASUS ROG Strix G16',
  'RTX 4070, Core i9 Gen 13, 32GB RAM, 1TB SSD. Gaming laptop cao cấp.',
  35000000, 42000000, 42000000,
  38000000, 42000000, 500000,
  DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY),
  'ENDED', 3, 2, 8, 8, 3
),
-- (8) Lenovo ThinkPad X1 — chờ duyệt
(
  'Lenovo ThinkPad X1 Carbon Gen 11',
  'Core i7, 16GB RAM, 512GB SSD. Siêu nhẹ 1.12kg, pin 15 giờ. Mới 99%.',
  28000000, 28000000, 28000000,
  30000000, NULL, 500000,
  NOW(), DATE_ADD(NOW(), INTERVAL 6 DAY),
  'PENDING_APPROVAL', 3, 2, NULL, NULL, 0
),
-- (9) MacBook Pro M3 — FAILED (không đạt giá sàn)
(
  'MacBook Pro M3',
  '16GB RAM 512GB SSD, màu Space Gray. Mới 100% nguyên seal, chưa active.',
  38000000, 39500000, 39500000,
  40000000, 45000000, 500000,
  DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY),
  'FAILED', 4, 2, 7, NULL, 3
),

-- (10) iPad Pro M4 — ACTIVE, 5 lượt đặt giá (sản phẩm hot)
(
  'iPad Pro M4 11 inch WiFi',
  'Chip M4 mạnh mẽ, màn hình OLED 120Hz. Kèm Apple Pencil Pro. Mới 100%.',
  26000000, 28000000, 28000000,
  28000000, 31000000, 300000,
  DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY),
  'ACTIVE', 2, 3, 5, NULL, 5
),
-- (11) Samsung Galaxy Tab S9 Ultra — ACTIVE, 2 lượt đặt giá
(
  'Samsung Galaxy Tab S9 Ultra',
  '12GB RAM 256GB, màn hình 14.6 inch AMOLED. Kèm bút S-Pen. Mới 99%.',
  24000000, 24800000, 24800000,
  26000000, 28000000, 300000,
  DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY),
  'ACTIVE', 2, 3, 6, NULL, 2
),

-- (12) AirPods Pro 2 — SOLD, đơn hàng đang chờ admin xác nhận
(
  'AirPods Pro 2',
  'Chống ồn chủ động ANC, chip H2, sạc USB-C. Mới 100% chưa khui hộp.',
  4500000, 5100000, 5100000,
  5000000, 5800000, 100000,
  DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY),
  'SOLD', 4, 4, 8, 8, 3
),
-- (13) Logitech MX Master 3S — SOLD, đơn hàng đang giao
(
  'Logitech MX Master 3S',
  'Chuột không dây cao cấp, 8000 DPI, sạc USB-C, kết nối đa thiết bị. Mới 100%.',
  2500000, 3050000, 3050000,
  3000000, 3500000, 50000,
  DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY),
  'SOLD', 4, 4, 6, 6, 3
),
-- (14) Apple Watch Series 9 — chờ duyệt
(
  'Apple Watch Series 9 45mm',
  'GPS + Cellular, viền nhôm, dây sport. Mới 100% nguyên seal.',
  10000000, 10000000, 10000000,
  11000000, NULL, 200000,
  NOW(), DATE_ADD(NOW(), INTERVAL 6 DAY),
  'PENDING_APPROVAL', 4, 4, NULL, NULL, 0
);

-- -----------------------------------------------------------------
-- BƯỚC 5: LƯỢT ĐẶT GIÁ (bids) — lịch sử cạnh tranh giá thực tế
-- auction_id tương ứng đúng thứ tự ở BƯỚC 4 (1-14)
-- -----------------------------------------------------------------
INSERT INTO bids (amount, bid_time, auction_id, bidder_id) VALUES

-- (1) iPhone 15 Pro Max: 5 -> 6 -> 7 -> 5
(25500000, DATE_SUB(NOW(), INTERVAL 3 DAY), 1, 5),
(26200000, DATE_SUB(NOW(), INTERVAL 2 DAY), 1, 6),
(27000000, DATE_SUB(NOW(), INTERVAL 1 DAY), 1, 7),
(27800000, DATE_SUB(NOW(), INTERVAL 10 HOUR), 1, 5),

-- (2) Samsung S24 Ultra: 6 -> 8 -> 6
(28500000, DATE_SUB(NOW(), INTERVAL 2 DAY), 2, 6),
(29200000, DATE_SUB(NOW(), INTERVAL 1 DAY), 2, 8),
(30000000, DATE_SUB(NOW(), INTERVAL 5 HOUR), 2, 6),

-- (5) Dell XPS 15 (đã kết thúc): 5 -> 7 -> 5 -> 8
(32500000, DATE_SUB(NOW(), INTERVAL 8 DAY), 5, 5),
(33200000, DATE_SUB(NOW(), INTERVAL 7 DAY), 5, 7),
(34000000, DATE_SUB(NOW(), INTERVAL 5 DAY), 5, 5),
(34800000, DATE_SUB(NOW(), INTERVAL 4 DAY), 5, 8),

-- (6) Dell XPS 15 9530: 7 -> 5
(30500000, DATE_SUB(NOW(), INTERVAL 1 DAY), 6, 7),
(31200000, DATE_SUB(NOW(), INTERVAL 8 HOUR), 6, 5),

-- (7) ASUS ROG Strix G16 (trước khi mua ngay): 6 -> 7, sau đó 8 mua ngay
(35500000, DATE_SUB(NOW(), INTERVAL 6 DAY), 7, 6),
(36200000, DATE_SUB(NOW(), INTERVAL 5 DAY), 7, 7),
(42000000, DATE_SUB(NOW(), INTERVAL 4 DAY), 7, 8),

-- (9) MacBook Pro M3 (thất bại, không đạt giá sàn): 5 -> 6 -> 7
(38500000, DATE_SUB(NOW(), INTERVAL 8 DAY), 9, 5),
(39000000, DATE_SUB(NOW(), INTERVAL 6 DAY), 9, 6),
(39500000, DATE_SUB(NOW(), INTERVAL 5 DAY), 9, 7),

-- (10) iPad Pro M4: 5 -> 6 -> 7 -> 8 -> 5
(26300000, DATE_SUB(NOW(), INTERVAL 4 DAY), 10, 5),
(26700000, DATE_SUB(NOW(), INTERVAL 3 DAY), 10, 6),
(27200000, DATE_SUB(NOW(), INTERVAL 2 DAY), 10, 7),
(27600000, DATE_SUB(NOW(), INTERVAL 1 DAY), 10, 8),
(28000000, DATE_SUB(NOW(), INTERVAL 2 HOUR), 10, 5),

-- (11) Samsung Tab S9 Ultra: 8 -> 6
(24400000, DATE_SUB(NOW(), INTERVAL 2 DAY), 11, 8),
(24800000, DATE_SUB(NOW(), INTERVAL 1 DAY), 11, 6),

-- (12) AirPods Pro 2 (đã kết thúc): 8 -> 5 -> 8
(4600000, DATE_SUB(NOW(), INTERVAL 5 DAY), 12, 8),
(4800000, DATE_SUB(NOW(), INTERVAL 4 DAY), 12, 5),
(5100000, DATE_SUB(NOW(), INTERVAL 3 DAY), 12, 8),

-- (13) Logitech MX Master 3S (đã kết thúc): 7 -> 6
(2850000, DATE_SUB(NOW(), INTERVAL 5 DAY), 13, 7),
(3050000, DATE_SUB(NOW(), INTERVAL 4 DAY), 13, 6);

-- -----------------------------------------------------------------
-- BƯỚC 6: ĐƠN HÀNG (orders) — 4 đơn ở các giai đoạn khác nhau
-- commission_fee = final_price * 5% | seller_receives = final_price - commission_fee
-- -----------------------------------------------------------------
INSERT INTO orders (
  final_price, status, payment_method, payment_note,
  created_at, confirmed_at, shipped_at, completed_at,
  auction_id, buyer_id, commission_fee, seller_receives
) VALUES

-- Đơn hàng (5) Dell XPS 15 — đã hoàn thành toàn bộ (PAID)
(
  34800000, 'PAID', 'BANK_TRANSFER', 'Đã chuyển khoản qua MBBank, nội dung DXPS15',
  DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 6 HOUR,
  DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY),
  5, 8, 1740000, 33060000
),

-- Đơn hàng (7) ASUS ROG Strix G16 — mua ngay, đã hoàn thành (PAID)
(
  42000000, 'PAID', 'MOMO', 'Đã thanh toán qua Momo, SĐT 0900000008',
  DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 10 HOUR,
  DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 12 HOUR),
  7, 8, 2100000, 39900000
),

-- Đơn hàng (12) AirPods Pro 2 — đã xác nhận thanh toán, ĐANG CHỜ admin xác nhận giao
(
  5100000, 'PENDING_CONFIRMATION', 'MOMO', 'Đã chuyển qua ví Momo lúc 20h hôm trước',
  DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY),
  NULL, NULL,
  12, 8, 255000, 4845000
),

-- Đơn hàng (13) Logitech MX Master 3S — đang trong quá trình giao hàng (SHIPPING)
(
  3050000, 'SHIPPING', 'BANK_TRANSFER', 'Chuyển khoản Vietcombank, nội dung thanh toan don hang',
  DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 8 HOUR,
  DATE_SUB(NOW(), INTERVAL 1 DAY), NULL,
  13, 6, 152500, 2897500
);

-- -----------------------------------------------------------------
-- BƯỚC 7: BÁO CÁO VI PHẠM (reports) — 2 báo cáo, trạng thái khác nhau
-- -----------------------------------------------------------------
INSERT INTO reports (
  reason, description, status, admin_note,
  created_at, resolved_at,
  reporter_id, reported_user_id, auction_id
) VALUES

-- Báo cáo đang chờ Admin xử lý
(
  'NO_RESPONSE',
  'Tôi đã thắng đấu giá Dell XPS 15 nhưng người bán không phản hồi tin nhắn để xác nhận giao hàng.',
  'PENDING', NULL,
  DATE_SUB(NOW(), INTERVAL 1 DAY), NULL,
  8, 3, 5
),

-- Báo cáo đã được Admin xử lý — bỏ qua vì không đủ cơ sở
(
  'WRONG_DESCRIPTION',
  'Sản phẩm Logitech MX Master 3S nhận được có vài vết trầy nhỏ không như mô tả "mới 100%".',
  'DISMISSED', 'Đã liên hệ người bán xác minh, vết trầy nhỏ trong phạm vi cho phép, không đủ cơ sở xử lý.',
  DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY),
  6, 4, 13
);

-- -----------------------------------------------------------------
-- BƯỚC 8: THÔNG BÁO (notifications) — mô phỏng các sự kiện đã xảy ra
-- -----------------------------------------------------------------
INSERT INTO notifications (message, is_read, created_at, user_id) VALUES

-- Bị vượt giá trong cuộc đua iPhone 15 Pro Max
('Bạn vừa bị vượt giá trên: iPhone 15 Pro Max 256GB', true,  DATE_SUB(NOW(), INTERVAL 2 DAY), 5),
('Bạn vừa bị vượt giá trên: iPhone 15 Pro Max 256GB', true,  DATE_SUB(NOW(), INTERVAL 1 DAY), 6),
('Bạn vừa bị vượt giá trên: iPhone 15 Pro Max 256GB', false, DATE_SUB(NOW(), INTERVAL 10 HOUR), 7),

-- Bị vượt giá Samsung S24 Ultra
('Bạn vừa bị vượt giá trên: Samsung Galaxy S24 Ultra', true, DATE_SUB(NOW(), INTERVAL 1 DAY), 6),
('Bạn vừa bị vượt giá trên: Samsung Galaxy S24 Ultra', false, DATE_SUB(NOW(), INTERVAL 5 HOUR), 8),

-- Thắng đấu giá / mua ngay thành công
('Bạn đã thắng phiên đấu giá: Dell XPS 15', true, DATE_SUB(NOW(), INTERVAL 4 DAY), 8),
('Bạn đã mua thành công: ASUS ROG Strix G16', true, DATE_SUB(NOW(), INTERVAL 4 DAY), 8),
('Bạn đã thắng phiên đấu giá: AirPods Pro 2', true, DATE_SUB(NOW(), INTERVAL 3 DAY), 8),
('Bạn đã thắng phiên đấu giá: Logitech MX Master 3S', true, DATE_SUB(NOW(), INTERVAL 4 DAY), 6),

-- Cập nhật trạng thái đơn hàng
('Đơn hàng #4 đang được giao đến bạn!', false, DATE_SUB(NOW(), INTERVAL 1 DAY), 6),
('Đơn hàng #1 đã hoàn thành. Cảm ơn bạn!', true, DATE_SUB(NOW(), INTERVAL 1 DAY), 8),
('Đơn hàng #2 đã hoàn thành. Cảm ơn bạn!', true, DATE_SUB(NOW(), INTERVAL 12 HOUR), 8);

-- -----------------------------------------------------------------
-- BƯỚC 9: ẢNH SẢN PHẨM — đúng tên file thực tế trong uploads/
-- auction_id tương ứng đúng thứ tự ở BƯỚC 4 (1-14)
-- -----------------------------------------------------------------
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

-- Dell XPS 15 9530 (6) — 5 ảnh (đã đổi tên file kèm "9530")
('laptop_dell_xps_15_9530_1_.jpg', 6),
('laptop_dell_xps_15_9530_2_.jpg', 6),
('laptop_dell_xps_15_9530_3_.jpg', 6),
('laptop_dell_xps_15_9530_4_.jpg', 6),
('laptop_dell_xps_15_9530_5_.jpg', 6),

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
('apple-watch-series-9-45mm-2.jpg', 14),
('apple-watch-series-9-45mm-3.png', 14),
('apple-watch-series-9-45mm-4.png', 14);
