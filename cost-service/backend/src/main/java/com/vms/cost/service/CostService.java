package com.vms.cost.service;

import com.vms.cost.dto.CostRequestDTO;
import com.vms.cost.dto.CostResponseDTO;
import com.vms.cost.dto.CostSummaryDTO;
import com.vms.cost.entity.CostType;

import java.time.LocalDate;
import java.util.List;

public interface CostService {

    CostResponseDTO createCost(CostRequestDTO request);

    List<CostResponseDTO> getCosts(
            Long vehicleId,
            CostType costType,
            LocalDate startDate,
            LocalDate endDate,
            String search
    );

    CostResponseDTO getCostById(Long id);

    List<CostResponseDTO> getCostsByVehicleId(Long vehicleId);

    CostResponseDTO updateCost(Long id, CostRequestDTO request);

    void deleteCost(Long id);

    CostSummaryDTO getCostSummary(Long vehicleId, LocalDate startDate, LocalDate endDate);
}
