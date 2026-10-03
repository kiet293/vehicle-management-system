package com.vms.vehicle.config;

import com.vms.vehicle.entity.Vehicle;
import com.vms.vehicle.entity.VehicleStatus;
import com.vms.vehicle.entity.VehicleType;
import com.vms.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final VehicleRepository vehicleRepository;

    @Override
    public void run(String... args) {
        if (vehicleRepository.count() == 0) {
            log.info("Initializing default vehicles in vehicle_db...");

            Vehicle v1 = Vehicle.builder()
                    .licensePlate("29A-888.88")
                    .brand("Toyota")
                    .model("Camry 2.5Q")
                    .vehicleType(VehicleType.SEDAN)
                    .seatCapacity(5)
                    .manufactureYear(2023)
                    .currentOdometer(15000)
                    .lastMaintenanceOdometer(15000)
                    .status(VehicleStatus.AVAILABLE)
                    .imageUrl("https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop&q=60")
                    .build();

            Vehicle v2 = Vehicle.builder()
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
                    .assignedDriverName("Nguyễn Văn An")
                    .imageUrl("https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=60")
                    .build();

            Vehicle v3 = Vehicle.builder()
                    .licensePlate("51K-999.99")
                    .brand("Hyundai")
                    .model("SantaFe Calligraphy")
                    .vehicleType(VehicleType.SUV)
                    .seatCapacity(7)
                    .manufactureYear(2023)
                    .currentOdometer(24800)
                    .lastMaintenanceOdometer(20000)
                    .status(VehicleStatus.AVAILABLE)
                    .imageUrl("https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60")
                    .build();

            Vehicle v4 = Vehicle.builder()
                    .licensePlate("29B-456.78")
                    .brand("Ford")
                    .model("Transit Luxury")
                    .vehicleType(VehicleType.VAN)
                    .seatCapacity(16)
                    .manufactureYear(2021)
                    .currentOdometer(62000)
                    .lastMaintenanceOdometer(55000)
                    .status(VehicleStatus.MAINTENANCE)
                    .imageUrl("https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=60")
                    .build();

            Vehicle v5 = Vehicle.builder()
                    .licensePlate("30E-777.77")
                    .brand("VinFast")
                    .model("VF8 Plus")
                    .vehicleType(VehicleType.SUV)
                    .seatCapacity(5)
                    .manufactureYear(2024)
                    .currentOdometer(8200)
                    .lastMaintenanceOdometer(5000)
                    .status(VehicleStatus.AVAILABLE)
                    .imageUrl("https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=60")
                    .build();

            vehicleRepository.saveAll(List.of(v1, v2, v3, v4, v5));
            log.info("Successfully seeded 5 initial vehicles.");
        }
    }
}
