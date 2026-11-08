package com.vms.email.entity;

public enum NotificationType {
    VEHICLE_ASSIGNED,   // Admin/Manager giao xe cho tài xế
    VEHICLE_REVOKED,    // Admin/Manager thu hồi xe từ tài xế
    VEHICLE_RETURNED,   // Tài xế bàn giao trả lại xe cho quản trị
    MAINTENANCE_ALERT,  // Xe quá ngưỡng cần bảo dưỡng
    HIGH_COST_ALERT,    // Phát sinh chi phí lớn
    SYSTEM              // Thông báo hệ thống chung
}

