package com.vms.cost.repository;

import com.vms.cost.entity.Cost;
import com.vms.cost.entity.CostType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface CostRepository extends JpaRepository<Cost, Long>, JpaSpecificationExecutor<Cost> {

    List<Cost> findByVehicleIdOrderByCostDateDescCreatedAtDesc(Long vehicleId);

    List<Cost> findByCostTypeOrderByCostDateDescCreatedAtDesc(CostType costType);

    List<Cost> findByCostDateBetweenOrderByCostDateDescCreatedAtDesc(LocalDate startDate, LocalDate endDate);

    List<Cost> findByVehicleIdAndCostDateBetweenOrderByCostDateDescCreatedAtDesc(
            Long vehicleId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM Cost c WHERE c.vehicleId = :vehicleId")
    BigDecimal sumAmountByVehicleId(@Param("vehicleId") Long vehicleId);

    @Query("SELECT c.costType, COUNT(c), COALESCE(SUM(c.amount), 0) FROM Cost c GROUP BY c.costType")
    List<Object[]> aggregateCostsByType();

    @Query("SELECT c.costType, COUNT(c), COALESCE(SUM(c.amount), 0) FROM Cost c WHERE c.vehicleId = :vehicleId GROUP BY c.costType")
    List<Object[]> aggregateCostsByVehicleAndType(@Param("vehicleId") Long vehicleId);
}
