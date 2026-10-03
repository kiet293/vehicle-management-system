-- =====================================================================
-- Cost Service Database Initialization & Sample Data
-- Database: cost_db
-- =====================================================================

USE `cost_db`;

CREATE TABLE IF NOT EXISTS `costs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `vehicle_id` BIGINT NOT NULL,
    `cost_type` VARCHAR(32) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `cost_date` DATE NOT NULL,
    `description` VARCHAR(500),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_cost_vehicle` (`vehicle_id`),
    INDEX `idx_cost_type` (`cost_type`),
    INDEX `idx_cost_date` (`cost_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample seed records for testing and demonstration
INSERT INTO `costs` (`vehicle_id`, `cost_type`, `amount`, `cost_date`, `description`) VALUES
(1, 'FUEL', 850000.00, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Đổ đầy bình dầu Diesel cho xe tải 29C-123.45'),
(1, 'TOLL', 70000.00, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Vé qua trạm thu phí cao tốc Pháp Vân - Cầu Giẽ'),
(2, 'MAINTENANCE', 2500000.00, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Thay nhớt máy, lọc gió và kiểm tra hệ thống phanh xe 29A-678.90'),
(2, 'FUEL', 500000.00, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Đổ xăng RON 95 cây xăng Petrolimex số 12'),
(3, 'INSURANCE', 8900000.00, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'Phí bảo hiểm trách nhiệm dân sự và vật chất xe 2 năm'),
(1, 'FUEL', 900000.00, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Đổ dầu Diesel cho chặng vận chuyển hàng Hải Phòng'),
(3, 'TOLL', 120000.00, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'Phí BOT trạm thu phí Hà Nội - Hải Phòng'),
(2, 'MAINTENANCE', 1200000.00, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'Cân chỉnh thước lái và đảo lốp xe định kỳ');
