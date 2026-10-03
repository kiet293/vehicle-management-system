package com.vms.cost.dto;

import com.vms.cost.entity.CostType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostSummaryDTO {
    private BigDecimal totalAmount;
    private long totalCount;
    private BigDecimal thisMonthTotal;
    private BigDecimal lastMonthTotal;
    private double percentChange;
    private Map<CostType, BigDecimal> byType;
    private Map<Integer, BigDecimal> monthlyTotals;
}
