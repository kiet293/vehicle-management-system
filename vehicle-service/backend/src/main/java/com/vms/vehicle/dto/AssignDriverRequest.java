package com.vms.vehicle.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignDriverRequest {
    private Long driverId;
    private String driverName;
    private String driverEmail;
}
