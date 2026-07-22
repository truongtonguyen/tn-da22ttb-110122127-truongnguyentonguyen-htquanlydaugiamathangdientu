-- 1. Phí tham gia đặt giá (entry fee): 500.000 VNĐ / người / phiên,
--    thu ở lần đặt giá ĐẦU TIÊN của mỗi người trong mỗi phiên.
-- 2. Số dư ví (balance) của BUYER:
--       - Mỗi buyer đã nạp sẵn 10.000.000đ qua VNPay (BƯỚC 7)
--       - Số dư hiện tại = 10.000.000 − tổng phí đang bị GIỮ (chưa hoàn)
-- 3. Số dư ví của SELLER tính từ sellerReceives của các đơn đã PAID.
-- 4. Phiên #4 (OPPO Find X7 Ultra) bị REJECTED, có reject_reason.

-- -----------------------------------------------------------------
-- BƯỚC 1: XÓA SẠCH DỮ LIỆU CŨ (đúng thứ tự khóa ngoại)
-- -----------------------------------------------------------------
DELETE FROM orders;
DELETE FROM auction_entry_fees;
DELETE FROM bids;
DELETE FROM reports;
DELETE FROM notifications;
DELETE FROM wallet_topup_requests;
DELETE FROM withdrawal_requests;
DELETE FROM auction_images;
DELETE FROM auctions;
DELETE FROM category;
DELETE FROM users;

ALTER TABLE orders               AUTO_INCREMENT = 1;
ALTER TABLE auction_entry_fees   AUTO_INCREMENT = 1;
ALTER TABLE bids                 AUTO_INCREMENT = 1;
ALTER TABLE reports              AUTO_INCREMENT = 1;
ALTER TABLE notifications        AUTO_INCREMENT = 1;
ALTER TABLE wallet_topup_requests AUTO_INCREMENT = 1;
ALTER TABLE withdrawal_requests  AUTO_INCREMENT = 1;
ALTER TABLE auction_images       AUTO_INCREMENT = 1;
ALTER TABLE auctions             AUTO_INCREMENT = 1;
ALTER TABLE category             AUTO_INCREMENT = 1;
ALTER TABLE users                AUTO_INCREMENT = 1;

-- -----------------------------------------------------------------
-- BƯỚC 2: USERS
-- -----------------------------------------------------------------
INSERT INTO users (
  id, username, email, password, full_name, phone, address,
  role, is_banned, is_email_verified, balance, last_login_ip
) VALUES
(1, 'admin',     'admin@gmail.com',     '$2b$10$Kr6xYeBPRpHsUXdxdBkoy.SmA8JvdS9Tnw3T8V51A9Yw8ZKDtzLdi', 'Quản Trị Viên',  '0900000001', 'Vĩnh Long',  'ADMIN', false, true, 0,          '192.168.1.10'),
(2, 'shopabc',   'shopabc@gmail.com',   '$2b$10$Kr6xYeBPRpHsUXdxdBkoy.SmA8JvdS9Tnw3T8V51A9Yw8ZKDtzLdi', 'Nguyễn Văn An',  '0900000002', 'TP.HCM',     'USER',  false, true, 0,          '118.70.100.21'),
(3, 'techstore', 'techstore@gmail.com', '$2b$10$Kr6xYeBPRpHsUXdxdBkoy.SmA8JvdS9Tnw3T8V51A9Yw8ZKDtzLdi', 'Trần Thị Bình',  '0900000003', 'Hà Nội',     'USER',  false, true, 42960000,   '118.70.100.22'),
(4, 'gadgethub', 'gadgethub@gmail.com', '$2b$10$Kr6xYeBPRpHsUXdxdBkoy.SmA8JvdS9Tnw3T8V51A9Yw8ZKDtzLdi', 'Lê Văn Cường',   '0900000004', 'Đà Nẵng',    'USER',  false, true, 0,          '118.70.100.23'),
(5, 'buyer1',    'buyer1@gmail.com',    '$2b$10$Kr6xYeBPRpHsUXdxdBkoy.SmA8JvdS9Tnw3T8V51A9Yw8ZKDtzLdi', 'Phạm Thị Dung',  '0900000005', 'Cần Thơ',    'USER',  false, true, 8500000,    '203.113.20.15'),
(6, 'buyer2',    'buyer2@gmail.com',    '$2b$10$Kr6xYeBPRpHsUXdxdBkoy.SmA8JvdS9Tnw3T8V51A9Yw8ZKDtzLdi', 'Hoàng Văn Em',   '0900000006', 'Hải Phòng',  'USER',  false, true, 7500000,    '203.113.20.42'),
(7, 'buyer3',    'buyer3@gmail.com',    '$2b$10$Kr6xYeBPRpHsUXdxdBkoy.SmA8JvdS9Tnw3T8V51A9Yw8ZKDtzLdi', 'Võ Thị Phương',  '0900000007', 'Huế',        'USER',  false, true, 9000000,    '118.70.15.88'),
(8, 'buyer4',    'buyer4@gmail.com',    '$2b$10$Kr6xYeBPRpHsUXdxdBkoy.SmA8JvdS9Tnw3T8V51A9Yw8ZKDtzLdi', 'Đặng Văn Giang', '0900000008', 'Nha Trang',  'USER',  false, true, 8000000,    '118.70.15.201');

