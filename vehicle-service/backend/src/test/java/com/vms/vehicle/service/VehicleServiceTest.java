package com.vms.vehicle.service;

import com.vms.vehicle.dto.AssignDriverRequest;
import com.vms.vehicle.dto.CreateVehicleRequest;
import com.vms.vehicle.dto.ReturnVehicleRequest;
import com.vms.vehicle.dto.UpdateVehicleRequest;
import com.vms.vehicle.dto.VehicleDTO;
import com.vms.vehicle.entity.Vehicle;
import com.vms.vehicle.entity.VehicleStatus;
import com.vms.vehicle.entity.VehicleType;
import com.vms.vehicle.exception.BadRequestException;
import com.vms.vehicle.exception.ResourceNotFoundException;
import com.vms.vehicle.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.time.Year;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link VehicleService}. Pure Mockito: no Spring context, no database.
 * Every test focuses on one business rule from the vehicle lifecycle.
 */
@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private EmailClient emailClient;

    @InjectMocks
    private VehicleService vehicleService;

    private static final Long VEHICLE_ID = 1L;

    @BeforeEach
    void setUp() {
        lenient().when(vehicleRepository.save(any(Vehicle.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    // ------------------------------------------------------------------
    // Fixtures
    // ------------------------------------------------------------------

    private Vehicle buildVehicle() {
        return buildVehicle(VehicleStatus.AVAILABLE, 15000, 15000);
    }

    private Vehicle buildVehicle(VehicleStatus status, int currentOdometer, int lastMaintenanceOdometer) {
        return Vehicle.builder()
                .id(VEHICLE_ID)
                .licensePlate("29A-888.88")
                .brand("Toyota")
                .model("Camry 2.5Q")
                .vehicleType(VehicleType.SEDAN)
                .seatCapacity(5)
                .manufactureYear(2023)
                .currentOdometer(currentOdometer)
                .lastMaintenanceOdometer(lastMaintenanceOdometer)
                .status(status)
                .build();
    }

    private CreateVehicleRequest buildCreateRequest() {
        return CreateVehicleRequest.builder()
                .licensePlate("29A-888.88")
                .brand("Toyota")
                .model("Camry 2.5Q")
                .vehicleType(VehicleType.SEDAN)
                .seatCapacity(5)
                .manufactureYear(Year.now().getValue() - 1)
                .initialOdometer(5000)
                .build();
    }

    private AssignDriverRequest buildAssignRequest() {
        return AssignDriverRequest.builder()
                .driverId(9L)
                .driverName("Nguyen Van An")
                .driverEmail("an@example.com")
                .build();
    }

    private ReturnVehicleRequest buildReturnRequest(Integer newOdometer) {
        return ReturnVehicleRequest.builder().newOdometer(newOdometer).build();
    }

    private void givenVehicleExists(Vehicle vehicle) {
        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));
    }

    // ------------------------------------------------------------------
    // createVehicle
    // ------------------------------------------------------------------

    @Nested
    @DisplayName("createVehicle")
    class CreateVehicle {

        @Test
        @DisplayName("normalizes a messy license plate before saving")
        void normalizesLicensePlate() {
            CreateVehicleRequest request = buildCreateRequest();
            request.setLicensePlate(" 29a88888 ");

            vehicleService.createVehicle(request);

            ArgumentCaptor<Vehicle> captor = ArgumentCaptor.forClass(Vehicle.class);
            verify(vehicleRepository).save(captor.capture());
            assertThat(captor.getValue().getLicensePlate()).isEqualTo("29A-888.88");
        }

        @Test
        @DisplayName("rejects a duplicate license plate")
        void rejectsDuplicatePlate() {
            CreateVehicleRequest request = buildCreateRequest();
            when(vehicleRepository.existsByLicensePlate("29A-888.88")).thenReturn(true);

            assertThatThrownBy(() -> vehicleService.createVehicle(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("đã được đăng ký");

            verify(vehicleRepository, never()).save(any(Vehicle.class));
        }

        @Test
        @DisplayName("rejects a manufacture year in the future")
        void rejectsFutureManufactureYear() {
            CreateVehicleRequest request = buildCreateRequest();
            request.setManufactureYear(Year.now().getValue() + 1);

            assertThatThrownBy(() -> vehicleService.createVehicle(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("vượt quá năm");

            verify(vehicleRepository, never()).save(any(Vehicle.class));
        }

        @Test
        @DisplayName("defaults the status to AVAILABLE")
        void defaultsStatusToAvailable() {
            VehicleDTO dto = vehicleService.createVehicle(buildCreateRequest());

            assertThat(dto.getStatus()).isEqualTo(VehicleStatus.AVAILABLE);
        }

        @Test
        @DisplayName("initialises both odometers to the initial reading")
        void setsBothOdometersToInitialReading() {
            CreateVehicleRequest request = buildCreateRequest();
            request.setInitialOdometer(5000);

            VehicleDTO dto = vehicleService.createVehicle(request);

            assertThat(dto.getCurrentOdometer()).isEqualTo(5000);
            assertThat(dto.getLastMaintenanceOdometer()).isEqualTo(5000);
        }

        @Test
        @DisplayName("defaults the initial odometer to 0 when omitted")
        void defaultsInitialOdometerToZero() {
            CreateVehicleRequest request = buildCreateRequest();
            request.setInitialOdometer(null);

            VehicleDTO dto = vehicleService.createVehicle(request);

            assertThat(dto.getCurrentOdometer()).isZero();
            assertThat(dto.getLastMaintenanceOdometer()).isZero();
        }

        @Test
        @DisplayName("trims brand and model")
        void trimsBrandAndModel() {
            CreateVehicleRequest request = buildCreateRequest();
            request.setBrand("  Toyota  ");
            request.setModel("  Camry  ");

            ArgumentCaptor<Vehicle> captor = ArgumentCaptor.forClass(Vehicle.class);
            vehicleService.createVehicle(request);
            verify(vehicleRepository).save(captor.capture());

            assertThat(captor.getValue().getBrand()).isEqualTo("Toyota");
            assertThat(captor.getValue().getModel()).isEqualTo("Camry");
        }
    }

    // ------------------------------------------------------------------
    // getVehicleById
    // ------------------------------------------------------------------

    @Nested
    @DisplayName("getVehicleById")
    class GetVehicleById {

        @Test
        @DisplayName("throws ResourceNotFoundException when the vehicle does not exist")
        void throwsWhenNotFound() {
            when(vehicleRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> vehicleService.getVehicleById(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("99");
        }

        @Test
        @DisplayName("maps the entity to a DTO")
        void mapsEntityToDto() {
            givenVehicleExists(buildVehicle());

            VehicleDTO dto = vehicleService.getVehicleById(VEHICLE_ID);

            assertThat(dto.getId()).isEqualTo(VEHICLE_ID);
            assertThat(dto.getLicensePlate()).isEqualTo("29A-888.88");
            assertThat(dto.getBrand()).isEqualTo("Toyota");
            assertThat(dto.getStatus()).isEqualTo(VehicleStatus.AVAILABLE);
        }
    }

    // ------------------------------------------------------------------
    // updateVehicle
    // ------------------------------------------------------------------

    @Nested
    @DisplayName("updateVehicle")
    class UpdateVehicle {

        @Test
        @DisplayName("throws ResourceNotFoundException when the vehicle does not exist")
        void throwsWhenNotFound() {
            when(vehicleRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> vehicleService.updateVehicle(99L, UpdateVehicleRequest.builder().build()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("rejects a last-maintenance odometer greater than the new current odometer")
        void rejectsLastMaintenanceAboveCurrent() {
            givenVehicleExists(buildVehicle());
            UpdateVehicleRequest request = UpdateVehicleRequest.builder()
                    .currentOdometer(1000)
                    .lastMaintenanceOdometer(9000)
                    .build();

            assertThatThrownBy(() -> vehicleService.updateVehicle(VEHICLE_ID, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("bảo dưỡng gần nhất");

            verify(vehicleRepository, never()).save(any(Vehicle.class));
        }

        @Test
        @DisplayName("keeps existing values for null fields (partial update)")
        void ignoresNullFields() {
            Vehicle vehicle = buildVehicle();
            givenVehicleExists(vehicle);

            vehicleService.updateVehicle(VEHICLE_ID, UpdateVehicleRequest.builder().brand("Honda").build());

            ArgumentCaptor<Vehicle> captor = ArgumentCaptor.forClass(Vehicle.class);
            verify(vehicleRepository).save(captor.capture());
            assertThat(captor.getValue().getBrand()).isEqualTo("Honda");
            assertThat(captor.getValue().getModel()).isEqualTo("Camry 2.5Q");
            assertThat(captor.getValue().getSeatCapacity()).isEqualTo(5);
            assertThat(captor.getValue().getCurrentOdometer()).isEqualTo(15000);
            assertThat(captor.getValue().getStatus()).isEqualTo(VehicleStatus.AVAILABLE);
        }

        @Test
        @DisplayName("ignores blank brand and model instead of overwriting with empty strings")
        void ignoresBlankStrings() {
            givenVehicleExists(buildVehicle());

            vehicleService.updateVehicle(VEHICLE_ID, UpdateVehicleRequest.builder()
                    .brand("   ")
                    .model("")
                    .build());

            ArgumentCaptor<Vehicle> captor = ArgumentCaptor.forClass(Vehicle.class);
            verify(vehicleRepository).save(captor.capture());
            assertThat(captor.getValue().getBrand()).isEqualTo("Toyota");
            assertThat(captor.getValue().getModel()).isEqualTo("Camry 2.5Q");
        }

        @Test
        @DisplayName("rejects a future manufacture year")
        void rejectsFutureManufactureYear() {
            givenVehicleExists(buildVehicle());

            assertThatThrownBy(() -> vehicleService.updateVehicle(VEHICLE_ID, UpdateVehicleRequest.builder()
                    .manufactureYear(Year.now().getValue() + 5)
                    .build()))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("vượt quá năm");
        }

        @Test
        @DisplayName("accepts updating odometer and maintenance odometer together")
        void acceptsOdometerAndMaintenanceTogether() {
            givenVehicleExists(buildVehicle());

            VehicleDTO dto = vehicleService.updateVehicle(VEHICLE_ID, UpdateVehicleRequest.builder()
                    .currentOdometer(20000)
                    .lastMaintenanceOdometer(18000)
                    .build());

            assertThat(dto.getCurrentOdometer()).isEqualTo(20000);
            assertThat(dto.getLastMaintenanceOdometer()).isEqualTo(18000);
        }
    }

    // ------------------------------------------------------------------
    // assignDriver
    // ------------------------------------------------------------------

    @Nested
    @DisplayName("assignDriver")
    class AssignDriver {

        @Test
        @DisplayName("sets the vehicle to IN_USE and stores the driver")
        void setsInUseAndDriver() {
            givenVehicleExists(buildVehicle());

            VehicleDTO dto = vehicleService.assignDriver(VEHICLE_ID, buildAssignRequest());

            assertThat(dto.getStatus()).isEqualTo(VehicleStatus.IN_USE);
            assertThat(dto.getAssignedDriverId()).isEqualTo(9L);
            assertThat(dto.getAssignedDriverName()).isEqualTo("Nguyen Van An");
        }

        @Test
        @DisplayName("rejects a vehicle that is not AVAILABLE")
        void rejectsVehicleNotAvailable() {
            givenVehicleExists(buildVehicle(VehicleStatus.MAINTENANCE, 15000, 15000));

            assertThatThrownBy(() -> vehicleService.assignDriver(VEHICLE_ID, buildAssignRequest()))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("SẴN SÀNG");

            verify(vehicleRepository, never()).save(any(Vehicle.class));
        }

        @Test
        @DisplayName("notifies the driver by email when an address is provided")
        void sendsAssignmentEmail() {
            givenVehicleExists(buildVehicle());

            vehicleService.assignDriver(VEHICLE_ID, buildAssignRequest());

            verify(emailClient, times(1))
                    .sendAssignmentNotification("29A-888.88", "Nguyen Van An", "an@example.com");
        }

        @Test
        @DisplayName("skips the email when no address is provided")
        void skipsEmailWithoutAddress() {
            givenVehicleExists(buildVehicle());
            AssignDriverRequest request = AssignDriverRequest.builder()
                    .driverId(9L)
                    .driverName("Nguyen Van An")
                    .build();

            vehicleService.assignDriver(VEHICLE_ID, request);

            verifyNoInteractions(emailClient);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when the vehicle does not exist")
        void throwsWhenNotFound() {
            when(vehicleRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> vehicleService.assignDriver(99L, buildAssignRequest()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ------------------------------------------------------------------
    // returnVehicle
    // ------------------------------------------------------------------

    @Nested
    @DisplayName("returnVehicle")
    class ReturnVehicle {

        @Test
        @DisplayName("clears the assigned driver")
        void clearsDriver() {
            Vehicle vehicle = buildVehicle(VehicleStatus.IN_USE, 15000, 15000);
            vehicle.setAssignedDriverId(3L);
            vehicle.setAssignedDriverName("Nguyen Van An");
            givenVehicleExists(vehicle);

            VehicleDTO dto = vehicleService.returnVehicle(VEHICLE_ID, buildReturnRequest(16000));

            assertThat(dto.getAssignedDriverId()).isNull();
            assertThat(dto.getAssignedDriverName()).isNull();
        }

        @Test
        @DisplayName("rejects an odometer that goes backwards")
        void rejectsOdometerDecrease() {
            givenVehicleExists(buildVehicle(VehicleStatus.IN_USE, 15000, 15000));

            assertThatThrownBy(() -> vehicleService.returnVehicle(VEHICLE_ID, buildReturnRequest(14000)))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("không thể nhỏ hơn");

            verify(vehicleRepository, never()).save(any(Vehicle.class));
        }

        @Test
        @DisplayName("accepts an unchanged odometer")
        void acceptsEqualOdometer() {
            givenVehicleExists(buildVehicle(VehicleStatus.IN_USE, 15000, 15000));

            VehicleDTO dto = vehicleService.returnVehicle(VEHICLE_ID, buildReturnRequest(15000));

            assertThat(dto.getCurrentOdometer()).isEqualTo(15000);
            assertThat(dto.getStatus()).isEqualTo(VehicleStatus.AVAILABLE);
        }

        @Test
        @DisplayName("stays AVAILABLE when the maintenance interval is not reached")
        void staysAvailableUnderThreshold() {
            givenVehicleExists(buildVehicle(VehicleStatus.IN_USE, 15000, 15000));

            VehicleDTO dto = vehicleService.returnVehicle(VEHICLE_ID, buildReturnRequest(19000));

            assertThat(dto.getStatus()).isEqualTo(VehicleStatus.AVAILABLE);
            verify(emailClient, never()).sendMaintenanceAlert(anyString(), anyInt(), anyInt());
        }

        @Test
        @DisplayName("switches to MAINTENANCE once 5000 km since maintenance is reached")
        void switchesToMaintenanceOverThreshold() {
            givenVehicleExists(buildVehicle(VehicleStatus.IN_USE, 15000, 10000));

            VehicleDTO dto = vehicleService.returnVehicle(VEHICLE_ID, buildReturnRequest(21000));

            assertThat(dto.getStatus()).isEqualTo(VehicleStatus.MAINTENANCE);
            assertThat(dto.getCurrentOdometer()).isEqualTo(21000);
        }

        @Test
        @DisplayName("triggers a maintenance alert email when the threshold is reached")
        void sendsMaintenanceEmail() {
            givenVehicleExists(buildVehicle(VehicleStatus.IN_USE, 15000, 10000));

            vehicleService.returnVehicle(VEHICLE_ID, buildReturnRequest(21000));

            verify(emailClient, times(1)).sendMaintenanceAlert("29A-888.88", 21000, 10000);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when the vehicle does not exist")
        void throwsWhenNotFound() {
            when(vehicleRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> vehicleService.returnVehicle(99L, buildReturnRequest(16000)))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ------------------------------------------------------------------
    // softDeleteVehicle
    // ------------------------------------------------------------------

    @Nested
    @DisplayName("softDeleteVehicle")
    class SoftDeleteVehicle {

        @Test
        @DisplayName("switches the vehicle to DECOMMISSIONED")
        void setsDecommissioned() {
            givenVehicleExists(buildVehicle(VehicleStatus.AVAILABLE, 15000, 15000));

            VehicleDTO dto = vehicleService.softDeleteVehicle(VEHICLE_ID);

            assertThat(dto.getStatus()).isEqualTo(VehicleStatus.DECOMMISSIONED);
        }

        @Test
        @DisplayName("keeps the odometer history intact (soft delete, not a hard delete)")
        void keepsOdometerHistory() {
            givenVehicleExists(buildVehicle(VehicleStatus.IN_USE, 38500, 35000));

            VehicleDTO dto = vehicleService.softDeleteVehicle(VEHICLE_ID);

            assertThat(dto.getCurrentOdometer()).isEqualTo(38500);
            assertThat(dto.getLastMaintenanceOdometer()).isEqualTo(35000);
        }

        @Test
        @DisplayName("never calls delete() on the repository")
        void neverHardDeletes() {
            givenVehicleExists(buildVehicle());

            vehicleService.softDeleteVehicle(VEHICLE_ID);

            verify(vehicleRepository, never()).delete(any(Vehicle.class));
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when the vehicle does not exist")
        void throwsWhenNotFound() {
            when(vehicleRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> vehicleService.softDeleteVehicle(99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ------------------------------------------------------------------
    // updateStatus
    // ------------------------------------------------------------------

    @Nested
    @DisplayName("updateStatus")
    class UpdateStatus {

        @Test
        @DisplayName("resets the last-maintenance odometer when maintenance is completed")
        void resetsOdometerWhenFinishingMaintenance() {
            givenVehicleExists(buildVehicle(VehicleStatus.MAINTENANCE, 21000, 10000));

            VehicleDTO dto = vehicleService.updateStatus(VEHICLE_ID, VehicleStatus.AVAILABLE);

            assertThat(dto.getStatus()).isEqualTo(VehicleStatus.AVAILABLE);
            assertThat(dto.getLastMaintenanceOdometer()).isEqualTo(21000);
        }

        @Test
        @DisplayName("does not touch the maintenance odometer for other transitions")
        void keepsOdometerForOtherTransitions() {
            givenVehicleExists(buildVehicle(VehicleStatus.IN_USE, 38500, 35000));

            VehicleDTO dto = vehicleService.updateStatus(VEHICLE_ID, VehicleStatus.AVAILABLE);

            assertThat(dto.getLastMaintenanceOdometer()).isEqualTo(35000);
        }

        @Test
        @DisplayName("applies the requested status")
        void appliesRequestedStatus() {
            givenVehicleExists(buildVehicle());

            VehicleDTO dto = vehicleService.updateStatus(VEHICLE_ID, VehicleStatus.MAINTENANCE);

            assertThat(dto.getStatus()).isEqualTo(VehicleStatus.MAINTENANCE);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when the vehicle does not exist")
        void throwsWhenNotFound() {
            when(vehicleRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> vehicleService.updateStatus(99L, VehicleStatus.AVAILABLE))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ------------------------------------------------------------------
    // getAllVehicles / getBrands
    // ------------------------------------------------------------------

    @Nested
    @DisplayName("getAllVehicles")
    class GetAllVehicles {

        @Test
        @DisplayName("delegates filtering to the repository specification")
        void usesSpecification() {
            when(vehicleRepository.findAll(any(Specification.class))).thenReturn(List.of(buildVehicle()));

            vehicleService.getAllVehicles(VehicleStatus.AVAILABLE, "Toyota", "29A");

            verify(vehicleRepository).findAll(any(Specification.class));
        }

        @Test
        @DisplayName("sorts by id descending")
        void sortsByIdDescending() {
            Vehicle v1 = buildVehicle();
            Vehicle v2 = buildVehicle();
            v2.setId(2L);
            Vehicle v3 = buildVehicle();
            v3.setId(3L);
            when(vehicleRepository.findAll(any(Specification.class))).thenReturn(List.of(v1, v2, v3));

            List<VehicleDTO> result = vehicleService.getAllVehicles(null, null, null);

            assertThat(result).extracting(VehicleDTO::getId).containsExactly(3L, 2L, 1L);
        }

        @Test
        @DisplayName("maps the maintenanceDue flag from the odometer gap")
        void mapsMaintenanceDue() {
            Vehicle due = buildVehicle(VehicleStatus.AVAILABLE, 15000, 10000);
            due.setId(2L);
            Vehicle notDue = buildVehicle(VehicleStatus.AVAILABLE, 14999, 10000);
            when(vehicleRepository.findAll(any(Specification.class))).thenReturn(List.of(due, notDue));

            List<VehicleDTO> result = vehicleService.getAllVehicles(null, null, null);

            // Sorted by id descending: due (id 2) first, then notDue (id 1)
            assertThat(result).extracting(VehicleDTO::isMaintenanceDue).containsExactly(true, false);
        }

        @Test
        @DisplayName("returns an empty list when nothing matches")
        void returnsEmptyList() {
            when(vehicleRepository.findAll(any(Specification.class))).thenReturn(List.of());

            assertThat(vehicleService.getAllVehicles(VehicleStatus.IN_USE, "Ferrari", "zzz")).isEmpty();
        }
    }

    @Nested
    @DisplayName("getBrands")
    class GetBrands {

        @Test
        @DisplayName("returns the distinct brands held by the repository")
        void returnsDistinctBrands() {
            when(vehicleRepository.findDistinctBrands())
                    .thenReturn(List.of("Ford", "Hyundai", "Toyota", "VinFast"));

            assertThat(vehicleService.getBrands()).containsExactly("Ford", "Hyundai", "Toyota", "VinFast");
        }

        @Test
        @DisplayName("returns an empty list when the fleet is empty")
        void returnsEmptyList() {
            when(vehicleRepository.findDistinctBrands()).thenReturn(List.of());

            assertThat(vehicleService.getBrands()).isEmpty();
        }
    }
}