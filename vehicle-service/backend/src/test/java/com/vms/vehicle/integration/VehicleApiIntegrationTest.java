package com.vms.vehicle.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vms.vehicle.entity.TripStatus;
import com.vms.vehicle.entity.Vehicle;
import com.vms.vehicle.entity.VehicleStatus;
import com.vms.vehicle.entity.VehicleType;
import com.vms.vehicle.entity.VehicleTrip;
import com.vms.vehicle.repository.VehicleRepository;
import com.vms.vehicle.repository.VehicleTripRepository;
import com.vms.vehicle.service.EmailClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end tests against a real (in-memory H2) database, exercising the full
 * HTTP stack: routing, validation, persistence and dynamic filtering.
 * No external MySQL or email service is required.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Vehicle API integration")
class VehicleApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private VehicleTripRepository vehicleTripRepository;

    @Autowired
    private DataSource dataSource;

    @MockBean
    private EmailClient emailClient;

    @BeforeEach
    void cleanDatabase() {
        vehicleTripRepository.deleteAll();
        vehicleRepository.deleteAll();
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private String createVehicleJson(String plate, String brand, String model, Integer initialOdometer) {
        return """
                {
                  "licensePlate": "%s",
                  "brand": "%s",
                  "model": "%s",
                  "vehicleType": "SEDAN",
                  "seatCapacity": 5,
                  "manufactureYear": 2023,
                  "initialOdometer": %d
                }
                """.formatted(plate, brand, model, initialOdometer);
    }

    private Long createVehicle(String plate, String brand, String model, Integer initialOdometer) throws Exception {
        String response = mockMvc.perform(post("/api/vehicles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createVehicleJson(plate, brand, model, initialOdometer)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).path("data").path("id").asLong();
    }

    private Vehicle buildEntity(String plate, String brand, VehicleStatus status, int odometer) {
        return Vehicle.builder()
                .licensePlate(plate)
                .brand(brand)
                .model("Test Model")
                .vehicleType(VehicleType.SEDAN)
                .seatCapacity(5)
                .manufactureYear(2023)
                .currentOdometer(odometer)
                .lastMaintenanceOdometer(odometer)
                .status(status)
                .build();
    }

    // ------------------------------------------------------------------
    // Tests
    // ------------------------------------------------------------------

    @Nested
    @DisplayName("CRUD lifecycle")
    class Crud {

        @Test
        @DisplayName("create, read, update and soft-delete a vehicle")
        void fullCrudLifecycle() throws Exception {
            Long id = createVehicle("29A-888.88", "Toyota", "Camry", 15000);

            mockMvc.perform(get("/api/vehicles/{id}", id))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.licensePlate").value("29A-888.88"))
                    .andExpect(jsonPath("$.data.status").value("AVAILABLE"))
                    .andExpect(jsonPath("$.data.currentOdometer").value(15000));

            mockMvc.perform(put("/api/vehicles/{id}", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"brand\": \"Honda\", \"model\": \"Civic\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.brand").value("Honda"))
                    .andExpect(jsonPath("$.data.model").value("Civic"))
                    .andExpect(jsonPath("$.data.licensePlate").value("29A-888.88"));

            mockMvc.perform(delete("/api/vehicles/{id}", id))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("DECOMMISSIONED"));

            assertThat(vehicleRepository.findById(id)).isPresent();
        }

        @Test
        @DisplayName("returns 404 for an unknown vehicle id")
        void unknownIdReturns404() throws Exception {
            mockMvc.perform(get("/api/vehicles/{id}", 999999))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("rejects a duplicate license plate with 400")
        void duplicatePlateReturns400() throws Exception {
            createVehicle("29A-888.88", "Toyota", "Camry", 15000);

            mockMvc.perform(post("/api/vehicles")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createVehicleJson("29A-888.88", "Ford", "Focus", 1000)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").isNotEmpty());
        }

        @Test
        @DisplayName("normalises the license plate on creation")
        void normalisesLicensePlate() throws Exception {
            mockMvc.perform(post("/api/vehicles")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createVehicleJson("51k99999", "Hyundai", "SantaFe", 500)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.licensePlate").value("51K-999.99"));
        }

        @Test
        @DisplayName("declares a unique index on the license plate column")
        void licensePlateIsUniqueInSchema() throws Exception {
            List<String> uniqueColumns = new ArrayList<>();
            try (Connection connection = dataSource.getConnection()) {
                DatabaseMetaData metaData = connection.getMetaData();
                try (ResultSet rs = metaData.getIndexInfo(null, null, "VEHICLES", true, false)) {
                    while (rs.next()) {
                        String column = rs.getString("COLUMN_NAME");
                        if (column != null) {
                            uniqueColumns.add(column.toUpperCase());
                        }
                    }
                }
            }

            assertThat(uniqueColumns).contains("LICENSE_PLATE");
        }
    }

    @Nested
    @DisplayName("Filtering and search")
    class Filtering {

        @Test
        @DisplayName("filters by status")
        void filtersByStatus() throws Exception {
            Long available = createVehicle("29A-888.88", "Toyota", "Camry", 15000);
            createVehicle("30H-123.45", "Ford", "Ranger", 15000);
            Long maintenance = createVehicle("29B-456.78", "Ford", "Transit", 15000);

            mockMvc.perform(put("/api/vehicles/{id}/status", maintenance)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"status\": \"MAINTENANCE\"}"))
                    .andExpect(status().isOk());

            mockMvc.perform(get("/api/vehicles").param("status", "AVAILABLE"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(2));

            mockMvc.perform(get("/api/vehicles").param("status", "MAINTENANCE"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(1))
                    .andExpect(jsonPath("$.data[0].id").value(maintenance));

            mockMvc.perform(get("/api/vehicles").param("status", "IN_USE"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(0));

            assertThat(available).isNotNull();
        }

        @Test
        @DisplayName("filters by brand case-insensitively")
        void filtersByBrandCaseInsensitive() throws Exception {
            createVehicle("29A-888.88", "Toyota", "Camry", 15000);
            createVehicle("30H-123.45", "Ford", "Ranger", 15000);
            createVehicle("29B-456.78", "Ford", "Transit", 15000);

            mockMvc.perform(get("/api/vehicles").param("brand", "Ford"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(2));

            mockMvc.perform(get("/api/vehicles").param("brand", "ford"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(2));

            mockMvc.perform(get("/api/vehicles").param("brand", "TOYOTA"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(1))
                    .andExpect(jsonPath("$.data[0].brand").value("Toyota"));

            mockMvc.perform(get("/api/vehicles").param("brand", "Ferrari"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(0));
        }

        @Test
        @DisplayName("searches across plate, brand, model and driver name")
        void searchesAcrossFields() throws Exception {
            Long id = createVehicle("29A-888.88", "Toyota", "Camry", 15000);
            createVehicle("30H-123.45", "Ford", "Ranger", 15000);

            mockMvc.perform(get("/api/vehicles").param("search", "29A"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(1))
                    .andExpect(jsonPath("$.data[0].id").value(id));

            mockMvc.perform(get("/api/vehicles").param("search", "ranger"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(1));

            mockMvc.perform(get("/api/vehicles").param("search", "Nguyen"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(0));

            mockMvc.perform(post("/api/vehicles/{id}/assign", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"driverId\": 9, \"driverName\": \"Nguyen Van An\"}"))
                    .andExpect(status().isOk());

            mockMvc.perform(get("/api/vehicles").param("search", "nguyen"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(1))
                    .andExpect(jsonPath("$.data[0].assignedDriverName").value("Nguyen Van An"));
        }

        @Test
        @DisplayName("combines status, brand and search filters")
        void combinesFilters() throws Exception {
            createVehicle("29A-888.88", "Toyota", "Camry", 15000);
            createVehicle("30H-123.45", "Ford", "Ranger", 15000);
            createVehicle("29A-111.11", "Toyota", "Vios", 15000);

            mockMvc.perform(get("/api/vehicles")
                            .param("status", "AVAILABLE")
                            .param("brand", "Toyota")
                            .param("search", "29A"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(2));

            mockMvc.perform(get("/api/vehicles")
                            .param("brand", "Ford")
                            .param("search", "29A"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(0));
        }

        @Test
        @DisplayName("lists distinct brands sorted alphabetically")
        void listsDistinctBrands() throws Exception {
            createVehicle("29A-888.88", "Toyota", "Camry", 15000);
            createVehicle("30H-123.45", "Ford", "Ranger", 15000);
            createVehicle("29B-456.78", "Ford", "Transit", 15000);

            mockMvc.perform(get("/api/vehicles/brands"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0]").value("Ford"))
                    .andExpect(jsonPath("$.data[1]").value("Toyota"))
                    .andExpect(jsonPath("$.data.length()").value(2));
        }

        @Test
        @DisplayName("returns the newest vehicles first")
        void sortsNewestFirst() throws Exception {
            Long first = createVehicle("29A-111.11", "Toyota", "Vios", 1000);
            Long second = createVehicle("29A-222.22", "Toyota", "Vios", 1000);

            mockMvc.perform(get("/api/vehicles"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].id").value(second))
                    .andExpect(jsonPath("$.data[1].id").value(first));
        }
    }

    @Nested
    @DisplayName("Dispatch lifecycle")
    class Dispatch {

        @Test
        @DisplayName("assign then return returns the vehicle to AVAILABLE")
        void assignThenReturn() throws Exception {
            Long id = createVehicle("29A-888.88", "Toyota", "Camry", 15000);

            mockMvc.perform(post("/api/vehicles/{id}/assign", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"driverId\": 9, \"driverName\": \"Nguyen Van An\", \"driverEmail\": \"an@example.com\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("IN_USE"))
                    .andExpect(jsonPath("$.data.assignedDriverName").value("Nguyen Van An"));

            mockMvc.perform(post("/api/vehicles/{id}/return", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"newOdometer\": 16500, \"notes\": \"returned on time\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("AVAILABLE"))
                    .andExpect(jsonPath("$.data.currentOdometer").value(16500))
                    .andExpect(jsonPath("$.data.assignedDriverId").doesNotExist());
        }

        @Test
        @DisplayName("rejects assigning a vehicle that is already in use")
        void rejectsDoubleAssign() throws Exception {
            Long id = createVehicle("29A-888.88", "Toyota", "Camry", 15000);

            mockMvc.perform(post("/api/vehicles/{id}/assign", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"driverId\": 9, \"driverName\": \"Nguyen Van An\"}"))
                    .andExpect(status().isOk());

            mockMvc.perform(post("/api/vehicles/{id}/assign", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"driverId\": 10, \"driverName\": \"Tran Thi B\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("rejects an odometer that goes backwards")
        void rejectsOdometerDecrease() throws Exception {
            Long id = createVehicle("29A-888.88", "Toyota", "Camry", 15000);

            mockMvc.perform(post("/api/vehicles/{id}/assign", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"driverId\": 9, \"driverName\": \"Nguyen Van An\"}"))
                    .andExpect(status().isOk());

            mockMvc.perform(post("/api/vehicles/{id}/return", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"newOdometer\": 12000}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("switches the vehicle to MAINTENANCE once 5000 km are reached")
        void maintenanceThresholdAutoTriggers() throws Exception {
            Long id = createVehicle("29A-888.88", "Toyota", "Camry", 1000);

            mockMvc.perform(post("/api/vehicles/{id}/assign", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"driverId\": 9, \"driverName\": \"Nguyen Van An\"}"))
                    .andExpect(status().isOk());

            mockMvc.perform(post("/api/vehicles/{id}/return", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"newOdometer\": 7000}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("MAINTENANCE"));
        }

        @Test
        @DisplayName("completing maintenance resets the maintenance odometer")
        void completingMaintenanceResetsOdometer() throws Exception {
            Long id = createVehicle("29A-888.88", "Toyota", "Camry", 1000);

            mockMvc.perform(post("/api/vehicles/{id}/assign", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"driverId\": 9, \"driverName\": \"Nguyen Van An\"}"))
                    .andExpect(status().isOk());

            mockMvc.perform(post("/api/vehicles/{id}/return", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"newOdometer\": 7000}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("MAINTENANCE"));

            mockMvc.perform(put("/api/vehicles/{id}/status", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"status\": \"AVAILABLE\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("AVAILABLE"))
                    .andExpect(jsonPath("$.data.lastMaintenanceOdometer").value(7000))
                    .andExpect(jsonPath("$.data.maintenanceDue").value(false));
        }

        @Test
        @DisplayName("flags a vehicle as maintenance-due in the DTO")
        void exposesMaintenanceDueFlag() throws Exception {
            Long id = createVehicle("29A-888.88", "Toyota", "Camry", 1000);
            vehicleRepository.findById(id).ifPresent(v -> {
                v.setLastMaintenanceOdometer(1000);
                v.setCurrentOdometer(9000);
                vehicleRepository.saveAndFlush(v);
            });

            mockMvc.perform(get("/api/vehicles/{id}", id))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.maintenanceDue").value(true));
        }
    }

    @Nested
    @DisplayName("Trip log")
    class TripLog {

        @Test
        @DisplayName("returns 404 for the current trip when the vehicle never ran")
        void currentTripReturns404WhenIdle() throws Exception {
            Long id = createVehicle("29A-888.88", "Toyota", "Camry", 15000);

            mockMvc.perform(get("/api/vehicles/{id}/trips/current", id))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("returns 404 for the current trip of an unknown vehicle")
        void currentTripReturns404ForUnknownVehicle() throws Exception {
            mockMvc.perform(get("/api/vehicles/{id}/trips/current", 999999))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("returns 404 for the trip history of an unknown vehicle")
        void tripsReturn404ForUnknownVehicle() throws Exception {
            mockMvc.perform(get("/api/vehicles/{id}/trips", 999999))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("returns an empty history for a vehicle that never ran")
        void emptyHistoryForNewVehicle() throws Exception {
            Long id = createVehicle("29A-888.88", "Toyota", "Camry", 15000);

            mockMvc.perform(get("/api/vehicles/{id}/trips", id))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(0));
        }

        @Test
        @DisplayName("opens a trip on assign and closes it on return")
        void tripLifecycle() throws Exception {
            Long id = createVehicle("29A-888.88", "Toyota", "Camry", 15000);

            mockMvc.perform(post("/api/vehicles/{id}/assign", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"driverId\": 9, \"driverName\": \"Nguyen Van An\"}"))
                    .andExpect(status().isOk());

            mockMvc.perform(get("/api/vehicles/{id}/trips/current", id))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"))
                    .andExpect(jsonPath("$.data.driverName").value("Nguyen Van An"))
                    .andExpect(jsonPath("$.data.startOdometer").value(15000))
                    .andExpect(jsonPath("$.data.endOdometer").doesNotExist());

            mockMvc.perform(post("/api/vehicles/{id}/return", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"newOdometer\": 16500, \"notes\": \"giao xong\"}"))
                    .andExpect(status().isOk());

            mockMvc.perform(get("/api/vehicles/{id}/trips/current", id))
                    .andExpect(status().isNotFound());

            mockMvc.perform(get("/api/vehicles/{id}/trips", id))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(1))
                    .andExpect(jsonPath("$.data[0].status").value("COMPLETED"))
                    .andExpect(jsonPath("$.data[0].startOdometer").value(15000))
                    .andExpect(jsonPath("$.data[0].endOdometer").value(16500))
                    .andExpect(jsonPath("$.data[0].distanceKm").value(1500))
                    .andExpect(jsonPath("$.data[0].notes").value("giao xong"));
        }

        @Test
        @DisplayName("keeps every dispatch, newest first")
        void keepsFullHistory() throws Exception {
            Long id = createVehicle("29A-888.88", "Toyota", "Camry", 15000);

            for (int leg = 1; leg <= 3; leg++) {
                mockMvc.perform(post("/api/vehicles/{id}/assign", id)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"driverId\": 9, \"driverName\": \"Tai xe " + leg + "\"}"))
                        .andExpect(status().isOk());
                mockMvc.perform(post("/api/vehicles/{id}/return", id)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"newOdometer\": " + (15000 + (leg * 100)) + "}"))
                        .andExpect(status().isOk());
            }

            mockMvc.perform(get("/api/vehicles/{id}/trips", id))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(3))
                    .andExpect(jsonPath("$.data[0].driverName").value("Tai xe 3"))
                    .andExpect(jsonPath("$.data[2].driverName").value("Tai xe 1"))
                    .andExpect(jsonPath("$.data[0].distanceKm").value(100));
        }

        @Test
        @DisplayName("cancels the running trip when the vehicle is decommissioned")
        void cancelsTripOnSoftDelete() throws Exception {
            Long id = createVehicle("29A-888.88", "Toyota", "Camry", 15000);

            mockMvc.perform(post("/api/vehicles/{id}/assign", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"driverId\": 9, \"driverName\": \"Nguyen Van An\"}"))
                    .andExpect(status().isOk());

            mockMvc.perform(delete("/api/vehicles/{id}", id))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("DECOMMISSIONED"));

            mockMvc.perform(get("/api/vehicles/{id}/trips", id))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].status").value("CANCELLED"))
                    .andExpect(jsonPath("$.data[0].endOdometer").value(15000));
        }

        @Test
        @DisplayName("does not open a trip when the assignment is rejected")
        void noTripWhenAssignRejected() throws Exception {
            Long id = createVehicle("29A-888.88", "Toyota", "Camry", 15000);

            mockMvc.perform(post("/api/vehicles/{id}/assign", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"driverId\": 9, \"driverName\": \"Nguyen Van An\"}"))
                    .andExpect(status().isOk());
            mockMvc.perform(post("/api/vehicles/{id}/assign", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"driverId\": 10, \"driverName\": \"Tran Thi B\"}"))
                    .andExpect(status().isBadRequest());

            mockMvc.perform(get("/api/vehicles/{id}/trips", id))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(1));
        }

        @Test
        @DisplayName("does not record a trip when the returned odometer is invalid")
        void noTripOnInvalidReturn() throws Exception {
            Long id = createVehicle("29A-888.88", "Toyota", "Camry", 15000);

            mockMvc.perform(post("/api/vehicles/{id}/assign", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"driverId\": 9, \"driverName\": \"Nguyen Van An\"}"))
                    .andExpect(status().isOk());
            mockMvc.perform(post("/api/vehicles/{id}/return", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"newOdometer\": 12000}"))
                    .andExpect(status().isBadRequest());

            mockMvc.perform(get("/api/vehicles/{id}/trips/current", id))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"));
        }

        @Test
        @DisplayName("snapshots the plate so history survives later renames")
        void snapshotsLicensePlate() throws Exception {
            Long id = createVehicle("29A-888.88", "Toyota", "Camry", 15000);

            mockMvc.perform(post("/api/vehicles/{id}/assign", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"driverId\": 9, \"driverName\": \"Nguyen Van An\"}"))
                    .andExpect(status().isOk());

            List<VehicleTrip> trips = vehicleTripRepository.findAllByVehicleIdOrderByStartedAtDesc(id);
            assertThat(trips).hasSize(1);
            assertThat(trips.get(0).getVehiclePlate()).isEqualTo("29A-888.88");
            assertThat(trips.get(0).getStatus()).isEqualTo(TripStatus.IN_PROGRESS);
        }
    }
}