-- -----------------------------------------------------------------
-- BƯỚC 3: DANH MỤC
-- -----------------------------------------------------------------
INSERT INTO category (id, name) VALUES
(1, 'Điện thoại'),
(2, 'Laptop'),
(3, 'Tablet'),
(4, 'Phụ kiện');

-- -----------------------------------------------------------------
-- BƯỚC 4: SẢN PHẨM ĐẤU GIÁ
-- -----------------------------------------------------------------
INSERT INTO auctions (
  title, description,
  starting_price, current_price, highest_bid,
  reserve_price, buy_now_price, bid_increment_step,
  start_time, end_time,
  status, seller_id, category_id,
  highest_bidder_id, winner_id, version,
  extension_count, duration_days, reject_reason
) VALUES
('iPhone 15 Pro Max 256GB',
  'Máy mới 99%, còn bảo hành 11 tháng, full hộp phụ kiện. Màu titan tự nhiên.',
  25000000, 27800000, 27800000, 27000000, 30000000, 500000,
  DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY),
  'ACTIVE', 2, 1, 5, NULL, 4, 0, 5, NULL),

('Samsung Galaxy S24 Ultra',
  'Bản 512GB, màu đen titan. Máy còn bảo hành 10 tháng, kèm S-Pen.',
  28000000, 30000000, 30000000, 30000000, 33000000, 500000,
  DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY),
  'ACTIVE', 2, 1, 6, NULL, 3, 0, 5, NULL),

('Xiaomi 14 Ultra',
  'Camera Leica chuyên nghiệp, chip Snapdragon 8 Gen 3. Mới 100% chưa active.',
  22000000, 22000000, 22000000, 24000000, 26000000, 300000,
  DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY),
  'ACTIVE', 2, 1, NULL, NULL, 0, 0, 6, NULL),

('OPPO Find X7 Ultra',
  'Camera Hasselblad, 16GB RAM 512GB. Màu xanh biển, mới 99%.',
  20000000, 20000000, 20000000, 22000000, NULL, 300000,
  NOW(), DATE_ADD(NOW(), INTERVAL 4 DAY),
  'REJECTED', 2, 1, NULL, NULL, 0, 0, 4,
  'Mô tả sản phẩm quá sơ sài hoặc thiếu thông tin — Bổ sung mô tả chi tiết: tình trạng máy, phụ kiện đi kèm, tình trạng bảo hành và bổ sung thêm hình ảnh thực tế trước khi đăng lại.'),

('Dell XPS 15',
  'Core i7 Gen 13, 32GB RAM, 1TB SSD, màn hình OLED 4K. Bảo hành 12 tháng.',
  32000000, 34800000, 34800000, 34000000, 37000000, 500000,
  DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY),
  'SOLD', 3, 2, 8, 8, 4, 0, 6, NULL),

('Dell XPS 15 9530',
  'Core i9 Gen 13, 32GB RAM, 1TB SSD, màn OLED 3.5K cảm ứng. Mới 98%, ít sử dụng.',
  30000000, 31200000, 31200000, 32000000, 35000000, 500000,
  DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 4 DAY),
  'ACTIVE', 4, 2, 5, NULL, 2, 0, 5, NULL),

