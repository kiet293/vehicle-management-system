package com.vms.cost.dto;

import com.vms.cost.entity.Cost;
import com.vms.cost.entity.CostType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostDTO {
    private Long id;
    private Long vehicleId;
    private String vehiclePlate;
    private Long driverId;
    private String driverName;
    private CostType costType;
    private BigDecimal amount;
    private Integer odometerAtCost;
    private LocalDate costDate;
    private String description;
    private String receiptImageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CostDTO fromEntity(Cost cost) {
        if (cost == null) return null;
        return CostDTO.builder()
                .id(cost.getId())
                .vehicleId(cost.getVehicleId())
                .vehiclePlate(cost.getVehiclePlate())
                .driverId(cost.getDriverId())
                .driverName(cost.getDriverName())
                .costType(cost.getCostType())
                .amount(cost.getAmount())
                .odometerAtCost(cost.getOdometerAtCost())
                .costDate(cost.getCostDate())
                .description(cost.getDescription())
                .receiptImageUrl(cost.getReceiptImageUrl())
                .createdAt(cost.getCreatedAt())
                .updatedAt(cost.getUpdatedAt())
                .build();
    }
}
