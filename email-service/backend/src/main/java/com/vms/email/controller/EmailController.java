package com.vms.email.controller;

import com.vms.email.common.ApiResponse;
import com.vms.email.dto.AssignmentAlertRequest;
import com.vms.email.dto.HighCostAlertRequest;
import com.vms.email.dto.MaintenanceAlertRequest;
import com.vms.email.dto.SendEmailRequest;
import com.vms.email.entity.EmailLog;
import com.vms.email.entity.EmailStatus;
import com.vms.email.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping({"/api/email", "/api/emails", "/api/v1/emails"})
public class EmailController {

    private final EmailService emailService;

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<EmailLog>> sendEmail(@RequestBody SendEmailRequest request) {
        EmailLog log = emailService.sendEmail(
                request.getTo(),
                request.getSubject(),
                request.getContent(),
                request.getType()
        );
        if (log.getStatus() == EmailStatus.FAILED) {
            return ResponseEntity.ok(ApiResponse.error(log.getErrorMessage() != null ? log.getErrorMessage() : "Gửi email thất bại", log));
        }
        String successMsg = (log.getStatus() == EmailStatus.SENT)
                ? "Đã gửi email thành công qua máy chủ SMTP!"
                : "Đã ghi nhận gửi email thành công (Chế độ mô phỏng / Mock Sent)!";
        return ResponseEntity.ok(ApiResponse.success(successMsg, log));
    }

    @PostMapping("/alerts/maintenance")
    public ResponseEntity<ApiResponse<EmailLog>> sendMaintenanceAlert(@RequestBody MaintenanceAlertRequest request) {
        EmailLog log = emailService.sendMaintenanceAlert(request);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi email cảnh báo bảo dưỡng xe " + request.getLicensePlate(), log));
    }

    @PostMapping("/alerts/high-cost")
    public ResponseEntity<ApiResponse<EmailLog>> sendHighCostAlert(@RequestBody HighCostAlertRequest request) {
        EmailLog log = emailService.sendHighCostAlert(request);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi email cảnh báo chi phí đột biến xe " + request.getLicensePlate(), log));
    }

    @PostMapping("/alerts/assignment")
    public ResponseEntity<ApiResponse<EmailLog>> sendAssignmentAlert(@RequestBody AssignmentAlertRequest request) {
        EmailLog log = emailService.sendAssignmentNotification(request);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi email thông báo bàn giao xe " + request.getLicensePlate(), log));
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<List<EmailLog>>> getLogs(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(required = false) Integer limit) {
        List<EmailLog> logs = (limit != null && limit > 0)
                ? emailService.getRecentLogs(limit)
                : emailService.getLogs(days);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}
