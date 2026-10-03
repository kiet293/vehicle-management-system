package com.vms.cost.dto;

import com.vms.cost.entity.CostType;

import java.math.BigDecimal;
import java.util.Map;

public class CostSummaryDTO {

    private BigDecimal totalAmount;
    private Long totalCount;
    private Map<CostType, BigDecimal> amountByType;
    private Map<CostType, Long> countByType;

    public CostSummaryDTO() {
    }

    public CostSummaryDTO(BigDecimal totalAmount, Long totalCount, Map<CostType, BigDecimal> amountByType, Map<CostType, Long> countByType) {
        this.totalAmount = totalAmount;
        this.totalCount = totalCount;
        this.amountByType = amountByType;
        this.countByType = countByType;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public Long getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(Long totalCount) {
        this.totalCount = totalCount;
    }

    public Map<CostType, BigDecimal> getAmountByType() {
        return amountByType;
    }

    public void setAmountByType(Map<CostType, BigDecimal> amountByType) {
        this.amountByType = amountByType;
    }

    public Map<CostType, Long> getCountByType() {
        return countByType;
    }

    public void setCountByType(Map<CostType, Long> countByType) {
        this.countByType = countByType;
    }

    public static CostSummaryDTOBuilder builder() {
        return new CostSummaryDTOBuilder();
    }

    public static class CostSummaryDTOBuilder {
        private BigDecimal totalAmount;
        private Long totalCount;
        private Map<CostType, BigDecimal> amountByType;
        private Map<CostType, Long> countByType;

        public CostSummaryDTOBuilder totalAmount(BigDecimal totalAmount) {
            this.totalAmount = totalAmount;
            return this;
        }

        public CostSummaryDTOBuilder totalCount(Long totalCount) {
            this.totalCount = totalCount;
            return this;
        }

        public CostSummaryDTOBuilder amountByType(Map<CostType, BigDecimal> amountByType) {
            this.amountByType = amountByType;
            return this;
        }

        public CostSummaryDTOBuilder countByType(Map<CostType, Long> countByType) {
            this.countByType = countByType;
            return this;
        }

        public CostSummaryDTO build() {
            return new CostSummaryDTO(totalAmount, totalCount, amountByType, countByType);
        }
    }
}
