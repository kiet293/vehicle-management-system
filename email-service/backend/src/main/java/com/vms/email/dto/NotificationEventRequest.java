package com.vms.email.dto;

import com.vms.email.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEventRequest {
    private NotificationType type;
    private String title;
    private String message;
    private Long targetUserId;
    private String targetUserEmail;
    private String targetRole;
    private String vehiclePlate;
    private Long vehicleId;
    private String actorName;
    private Integer newOdometer;
    private String notes;
}

