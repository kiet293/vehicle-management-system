package com.vms.cost.repository;

import com.vms.cost.entity.Cost;
import com.vms.cost.entity.CostType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface CostRepository extends JpaRepository<Cost, Long> {
    List<Cost> findByVehicleId(Long vehicleId);
    List<Cost> findByCostType(CostType costType);
    List<Cost> findByCostDateBetween(LocalDate fromDate, LocalDate toDate);

    @Query("SELECT SUM(c.amount) FROM Cost c WHERE c.costDate BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountBetweenDates(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
