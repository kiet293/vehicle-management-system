package com.vms.cost.service;

import com.vms.cost.dto.CostRequestDTO;
import com.vms.cost.dto.CostResponseDTO;
import com.vms.cost.dto.CostSummaryDTO;
import com.vms.cost.entity.Cost;
import com.vms.cost.entity.CostType;
import com.vms.cost.exception.ResourceNotFoundException;
import com.vms.cost.repository.CostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CostServiceTest {

    @Mock
    private CostRepository costRepository;

    @InjectMocks
    private CostServiceImpl costService;

    private Cost sampleCost;
    private CostRequestDTO sampleRequest;

    @BeforeEach
    void setUp() {
        sampleCost = Cost.builder()
                .id(1L)
                .vehicleId(101L)
                .costType(CostType.FUEL)
                .amount(new BigDecimal("850000.00"))
                .costDate(LocalDate.now().minusDays(1))
                .description("Đổ xăng Petrolimex 95")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        sampleRequest = CostRequestDTO.builder()
                .vehicleId(101L)
                .costType(CostType.FUEL)
                .amount(new BigDecimal("850000.00"))
                .costDate(LocalDate.now().minusDays(1))
                .description("Đổ xăng Petrolimex 95")
                .build();
    }

    @Test
    @DisplayName("Tạo mới phiếu chi phí thành công")
    void testCreateCost_Success() {
        when(costRepository.save(any(Cost.class))).thenReturn(sampleCost);

        CostResponseDTO result = costService.createCost(sampleRequest);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getVehicleId()).isEqualTo(101L);
        assertThat(result.getCostType()).isEqualTo(CostType.FUEL);
        assertThat(result.getAmount()).isEqualByComparingTo(new BigDecimal("850000.00"));
        verify(costRepository, times(1)).save(any(Cost.class));
    }

    @Test
    @DisplayName("Ném lỗi khi ngày phát sinh vượt quá ngày hiện tại")
    void testCreateCost_FutureDate_ThrowsException() {
        sampleRequest.setCostDate(LocalDate.now().plusDays(2));

        assertThatThrownBy(() -> costService.createCost(sampleRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("không được vượt quá ngày hiện tại");

        verify(costRepository, never()).save(any());
    }

    @Test
    @DisplayName("Lấy chi tiết phiếu chi theo ID thành công")
    void testGetCostById_Success() {
        when(costRepository.findById(1L)).thenReturn(Optional.of(sampleCost));

        CostResponseDTO result = costService.getCostById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Ném lỗi ResourceNotFoundException khi ID không tồn tại")
    void testGetCostById_NotFound() {
        when(costRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> costService.getCostById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy");
    }

    @Test
    @DisplayName("Lấy danh sách phiếu chi theo vehicleId")
    void testGetCostsByVehicleId() {
        when(costRepository.findByVehicleIdOrderByCostDateDescCreatedAtDesc(101L))
                .thenReturn(List.of(sampleCost));

        List<CostResponseDTO> results = costService.getCostsByVehicleId(101L);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getVehicleId()).isEqualTo(101L);
    }

    @Test
    @DisplayName("Cập nhật phiếu chi thành công")
    void testUpdateCost_Success() {
        when(costRepository.findById(1L)).thenReturn(Optional.of(sampleCost));
        when(costRepository.save(any(Cost.class))).thenReturn(sampleCost);

        sampleRequest.setAmount(new BigDecimal("900000.00"));
        CostResponseDTO updated = costService.updateCost(1L, sampleRequest);

        assertThat(updated).isNotNull();
        verify(costRepository).save(sampleCost);
    }

    @Test
    @DisplayName("Xóa phiếu chi thành công")
    void testDeleteCost_Success() {
        when(costRepository.findById(1L)).thenReturn(Optional.of(sampleCost));
        doNothing().when(costRepository).delete(sampleCost);

        costService.deleteCost(1L);

        verify(costRepository, times(1)).delete(sampleCost);
    }

    @Test
    @DisplayName("Tổng hợp số liệu chi phí (Cost Summary)")
    void testGetCostSummary() {
        when(costRepository.findAll(any(Specification.class), any(Sort.class)))
                .thenReturn(List.of(sampleCost));

        CostSummaryDTO summary = costService.getCostSummary(101L, null, null);

        assertThat(summary).isNotNull();
        assertThat(summary.getTotalCount()).isEqualTo(1L);
        assertThat(summary.getTotalAmount()).isEqualByComparingTo(new BigDecimal("850000.00"));
        assertThat(summary.getAmountByType().get(CostType.FUEL)).isEqualByComparingTo(new BigDecimal("850000.00"));
    }
}
