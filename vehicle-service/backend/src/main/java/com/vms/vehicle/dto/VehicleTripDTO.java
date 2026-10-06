package com.vms.vehicle.dto;

import com.vms.vehicle.entity.TripStatus;
import com.vms.vehicle.entity.VehicleTrip;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleTripDTO {
    private Long id;
    private Long vehicleId;
    private String vehiclePlate;
    private Long driverId;
    private String driverName;
    private Integer startOdometer;
    private Integer endOdometer;
    private Integer distanceKm;
    private TripStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private String notes;
    private Integer durationMinutes;

    public static VehicleTripDTO fromEntity(VehicleTrip trip) {
        if (trip == null) return null;
        Integer duration = null;
        if (trip.getEndedAt() != null && trip.getStartedAt() != null) {
            duration = (int) Duration.between(trip.getStartedAt(), trip.getEndedAt()).toMinutes();
        }
        return VehicleTripDTO.builder()
                .id(trip.getId())
                .vehicleId(trip.getVehicleId())
                .vehiclePlate(trip.getVehiclePlate())
                .driverId(trip.getDriverId())
                .driverName(trip.getDriverName())
                .startOdometer(trip.getStartOdometer())
                .endOdometer(trip.getEndOdometer())
                .distanceKm(trip.getDistanceKm())
                .status(trip.getStatus())
                .startedAt(trip.getStartedAt())
                .endedAt(trip.getEndedAt())
                .notes(trip.getNotes())
                .durationMinutes(duration)
                .build();
    }
}