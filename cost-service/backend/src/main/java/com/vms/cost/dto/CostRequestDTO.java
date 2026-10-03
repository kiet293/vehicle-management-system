package com.vms.cost.dto;

import com.vms.cost.entity.CostType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CostRequestDTO {

    @NotNull(message = "Phương tiện không được để trống (vehicleId is required)")
    private Long vehicleId;

    @NotNull(message = "Loại chi phí không được để trống (costType is required)")
    private CostType costType;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0.01", inclusive = true, message = "Số tiền chi phí phải lớn hơn 0")
    private BigDecimal amount;

    @NotNull(message = "Ngày phát sinh chi phí không được để trống")
    @PastOrPresent(message = "Ngày chi phí không được vượt quá ngày hiện tại")
    private LocalDate costDate;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    private String description;

    public CostRequestDTO() {
    }

    public CostRequestDTO(Long vehicleId, CostType costType, BigDecimal amount, LocalDate costDate, String description) {
        this.vehicleId = vehicleId;
        this.costType = costType;
        this.amount = amount;
        this.costDate = costDate;
        this.description = description;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public CostType getCostType() {
        return costType;
    }

    public void setCostType(CostType costType) {
        this.costType = costType;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public LocalDate getCostDate() {
        return costDate;
    }

    public void setCostDate(LocalDate costDate) {
        this.costDate = costDate;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public static CostRequestDTOBuilder builder() {
        return new CostRequestDTOBuilder();
    }

    public static class CostRequestDTOBuilder {
        private Long vehicleId;
        private CostType costType;
        private BigDecimal amount;
        private LocalDate costDate;
        private String description;

        public CostRequestDTOBuilder vehicleId(Long vehicleId) {
            this.vehicleId = vehicleId;
            return this;
        }

        public CostRequestDTOBuilder costType(CostType costType) {
            this.costType = costType;
            return this;
        }

        public CostRequestDTOBuilder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public CostRequestDTOBuilder costDate(LocalDate costDate) {
            this.costDate = costDate;
            return this;
        }

        public CostRequestDTOBuilder description(String description) {
            this.description = description;
            return this;
        }

        public CostRequestDTO build() {
            return new CostRequestDTO(vehicleId, costType, amount, costDate, description);
        }
    }
}
