package com.vms.cost.service;

import com.vms.cost.dto.CostRequestDTO;
import com.vms.cost.dto.CostResponseDTO;
import com.vms.cost.dto.CostSummaryDTO;
import com.vms.cost.entity.Cost;
import com.vms.cost.entity.CostType;
import com.vms.cost.exception.ResourceNotFoundException;
import com.vms.cost.repository.CostRepository;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class CostServiceImpl implements CostService {

    private static final Logger log = LoggerFactory.getLogger(CostServiceImpl.class);

    private final CostRepository costRepository;

    public CostServiceImpl(CostRepository costRepository) {
        this.costRepository = costRepository;
    }

    @Override
    public CostResponseDTO createCost(CostRequestDTO request) {
        validateCostDate(request.getCostDate());

        Cost cost = Cost.builder()
                .vehicleId(request.getVehicleId())
                .costType(request.getCostType())
                .amount(request.getAmount())
                .costDate(request.getCostDate())
                .description(request.getDescription())
                .build();

        Cost saved = costRepository.save(cost);
        log.info("Created cost record with ID: {}, vehicleId: {}, amount: {}", 
                saved.getId(), saved.getVehicleId(), saved.getAmount());
        return CostResponseDTO.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CostResponseDTO> getCosts(
            Long vehicleId,
            CostType costType,
            LocalDate startDate,
            LocalDate endDate,
            String search) {

        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Ngày bắt đầu (startDate) không được lớn hơn ngày kết thúc (endDate)");
        }

        Specification<Cost> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (vehicleId != null) {
                predicates.add(cb.equal(root.get("vehicleId"), vehicleId));
            }

            if (costType != null) {
                predicates.add(cb.equal(root.get("costType"), costType));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("costDate"), startDate));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("costDate"), endDate));
            }

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("description")), pattern));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Sort sort = Sort.by(Sort.Direction.DESC, "costDate").and(Sort.by(Sort.Direction.DESC, "id"));
        return costRepository.findAll(spec, sort)
                .stream()
                .map(CostResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CostResponseDTO getCostById(Long id) {
        Cost cost = costRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu chi với ID: " + id));
        return CostResponseDTO.fromEntity(cost);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CostResponseDTO> getCostsByVehicleId(Long vehicleId) {
        return costRepository.findByVehicleIdOrderByCostDateDescCreatedAtDesc(vehicleId)
                .stream()
                .map(CostResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public CostResponseDTO updateCost(Long id, CostRequestDTO request) {
        Cost cost = costRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu chi với ID: " + id));

        validateCostDate(request.getCostDate());

        cost.setVehicleId(request.getVehicleId());
        cost.setCostType(request.getCostType());
        cost.setAmount(request.getAmount());
        cost.setCostDate(request.getCostDate());
        cost.setDescription(request.getDescription());

        Cost updated = costRepository.save(cost);
        log.info("Updated cost record ID: {}", updated.getId());
        return CostResponseDTO.fromEntity(updated);
    }

    @Override
    public void deleteCost(Long id) {
        Cost cost = costRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu chi với ID: " + id));
        costRepository.delete(cost);
        log.info("Deleted cost record ID: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public CostSummaryDTO getCostSummary(Long vehicleId, LocalDate startDate, LocalDate endDate) {
        List<CostResponseDTO> costs = getCosts(vehicleId, null, startDate, endDate, null);

        BigDecimal totalAmount = BigDecimal.ZERO;
        Map<CostType, BigDecimal> amountByType = new EnumMap<>(CostType.class);
        Map<CostType, Long> countByType = new EnumMap<>(CostType.class);

        for (CostType type : CostType.values()) {
            amountByType.put(type, BigDecimal.ZERO);
            countByType.put(type, 0L);
        }

        for (CostResponseDTO cost : costs) {
            totalAmount = totalAmount.add(cost.getAmount());
            CostType type = cost.getCostType();
            if (type != null) {
                amountByType.put(type, amountByType.get(type).add(cost.getAmount()));
                countByType.put(type, countByType.get(type) + 1);
            }
        }

        return CostSummaryDTO.builder()
                .totalAmount(totalAmount)
                .totalCount((long) costs.size())
                .amountByType(amountByType)
                .countByType(countByType)
                .build();
    }

    private void validateCostDate(LocalDate costDate) {
        if (costDate != null && costDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Ngày chi phí không được vượt quá ngày hiện tại");
        }
    }
}
