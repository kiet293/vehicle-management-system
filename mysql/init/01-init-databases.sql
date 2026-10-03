-- =====================================================================
-- Vehicle Management System - Database Initialization Script
-- Creates individual logical microservice databases and sets up permissions
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `user_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `vehicle_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `cost_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `report_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Ensure application user has full access to all microservice databases
GRANT ALL PRIVILEGES ON `user_db`.* TO 'vms_user'@'%';
GRANT ALL PRIVILEGES ON `vehicle_db`.* TO 'vms_user'@'%';
GRANT ALL PRIVILEGES ON `cost_db`.* TO 'vms_user'@'%';
GRANT ALL PRIVILEGES ON `report_db`.* TO 'vms_user'@'%';

FLUSH PRIVILEGES;
