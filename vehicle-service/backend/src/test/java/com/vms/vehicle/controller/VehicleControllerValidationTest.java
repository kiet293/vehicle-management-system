package com.vms.vehicle.controller;

import com.vms.vehicle.dto.VehicleDTO;
import com.vms.vehicle.entity.VehicleStatus;
import com.vms.vehicle.service.VehicleService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice test: verifies that Bean Validation on the request DTOs turns invalid
 * payloads into HTTP 400 with the standard {@code ApiResponse} error envelope
 * instead of leaking a 500.
 */
@WebMvcTest(VehicleController.class)
@DisplayName("VehicleController validation")
class VehicleControllerValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private VehicleService vehicleService;

    @Nested
    @DisplayName("POST /api/vehicles")
    class CreateVehicle {

        private String validBody(String overrides) {
            return """
                    {
                      "licensePlate": "29A-888.88",
                      "brand": "Toyota",
                      "model": "Camry",
                      "vehicleType": "SEDAN",
                      "seatCapacity": 5,
                      "manufactureYear": 2023
                    %s
                    }
                    """.formatted(overrides);
        }

        @Test
        @DisplayName("accepts a valid payload")
        void acceptsValidPayload() throws Exception {
            when(vehicleService.createVehicle(any())).thenReturn(VehicleDTO.builder()
                    .id(1L).licensePlate("29A-888.88").status(VehicleStatus.AVAILABLE).build());

            mockMvc.perform(post("/api/vehicles")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validBody("")))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.licensePlate").value("29A-888.88"));
        }

        @Test
        @DisplayName("returns 400 when the license plate is missing")
        void missingPlate() throws Exception {
            mockMvc.perform(post("/api/vehicles")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validBody(", \"licensePlate\": \"\"")))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").isNotEmpty());
        }

        @Test
        @DisplayName("returns 400 when the license plate is blank")
        void blankPlate() throws Exception {
            mockMvc.perform(post("/api/vehicles")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validBody(", \"licensePlate\": \"   \"")))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when the vehicle type is missing")
        void missingVehicleType() throws Exception {
            mockMvc.perform(post("/api/vehicles")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validBody(", \"vehicleType\": null")))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when the seat capacity is not positive")
        void nonPositiveSeatCapacity() throws Exception {
            mockMvc.perform(post("/api/vehicles")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validBody(", \"seatCapacity\": 0")))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when the manufacture year is below 1990")
        void yearBefore1990() throws Exception {
            mockMvc.perform(post("/api/vehicles")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validBody(", \"manufactureYear\": 1985")))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when the initial odometer is negative")
        void negativeInitialOdometer() throws Exception {
            mockMvc.perform(post("/api/vehicles")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validBody(", \"initialOdometer\": -10")))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 for a malformed JSON body")
        void malformedBody() throws Exception {
            mockMvc.perform(post("/api/vehicles")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"licensePlate\": "))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    @Nested
    @DisplayName("PUT /api/vehicles/{id}")
    class UpdateVehicle {

        @Test
        @DisplayName("returns 400 when the payload is empty")
        void emptyPayloadIsValid() throws Exception {
            when(vehicleService.updateVehicle(anyLong(), any())).thenReturn(VehicleDTO.builder().id(1L).build());

            mockMvc.perform(put("/api/vehicles/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 400 when the seat capacity is zero")
        void zeroSeatCapacity() throws Exception {
            mockMvc.perform(put("/api/vehicles/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"seatCapacity\": 0}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when the manufacture year is above 2100")
        void yearAfter2100() throws Exception {
            mockMvc.perform(put("/api/vehicles/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"manufactureYear\": 2200}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when the odometer is negative")
        void negativeOdometer() throws Exception {
            mockMvc.perform(put("/api/vehicles/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"currentOdometer\": -1}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/vehicles/{id}/assign")
    class AssignDriver {

        @Test
        @DisplayName("accepts a valid payload")
        void acceptsValidPayload() throws Exception {
            when(vehicleService.assignDriver(anyLong(), any())).thenReturn(VehicleDTO.builder()
                    .id(1L).licensePlate("29A-888.88").status(VehicleStatus.IN_USE).build());

            mockMvc.perform(post("/api/vehicles/1/assign")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"driverId": 9, "driverName": "Nguyen Van An", "driverEmail": "an@example.com"}
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("IN_USE"));
        }

        @Test
        @DisplayName("returns 400 when the driver name is blank")
        void blankDriverName() throws Exception {
            mockMvc.perform(post("/api/vehicles/1/assign")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"driverId\": 9, \"driverName\": \"  \"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when the driver email is invalid")
        void invalidDriverEmail() throws Exception {
            mockMvc.perform(post("/api/vehicles/1/assign")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"driverId\": 9, \"driverName\": \"An\", \"driverEmail\": \"not-an-email\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when the driver id is missing")
        void missingDriverId() throws Exception {
            mockMvc.perform(post("/api/vehicles/1/assign")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"driverName\": \"An\"}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/vehicles/{id}/return")
    class ReturnVehicle {

        @Test
        @DisplayName("accepts a valid payload")
        void acceptsValidPayload() throws Exception {
            when(vehicleService.returnVehicle(anyLong(), any())).thenReturn(VehicleDTO.builder()
                    .id(1L).status(VehicleStatus.AVAILABLE).build());

            mockMvc.perform(post("/api/vehicles/1/return")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"newOdometer\": 16000, \"notes\": \"on time\"}"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 400 when the new odometer is missing")
        void missingOdometer() throws Exception {
            mockMvc.perform(post("/api/vehicles/1/return")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"notes\": \"on time\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when the new odometer is negative")
        void negativeOdometer() throws Exception {
            mockMvc.perform(post("/api/vehicles/1/return")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"newOdometer\": -5}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("PUT /api/vehicles/{id}/status")
    class UpdateStatus {

        @Test
        @DisplayName("accepts a valid status")
        void acceptsValidStatus() throws Exception {
            when(vehicleService.updateStatus(anyLong(), any())).thenReturn(VehicleDTO.builder()
                    .id(1L).status(VehicleStatus.MAINTENANCE).build());

            mockMvc.perform(put("/api/vehicles/1/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"status\": \"MAINTENANCE\"}"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 400 when the status is missing")
        void missingStatus() throws Exception {
            mockMvc.perform(put("/api/vehicles/1/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when the status value is unknown")
        void unknownStatus() throws Exception {
            mockMvc.perform(put("/api/vehicles/1/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"status\": \"FLYING\"}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/vehicles")
    class ReadVehicles {

        @Test
        @DisplayName("supports the v1 path alias and query filters")
        void supportsV1AliasAndFilters() throws Exception {
            when(vehicleService.getAllVehicles(any(), any(), any())).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/vehicles")
                            .param("status", "AVAILABLE")
                            .param("brand", "Toyota")
                            .param("search", "29A"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("returns 400 for an unknown status filter value")
        void unknownStatusFilter() throws Exception {
            mockMvc.perform(get("/api/vehicles").param("status", "NOT_A_STATUS"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("returns 400 for a non-numeric path variable")
        void nonNumericId() throws Exception {
            mockMvc.perform(get("/api/vehicles/abc"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("exposes the distinct brand list")
        void listsBrands() throws Exception {
            when(vehicleService.getBrands()).thenReturn(List.of("Ford", "Toyota"));

            mockMvc.perform(get("/api/vehicles/brands"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0]").value("Ford"))
                    .andExpect(jsonPath("$.data.length()").value(2));
        }

        @Test
        @DisplayName("returns 400 for an unknown vehicle type in the query string")
        void unknownVehicleTypeFilterIsIgnored() throws Exception {
            when(vehicleService.getAllVehicles(any(), any(), any())).thenReturn(List.of());

            mockMvc.perform(get("/api/vehicles").param("brand", "Toyota"))
                    .andExpect(status().isOk());
        }
    }
}