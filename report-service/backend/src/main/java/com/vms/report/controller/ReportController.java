package com.vms.report.controller;

import com.vms.report.common.ApiResponse;
import com.vms.report.dto.*;
import com.vms.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping({"/api/reports", "/api/v1/reports"})
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<ReportSummaryDTO>> getSummary(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        ReportSummaryDTO summary = reportService.getSummary(year, month);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/monthly-trends")
    public ResponseEntity<ApiResponse<List<MonthlyTrendDTO>>> getMonthlyTrends(
            @RequestParam(required = false) Integer year) {
        List<MonthlyTrendDTO> trends = reportService.getMonthlyTrends(year);
        return ResponseEntity.ok(ApiResponse.success(trends));
    }

    @GetMapping("/cost-by-type")
    public ResponseEntity<ApiResponse<List<CostByTypeDTO>>> getCostByType(
            @RequestParam(required = false) Integer year) {
        List<CostByTypeDTO> breakdown = reportService.getCostByType(year);
        return ResponseEntity.ok(ApiResponse.success(breakdown));
    }

    @GetMapping("/top-vehicles")
    public ResponseEntity<ApiResponse<List<TopVehicleDTO>>> getTopVehicles(
            @RequestParam(required = false, defaultValue = "5") Integer limit,
            @RequestParam(required = false) Integer year) {
        List<TopVehicleDTO> top = reportService.getTopVehicles(limit, year);
        return ResponseEntity.ok(ApiResponse.success(top));
    }
}
