package com.vms.cost.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.vms.cost.dto.CostRequestDTO;
import com.vms.cost.dto.CostResponseDTO;
import com.vms.cost.dto.CostSummaryDTO;
import com.vms.cost.entity.CostType;
import com.vms.cost.service.CostService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CostController.class)
class CostControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CostService costService;

    private ObjectMapper objectMapper;
    private CostResponseDTO sampleResponse;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        sampleResponse = CostResponseDTO.builder()
                .id(1L)
                .vehicleId(101L)
                .costType(CostType.FUEL)
                .amount(new BigDecimal("850000.00"))
                .costDate(LocalDate.now().minusDays(1))
                .description("Đổ xăng RON 95")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/costs - Thành công trả về 201 Created")
    void testCreateCost_Success() throws Exception {
        CostRequestDTO request = CostRequestDTO.builder()
                .vehicleId(101L)
                .costType(CostType.FUEL)
                .amount(new BigDecimal("850000.00"))
                .costDate(LocalDate.now().minusDays(1))
                .description("Đổ xăng RON 95")
                .build();

        when(costService.createCost(any(CostRequestDTO.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/v1/costs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(1)))
                .andExpect(jsonPath("$.data.vehicleId", is(101)))
                .andExpect(jsonPath("$.data.costType", is("FUEL")));
    }

    @Test
    @DisplayName("POST /api/v1/costs - Báo lỗi 400 khi số tiền <= 0 hoặc thiếu trường bắt buộc")
    void testCreateCost_InvalidInput_ReturnsBadRequest() throws Exception {
        CostRequestDTO request = CostRequestDTO.builder()
                .vehicleId(null) // missing
                .costType(null)  // missing
                .amount(new BigDecimal("-1000")) // invalid
                .costDate(LocalDate.now().plusDays(5)) // future
                .build();

        mockMvc.perform(post("/api/v1/costs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("GET /api/v1/costs - Thành công trả về danh sách")
    void testGetCosts_Success() throws Exception {
        when(costService.getCosts(eq(101L), eq(CostType.FUEL), any(), any(), any()))
                .thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/v1/costs")
                        .param("vehicleId", "101")
                        .param("costType", "FUEL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data[0].id", is(1)))
                .andExpect(jsonPath("$.data[0].amount", is(850000.0)));
    }

    @Test
    @DisplayName("GET /api/v1/costs/vehicle/{vehicleId} - Lấy chi phí theo xe")
    void testGetCostsByVehicleId_Success() throws Exception {
        when(costService.getCostsByVehicleId(101L)).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/v1/costs/vehicle/101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data[0].vehicleId", is(101)));
    }

    @Test
    @DisplayName("GET /api/v1/costs/{id} - Lấy chi tiết phiếu chi")
    void testGetCostById_Success() throws Exception {
        when(costService.getCostById(1L)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/v1/costs/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(1)));
    }

    @Test
    @DisplayName("DELETE /api/v1/costs/{id} - Xóa phiếu chi thành công")
    void testDeleteCost_Success() throws Exception {
        doNothing().when(costService).deleteCost(1L);

        mockMvc.perform(delete("/api/v1/costs/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("GET /api/v1/costs/summary - Lấy tổng hợp chi phí")
    void testGetCostSummary_Success() throws Exception {
        CostSummaryDTO summary = CostSummaryDTO.builder()
                .totalAmount(new BigDecimal("1200000.00"))
                .totalCount(3L)
                .amountByType(Map.of(CostType.FUEL, new BigDecimal("850000.00"), CostType.TOLL, new BigDecimal("350000.00")))
                .countByType(Map.of(CostType.FUEL, 2L, CostType.TOLL, 1L))
                .build();

        when(costService.getCostSummary(any(), any(), any())).thenReturn(summary);

        mockMvc.perform(get("/api/v1/costs/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalAmount", is(1200000.00)))
                .andExpect(jsonPath("$.data.totalCount", is(3)));
    }
}
