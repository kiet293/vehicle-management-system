package com.vms.vehicle.dto;

import com.vms.vehicle.entity.Vehicle;
import com.vms.vehicle.entity.VehicleStatus;
import com.vms.vehicle.entity.VehicleType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("VehicleDTO")
class VehicleDTOTest {

    private Vehicle buildEntity() {
        return Vehicle.builder()
                .id(7L)
                .licensePlate("30H-123.45")
                .brand("Ford")
                .model("Ranger Wildtrak")
                .vehicleType(VehicleType.PICKUP)
                .seatCapacity(5)
                .manufactureYear(2022)
                .currentOdometer(38500)
                .lastMaintenanceOdometer(35000)
                .status(VehicleStatus.IN_USE)
                .assignedDriverId(3L)
                .assignedDriverName("Nguyen Van An")
                .imageUrl("https://example.com/ranger.jpg")
                .createdAt(LocalDateTime.of(2024, 1, 1, 10, 0))
                .updatedAt(LocalDateTime.of(2024, 6, 1, 10, 0))
                .build();
    }

    @Nested
    @DisplayName("fromEntity")
    class FromEntity {

        @Test
        @DisplayName("maps every field from the entity")
        void mapsAllFields() {
            VehicleDTO dto = VehicleDTO.fromEntity(buildEntity());

            assertThat(dto.getId()).isEqualTo(7L);
            assertThat(dto.getLicensePlate()).isEqualTo("30H-123.45");
            assertThat(dto.getBrand()).isEqualTo("Ford");
            assertThat(dto.getModel()).isEqualTo("Ranger Wildtrak");
            assertThat(dto.getVehicleType()).isEqualTo(VehicleType.PICKUP);
            assertThat(dto.getSeatCapacity()).isEqualTo(5);
            assertThat(dto.getManufactureYear()).isEqualTo(2022);
            assertThat(dto.getCurrentOdometer()).isEqualTo(38500);
            assertThat(dto.getLastMaintenanceOdometer()).isEqualTo(35000);
            assertThat(dto.getStatus()).isEqualTo(VehicleStatus.IN_USE);
            assertThat(dto.getAssignedDriverId()).isEqualTo(3L);
            assertThat(dto.getAssignedDriverName()).isEqualTo("Nguyen Van An");
            assertThat(dto.getImageUrl()).isEqualTo("https://example.com/ranger.jpg");
            assertThat(dto.getCreatedAt()).isEqualTo(LocalDateTime.of(2024, 1, 1, 10, 0));
            assertThat(dto.getUpdatedAt()).isEqualTo(LocalDateTime.of(2024, 6, 1, 10, 0));
        }

        @Test
        @DisplayName("returns null for a null entity")
        void returnsNullForNullEntity() {
            assertThat(VehicleDTO.fromEntity(null)).isNull();
        }

        @Test
        @DisplayName("flags maintenance as due once the gap reaches 5000 km")
        void maintenanceDueAtThreshold() {
            Vehicle entity = buildEntity();
            entity.setLastMaintenanceOdometer(33500);

            assertThat(VehicleDTO.fromEntity(entity).isMaintenanceDue()).isTrue();
        }

        @Test
        @DisplayName("does not flag maintenance one km below the threshold")
        void maintenanceNotDueBelowThreshold() {
            Vehicle entity = buildEntity();
            entity.setLastMaintenanceOdometer(33501);

            assertThat(VehicleDTO.fromEntity(entity).isMaintenanceDue()).isFalse();
        }

        @Test
        @DisplayName("tolerates a vehicle without an assigned driver")
        void handlesNullDriver() {
            Vehicle entity = buildEntity();
            entity.setStatus(VehicleStatus.AVAILABLE);
            entity.setAssignedDriverId(null);
            entity.setAssignedDriverName(null);

            VehicleDTO dto = VehicleDTO.fromEntity(entity);

            assertThat(dto.getAssignedDriverId()).isNull();
            assertThat(dto.getAssignedDriverName()).isNull();
        }
    }
}