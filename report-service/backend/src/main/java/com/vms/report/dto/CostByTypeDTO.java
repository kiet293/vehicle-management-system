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
public class CostByTypeDTO {
    private String type;
    private String typeLabel;
    private BigDecimal amount;
    private double percentage;
    private String color;
}
