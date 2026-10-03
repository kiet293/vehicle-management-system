package com.vms.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopVehicleDTO {
    private int rank;
    private Long vehicleId;
    private String licensePlate;
    private String brandModel;
    private String driverName;
    private long costCount;
    private BigDecimal totalCost;
}