('ASUS ROG Strix G16',
  'RTX 4070, Core i9 Gen 13, 32GB RAM, 1TB SSD. Gaming laptop cao cấp.',
  35000000, 42000000, 42000000, 38000000, 42000000, 500000,
  DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY),
  'SOLD', 3, 2, 8, 8, 3, 0, 5, NULL),

('Lenovo ThinkPad X1 Carbon Gen 11',
  'Core i7, 16GB RAM, 512GB SSD. Siêu nhẹ 1.12kg, pin 15 giờ. Mới 99%.',
  28000000, 28000000, 28000000, 30000000, NULL, 500000,
  NOW(), DATE_ADD(NOW(), INTERVAL 6 DAY),
  'PENDING_APPROVAL', 3, 2, NULL, NULL, 0, 0, 6, NULL),

('MacBook Pro M3',
  '16GB RAM 512GB SSD, màu Space Gray. Mới 100% nguyên seal, chưa active.',
  38000000, 39500000, 39500000, 40000000, 45000000, 500000,
  DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY),
  'FAILED', 4, 2, 7, NULL, 3, 0, 7, NULL),

('iPad Pro M4 11 inch WiFi',
  'Chip M4 mạnh mẽ, màn hình OLED 120Hz. Kèm Apple Pencil Pro. Mới 100%.',
  26000000, 28000000, 28000000, 28000000, 31000000, 300000,
  DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY),
  'ACTIVE', 2, 3, 5, NULL, 5, 0, 5, NULL),

('Samsung Galaxy Tab S9 Ultra',
  '12GB RAM 256GB, màn hình 14.6 inch AMOLED. Kèm bút S-Pen. Mới 99%.',
  24000000, 24800000, 24800000, 26000000, 28000000, 300000,
  DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY),
  'ACTIVE', 2, 3, 6, NULL, 2, 0, 5, NULL),

('AirPods Pro 2',
  'Chống ồn chủ động ANC, chip H2, sạc USB-C. Mới 100% chưa khui hộp.',
  4500000, 5100000, 5100000, 5000000, 5800000, 100000,
  DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY),
  'SOLD', 4, 4, 8, 8, 3, 0, 4, NULL),

('Logitech MX Master 3S',
  'Chuột không dây cao cấp, 8000 DPI, sạc USB-C, kết nối đa thiết bị. Mới 100%.',
  2500000, 3050000, 3050000, 3000000, 3500000, 50000,
  DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY),
  'SOLD', 4, 4, 6, 6, 3, 0, 4, NULL),

('Apple Watch Series 9 45mm',
  'GPS + Cellular, viền nhôm, dây sport. Mới 100% nguyên seal.',
  10000000, 10000000, 10000000, 11000000, NULL, 200000,
  NOW(), DATE_ADD(NOW(), INTERVAL 6 DAY),
  'PENDING_APPROVAL', 4, 4, NULL, NULL, 0, 0, 6, NULL);

-- -----------------------------------------------------------------
-- BƯỚC 5: LƯỢT ĐẶT GIÁ
-- -----------------------------------------------------------------
INSERT INTO bids (amount, bid_time, auction_id, bidder_id, ip_address) VALUES
(25500000, DATE_SUB(NOW(), INTERVAL 3 DAY),    1, 5, '203.113.20.15'),
(26200000, DATE_SUB(NOW(), INTERVAL 2 DAY),    1, 6, '203.113.20.42'),
(27000000, DATE_SUB(NOW(), INTERVAL 1 DAY),    1, 7, '118.70.15.88'),
(27800000, DATE_SUB(NOW(), INTERVAL 10 HOUR),  1, 5, '203.113.20.15'),

(28500000, DATE_SUB(NOW(), INTERVAL 2 DAY),    2, 6, '203.113.20.42'),
(29200000, DATE_SUB(NOW(), INTERVAL 1 DAY),    2, 8, '118.70.15.201'),
(30000000, DATE_SUB(NOW(), INTERVAL 5 HOUR),   2, 6, '203.113.20.42'),

