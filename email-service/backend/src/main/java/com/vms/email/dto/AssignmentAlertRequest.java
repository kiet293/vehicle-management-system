package com.vms.email.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentAlertRequest {
    private String licensePlate;
    private String driverName;
    private String driverEmail;
}
