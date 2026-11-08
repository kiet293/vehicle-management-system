package com.vms.email.repository;

import com.vms.email.entity.Notification;
import com.vms.email.entity.NotificationType;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Repository
public class NotificationRepository {

    private final List<Notification> notifications = new CopyOnWriteArrayList<>();

    public NotificationRepository() {
        // Khởi tạo một số thông báo mẫu thực tế ban đầu
        initSeedData();
    }

    private void initSeedData() {
        // Thông báo cho Tài xế Nguyễn Văn An (id=3, email="driver.an@vms.com")
        notifications.add(Notification.builder()
                .id(UUID.randomUUID().toString())
                .title("🚗 Phân công phương tiện mới: 29A-888.88")
                .message("Bạn đã được Ban Quản lý phân công điều phối xe Toyota Camry (29A-888.88). Vui lòng kiểm tra xe trước khi khởi hành.")
                .type(NotificationType.VEHICLE_ASSIGNED)
                .targetUserId(3L)
                .targetUserEmail("driver.an@vms.com")
                .targetRole("DRIVER")
                .vehiclePlate("29A-888.88")
                .actorName("Quản trị viên")
                .isRead(false)
                .createdAt(LocalDateTime.now().minusMinutes(25))
                .build());

        // Thông báo cho Admin & Manager: Tài xế đã trả xe
        notifications.add(Notification.builder()
                .id(UUID.randomUUID().toString())
                .title("✅ Tài xế đã hoàn tất chuyến & trả xe: 30H-123.45")
                .message("Tài xế Nguyễn Văn An đã bàn giao lại xe 30H-123.45. Số km hiện tại: 45.200 km. Ghi chú: Xe hoạt động tốt, đã rửa sạch.")
                .type(NotificationType.VEHICLE_RETURNED)
                .targetRole("ADMIN")
                .vehiclePlate("30H-123.45")
                .actorName("Nguyễn Văn An")
                .isRead(false)
                .createdAt(LocalDateTime.now().minusHours(2))
                .build());

        // Thông báo cảnh báo bảo dưỡng cho Admin & Manager
        notifications.add(Notification.builder()
                .id(UUID.randomUUID().toString())
                .title("🔧 Cảnh báo bảo dưỡng xe 29B-456.78")
                .message("Xe Ford Transit 29B-456.78 đã chạm ngưỡng 62.000 km (vượt mốc 5.000 km) và đã chuyển sang trạng thái Bảo dưỡng.")
                .type(NotificationType.MAINTENANCE_ALERT)
                .targetRole("ADMIN")
                .vehiclePlate("29B-456.78")
                .actorName("Hệ thống VMS")
                .isRead(true)
                .createdAt(LocalDateTime.now().minusDays(1))
                .build());
    }

    public Notification save(Notification notification) {
        if (notification.getId() == null) {
            notification.setId(UUID.randomUUID().toString());
        }
        if (notification.getCreatedAt() == null) {
            notification.setCreatedAt(LocalDateTime.now());
        }
        // Thêm thông báo mới nhất lên đầu danh sách
        notifications.add(0, notification);
        if (notifications.size() > 500) {
            notifications.remove(notifications.size() - 1);
        }
        return notification;
    }

    public List<Notification> findAll() {
        return Collections.unmodifiableList(new ArrayList<>(notifications));
    }

    /**
     * Lọc thông báo phù hợp theo người dùng hiện tại
     */
    public List<Notification> findByUser(Long userId, String email, String role) {
        final String userRole = role != null ? role.toUpperCase().trim() : "DRIVER";
        final String userEmail = email != null ? email.toLowerCase().trim() : "";

        return notifications.stream().filter(n -> {
            // Nếu thông báo gửi cho tất cả
            if ("ALL".equalsIgnoreCase(n.getTargetRole())) {
                return true;
            }

            // Nếu người dùng là ADMIN hoặc MANAGER -> xem được thông báo gửi cho ADMIN, MANAGER, hoặc đích danh mình
            if ("ADMIN".equals(userRole) || "MANAGER".equals(userRole)) {
                if ("ADMIN".equalsIgnoreCase(n.getTargetRole()) || "MANAGER".equalsIgnoreCase(n.getTargetRole())) {
                    return true;
                }
            }

            // Nếu thông báo gửi đích danh theo ID
            if (userId != null && n.getTargetUserId() != null && n.getTargetUserId().equals(userId)) {
                return true;
            }

            // Nếu thông báo gửi đích danh theo Email
            if (!userEmail.isEmpty() && n.getTargetUserEmail() != null
                    && n.getTargetUserEmail().toLowerCase().trim().equals(userEmail)) {
                return true;
            }

            // Nếu người dùng là DRIVER và thông báo gửi chung cho DRIVER (mà không chỉ định ID người khác)
            if ("DRIVER".equals(userRole) && "DRIVER".equalsIgnoreCase(n.getTargetRole())) {
                if (n.getTargetUserId() == null && n.getTargetUserEmail() == null) {
                    return true;
                }
            }

            return false;
        }).collect(Collectors.toList());
    }

    public boolean markAsRead(String id) {
        for (Notification n : notifications) {
            if (n.getId().equals(id)) {
                n.setRead(true);
                return true;
            }
        }
        return false;
    }

    public int markAllAsRead(Long userId, String email, String role) {
        List<Notification> userList = findByUser(userId, email, role);
        int count = 0;
        for (Notification n : userList) {
            if (!n.isRead()) {
                n.setRead(true);
                count++;
            }
        }
        return count;
    }
}

