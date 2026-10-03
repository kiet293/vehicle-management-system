package com.vms.cost.controller;

import com.vms.cost.dto.ApiResponse;
import com.vms.cost.dto.CostRequestDTO;
import com.vms.cost.dto.CostResponseDTO;
import com.vms.cost.dto.CostSummaryDTO;
import com.vms.cost.entity.CostType;
import com.vms.cost.service.CostService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping({"/api/v1/costs", "/api/costs"})
@CrossOrigin(origins = "*")
public class CostController {

    private static final Logger log = LoggerFactory.getLogger(CostController.class);

    private final CostService costService;

    public CostController(CostService costService) {
        this.costService = costService;
    }

    /**
     * POST /api/v1/costs - Tạo mới một phiếu chi phí
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CostResponseDTO>> createCost(@Valid @RequestBody CostRequestDTO request) {
        log.info("Received request to create cost for vehicle: {}", request.getVehicleId());
        CostResponseDTO created = costService.createCost(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phiếu chi phí thành công", created));
    }

    /**
     * GET /api/v1/costs - Lấy danh sách phiếu chi có hỗ trợ lọc:
     * - vehicleId: lọc theo xe
     * - costType: lọc theo loại chi phí (FUEL, MAINTENANCE, TOLL, INSURANCE)
     * - startDate & endDate: lọc theo khoảng thời gian
     * - search: tìm kiếm theo mô tả / ghi chú
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CostResponseDTO>>> getCosts(
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) CostType costType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search) {

        log.info("Querying costs with filters - vehicleId: {}, costType: {}, startDate: {}, endDate: {}, search: {}",
                vehicleId, costType, startDate, endDate, search);
        List<CostResponseDTO> costs = costService.getCosts(vehicleId, costType, startDate, endDate, search);
        return ResponseEntity.ok(ApiResponse.success(costs));
    }

    /**
     * GET /api/v1/costs/{id} - Lấy chi tiết một phiếu chi theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CostResponseDTO>> getCostById(@PathVariable Long id) {
        log.info("Querying cost by ID: {}", id);
        CostResponseDTO cost = costService.getCostById(id);
        return ResponseEntity.ok(ApiResponse.success(cost));
    }

    /**
     * GET /api/v1/costs/vehicle/{vehicleId} - Lấy lịch sử chi phí theo phương tiện
     */
    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<ApiResponse<List<CostResponseDTO>>> getCostsByVehicleId(@PathVariable Long vehicleId) {
        log.info("Querying costs for vehicleId: {}", vehicleId);
        List<CostResponseDTO> costs = costService.getCostsByVehicleId(vehicleId);
        return ResponseEntity.ok(ApiResponse.success(costs));
    }

    /**
     * PUT /api/v1/costs/{id} - Cập nhật phiếu chi
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CostResponseDTO>> updateCost(
            @PathVariable Long id,
            @Valid @RequestBody CostRequestDTO request) {
        log.info("Received request to update cost ID: {}", id);
        CostResponseDTO updated = costService.updateCost(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật phiếu chi phí thành công", updated));
    }

    /**
     * DELETE /api/v1/costs/{id} - Xóa phiếu chi
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCost(@PathVariable Long id) {
        log.info("Received request to delete cost ID: {}", id);
        costService.deleteCost(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa phiếu chi phí thành công", null));
    }

    /**
     * GET /api/v1/costs/summary - Báo cáo tổng hợp số liệu chi phí
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<CostSummaryDTO>> getCostSummary(
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        CostSummaryDTO summary = costService.getCostSummary(vehicleId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
