package com.vms.email.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HighCostAlertRequest {
    private String licensePlate;
    private String costType;
    private BigDecimal amount;
    private String driverName;
    private String description;
    private String recipientEmail;
}
