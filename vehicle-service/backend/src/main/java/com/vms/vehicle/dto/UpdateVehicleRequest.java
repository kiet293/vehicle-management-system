package com.vms.vehicle.dto;

import com.vms.vehicle.entity.VehicleType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVehicleRequest {

    @Size(max = 50, message = "Tên hãng xe không được vượt quá 50 ký tự")
    private String brand;

    @Size(max = 50, message = "Tên dòng xe không được vượt quá 50 ký tự")
    private String model;

    private VehicleType vehicleType;

    @Min(value = 1, message = "Số chỗ ngồi phải là số nguyên dương lớn hơn 0")
    private Integer seatCapacity;

    @Min(value = 1990, message = "Năm sản xuất phải từ năm 1990 trở lên")
    @Max(value = 2100, message = "Năm sản xuất không hợp lệ")
    private Integer manufactureYear;

    @Min(value = 0, message = "Số km hiện tại không được nhỏ hơn 0")
    private Integer currentOdometer;

    @Min(value = 0, message = "Số km bảo dưỡng gần nhất không được nhỏ hơn 0")
    private Integer lastMaintenanceOdometer;

    @Size(max = 500, message = "Đường dẫn ảnh không được vượt quá 500 ký tự")
    private String imageUrl;
}