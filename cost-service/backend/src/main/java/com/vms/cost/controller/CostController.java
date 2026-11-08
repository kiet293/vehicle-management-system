package com.vms.cost.controller;

import com.vms.cost.common.ApiResponse;
import com.vms.cost.dto.CostDTO;
import com.vms.cost.dto.CostSummaryDTO;
import com.vms.cost.dto.CreateCostRequest;
import com.vms.cost.dto.OcrReceiptResponse;
import com.vms.cost.dto.UpdateCostRequest;
import com.vms.cost.entity.CostType;
import com.vms.cost.service.CostService;
import com.vms.cost.service.OcrService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping({"/api/costs", "/api/v1/costs"})
public class CostController {

    private final CostService costService;
    private final OcrService ocrService;

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

    /**
     * OCR API: Nhận file ảnh hóa đơn, quét và trả về dữ liệu trích xuất tự động
     */
    @PostMapping(value = "/ocr/scan-receipt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<OcrReceiptResponse>> scanReceipt(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        // BaseUrl để trả về link ảnh đầy đủ nếu cần
        String baseUrl = "";
        OcrReceiptResponse response = ocrService.scanReceipt(file, baseUrl);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    /**
     * Phục vụ xem file ảnh hóa đơn đã tải lên
     */
    @GetMapping("/receipts/{filename:.+}")
    public ResponseEntity<Resource> getReceiptImage(@PathVariable String filename) {
        Resource resource = ocrService.loadReceiptAsResource(filename);

        String contentType = "application/octet-stream";
        try {
            String probeType = Files.probeContentType(Paths.get(resource.getFile().getAbsolutePath()));
            if (probeType != null) {
                contentType = probeType;
            }
        } catch (IOException ignored) {}

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
