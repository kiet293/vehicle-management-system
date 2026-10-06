package com.vms.vehicle.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
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
public class AssignDriverRequest {

    @NotNull(message = "Vui lòng chọn tài xế bàn giao hợp lệ")
    private Long driverId;

    @NotBlank(message = "Vui lòng chọn tài xế bàn giao hợp lệ")
    @Size(max = 100, message = "Tên tài xế không được vượt quá 100 ký tự")
    private String driverName;

    @Email(message = "Định dạng email tài xế không hợp lệ")
    @Size(max = 100, message = "Email không được vượt quá 100 ký tự")
    private String driverEmail;
}