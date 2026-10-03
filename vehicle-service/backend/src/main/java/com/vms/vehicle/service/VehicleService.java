package com.vms.vehicle.service;

import com.vms.vehicle.dto.*;
import com.vms.vehicle.entity.Vehicle;
import com.vms.vehicle.entity.VehicleStatus;
import com.vms.vehicle.exception.BadRequestException;
import com.vms.vehicle.exception.ResourceNotFoundException;
import com.vms.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final EmailClient emailClient;

    public List<VehicleDTO> getAllVehicles(VehicleStatus status, String brand, String search) {
        List<Vehicle> list = vehicleRepository.findAll();
        return list.stream()
                .filter(v -> status == null || v.getStatus() == status)
                .filter(v -> brand == null || brand.trim().isEmpty() || v.getBrand().equalsIgnoreCase(brand.trim()))
                .filter(v -> {
                    if (search == null || search.trim().isEmpty()) return true;
                    String s = search.trim().toLowerCase();
                    return (v.getLicensePlate() != null && v.getLicensePlate().toLowerCase().contains(s)) ||
                            (v.getBrand() != null && v.getBrand().toLowerCase().contains(s)) ||
                            (v.getModel() != null && v.getModel().toLowerCase().contains(s)) ||
                            (v.getAssignedDriverName() != null && v.getAssignedDriverName().toLowerCase().contains(s));
                })
                .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                .map(VehicleDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public VehicleDTO getVehicleById(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phương tiện với ID: " + id));
        return VehicleDTO.fromEntity(vehicle);
    }

    private String normalizePlate(String raw) {
        if (raw == null) return "";
        String s = raw.trim().toUpperCase().replaceAll("[\\s.]+", "");
        // If format like 29A88888 -> format to 29A-888.88
        if (s.matches("^\\d{2}[A-Z]\\d{4,5}$")) {
            String prefix = s.substring(0, 3);
            String rest = s.substring(3);
            if (rest.length() == 4) {
                return prefix + "-" + rest;
            } else if (rest.length() == 5) {
                return prefix + "-" + rest.substring(0, 3) + "." + rest.substring(3);
            }
        }
        return raw.trim().toUpperCase();
    }

    @Transactional
    public VehicleDTO createVehicle(CreateVehicleRequest request) {
        if (request.getLicensePlate() == null || request.getLicensePlate().trim().isEmpty()) {
            throw new BadRequestException("Biển số xe không được để trống");
        }
        String normalizedPlate = normalizePlate(request.getLicensePlate());
        if (vehicleRepository.existsByLicensePlate(normalizedPlate)) {
            throw new BadRequestException("Biển số xe này đã được đăng ký trong hệ thống");
        }
        if (request.getBrand() == null || request.getBrand().trim().isEmpty()) {
            throw new BadRequestException("Hãng xe không được để trống");
        }
        if (request.getModel() == null || request.getModel().trim().isEmpty()) {
            throw new BadRequestException("Dòng xe không được để trống");
        }
        int currentYear = Year.now().getValue();
        if (request.getManufactureYear() == null || request.getManufactureYear() < 1990 || request.getManufactureYear() > currentYear) {
            throw new BadRequestException("Năm sản xuất phải từ năm 1990 đến năm " + currentYear);
        }
        if (request.getSeatCapacity() == null || request.getSeatCapacity() <= 0) {
            throw new BadRequestException("Số chỗ ngồi phải là số nguyên dương lớn hơn 0");
        }
        int initialKm = (request.getInitialOdometer() != null && request.getInitialOdometer() >= 0) ? request.getInitialOdometer() : 0;

        Vehicle vehicle = Vehicle.builder()
                .licensePlate(normalizedPlate)
                .brand(request.getBrand().trim())
                .model(request.getModel().trim())
                .vehicleType(request.getVehicleType())
                .seatCapacity(request.getSeatCapacity())
                .manufactureYear(request.getManufactureYear())
                .currentOdometer(initialKm)
                .lastMaintenanceOdometer(initialKm)
                .status(VehicleStatus.AVAILABLE)
                .imageUrl(request.getImageUrl())
                .build();

        Vehicle saved = vehicleRepository.save(vehicle);
        return VehicleDTO.fromEntity(saved);
    }

    @Transactional
    public VehicleDTO updateVehicle(Long id, UpdateVehicleRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phương tiện với ID: " + id));

        if (request.getBrand() != null && !request.getBrand().trim().isEmpty()) {
            vehicle.setBrand(request.getBrand().trim());
        }
        if (request.getModel() != null && !request.getModel().trim().isEmpty()) {
            vehicle.setModel(request.getModel().trim());
        }
        if (request.getVehicleType() != null) {
            vehicle.setVehicleType(request.getVehicleType());
        }
        if (request.getSeatCapacity() != null && request.getSeatCapacity() > 0) {
            vehicle.setSeatCapacity(request.getSeatCapacity());
        }
        if (request.getManufactureYear() != null && request.getManufactureYear() >= 1990) {
            vehicle.setManufactureYear(request.getManufactureYear());
        }
        if (request.getCurrentOdometer() != null && request.getCurrentOdometer() >= 0) {
            vehicle.setCurrentOdometer(request.getCurrentOdometer());
        }
        if (request.getLastMaintenanceOdometer() != null && request.getLastMaintenanceOdometer() >= 0) {
            vehicle.setLastMaintenanceOdometer(request.getLastMaintenanceOdometer());
        }
        if (request.getImageUrl() != null) {
            vehicle.setImageUrl(request.getImageUrl());
        }

        Vehicle updated = vehicleRepository.save(vehicle);
        return VehicleDTO.fromEntity(updated);
    }

    @Transactional
    public VehicleDTO softDeleteVehicle(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phương tiện với ID: " + id));
        vehicle.setStatus(VehicleStatus.DECOMMISSIONED);
        Vehicle updated = vehicleRepository.save(vehicle);
        return VehicleDTO.fromEntity(updated);
    }

    @Transactional
    public VehicleDTO assignDriver(Long id, AssignDriverRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phương tiện với ID: " + id));

        if (request.getDriverId() == null || request.getDriverName() == null || request.getDriverName().trim().isEmpty()) {
            throw new BadRequestException("Vui lòng chọn tài xế bàn giao hợp lệ");
        }

        vehicle.setAssignedDriverId(request.getDriverId());
        vehicle.setAssignedDriverName(request.getDriverName().trim());
        vehicle.setStatus(VehicleStatus.IN_USE);

        Vehicle updated = vehicleRepository.save(vehicle);

        // Async notify driver
        if (request.getDriverEmail() != null && !request.getDriverEmail().trim().isEmpty()) {
            emailClient.sendAssignmentNotification(vehicle.getLicensePlate(), request.getDriverName(), request.getDriverEmail());
        }

        return VehicleDTO.fromEntity(updated);
    }

    @Transactional
    public VehicleDTO returnVehicle(Long id, ReturnVehicleRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phương tiện với ID: " + id));

        if (request.getNewOdometer() == null) {
            throw new BadRequestException("Vui lòng nhập chỉ số công-tơ-mét hiện tại");
        }

        if (request.getNewOdometer() < vehicle.getCurrentOdometer()) {
            throw new BadRequestException(String.format(
                    "Số km cập nhật (%d km) không thể nhỏ hơn số km hiện tại (%d km). Vui lòng kiểm tra lại công-tơ-mét trên xe.",
                    request.getNewOdometer(), vehicle.getCurrentOdometer()
            ));
        }

        vehicle.setCurrentOdometer(request.getNewOdometer());
        vehicle.setAssignedDriverId(null);
        vehicle.setAssignedDriverName(null);

        // Check maintenance threshold: every 5000 km
        int kmSinceLastMaintenance = vehicle.getCurrentOdometer() - vehicle.getLastMaintenanceOdometer();
        if (kmSinceLastMaintenance >= 5000) {
            vehicle.setStatus(VehicleStatus.MAINTENANCE);
            emailClient.sendMaintenanceAlert(vehicle.getLicensePlate(), vehicle.getCurrentOdometer(), vehicle.getLastMaintenanceOdometer());
            log.warn("Vehicle {} has exceeded maintenance interval ({} km since last). Set to MAINTENANCE.",
                    vehicle.getLicensePlate(), kmSinceLastMaintenance);
        } else {
            vehicle.setStatus(VehicleStatus.AVAILABLE);
        }

        Vehicle updated = vehicleRepository.save(vehicle);
        return VehicleDTO.fromEntity(updated);
    }

    @Transactional
    public VehicleDTO updateStatus(Long id, VehicleStatus status) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phương tiện với ID: " + id));

        // If completing maintenance, update lastMaintenanceOdometer to current odometer
        if (vehicle.getStatus() == VehicleStatus.MAINTENANCE && status == VehicleStatus.AVAILABLE) {
            vehicle.setLastMaintenanceOdometer(vehicle.getCurrentOdometer());
        }

        vehicle.setStatus(status);
        Vehicle updated = vehicleRepository.save(vehicle);
        return VehicleDTO.fromEntity(updated);
    }
}