(32500000, DATE_SUB(NOW(), INTERVAL 8 DAY),    5, 5, '203.113.20.15'),
(33200000, DATE_SUB(NOW(), INTERVAL 7 DAY),    5, 7, '118.70.15.88'),
(34000000, DATE_SUB(NOW(), INTERVAL 5 DAY),    5, 5, '203.113.20.15'),
(34800000, DATE_SUB(NOW(), INTERVAL 4 DAY),    5, 8, '118.70.15.201'),

(30500000, DATE_SUB(NOW(), INTERVAL 1 DAY),    6, 7, '118.70.15.88'),
(31200000, DATE_SUB(NOW(), INTERVAL 8 HOUR),   6, 5, '203.113.20.15'),

(35500000, DATE_SUB(NOW(), INTERVAL 6 DAY),    7, 6, '203.113.20.42'),
(36200000, DATE_SUB(NOW(), INTERVAL 5 DAY),    7, 7, '118.70.15.88'),

(38500000, DATE_SUB(NOW(), INTERVAL 8 DAY),    9, 5, '203.113.20.15'),
(39000000, DATE_SUB(NOW(), INTERVAL 6 DAY),    9, 6, '203.113.20.42'),
(39500000, DATE_SUB(NOW(), INTERVAL 5 DAY),    9, 7, '118.70.15.88'),

(26300000, DATE_SUB(NOW(), INTERVAL 4 DAY),   10, 5, '203.113.20.15'),
(26700000, DATE_SUB(NOW(), INTERVAL 3 DAY),   10, 6, '203.113.20.42'),
(27200000, DATE_SUB(NOW(), INTERVAL 2 DAY),   10, 7, '118.70.15.88'),
(27600000, DATE_SUB(NOW(), INTERVAL 1 DAY),   10, 8, '118.70.15.201'),
(28000000, DATE_SUB(NOW(), INTERVAL 2 HOUR),  10, 5, '203.113.20.15'),

(24400000, DATE_SUB(NOW(), INTERVAL 2 DAY),   11, 8, '118.70.15.201'),
(24800000, DATE_SUB(NOW(), INTERVAL 1 DAY),   11, 6, '203.113.20.42'),

(4600000,  DATE_SUB(NOW(), INTERVAL 5 DAY),   12, 8, '118.70.15.201'),
(4800000,  DATE_SUB(NOW(), INTERVAL 4 DAY),   12, 5, '203.113.20.15'),
(5100000,  DATE_SUB(NOW(), INTERVAL 3 DAY),   12, 8, '118.70.15.201'),

(2850000,  DATE_SUB(NOW(), INTERVAL 5 DAY),   13, 7, '118.70.15.88'),
(3050000,  DATE_SUB(NOW(), INTERVAL 4 DAY),   13, 6, '203.113.20.42');

