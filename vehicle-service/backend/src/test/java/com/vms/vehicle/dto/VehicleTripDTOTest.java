package com.vms.vehicle.dto;

import com.vms.vehicle.entity.TripStatus;
import com.vms.vehicle.entity.VehicleTrip;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("VehicleTripDTO")
class VehicleTripDTOTest {

    private static final LocalDateTime STARTED = LocalDateTime.of(2024, 5, 1, 8, 0);

    private VehicleTrip buildTrip() {
        return VehicleTrip.builder()
                .id(1L)
                .vehicleId(7L)
                .vehiclePlate("29A-888.88")
                .driverId(9L)
                .driverName("Nguyen Van An")
                .startOdometer(15000)
                .endOdometer(16500)
                .distanceKm(1500)
                .status(TripStatus.COMPLETED)
                .startedAt(STARTED)
                .endedAt(STARTED.plusMinutes(90))
                .notes("Tra xe dung han")
                .build();
    }

    @Nested
    @DisplayName("fromEntity")
    class FromEntity {

        @Test
        @DisplayName("maps every field from the entity")
        void mapsAllFields() {
            VehicleTripDTO dto = VehicleTripDTO.fromEntity(buildTrip());

            assertThat(dto.getId()).isEqualTo(1L);
            assertThat(dto.getVehicleId()).isEqualTo(7L);
            assertThat(dto.getVehiclePlate()).isEqualTo("29A-888.88");
            assertThat(dto.getDriverId()).isEqualTo(9L);
            assertThat(dto.getDriverName()).isEqualTo("Nguyen Van An");
            assertThat(dto.getStartOdometer()).isEqualTo(15000);
            assertThat(dto.getEndOdometer()).isEqualTo(16500);
            assertThat(dto.getDistanceKm()).isEqualTo(1500);
            assertThat(dto.getStatus()).isEqualTo(TripStatus.COMPLETED);
            assertThat(dto.getStartedAt()).isEqualTo(STARTED);
            assertThat(dto.getEndedAt()).isEqualTo(STARTED.plusMinutes(90));
            assertThat(dto.getNotes()).isEqualTo("Tra xe dung han");
        }

        @Test
        @DisplayName("returns null for a null entity")
        void returnsNullForNullEntity() {
            assertThat(VehicleTripDTO.fromEntity(null)).isNull();
        }

        @Test
        @DisplayName("computes the duration in minutes for a finished trip")
        void computesDuration() {
            assertThat(VehicleTripDTO.fromEntity(buildTrip()).getDurationMinutes()).isEqualTo(90);
        }

        @Test
        @DisplayName("leaves the duration null for a running trip")
        void durationNullForRunningTrip() {
            VehicleTrip trip = buildTrip();
            trip.setStatus(TripStatus.IN_PROGRESS);
            trip.setEndedAt(null);

            assertThat(VehicleTripDTO.fromEntity(trip).getDurationMinutes()).isNull();
        }

        @Test
        @DisplayName("tolerates a trip without a driver")
        void handlesNullDriver() {
            VehicleTrip trip = buildTrip();
            trip.setDriverId(null);
            trip.setDriverName(null);

            VehicleTripDTO dto = VehicleTripDTO.fromEntity(trip);

            assertThat(dto.getDriverId()).isNull();
            assertThat(dto.getDriverName()).isNull();
        }

        @Test
        @DisplayName("tolerates a missing start timestamp when computing duration")
        void handlesMissingStart() {
            VehicleTrip trip = buildTrip();
            trip.setStartedAt(null);

            assertThat(VehicleTripDTO.fromEntity(trip).getDurationMinutes()).isNull();
        }
    }
}