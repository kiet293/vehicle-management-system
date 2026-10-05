package com.vms.vehicle.dto;

import com.vms.vehicle.entity.VehicleStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVehicleStatusRequest {

    @NotNull(message = "Trạng thái xe không được để trống")
    private VehicleStatus status;
}