-- -----------------------------------------------------------------
-- BƯỚC 6: PHÍ THAM GIA ĐẶT GIÁ
-- -----------------------------------------------------------------
INSERT INTO auction_entry_fees (auction_id, bidder_id, fee_amount, refunded, paid_at, refunded_at) VALUES
(1,  5, 500000, false, DATE_SUB(NOW(), INTERVAL 3 DAY),  NULL),
(1,  6, 500000, false, DATE_SUB(NOW(), INTERVAL 2 DAY),  NULL),
(1,  7, 500000, false, DATE_SUB(NOW(), INTERVAL 1 DAY),  NULL),
(2,  6, 500000, false, DATE_SUB(NOW(), INTERVAL 2 DAY),  NULL),
(2,  8, 500000, false, DATE_SUB(NOW(), INTERVAL 1 DAY),  NULL),
(5,  5, 500000, true,  DATE_SUB(NOW(), INTERVAL 8 DAY),  DATE_SUB(NOW(), INTERVAL 3 DAY)),
(5,  7, 500000, true,  DATE_SUB(NOW(), INTERVAL 7 DAY),  DATE_SUB(NOW(), INTERVAL 3 DAY)),
(5,  8, 500000, true,  DATE_SUB(NOW(), INTERVAL 4 DAY),  DATE_SUB(NOW(), INTERVAL 1 DAY)),
(6,  7, 500000, false, DATE_SUB(NOW(), INTERVAL 1 DAY),  NULL),
(6,  5, 500000, false, DATE_SUB(NOW(), INTERVAL 8 HOUR), NULL),
(7,  6, 500000, true,  DATE_SUB(NOW(), INTERVAL 6 DAY),  DATE_SUB(NOW(), INTERVAL 3 DAY)),
(7,  7, 500000, true,  DATE_SUB(NOW(), INTERVAL 5 DAY),  DATE_SUB(NOW(), INTERVAL 3 DAY)),
(9,  5, 500000, true,  DATE_SUB(NOW(), INTERVAL 8 DAY),  DATE_SUB(NOW(), INTERVAL 3 DAY)),
(9,  6, 500000, true,  DATE_SUB(NOW(), INTERVAL 6 DAY),  DATE_SUB(NOW(), INTERVAL 3 DAY)),
(9,  7, 500000, true,  DATE_SUB(NOW(), INTERVAL 5 DAY),  DATE_SUB(NOW(), INTERVAL 3 DAY)),
(10, 5, 500000, false, DATE_SUB(NOW(), INTERVAL 4 DAY),  NULL),
(10, 6, 500000, false, DATE_SUB(NOW(), INTERVAL 3 DAY),  NULL),
(10, 7, 500000, false, DATE_SUB(NOW(), INTERVAL 2 DAY),  NULL),
(10, 8, 500000, false, DATE_SUB(NOW(), INTERVAL 1 DAY),  NULL),
(11, 8, 500000, false, DATE_SUB(NOW(), INTERVAL 2 DAY),  NULL),
(11, 6, 500000, false, DATE_SUB(NOW(), INTERVAL 1 DAY),  NULL),
(12, 5, 500000, true,  DATE_SUB(NOW(), INTERVAL 4 DAY),  DATE_SUB(NOW(), INTERVAL 2 DAY)),
(12, 8, 500000, false, DATE_SUB(NOW(), INTERVAL 5 DAY),  NULL),
(13, 7, 500000, true,  DATE_SUB(NOW(), INTERVAL 5 DAY),  DATE_SUB(NOW(), INTERVAL 3 DAY)),
(13, 6, 500000, false, DATE_SUB(NOW(), INTERVAL 4 DAY),  NULL);

-- -----------------------------------------------------------------
-- BƯỚC 7: NẠP TIỀN VÍ — chỉ qua VNPay, không có nạp thủ công
-- 4 bản ghi APPROVED là nguồn gốc balance ban đầu của buyer
-- vnp_txn_ref dùng giả định để demo lịch sử
-- -----------------------------------------------------------------
INSERT INTO wallet_topup_requests (user_id, amount, status, note, created_at, confirmed_at, vnp_txn_ref) VALUES
(5, 10000000, 'APPROVED', 'Nạp qua VNPay', DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY), 'TOPUP5_1000000000001'),
(6, 10000000, 'APPROVED', 'Nạp qua VNPay', DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY), 'TOPUP6_1000000000002'),
(7, 10000000, 'APPROVED', 'Nạp qua VNPay', DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY), 'TOPUP7_1000000000003'),
(8, 10000000, 'APPROVED', 'Nạp qua VNPay', DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY), 'TOPUP8_1000000000004'),

-- Demo thêm 1 APPROVED và 1 REJECTED để hiển thị đủ trạng thái lịch sử
(5, 2000000,  'APPROVED', 'Nạp qua VNPay', DATE_SUB(NOW(), INTERVAL 3 HOUR),  DATE_SUB(NOW(), INTERVAL 3 HOUR),  'TOPUP5_1000000000005'),
(6, 1000000,  'REJECTED', 'Thanh toán VNPay bị hủy', DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR), 'TOPUP6_1000000000006');

-- Buyer5 nạp thêm 2.000.000 → balance: 8.500.000 + 2.000.000 = 10.500.000
-- Nhưng để đơn giản, giữ nguyên balance 8.500.000 trong BƯỚC 2
-- (bản ghi APPROVED thêm chỉ để demo lịch sử, không cộng vào balance mẫu)

