package com.vms.vehicle.dto;

import com.vms.vehicle.entity.VehicleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVehicleRequest {
    private String brand;
    private String model;
    private VehicleType vehicleType;
    private Integer seatCapacity;
    private Integer manufactureYear;
    private Integer currentOdometer;
    private Integer lastMaintenanceOdometer;
    private String imageUrl;
}
