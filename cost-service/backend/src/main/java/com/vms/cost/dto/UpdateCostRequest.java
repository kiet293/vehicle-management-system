package com.vms.cost.dto;

import com.vms.cost.entity.CostType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCostRequest {
    private CostType costType;
    private BigDecimal amount;
    private Integer odometerAtCost;
    private LocalDate costDate;
    private String description;
    private String receiptImageUrl;
}
