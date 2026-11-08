package com.vms.email.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    private String id;
    private String title;
    private String message;
    private NotificationType type;
    private Long targetUserId;      // ID người nhận cụ thể (VD: tài xế có id=3)
    private String targetUserEmail; // Email người nhận
    private String targetRole;      // "ADMIN", "MANAGER", "DRIVER", "ALL"
    private String vehiclePlate;    // Biển số xe liên quan (nếu có)
    private Long vehicleId;         // ID xe liên quan
    private String actorName;       // Người thực hiện hành động (Admin, Quản trị viên, hoặc Tài xế)
    @Builder.Default
    private boolean isRead = false;
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

