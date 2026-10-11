-- =============================================================================
-- SEED SAMPLE DATA FOR VEHICLE MANAGEMENT SYSTEM (VMS)
-- =============================================================================
SET NAMES utf8mb4;

-- 1. Thêm các tài xế mẫu trong user_db
USE user_db;

INSERT INTO users (username, password, full_name, email, phone, role, driver_license_number, driver_license_class, status, created_at, updated_at)
VALUES 
  ('driver3', '$2a$10$tu.crG9UlCLruXe6FRV82OtSOVakjlXyWpRdPuf62znZdPlW9FT62', 'Vũ Thành Long', 'driver.long@vms.com', '0915234567', 'DRIVER', '2905543210', 'D', 'ACTIVE', NOW(), NOW()),
  ('driver4', '$2a$10$tu.crG9UlCLruXe6FRV82OtSOVakjlXyWpRdPuf62znZdPlW9FT62', 'Đỗ Minh Quân', 'driver.quan@vms.com', '0988776655', 'DRIVER', '2908877665', 'E', 'ACTIVE', NOW(), NOW()),
  ('driver5', '$2a$10$tu.crG9UlCLruXe6FRV82OtSOVakjlXyWpRdPuf62znZdPlW9FT62', 'Hoàng Văn Tuấn', 'driver.tuan@vms.com', '0944112233', 'DRIVER', '2904433221', 'B2', 'ACTIVE', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  full_name = VALUES(full_name),
  phone = VALUES(phone),
  driver_license_number = VALUES(driver_license_number),
  driver_license_class = VALUES(driver_license_class);

-- Lấy ID của các driver sau khi insert/update
SET @driver_an_id = (SELECT id FROM users WHERE username = 'driver1' LIMIT 1);
SET @driver_binh_id = (SELECT id FROM users WHERE username = 'driver2' LIMIT 1);
SET @driver_long_id = (SELECT id FROM users WHERE username = 'driver3' LIMIT 1);
SET @driver_quan_id = (SELECT id FROM users WHERE username = 'driver4' LIMIT 1);
SET @driver_tuan_id = (SELECT id FROM users WHERE username = 'driver5' LIMIT 1);

-- 2. Cập nhật và bổ sung các phương tiện mẫu trong vehicle_db
USE vehicle_db;

-- Cập nhật thông tin chi tiết cho các xe sẵn có
UPDATE vehicles SET 
  assigned_driver_id = @driver_an_id,
  assigned_driver_name = 'Nguyễn Văn An',
  status = 'IN_USE',
  current_odometer = 18500,
  last_maintenance_odometer = 15000
WHERE license_plate = '29A-888.88';

-- Xe gặp sự cố 1: Ford Ranger - ĐANG BẢO TRÌ SỰ CỐ TẠI GARA
UPDATE vehicles SET 
  assigned_driver_id = @driver_binh_id,
  assigned_driver_name = 'Phạm Hoàng Bình',
  status = 'MAINTENANCE',
  current_odometer = 39200,
  last_maintenance_odometer = 35000
WHERE license_plate = '30H-123.45';

-- Xe gặp sự cố 2: Hyundai SantaFe - QUÁ HẠN BẢO DƯỠNG KHẨN CẤP (vượt +6.500 km >= 5.000 km)
UPDATE vehicles SET 
  assigned_driver_id = @driver_long_id,
  assigned_driver_name = 'Vũ Thành Long',
  status = 'AVAILABLE',
  current_odometer = 26500,
  last_maintenance_odometer = 20000
WHERE license_plate = '51K-999.99';

UPDATE vehicles SET 
  assigned_driver_id = @driver_quan_id,
  assigned_driver_name = 'Đỗ Minh Quân',
  status = 'IN_USE',
  current_odometer = 64200,
  last_maintenance_odometer = 62000
WHERE license_plate = '29B-456.78';

-- Xe gặp sự cố 3: VinFast VF8 - ĐANG BẢO TRÌ SỰ CỐ PIN & ĐỘNG CƠ
UPDATE vehicles SET 
  assigned_driver_id = @driver_tuan_id,
  assigned_driver_name = 'Hoàng Văn Tuấn',
  status = 'MAINTENANCE',
  current_odometer = 12000,
  last_maintenance_odometer = 5000
WHERE license_plate = '30E-777.77';

UPDATE vehicles SET 
  assigned_driver_id = NULL,
  assigned_driver_name = NULL,
  status = 'AVAILABLE',
  current_odometer = 2500,
  last_maintenance_odometer = 0,
  image_url = 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop&q=60'
WHERE license_plate = '75A-777.77';

-- Thêm các xe mới bổ sung để hạm đội phong phú
INSERT INTO vehicles (license_plate, brand, model, vehicle_type, seat_capacity, manufacture_year, current_odometer, last_maintenance_odometer, status, assigned_driver_id, assigned_driver_name, image_url, created_at, updated_at)
VALUES
  ('51G-888.66', 'Mercedes-Benz', 'C300 AMG', 'SEDAN', 5, 2024, 15800, 15000, 'AVAILABLE', @driver_an_id, 'Nguyễn Văn An', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop&q=60', NOW(), NOW()),
  ('43A-666.88', 'Mitsubishi', 'Xpander Premium', 'VAN', 7, 2023, 46200, 40000, 'MAINTENANCE', @driver_long_id, 'Vũ Thành Long', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60', NOW(), NOW()),
  ('29H-999.88', 'Isuzu', 'QKR 270 Thùng Kín', 'TRUCK', 3, 2022, 52300, 50000, 'IN_USE', @driver_binh_id, 'Phạm Hoàng Bình', 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&auto=format&fit=crop&q=60', NOW(), NOW()),
  ('30F-555.55', 'Mazda', 'CX-5 2.5 Signature', 'SUV', 5, 2023, 21000, 20000, 'AVAILABLE', NULL, NULL, 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&auto=format&fit=crop&q=60', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  status = VALUES(status),
  current_odometer = VALUES(current_odometer),
  last_maintenance_odometer = VALUES(last_maintenance_odometer),
  assigned_driver_id = VALUES(assigned_driver_id),
  assigned_driver_name = VALUES(assigned_driver_name);

-- 3. Thêm nhật ký chuyến đi mẫu
INSERT INTO vehicle_trips (vehicle_id, vehicle_plate, driver_id, driver_name, start_odometer, end_odometer, distance_km, status, started_at, ended_at, notes)
VALUES
  (2, '30H-123.45', @driver_binh_id, 'Phạm Hoàng Bình', 38500, 39200, 700, 'COMPLETED', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 'Phát hiện tiếng kêu lạ ở trục phanh trước khi về tới Gara.'),
  (1, '29A-888.88', @driver_an_id, 'Nguyễn Văn An', 17800, 18500, 700, 'IN_PROGRESS', DATE_SUB(NOW(), INTERVAL 4 HOUR), NULL, 'Đang đưa đón chuyên gia khu công nghệ cao Hòa Lạc.'),
  (4, '29B-456.78', @driver_quan_id, 'Đỗ Minh Quân', 63500, 64200, 700, 'IN_PROGRESS', DATE_SUB(NOW(), INTERVAL 6 HOUR), NULL, 'Hành trình chở đoàn khách du lịch tuyến Hà Nội - Hạ Long.')
ON DUPLICATE KEY UPDATE notes = VALUES(notes);

-- 4. Thêm chi phí phát sinh mẫu trong cost_db
USE cost_db;

INSERT INTO costs (vehicle_id, vehicle_plate, driver_id, driver_name, cost_type, amount, odometer_at_cost, cost_date, description, receipt_image_url, created_at, updated_at)
VALUES
  (2, '30H-123.45', @driver_binh_id, 'Phạm Hoàng Bình', 'MAINTENANCE', 4850000.00, 39200, CURDATE(), 'Sửa chữa và thay thế cụm má phanh ABS khẩn cấp tại Gara Ford', 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=60', NOW(), NOW()),
  (5, '30E-777.77', @driver_tuan_id, 'Hoàng Văn Tuấn', 'MAINTENANCE', 3200000.00, 12000, CURDATE(), 'Kiểm tra phần mềm và bảo dưỡng module sạc pin VinFast 3S', 'https://images.unsplash.com/photo-1554415707-9e4466bfe0dc?w=800&auto=format&fit=crop&q=60', NOW(), NOW())
ON DUPLICATE KEY UPDATE amount = VALUES(amount);
