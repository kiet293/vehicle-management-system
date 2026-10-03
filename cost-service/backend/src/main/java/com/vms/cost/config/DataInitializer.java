package com.vms.cost.config;

import com.vms.cost.entity.Cost;
import com.vms.cost.entity.CostType;
import com.vms.cost.repository.CostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CostRepository costRepository;

    @Override
    public void run(String... args) {
        if (costRepository.count() == 0) {
            log.info("Initializing default costs in cost_db...");

            LocalDate now = LocalDate.now();
            int currentYear = now.getYear();

            Cost c1 = Cost.builder()
                    .vehicleId(1L)
                    .vehiclePlate("29A-888.88")
                    .driverId(3L)
                    .driverName("Nguyễn Văn An")
                    .costType(CostType.FUEL)
                    .amount(new BigDecimal("850000"))
                    .odometerAtCost(14500)
                    .costDate(now.minusDays(2))
                    .description("Đổ đầy bình xăng RON 95 Petrolimex số 3")
                    .receiptImageUrl("https://images.unsplash.com/photo-1554415707-9e4466bfe0dc?w=800&auto=format&fit=crop&q=60")
                    .build();

            Cost c2 = Cost.builder()
                    .vehicleId(2L)
                    .vehiclePlate("30H-123.45")
                    .driverId(3L)
                    .driverName("Nguyễn Văn An")
                    .costType(CostType.TOLL)
                    .amount(new BigDecimal("120000"))
                    .odometerAtCost(38200)
                    .costDate(now.minusDays(5))
                    .description("Vé trạm thu phí BOT Pháp Vân - Cầu Giẽ")
                    .build();

            Cost c3 = Cost.builder()
                    .vehicleId(4L)
                    .vehiclePlate("29B-456.78")
                    .driverId(4L)
                    .driverName("Phạm Hoàng Bình")
                    .costType(CostType.MAINTENANCE)
                    .amount(new BigDecimal("6500000"))
                    .odometerAtCost(60000)
                    .costDate(now.minusDays(10))
                    .description("Bảo dưỡng mốc 60.000 km: Thay 4 lốp xe Bridgestone và dầu nhớt máy")
                    .receiptImageUrl("https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=60")
                    .build();

            Cost c4 = Cost.builder()
                    .vehicleId(3L)
                    .vehiclePlate("51K-999.99")
                    .driverId(4L)
                    .driverName("Phạm Hoàng Bình")
                    .costType(CostType.INSURANCE)
                    .amount(new BigDecimal("8200000"))
                    .odometerAtCost(24000)
                    .costDate(now.minusDays(20))
                    .description("Tái tục Bảo hiểm vật chất thân vỏ xe Bảo Việt 1 năm")
                    .build();

            Cost c5 = Cost.builder()
                    .vehicleId(5L)
                    .vehiclePlate("30E-777.77")
                    .driverId(3L)
                    .driverName("Nguyễn Văn An")
                    .costType(CostType.FUEL)
                    .amount(new BigDecimal("450000"))
                    .odometerAtCost(8000)
                    .costDate(now.minusDays(12))
                    .description("Sạc pin xe điện tại trạm VinFast Landmark 81")
                    .build();

            Cost c6 = Cost.builder()
                    .vehicleId(1L)
                    .vehiclePlate("29A-888.88")
                    .driverId(3L)
                    .driverName("Nguyễn Văn An")
                    .costType(CostType.OTHER)
                    .amount(new BigDecimal("250000"))
                    .odometerAtCost(14000)
                    .costDate(now.minusDays(25))
                    .description("Rửa xe và dọn vệ sinh nội thất chi tiết")
                    .build();

            // Previous months data for realistic trend chart in 2026
            Cost c7 = Cost.builder()
                    .vehicleId(2L)
                    .vehiclePlate("30H-123.45")
                    .driverId(3L)
                    .driverName("Nguyễn Văn An")
                    .costType(CostType.FUEL)
                    .amount(new BigDecimal("2100000"))
                    .odometerAtCost(35000)
                    .costDate(LocalDate.of(currentYear, Math.max(1, now.getMonthValue() - 1), 15))
                    .description("Nhiên liệu vận hành tháng trước")
                    .build();

            Cost c8 = Cost.builder()
                    .vehicleId(4L)
                    .vehiclePlate("29B-456.78")
                    .driverId(4L)
                    .driverName("Phạm Hoàng Bình")
                    .costType(CostType.MAINTENANCE)
                    .amount(new BigDecimal("3200000"))
                    .odometerAtCost(58000)
                    .costDate(LocalDate.of(currentYear, Math.max(1, now.getMonthValue() - 2), 20))
                    .description("Thay má phanh trước và lọc gió điều hòa")
                    .build();

            costRepository.saveAll(List.of(c1, c2, c3, c4, c5, c6, c7, c8));
            log.info("Successfully seeded 8 initial cost records.");
        }
    }
}
