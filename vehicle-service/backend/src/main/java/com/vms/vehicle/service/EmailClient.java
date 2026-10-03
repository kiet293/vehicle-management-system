package com.vms.vehicle.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailClient {

    private final RestTemplate restTemplate;

    @Value("${services.email-service-url:http://localhost:8084}")
    private String emailServiceUrl;

    public void sendMaintenanceAlert(String licensePlate, int currentOdometer, int lastMaintenanceOdometer) {
        try {
            String url = emailServiceUrl + "/api/email/alerts/maintenance";
            Map<String, Object> body = new HashMap<>();
            body.put("licensePlate", licensePlate);
            body.put("currentOdometer", currentOdometer);
            body.put("lastMaintenanceOdometer", lastMaintenanceOdometer);
            restTemplate.postForObject(url, body, Map.class);
            log.info("Triggered maintenance alert for vehicle: {}", licensePlate);
        } catch (Exception ex) {
            log.warn("Could not send maintenance alert email (Fault Isolation active): {}", ex.getMessage());
        }
    }

    public void sendAssignmentNotification(String licensePlate, String driverName, String driverEmail) {
        try {
            String url = emailServiceUrl + "/api/email/alerts/assignment";
            Map<String, Object> body = new HashMap<>();
            body.put("licensePlate", licensePlate);
            body.put("driverName", driverName);
            body.put("driverEmail", driverEmail);
            restTemplate.postForObject(url, body, Map.class);
            log.info("Triggered assignment notification for vehicle: {} to {}", licensePlate, driverName);
        } catch (Exception ex) {
            log.warn("Could not send assignment notification email (Fault Isolation active): {}", ex.getMessage());
        }
    }
}
