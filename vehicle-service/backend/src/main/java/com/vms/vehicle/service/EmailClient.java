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
        // 1. Luôn gửi thông báo In-App trước
        try {
            sendInAppNotification(Map.of(
                    "type", "MAINTENANCE_ALERT",
                    "vehiclePlate", licensePlate,
                    "targetRole", "ADMIN",
                    "title", "🔧 Cảnh báo bảo dưỡng xe: " + licensePlate,
                    "message", String.format("Xe %s đã đạt %d km (vượt mốc 5.000 km) và đã tự động chuyển sang trạng thái Bảo dưỡng.",
                            licensePlate, currentOdometer)
            ));
        } catch (Exception ex) {
            log.warn("Could not post in-app maintenance notification: {}", ex.getMessage());
        }

        // 2. Gửi email cảnh báo qua SMTP
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
        sendAssignmentNotification(licensePlate, null, driverName, driverEmail);
    }

    public void sendAssignmentNotification(String licensePlate, Long driverId, String driverName, String driverEmail) {
        // 1. Luôn gửi thông báo In-App trước để hiển thị ngay trên thanh Navbar
        try {
            Map<String, Object> notif = new HashMap<>();
            notif.put("type", "VEHICLE_ASSIGNED");
            notif.put("vehiclePlate", licensePlate);
            notif.put("targetUserId", driverId);
            notif.put("targetUserEmail", driverEmail);
            notif.put("actorName", "Quản trị viên");
            notif.put("targetRole", "DRIVER");
            sendInAppNotification(notif);
            log.info("Posted in-app assignment notification for vehicle: {} to driver ID: {}", licensePlate, driverId);
        } catch (Exception ex) {
            log.warn("Could not post in-app assignment notification: {}", ex.getMessage());
        }

        // 2. Gửi email qua SMTP (nếu có tài khoản)
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

    public void sendRevocationNotification(String licensePlate, Long driverId, String driverName, String driverEmail, String actorName) {
        try {
            Map<String, Object> notif = new HashMap<>();
            notif.put("type", "VEHICLE_REVOKED");
            notif.put("vehiclePlate", licensePlate);
            notif.put("targetUserId", driverId);
            notif.put("targetUserEmail", driverEmail);
            notif.put("actorName", actorName != null ? actorName : "Quản trị viên");
            notif.put("targetRole", "DRIVER");
            sendInAppNotification(notif);
            log.info("Triggered revocation notification for vehicle: {} from driver: {}", licensePlate, driverName);
        } catch (Exception ex) {
            log.warn("Could not send revocation notification (Fault Isolation active): {}", ex.getMessage());
        }
    }

    public void sendReturnNotification(String licensePlate, Long driverId, String driverName, int newOdometer, String notes) {
        try {
            Map<String, Object> notif = new HashMap<>();
            notif.put("type", "VEHICLE_RETURNED");
            notif.put("vehiclePlate", licensePlate);
            notif.put("actorName", driverName != null ? driverName : "Tài xế");
            notif.put("newOdometer", newOdometer);
            notif.put("notes", notes != null ? notes : "");
            notif.put("targetRole", "ADMIN");
            sendInAppNotification(notif);
            log.info("Triggered vehicle return notification for vehicle: {} by driver: {}", licensePlate, driverName);
        } catch (Exception ex) {
            log.warn("Could not send vehicle return notification (Fault Isolation active): {}", ex.getMessage());
        }
    }

    private void sendInAppNotification(Map<String, Object> payload) {
        try {
            String url = emailServiceUrl + "/api/email/notifications/event";
            restTemplate.postForObject(url, payload, Map.class);
        } catch (Exception ex) {
            log.warn("Could not post in-app notification event: {}", ex.getMessage());
        }
    }
}
