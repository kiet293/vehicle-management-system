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
public class OcrReceiptResponse {
    private String receiptImageUrl;
    private BigDecimal amount;
    private CostType costType;
    private LocalDate costDate;
    private String vehiclePlate;
    private String merchantName;
    private String invoiceNumber;
    private String description;
    private String rawText;
    private boolean aiExtracted;
    private String message;
}

