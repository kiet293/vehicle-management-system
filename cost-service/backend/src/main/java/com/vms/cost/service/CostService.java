package com.vms.cost.service;

import com.vms.cost.dto.CostDTO;
import com.vms.cost.dto.CostSummaryDTO;
import com.vms.cost.dto.CreateCostRequest;
import com.vms.cost.dto.UpdateCostRequest;
import com.vms.cost.entity.Cost;
import com.vms.cost.entity.CostType;
import com.vms.cost.exception.BadRequestException;
import com.vms.cost.exception.ResourceNotFoundException;
import com.vms.cost.repository.CostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CostService {

    private final CostRepository costRepository;
    private final EmailClient emailClient;

    private static final BigDecimal HIGH_COST_THRESHOLD = new BigDecimal("5000000");

    public List<CostDTO> getAllCosts(Long vehicleId, CostType costType, LocalDate fromDate, LocalDate toDate, Long driverId, String search) {
        List<Cost> list = costRepository.findAll();
        return list.stream()
                .filter(c -> vehicleId == null || c.getVehicleId().equals(vehicleId))
                .filter(c -> costType == null || c.getCostType() == costType)
                .filter(c -> fromDate == null || !c.getCostDate().isBefore(fromDate))
                .filter(c -> toDate == null || !c.getCostDate().isAfter(toDate))
                .filter(c -> driverId == null || (c.getDriverId() != null && c.getDriverId().equals(driverId)))
                .filter(c -> {
                    if (search == null || search.trim().isEmpty()) return true;
                    String s = search.trim().toLowerCase();
                    return (c.getVehiclePlate() != null && c.getVehiclePlate().toLowerCase().contains(s)) ||
                            (c.getDescription() != null && c.getDescription().toLowerCase().contains(s)) ||
                            (c.getDriverName() != null && c.getDriverName().toLowerCase().contains(s));
                })
                .sorted((a, b) -> b.getCostDate().compareTo(a.getCostDate()))
                .map(CostDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public CostDTO getCostById(Long id) {
        Cost cost = costRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu chi với ID: " + id));
        return CostDTO.fromEntity(cost);
    }

    @Transactional
    public CostDTO createCost(CreateCostRequest request) {
        if (request.getVehicleId() == null) {
            throw new BadRequestException("Vui lòng chọn phương tiện phát sinh chi phí");
        }
        if (request.getCostType() == null) {
            throw new BadRequestException("Vui lòng chọn loại chi phí");
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Số tiền chi phí phải lớn hơn 0 ₫");
        }
        LocalDate date = request.getCostDate() != null ? request.getCostDate() : LocalDate.now();
        if (date.isAfter(LocalDate.now())) {
            throw new BadRequestException("Ngày chi phí không được vượt quá ngày hiện tại");
        }

        Cost cost = Cost.builder()
                .vehicleId(request.getVehicleId())
                .vehiclePlate(request.getVehiclePlate() != null ? request.getVehiclePlate() : "N/A")
                .driverId(request.getDriverId())
                .driverName(request.getDriverName())
                .costType(request.getCostType())
                .amount(request.getAmount())
                .odometerAtCost(request.getOdometerAtCost())
                .costDate(date)
                .description(request.getDescription())
                .receiptImageUrl(request.getReceiptImageUrl())
                .build();

        Cost saved = costRepository.save(cost);

        // High cost alert trigger if > 5,000,000 VND
        if (saved.getAmount().compareTo(HIGH_COST_THRESHOLD) > 0) {
            emailClient.sendHighCostAlert(
                    saved.getVehiclePlate(),
                    saved.getCostType().name(),
                    saved.getAmount(),
                    saved.getDriverName(),
                    saved.getDescription()
            );
        }

        return CostDTO.fromEntity(saved);
    }

    @Transactional
    public CostDTO updateCost(Long id, UpdateCostRequest request) {
        Cost cost = costRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu chi với ID: " + id));

        if (request.getCostType() != null) {
            cost.setCostType(request.getCostType());
        }
        if (request.getAmount() != null) {
            if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Số tiền chi phí phải lớn hơn 0 ₫");
            }
            cost.setAmount(request.getAmount());
        }
        if (request.getCostDate() != null) {
            if (request.getCostDate().isAfter(LocalDate.now())) {
                throw new BadRequestException("Ngày chi phí không được vượt quá ngày hiện tại");
            }
            cost.setCostDate(request.getCostDate());
        }
        if (request.getOdometerAtCost() != null) {
            cost.setOdometerAtCost(request.getOdometerAtCost());
        }
        if (request.getDescription() != null) {
            cost.setDescription(request.getDescription());
        }
        if (request.getReceiptImageUrl() != null) {
            cost.setReceiptImageUrl(request.getReceiptImageUrl());
        }

        Cost updated = costRepository.save(cost);
        return CostDTO.fromEntity(updated);
    }

    @Transactional
    public void deleteCost(Long id) {
        if (!costRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy phiếu chi với ID: " + id);
        }
        costRepository.deleteById(id);
    }

    public CostSummaryDTO getSummary(Integer targetYear, Integer targetMonth) {
        int year = targetYear != null ? targetYear : LocalDate.now().getYear();
        List<Cost> allCosts = costRepository.findAll();

        List<Cost> yearCosts = allCosts.stream()
                .filter(c -> c.getCostDate().getYear() == year)
                .toList();

        BigDecimal totalAmount = yearCosts.stream()
                .map(Cost::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalCount = yearCosts.size();

        // Breakdown by cost type
        Map<CostType, BigDecimal> byType = new EnumMap<>(CostType.class);
        for (CostType type : CostType.values()) {
            byType.put(type, BigDecimal.ZERO);
        }
        for (Cost c : yearCosts) {
            byType.put(c.getCostType(), byType.get(c.getCostType()).add(c.getAmount()));
        }

        // Monthly breakdown (months 1..12)
        Map<Integer, BigDecimal> monthlyTotals = new TreeMap<>();
        for (int m = 1; m <= 12; m++) {
            monthlyTotals.put(m, BigDecimal.ZERO);
        }
        for (Cost c : yearCosts) {
            int m = c.getCostDate().getMonthValue();
            monthlyTotals.put(m, monthlyTotals.get(m).add(c.getAmount()));
        }

        // Current month and previous month comparison
        int currentMonth = targetMonth != null ? targetMonth : LocalDate.now().getMonthValue();
        BigDecimal thisMonthTotal = monthlyTotals.getOrDefault(currentMonth, BigDecimal.ZERO);
        int prevMonth = currentMonth > 1 ? currentMonth - 1 : 12;
        BigDecimal lastMonthTotal = monthlyTotals.getOrDefault(prevMonth, BigDecimal.ZERO);

        double percentChange = 0.0;
        if (lastMonthTotal.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal diff = thisMonthTotal.subtract(lastMonthTotal);
            percentChange = diff.divide(lastMonthTotal, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }

        return CostSummaryDTO.builder()
                .totalAmount(totalAmount)
                .totalCount(totalCount)
                .thisMonthTotal(thisMonthTotal)
                .lastMonthTotal(lastMonthTotal)
                .percentChange(percentChange)
                .byType(byType)
                .monthlyTotals(monthlyTotals)
                .build();
    }
}
