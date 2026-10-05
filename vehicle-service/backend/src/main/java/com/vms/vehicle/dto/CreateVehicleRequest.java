package com.vms.vehicle.dto;

import com.vms.vehicle.entity.VehicleType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateVehicleRequest {

    @NotBlank(message = "Biển số xe không được để trống")
    @Size(max = 20, message = "Biển số xe không được vượt quá 20 ký tự")
    private String licensePlate;

    @NotBlank(message = "Hãng xe không được để trống")
    @Size(max = 50, message = "Tên hãng xe không được vượt quá 50 ký tự")
    private String brand;

    @NotBlank(message = "Dòng xe không được để trống")
    @Size(max = 50, message = "Tên dòng xe không được vượt quá 50 ký tự")
    private String model;

    @NotNull(message = "Loại xe không được để trống")
    private VehicleType vehicleType;

    @NotNull(message = "Số chỗ ngồi không được để trống")
    @Positive(message = "Số chỗ ngồi phải là số nguyên dương lớn hơn 0")
    private Integer seatCapacity;

    @NotNull(message = "Năm sản xuất không được để trống")
    @Min(value = 1990, message = "Năm sản xuất phải từ năm 1990 trở lên")
    @Max(value = 2100, message = "Năm sản xuất không hợp lệ")
    private Integer manufactureYear;

    @Min(value = 0, message = "Số km ban đầu không được nhỏ hơn 0")
    private Integer initialOdometer;

    @Size(max = 500, message = "Đường dẫn ảnh không được vượt quá 500 ký tự")
    private String imageUrl;
}