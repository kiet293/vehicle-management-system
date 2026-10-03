package com.vms.cost.dto;

import com.vms.cost.entity.Cost;
import com.vms.cost.entity.CostType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class CostResponseDTO {

    private Long id;
    private Long vehicleId;
    private CostType costType;
    private BigDecimal amount;
    private LocalDate costDate;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public CostResponseDTO() {
    }

    public CostResponseDTO(Long id, Long vehicleId, CostType costType, BigDecimal amount, LocalDate costDate, String description, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.vehicleId = vehicleId;
        this.costType = costType;
        this.amount = amount;
        this.costDate = costDate;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static CostResponseDTO fromEntity(Cost cost) {
        if (cost == null) return null;
        return CostResponseDTO.builder()
                .id(cost.getId())
                .vehicleId(cost.getVehicleId())
                .costType(cost.getCostType())
                .amount(cost.getAmount())
                .costDate(cost.getCostDate())
                .description(cost.getDescription())
                .createdAt(cost.getCreatedAt())
                .updatedAt(cost.getUpdatedAt())
                .build();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static CostResponseDTOBuilder builder() {
        return new CostResponseDTOBuilder();
    }

    public static class CostResponseDTOBuilder {
        private Long id;
        private Long vehicleId;
        private CostType costType;
        private BigDecimal amount;
        private LocalDate costDate;
        private String description;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public CostResponseDTOBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public CostResponseDTOBuilder vehicleId(Long vehicleId) {
            this.vehicleId = vehicleId;
            return this;
        }

        public CostResponseDTOBuilder costType(CostType costType) {
            this.costType = costType;
            return this;
        }

        public CostResponseDTOBuilder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public CostResponseDTOBuilder costDate(LocalDate costDate) {
            this.costDate = costDate;
            return this;
        }

        public CostResponseDTOBuilder description(String description) {
            this.description = description;
            return this;
        }

        public CostResponseDTOBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public CostResponseDTOBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public CostResponseDTO build() {
            return new CostResponseDTO(id, vehicleId, costType, amount, costDate, description, createdAt, updatedAt);
        }
    }
}
