package com.vms.cost.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailClient {

    private final RestTemplate restTemplate;

    @Value("${services.email-service-url:http://localhost:8084}")
    private String emailServiceUrl;

    public void sendHighCostAlert(String licensePlate, String costType, BigDecimal amount, String driverName, String description) {
        try {
            String url = emailServiceUrl + "/api/email/alerts/high-cost";
            Map<String, Object> body = new HashMap<>();
            body.put("licensePlate", licensePlate);
            body.put("costType", costType);
            body.put("amount", amount);
            body.put("driverName", driverName != null ? driverName : "N/A");
            body.put("description", description != null ? description : "");
            restTemplate.postForObject(url, body, Map.class);
            log.info("Triggered high-cost alert for vehicle: {} (amount: {} VND)", licensePlate, amount);
        } catch (Exception ex) {
            log.warn("Could not send high-cost alert email (Fault Isolation active): {}", ex.getMessage());
        }
    }
}
