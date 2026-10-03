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
public class ReportSummaryDTO {
    private long totalVehicles;
    private long availableVehicles;
    private long inUseVehicles;
    private long maintenanceVehicles;

    private BigDecimal currentMonthCost;
    private BigDecimal previousMonthCost;
    private double costChangePercentage;
    private long currentMonthCount;
}