-- -----------------------------------------------------------------
-- BƯỚC 8: ĐƠN HÀNG
-- shipped_at = thời điểm NGƯỜI BÁN xác nhận giao (không phải admin)
-- -----------------------------------------------------------------
INSERT INTO orders (
  final_price, status, payment_method, payment_note,
  created_at, confirmed_at, shipped_at, completed_at,
  auction_id, buyer_id, commission_fee, seller_receives,
  vnp_txn_ref, is_overdue_cancel, late_penalty_applied
) VALUES
-- Đơn (5) Dell XPS 15 — PAID hoàn tất
(34800000, 'PAID', 'BANK_TRANSFER', 'Đã chuyển khoản qua MBBank, nội dung DXPS15',
 DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 6 HOUR,
 DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY),
 5, 8, 1740000, 33060000, NULL, false, false),

-- Đơn (7) ASUS ROG Strix G16 — mua ngay, PAID hoàn tất
(42000000, 'PAID', 'MOMO', 'Đã thanh toán qua Momo, SĐT 0900000008',
 DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 10 HOUR,
 DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 12 HOUR),
 7, 8, 2100000, 39900000, NULL, false, false),

-- Đơn (12) AirPods Pro 2 — PENDING_CONFIRMATION (chờ người bán xác nhận giao)
(5100000, 'PENDING_CONFIRMATION', 'MOMO', 'Đã chuyển qua ví Momo lúc 20h hôm trước',
 DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY),
 NULL, NULL,
 12, 8, 255000, 4845000, NULL, false, false),

-- Đơn (13) Logitech MX Master 3S — SHIPPING (người bán đã xác nhận, chờ người mua nhận hàng)
(3050000, 'SHIPPING', 'BANK_TRANSFER', 'Chuyển khoản Vietcombank, nội dung thanh toan don hang',
 DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 8 HOUR,
 DATE_SUB(NOW(), INTERVAL 1 DAY), NULL,
 13, 6, 152500, 2897500, NULL, false, false);

-- -----------------------------------------------------------------
-- BƯỚC 9: BÁO CÁO VI PHẠM
-- -----------------------------------------------------------------
INSERT INTO reports (
  reason, description, status, admin_note,
  created_at, resolved_at,
  reporter_id, reported_user_id, auction_id
) VALUES
('NO_RESPONSE',
 'Tôi đã thắng đấu giá Dell XPS 15 nhưng người bán không phản hồi tin nhắn.',
 'PENDING', NULL,
 DATE_SUB(NOW(), INTERVAL 1 DAY), NULL,
 8, 3, 5),

('WRONG_DESCRIPTION',
 'Sản phẩm Logitech MX Master 3S nhận được có vài vết trầy nhỏ không như mô tả "mới 100%".',
 'DISMISSED', 'Đã liên hệ người bán xác minh, vết trầy nhỏ trong phạm vi cho phép, không đủ cơ sở xử lý.',
 DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY),
 6, 4, 13);

