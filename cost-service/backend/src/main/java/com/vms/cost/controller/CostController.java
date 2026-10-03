package com.vms.cost.controller;

import com.vms.cost.common.ApiResponse;
import com.vms.cost.dto.CostDTO;
import com.vms.cost.dto.CostSummaryDTO;
import com.vms.cost.dto.CreateCostRequest;
import com.vms.cost.dto.UpdateCostRequest;
import com.vms.cost.entity.CostType;
import com.vms.cost.service.CostService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping({"/api/costs", "/api/v1/costs"})
public class CostController {

    private final CostService costService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CostDTO>>> getAllCosts(
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) CostType costType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Long driverId,
            @RequestParam(required = false) String search) {
        List<CostDTO> list = costService.getAllCosts(vehicleId, costType, fromDate, toDate, driverId, search);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CostDTO>> getCostById(@PathVariable Long id) {
        CostDTO cost = costService.getCostById(id);
        return ResponseEntity.ok(ApiResponse.success(cost));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CostDTO>> createCost(@RequestBody CreateCostRequest request) {
        CostDTO created = costService.createCost(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đã ghi nhận phiếu chi phí cho xe " + created.getVehiclePlate(), created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CostDTO>> updateCost(
            @PathVariable Long id,
            @RequestBody UpdateCostRequest request) {
        CostDTO updated = costService.updateCost(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật phiếu chi thành công!", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCost(@PathVariable Long id) {
        costService.deleteCost(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa phiếu chi thành công!", null));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<CostSummaryDTO>> getSummary(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        CostSummaryDTO summary = costService.getSummary(year, month);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
