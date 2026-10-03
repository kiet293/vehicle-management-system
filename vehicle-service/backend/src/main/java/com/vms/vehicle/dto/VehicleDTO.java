package com.vms.vehicle.dto;

import com.vms.vehicle.entity.Vehicle;
import com.vms.vehicle.entity.VehicleStatus;
import com.vms.vehicle.entity.VehicleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleDTO {
    private Long id;
    private String licensePlate;
    private String brand;
    private String model;
    private VehicleType vehicleType;
    private Integer seatCapacity;
    private Integer manufactureYear;
    private Integer currentOdometer;
    private Integer lastMaintenanceOdometer;
    private VehicleStatus status;
    private Long assignedDriverId;
    private String assignedDriverName;
    private String imageUrl;
    private boolean maintenanceDue;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static VehicleDTO fromEntity(Vehicle vehicle) {
        if (vehicle == null) return null;
        boolean due = (vehicle.getCurrentOdometer() - vehicle.getLastMaintenanceOdometer()) >= 5000;
        return VehicleDTO.builder()
                .id(vehicle.getId())
                .licensePlate(vehicle.getLicensePlate())
                .brand(vehicle.getBrand())
                .model(vehicle.getModel())
                .vehicleType(vehicle.getVehicleType())
                .seatCapacity(vehicle.getSeatCapacity())
                .manufactureYear(vehicle.getManufactureYear())
                .currentOdometer(vehicle.getCurrentOdometer())
                .lastMaintenanceOdometer(vehicle.getLastMaintenanceOdometer())
                .status(vehicle.getStatus())
                .assignedDriverId(vehicle.getAssignedDriverId())
                .assignedDriverName(vehicle.getAssignedDriverName())
                .imageUrl(vehicle.getImageUrl())
                .maintenanceDue(due)
                .createdAt(vehicle.getCreatedAt())
                .updatedAt(vehicle.getUpdatedAt())
                .build();
    }
}
