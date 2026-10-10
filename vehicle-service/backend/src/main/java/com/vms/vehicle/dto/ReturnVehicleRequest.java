package com.vms.vehicle.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnVehicleRequest {

    @NotNull(message = "Vui lòng nhập chỉ số công-tơ-mét hiện tại")
    @Min(value = 0, message = "Chỉ số công-tơ-mét không được nhỏ hơn 0")
    private Integer newOdometer;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    private String notes;
}