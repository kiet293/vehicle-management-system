package com.vms.cost.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "costs", indexes = {
    @Index(name = "idx_cost_vehicle", columnList = "vehicle_id"),
    @Index(name = "idx_cost_type", columnList = "cost_type"),
    @Index(name = "idx_cost_date", columnList = "cost_date")
})
public class Cost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_id", nullable = false)
    private Long vehicleId;

    @Enumerated(EnumType.STRING)
    @Column(name = "cost_type", nullable = false, length = 32)
    private CostType costType;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "cost_date", nullable = false)
    private LocalDate costDate;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Cost() {
    }

    public Cost(Long id, Long vehicleId, CostType costType, BigDecimal amount, LocalDate costDate, String description, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.vehicleId = vehicleId;
        this.costType = costType;
        this.amount = amount;
        this.costDate = costDate;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
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

    public static CostBuilder builder() {
        return new CostBuilder();
    }

    public static class CostBuilder {
        private Long id;
        private Long vehicleId;
        private CostType costType;
        private BigDecimal amount;
        private LocalDate costDate;
        private String description;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public CostBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public CostBuilder vehicleId(Long vehicleId) {
            this.vehicleId = vehicleId;
            return this;
        }

        public CostBuilder costType(CostType costType) {
            this.costType = costType;
            return this;
        }

        public CostBuilder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public CostBuilder costDate(LocalDate costDate) {
            this.costDate = costDate;
            return this;
        }

        public CostBuilder description(String description) {
            this.description = description;
            return this;
        }

        public CostBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public CostBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Cost build() {
            return new Cost(id, vehicleId, costType, amount, costDate, description, createdAt, updatedAt);
        }
    }
}