-- -----------------------------------------------------------------
-- BƯỚC 10: THÔNG BÁO
-- -----------------------------------------------------------------
INSERT INTO notifications (message, is_read, created_at, user_id) VALUES
('Bạn vừa bị vượt giá trên: iPhone 15 Pro Max 256GB', true,  DATE_SUB(NOW(), INTERVAL 2 DAY),   5),
('Bạn vừa bị vượt giá trên: iPhone 15 Pro Max 256GB', true,  DATE_SUB(NOW(), INTERVAL 1 DAY),   6),
('Bạn vừa bị vượt giá trên: iPhone 15 Pro Max 256GB', false, DATE_SUB(NOW(), INTERVAL 10 HOUR), 7),
('Bạn vừa bị vượt giá trên: Samsung Galaxy S24 Ultra', true, DATE_SUB(NOW(), INTERVAL 1 DAY),   6),
('Bạn vừa bị vượt giá trên: Samsung Galaxy S24 Ultra', false,DATE_SUB(NOW(), INTERVAL 5 HOUR),  8),
('Bạn đã thắng phiên đấu giá: Dell XPS 15',          true,  DATE_SUB(NOW(), INTERVAL 4 DAY),   8),
('Bạn đã mua thành công: ASUS ROG Strix G16',         true,  DATE_SUB(NOW(), INTERVAL 4 DAY),   8),
('Bạn đã thắng phiên đấu giá: AirPods Pro 2',        true,  DATE_SUB(NOW(), INTERVAL 3 DAY),   8),
('Bạn đã thắng phiên đấu giá: Logitech MX Master 3S',true,  DATE_SUB(NOW(), INTERVAL 4 DAY),   6),
('Đơn hàng #4 đang được giao đến bạn! Sau khi nhận hàng vui lòng xác nhận trong ứng dụng.', false, DATE_SUB(NOW(), INTERVAL 1 DAY), 6),
('Đơn hàng #1 đã hoàn thành. Cảm ơn bạn!',           true,  DATE_SUB(NOW(), INTERVAL 1 DAY),   8),
('Đơn hàng #2 đã hoàn thành. Cảm ơn bạn!',           true,  DATE_SUB(NOW(), INTERVAL 12 HOUR), 8),
('Phiên đấu giá "OPPO Find X7 Ultra" đã bị từ chối. Lý do: Mô tả sản phẩm quá sơ sài hoặc thiếu thông tin — Bổ sung mô tả chi tiết: tình trạng máy, phụ kiện đi kèm, tình trạng bảo hành.', false, NOW(), 2),
('Nạp tiền qua VNPay thành công! Số dư hiện tại: 10.000.000 VNĐ', true, DATE_SUB(NOW(), INTERVAL 12 DAY), 5),
('Nạp tiền qua VNPay thành công! Số dư hiện tại: 10.000.000 VNĐ', true, DATE_SUB(NOW(), INTERVAL 12 DAY), 6),
('Nạp tiền qua VNPay thành công! Số dư hiện tại: 10.000.000 VNĐ', true, DATE_SUB(NOW(), INTERVAL 12 DAY), 7),
('Nạp tiền qua VNPay thành công! Số dư hiện tại: 10.000.000 VNĐ', true, DATE_SUB(NOW(), INTERVAL 12 DAY), 8),
('Bạn không thắng phiên "MacBook Pro M3". Phí tham gia 500.000 VNĐ đã được hoàn lại vào ví.', true,  DATE_SUB(NOW(), INTERVAL 3 DAY), 5),
('Bạn không thắng phiên "MacBook Pro M3". Phí tham gia 500.000 VNĐ đã được hoàn lại vào ví.', true,  DATE_SUB(NOW(), INTERVAL 3 DAY), 6),
('Bạn không thắng phiên "MacBook Pro M3". Phí tham gia 500.000 VNĐ đã được hoàn lại vào ví.', false, DATE_SUB(NOW(), INTERVAL 3 DAY), 7),
('Rút tiền thành công! 20.000.000 VNĐ đã được chuyển đến Vietcombank - 0071001234567', true, DATE_SUB(NOW(), INTERVAL 1 DAY), 3),
('Rút tiền thành công! 10.000.000 VNĐ đã được chuyển đến Vietcombank - 0071001234567', false, DATE_SUB(NOW(), INTERVAL 6 HOUR), 3);

