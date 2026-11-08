package com.vms.email.controller;

import com.vms.email.common.ApiResponse;
import com.vms.email.dto.NotificationEventRequest;
import com.vms.email.entity.Notification;
import com.vms.email.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping({"/api/email/notifications", "/api/emails/notifications", "/api/v1/emails/notifications"})
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Lấy danh sách thông báo của người dùng theo ID, Email, Role
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String email,
            @RequestParam(required = false, defaultValue = "DRIVER") String role) {
        List<Notification> list = notificationService.getUserNotifications(userId, email, role);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * Kích hoạt tạo thông báo mới từ sự kiện hệ thống (Giao xe, Thu hồi xe, Trả xe, Bảo dưỡng, v.v.)
     */
    @PostMapping("/event")
    public ResponseEntity<ApiResponse<Notification>> createEventNotification(
            @RequestBody NotificationEventRequest request) {
        Notification created = notificationService.createEventNotification(request);
        return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận thông báo thành công", created));
    }

    /**
     * Đánh dấu 1 thông báo đã đọc
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Boolean>> markAsRead(@PathVariable String id) {
        boolean success = notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thông báo thành công", success));
    }

    /**
     * Đánh dấu tất cả thông báo của người dùng đã đọc
     */
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markAllAsRead(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String email,
            @RequestParam(required = false, defaultValue = "DRIVER") String role) {
        int count = notificationService.markAllAsRead(userId, email, role);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu đã đọc toàn bộ " + count + " thông báo",
                Map.of("updatedCount", count)));
    }

    /**
     * Xóa 1 thông báo
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Boolean>> deleteNotification(@PathVariable String id) {
        boolean deleted = notificationService.deleteNotification(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa thông báo thành công", deleted));
    }

    /**
     * Xóa toàn bộ thông báo của người dùng
     */
    @DeleteMapping("/clear-all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> clearAll(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String email,
            @RequestParam(required = false, defaultValue = "DRIVER") String role) {
        int count = notificationService.deleteAll(userId, email, role);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa toàn bộ " + count + " thông báo",
                Map.of("deletedCount", count)));
    }
}

