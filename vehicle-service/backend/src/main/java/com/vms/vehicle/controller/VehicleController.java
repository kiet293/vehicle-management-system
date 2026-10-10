package com.vms.vehicle.controller;

import com.vms.vehicle.common.ApiResponse;
import com.vms.vehicle.dto.*;
import com.vms.vehicle.entity.VehicleStatus;
import com.vms.vehicle.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping({"/api/vehicles", "/api/v1/vehicles"})
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<VehicleDTO>>> getAllVehicles(
            @RequestParam(required = false) VehicleStatus status,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String search) {
        List<VehicleDTO> list = vehicleService.getAllVehicles(status, brand, search);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/brands")
    public ResponseEntity<ApiResponse<List<String>>> getBrands() {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.getBrands()));
    }

    @GetMapping("/{id}/trips")
    public ResponseEntity<ApiResponse<List<VehicleTripDTO>>> getTripsByVehicle(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.getTripsByVehicle(id)));
    }

    @GetMapping("/{id}/trips/current")
    public ResponseEntity<ApiResponse<VehicleTripDTO>> getCurrentTrip(@PathVariable Long id) {
        VehicleTripDTO trip = vehicleService.getCurrentTrip(id);
        if (trip == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Xe hiện không có chuyến đi nào đang chạy"));
        }
        return ResponseEntity.ok(ApiResponse.success(trip));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VehicleDTO>> getVehicleById(@PathVariable Long id) {
        VehicleDTO dto = vehicleService.getVehicleById(id);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VehicleDTO>> createVehicle(@Valid @RequestBody CreateVehicleRequest request) {
        VehicleDTO created = vehicleService.createVehicle(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm xe " + created.getLicensePlate() + " thành công!", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VehicleDTO>> updateVehicle(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVehicleRequest request) {
        VehicleDTO updated = vehicleService.updateVehicle(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin xe thành công!", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<VehicleDTO>> deleteVehicle(@PathVariable Long id) {
        VehicleDTO deleted = vehicleService.softDeleteVehicle(id);
        return ResponseEntity.ok(ApiResponse.success("Đã chuyển xe sang trạng thái ngừng khai thác (DECOMMISSIONED)!", deleted));
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<VehicleDTO>> assignDriver(
            @PathVariable Long id,
            @Valid @RequestBody AssignDriverRequest request) {
        VehicleDTO assigned = vehicleService.assignDriver(id, request);
        return ResponseEntity.ok(ApiResponse.success(
                "Đã bàn giao xe " + assigned.getLicensePlate() + " cho tài xế " + request.getDriverName() + "!",
                assigned
        ));
    }

    @PostMapping("/{id}/return")
    public ResponseEntity<ApiResponse<VehicleDTO>> returnVehicle(
            @PathVariable Long id,
            @Valid @RequestBody ReturnVehicleRequest request) {
        VehicleDTO returned = vehicleService.returnVehicle(id, request);
        String msg = returned.getStatus() == VehicleStatus.MAINTENANCE
                ? "Bàn giao xe thành công! Xe đã đạt ngưỡng định mức và được chuyển sang trạng thái BẢO DƯỠNG."
                : "Bàn giao lại xe thành công! Xe đã sẵn sàng đón chuyến mới.";
        return ResponseEntity.ok(ApiResponse.success(msg, returned));
    }

    @RequestMapping(value = "/{id}/status", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<ApiResponse<VehicleDTO>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVehicleStatusRequest request) {
        VehicleDTO updated = vehicleService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái xe thành công!", updated));
    }
}