-- -----------------------------------------------------------------
-- BƯỚC 11: ẢNH SẢN PHẨM
-- -----------------------------------------------------------------
INSERT INTO auction_images (image_url, auction_id) VALUES
('iphone-15-pro-max.jpg', 1), ('iphone-15-pro-max_1.jpg', 1), ('iphone-15-pro-max_2.jpg', 1), ('iphone-15-pro-max_3.jpg', 1), ('iphone-15-pro-max_4.jpg', 1),
('samsung-galaxy-s24-ultra-1.jpg', 2), ('samsung-galaxy-s24-ultra-2.jpg', 2), ('samsung-galaxy-s24-ultra-3.jpg', 2), ('samsung-galaxy-s24-ultra-4.jpg', 2),
('xiaomi_14_ultra_1.jpg', 3), ('xiaomi_14_ultra_2.jpg', 3), ('xiaomi_14_ultra_3.jpg', 3), ('xiaomi_14_ultra_4.jpg', 3),
('oppo-find-x7-ultra.jpg', 4), ('oppo-find-x7-ultra-1.jpg', 4), ('oppo-find-x7-ultra-2.jpg', 4), ('oppo-find-x7-ultra-3.jpg', 4), ('oppo-find-x7-ultra-4.jpg', 4),
('dell-xps-15-1.jpg', 5), ('dell-xps-15-2.jpg', 5), ('dell-xps-15-3.jpg', 5), ('dell-xps-15-4.jpg', 5), ('dell-xps-15-5.jpg', 5),
('laptop_dell_xps_15_9530_1_.jpg', 6), ('laptop_dell_xps_15_9530_2_.jpg', 6), ('laptop_dell_xps_15_9530_3_.jpg', 6), ('laptop_dell_xps_15_9530_4_.jpg', 6), ('laptop_dell_xps_15_9530_5_.jpg', 6),
('asus-rog-strix-g16-1.jpg', 7), ('asus-rog-strix-g16-2.jpg', 7), ('asus-rog-strix-g16-3.jpg', 7), ('asus-rog-strix-g16-4.jpg', 7), ('asus-rog-strix-g16-5.jpg', 7), ('asus-rog-strix-g16-6.jpg', 7), ('asus-rog-strix-g16-7.jpg', 7), ('asus-rog-strix-g16-8.jpg', 7), ('asus-rog-strix-g16-9.jpg', 7),
('lenovo-thinkpad-x1-1.jpg', 8), ('lenovo-thinkpad-x1-2.jpg', 8), ('lenovo-thinkpad-x1-3.jpg', 8), ('lenovo-thinkpad-x1-4.jpg', 8), ('lenovo-thinkpad-x1-5.jpg', 8), ('lenovo-thinkpad-x1-6.jpg', 8),
('macbook-pro-m3-1.jpg', 9), ('macbook-pro-m3-2.jpg', 9), ('macbook-pro-m3-3.jpg', 9), ('macbook-pro-m3-4.jpg', 9),
('ipad-pro-m4-1.jpg', 10), ('ipad-pro-m4-2.jpg', 10), ('ipad-pro-m4-3.jpg', 10),
('samsung-galaxy-tab-s9-1.jpg', 11), ('samsung-galaxy-tabs9-2.jpg', 11), ('samsung-galaxy-tab-s9-3.jpg', 11), ('samsung-galaxy-tab-s9-4.jpg', 11),
('airpods-pro-2-1.jpg', 12), ('airpods-pro-2-2.jpg', 12), ('airpods-pro-2-3.jpg', 12), ('airpods-pro-2-4.jpg', 12),
('logitech-mx-master-3s.jpg', 13), ('logitech-mx-master-3s_1_.jpg', 13), ('logitech-mx-master-3s_2_.jpg', 13), ('logitech-mx-master-3s_3_.jpg', 13), ('logitech-mx-master-3s_4_.jpg', 13), ('logitech-mx-master-3s_5_.jpg', 13),
('apple-watch-series-9-45mm-1.png', 14), ('apple-watch-series-9-45mm-2.jpg', 14), ('apple-watch-series-9-45mm-3.png', 14), ('apple-watch-series-9-45mm-4.png', 14);

-- -----------------------------------------------------------------
-- BƯỚC 12: YÊU CẦU RÚT TIỀN
-- seller3 (techstore) rút 2 lần từ doanh thu 2 đơn PAID (tổng 72.960.000đ)
-- Đã rút: 20.000.000 + 10.000.000 = 30.000.000
-- Số dư còn lại: 72.960.000 - 30.000.000 = 42.960.000 
-- -----------------------------------------------------------------
INSERT INTO withdrawal_requests (
  user_id, amount, bank_name, bank_account_number, bank_account_name,
  status, admin_note, created_at, processed_at
) VALUES
(3, 20000000, 'Vietcombank', '0071001234567', 'TRAN THI BINH',
 'COMPLETED', 'Giả lập chuyển khoản thành công',
 DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),

(3, 10000000, 'Vietcombank', '0071001234567', 'TRAN THI BINH',
 'COMPLETED', 'Giả lập chuyển khoản thành công',
 DATE_SUB(NOW(), INTERVAL 6 HOUR), DATE_SUB(NOW(), INTERVAL 6 HOUR));