package com.vms.email.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceAlertRequest {
    private String licensePlate;
    private Integer currentOdometer;
    private Integer lastMaintenanceOdometer;
    private String recipientEmail;
}
