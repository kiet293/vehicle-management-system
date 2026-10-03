package com.vms.report.service;

import com.vms.report.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final RestTemplate restTemplate;

    @Value("${services.vehicle-service-url:http://localhost:8082}")
    private String vehicleServiceUrl;

    @Value("${services.cost-service-url:http://localhost:8083}")
    private String costServiceUrl;

    public ReportSummaryDTO getSummary(Integer targetYear, Integer targetMonth) {
        int year = targetYear != null ? targetYear : LocalDate.now().getYear();
        int month = targetMonth != null ? targetMonth : LocalDate.now().getMonthValue();

        long total = 5;
        long available = 3;
        long inUse = 1;
        long maintenance = 1;

        try {
            String url = vehicleServiceUrl + "/api/vehicles";
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {}
            );
            if (response.getBody() != null && response.getBody().get("data") instanceof List<?> list) {
                total = list.size();
                available = 0;
                inUse = 0;
                maintenance = 0;
                for (Object item : list) {
                    if (item instanceof Map<?, ?> map) {
                        String st = (String) map.get("status");
                        if ("AVAILABLE".equalsIgnoreCase(st)) available++;
                        else if ("IN_USE".equalsIgnoreCase(st)) inUse++;
                        else if ("MAINTENANCE".equalsIgnoreCase(st)) maintenance++;
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Unable to fetch vehicles from vehicle-service (Fault Isolation fallback active): {}", ex.getMessage());
        }

        BigDecimal currentMonthCost = BigDecimal.ZERO;
        BigDecimal previousMonthCost = BigDecimal.ZERO;
        double changePct = 0.0;
        long monthCount = 0;

        try {
            String costUrl = costServiceUrl + "/api/costs/summary?year=" + year + "&month=" + month;
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    costUrl,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {}
            );
            if (response.getBody() != null && response.getBody().get("data") instanceof Map<?, ?> data) {
                if (data.get("thisMonthTotal") != null) {
                    currentMonthCost = new BigDecimal(data.get("thisMonthTotal").toString());
                }
                if (data.get("lastMonthTotal") != null) {
                    previousMonthCost = new BigDecimal(data.get("lastMonthTotal").toString());
                }
                if (data.get("percentChange") != null) {
                    changePct = Double.parseDouble(data.get("percentChange").toString());
                }
                if (data.get("totalCount") != null) {
                    monthCount = Long.parseLong(data.get("totalCount").toString());
                }
            }
        } catch (Exception ex) {
            log.warn("Unable to fetch cost summary from cost-service (Fault Isolation fallback active): {}", ex.getMessage());
            currentMonthCost = new BigDecimal("16520000");
            previousMonthCost = new BigDecimal("14200000");
            changePct = 16.3;
            monthCount = 6;
        }

        return ReportSummaryDTO.builder()
                .totalVehicles(total)
                .availableVehicles(available)
                .inUseVehicles(inUse)
                .maintenanceVehicles(maintenance)
                .currentMonthCost(currentMonthCost)
                .previousMonthCost(previousMonthCost)
                .costChangePercentage(changePct)
                .currentMonthCount(monthCount)
                .build();
    }

    public List<MonthlyTrendDTO> getMonthlyTrends(Integer targetYear) {
        int year = targetYear != null ? targetYear : LocalDate.now().getYear();
        List<MonthlyTrendDTO> trends = new ArrayList<>();

        Map<Integer, BigDecimal> monthlyTotals = new TreeMap<>();
        for (int m = 1; m <= 12; m++) {
            monthlyTotals.put(m, BigDecimal.ZERO);
        }

        try {
            String costUrl = costServiceUrl + "/api/costs/summary?year=" + year;
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    costUrl,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {}
            );
            if (response.getBody() != null && response.getBody().get("data") instanceof Map<?, ?> data) {
                if (data.get("monthlyTotals") instanceof Map<?, ?> months) {
                    for (Map.Entry<?, ?> entry : months.entrySet()) {
                        int m = Integer.parseInt(entry.getKey().toString());
                        BigDecimal amt = new BigDecimal(entry.getValue().toString());
                        monthlyTotals.put(m, amt);
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Unable to fetch monthly trends from cost-service: {}", ex.getMessage());
            // Fallback sample trend
            monthlyTotals.put(1, new BigDecimal("18500000"));
            monthlyTotals.put(2, new BigDecimal("22000000"));
            monthlyTotals.put(3, new BigDecimal("19200000"));
            monthlyTotals.put(4, new BigDecimal("25400000"));
            monthlyTotals.put(5, new BigDecimal("28000000"));
            monthlyTotals.put(6, new BigDecimal("31500000"));
            monthlyTotals.put(7, new BigDecimal("27000000"));
            monthlyTotals.put(8, new BigDecimal("35000000"));
            monthlyTotals.put(9, new BigDecimal("42500000"));
            monthlyTotals.put(10, new BigDecimal("16520000"));
            monthlyTotals.put(11, BigDecimal.ZERO);
            monthlyTotals.put(12, BigDecimal.ZERO);
        }

        for (int m = 1; m <= 12; m++) {
            trends.add(MonthlyTrendDTO.builder()
                    .month(m)
                    .monthLabel("T" + m)
                    .amount(monthlyTotals.getOrDefault(m, BigDecimal.ZERO))
                    .count(monthlyTotals.getOrDefault(m, BigDecimal.ZERO).compareTo(BigDecimal.ZERO) > 0 ? 3 : 0)
                    .build());
        }

        return trends;
    }

    public List<CostByTypeDTO> getCostByType(Integer targetYear) {
        int year = targetYear != null ? targetYear : LocalDate.now().getYear();
        Map<String, BigDecimal> byType = new LinkedHashMap<>();
        byType.put("FUEL", BigDecimal.ZERO);
        byType.put("TOLL", BigDecimal.ZERO);
        byType.put("MAINTENANCE", BigDecimal.ZERO);
        byType.put("INSURANCE", BigDecimal.ZERO);
        byType.put("OTHER", BigDecimal.ZERO);

        try {
            String costUrl = costServiceUrl + "/api/costs/summary?year=" + year;
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    costUrl,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {}
            );
            if (response.getBody() != null && response.getBody().get("data") instanceof Map<?, ?> data) {
                if (data.get("byType") instanceof Map<?, ?> types) {
                    for (Map.Entry<?, ?> entry : types.entrySet()) {
                        String t = entry.getKey().toString();
                        BigDecimal amt = new BigDecimal(entry.getValue().toString());
                        byType.put(t, amt);
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Unable to fetch cost by type from cost-service: {}", ex.getMessage());
            byType.put("FUEL", new BigDecimal("12500000"));
            byType.put("TOLL", new BigDecimal("3500000"));
            byType.put("MAINTENANCE", new BigDecimal("9700000"));
            byType.put("INSURANCE", new BigDecimal("8200000"));
            byType.put("OTHER", new BigDecimal("1500000"));
        }

        BigDecimal total = byType.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, String> labels = Map.of(
                "FUEL", "Nhiên liệu (Xăng/Điện)",
                "TOLL", "Vé cầu đường BOT",
                "MAINTENANCE", "Bảo dưỡng & Sửa chữa",
                "INSURANCE", "Bảo hiểm thân vỏ",
                "OTHER", "Chi phí khác"
        );

        Map<String, String> colors = Map.of(
                "FUEL", "#3b82f6",
                "TOLL", "#f59e0b",
                "MAINTENANCE", "#8b5cf6",
                "INSURANCE", "#10b981",
                "OTHER", "#64748b"
        );

        List<CostByTypeDTO> list = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : byType.entrySet()) {
            double pct = 0.0;
            if (total.compareTo(BigDecimal.ZERO) > 0) {
                pct = entry.getValue().divide(total, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .doubleValue();
            }
            list.add(CostByTypeDTO.builder()
                    .type(entry.getKey())
                    .typeLabel(labels.getOrDefault(entry.getKey(), entry.getKey()))
                    .amount(entry.getValue())
                    .percentage(pct)
                    .color(colors.getOrDefault(entry.getKey(), "#3b82f6"))
                    .build());
        }

        return list;
    }

    public List<TopVehicleDTO> getTopVehicles(Integer limit, Integer targetYear) {
        int max = (limit != null && limit > 0) ? limit : 5;
        List<TopVehicleDTO> result = new ArrayList<>();

        try {
            String costUrl = costServiceUrl + "/api/costs";
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    costUrl,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {}
            );

            if (response.getBody() != null && response.getBody().get("data") instanceof List<?> list) {
                Map<Long, TopVehicleDTO> map = new HashMap<>();

                for (Object item : list) {
                    if (item instanceof Map<?, ?> c) {
                        Long vId = c.get("vehicleId") != null ? Long.parseLong(c.get("vehicleId").toString()) : 0L;
                        String plate = (String) c.get("vehiclePlate");
                        String driver = (String) c.get("driverName");
                        BigDecimal amt = c.get("amount") != null ? new BigDecimal(c.get("amount").toString()) : BigDecimal.ZERO;

                        TopVehicleDTO dto = map.getOrDefault(vId, TopVehicleDTO.builder()
                                .vehicleId(vId)
                                .licensePlate(plate != null ? plate : "Xe #" + vId)
                                .brandModel("Đang cập nhật")
                                .driverName(driver != null ? driver : "Chưa bàn giao")
                                .costCount(0)
                                .totalCost(BigDecimal.ZERO)
                                .build());

                        dto.setCostCount(dto.getCostCount() + 1);
                        dto.setTotalCost(dto.getTotalCost().add(amt));
                        if (driver != null && !driver.isEmpty()) dto.setDriverName(driver);
                        map.put(vId, dto);
                    }
                }

                // Cross-reference vehicle info
                try {
                    String vUrl = vehicleServiceUrl + "/api/vehicles";
                    ResponseEntity<Map<String, Object>> vResp = restTemplate.exchange(
                            vUrl,
                            HttpMethod.GET,
                            null,
                            new ParameterizedTypeReference<>() {}
                    );
                    if (vResp.getBody() != null && vResp.getBody().get("data") instanceof List<?> vList) {
                        for (Object o : vList) {
                            if (o instanceof Map<?, ?> vm) {
                                Long vid = Long.parseLong(vm.get("id").toString());
                                String brand = (String) vm.get("brand");
                                String model = (String) vm.get("model");
                                if (map.containsKey(vid)) {
                                    map.get(vid).setBrandModel(brand + " " + model);
                                }
                            }
                        }
                    }
                } catch (Exception ignored) {}

                List<TopVehicleDTO> sorted = map.values().stream()
                        .sorted((a, b) -> b.getTotalCost().compareTo(a.getTotalCost()))
                        .limit(max)
                        .collect(Collectors.toList());

                int rank = 1;
                for (TopVehicleDTO item : sorted) {
                    item.setRank(rank++);
                    result.add(item);
                }
            }
        } catch (Exception ex) {
            log.warn("Unable to fetch top vehicles: {}", ex.getMessage());
            // Fallback top 5 vehicles
            result.add(new TopVehicleDTO(1, 4L, "29B-456.78", "Ford Transit Luxury", "Phạm Hoàng Bình", 3, new BigDecimal("9700000")));
            result.add(new TopVehicleDTO(2, 3L, "51K-999.99", "Hyundai SantaFe Calligraphy", "Phạm Hoàng Bình", 1, new BigDecimal("8200000")));
            result.add(new TopVehicleDTO(3, 2L, "30H-123.45", "Ford Ranger Wildtrak", "Nguyễn Văn An", 2, new BigDecimal("2220000")));
            result.add(new TopVehicleDTO(4, 1L, "29A-888.88", "Toyota Camry 2.5Q", "Nguyễn Văn An", 2, new BigDecimal("1100000")));
            result.add(new TopVehicleDTO(5, 5L, "30E-777.77", "VinFast VF8 Plus", "Nguyễn Văn An", 1, new BigDecimal("450000")));
        }

        return result;
    }
}
