package com.vms.email.service;

import com.vms.email.dto.NotificationEventRequest;
import com.vms.email.entity.Notification;
import com.vms.email.entity.NotificationType;
import com.vms.email.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * Tạo thông báo dựa trên sự kiện hệ thống
     */
    public Notification createEventNotification(NotificationEventRequest request) {
        NotificationType type = request.getType() != null ? request.getType() : NotificationType.SYSTEM;
        String title = request.getTitle();
        String message = request.getMessage();
        String actor = request.getActorName() != null ? request.getActorName().trim() : "Quản trị viên";
        String plate = request.getVehiclePlate() != null ? request.getVehiclePlate().trim() : "Chưa xác định";

        switch (type) {
            case VEHICLE_ASSIGNED -> {
                if (title == null || title.isBlank()) {
                    title = "🚗 Phân công phương tiện mới: " + plate;
                }
                if (message == null || message.isBlank()) {
                    message = String.format("Bạn đã được Ban Quản lý (%s) bàn giao phụ trách phương tiện %s. Vui lòng kiểm tra xe trước khi khởi hành.",
                            actor, plate);
                }
                request.setTargetRole("DRIVER");
            }
            case VEHICLE_REVOKED -> {
                if (title == null || title.isBlank()) {
                    title = "⚠️ Thu hồi phương tiện: " + plate;
                }
                if (message == null || message.isBlank()) {
                    message = String.format("Phương tiện %s đã được Quản trị viên (%s) thu hồi lại. Lượt phân công nhiệm vụ đã kết thúc.",
                            plate, actor);
                }
                request.setTargetRole("DRIVER");
            }
            case VEHICLE_RETURNED -> {
                if (title == null || title.isBlank()) {
                    title = "✅ Tài xế đã trả xe: " + plate;
                }
                if (message == null || message.isBlank()) {
                    String odoStr = request.getNewOdometer() != null ? String.format("%,d km", request.getNewOdometer()) : "Chưa cập nhật";
                    String noteStr = (request.getNotes() != null && !request.getNotes().isBlank()) ? " (Ghi chú: " + request.getNotes() + ")" : "";
                    message = String.format("Tài xế %s đã bàn giao lại xe %s sau chuyến đi. Chỉ số công-tơ-mét: %s.%s",
                            actor, plate, odoStr, noteStr);
                }
                request.setTargetRole("ADMIN"); // Gửi cho Ban Quản trị & Quản lý
            }
            case MAINTENANCE_ALERT -> {
                if (title == null || title.isBlank()) {
                    title = "🔧 Cảnh báo bảo dưỡng xe: " + plate;
                }
                request.setTargetRole("ADMIN");
            }
            case HIGH_COST_ALERT -> {
                if (title == null || title.isBlank()) {
                    title = "💸 Phát sinh phiếu chi lớn: " + plate;
                }
                request.setTargetRole("ADMIN");
            }
            default -> {
                if (title == null || title.isBlank()) {
                    title = "📢 Thông báo từ Hệ thống VMS";
                }
            }
        }

        Notification notification = Notification.builder()
                .id(UUID.randomUUID().toString())
                .title(title)
                .message(message)
                .type(type)
                .targetUserId(request.getTargetUserId())
                .targetUserEmail(request.getTargetUserEmail())
                .targetRole(request.getTargetRole() != null ? request.getTargetRole() : "ALL")
                .vehiclePlate(request.getVehiclePlate())
                .vehicleId(request.getVehicleId())
                .actorName(actor)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Created in-app notification [{}] type={} for user/role={}/{}",
                saved.getId(), saved.getType(), saved.getTargetUserId(), saved.getTargetRole());
        return saved;
    }

    public List<Notification> getUserNotifications(Long userId, String email, String role) {
        return notificationRepository.findByUser(userId, email, role);
    }

    public boolean markAsRead(String id) {
        return notificationRepository.markAsRead(id);
    }

    public int markAllAsRead(Long userId, String email, String role) {
        return notificationRepository.markAllAsRead(userId, email, role);
    }

    public boolean deleteNotification(String id) {
        return notificationRepository.deleteById(id);
    }

    public int deleteAll(Long userId, String email, String role) {
        return notificationRepository.deleteAll(userId, email, role);
    }
}

