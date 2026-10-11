package com.vms.email.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutoNotificationRequest {
    private String title;
    private String message;
    private String targetRole; // e.g. "MANAGER", "ADMIN", "DRIVER"
    private String recipientEmail; // Optional: nếu không truyền, hệ thống tự động gửi về email người dùng
    private String referenceId; // e.g. Biển số xe hoặc mã phiếu chi
    private String category; // e.g. "MAINTENANCE", "COST", "ASSIGNMENT", "SYSTEM"
}
