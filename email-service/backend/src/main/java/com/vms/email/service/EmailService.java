package com.vms.email.service;

import com.vms.email.dto.AssignmentAlertRequest;
import com.vms.email.dto.HighCostAlertRequest;
import com.vms.email.dto.MaintenanceAlertRequest;
import com.vms.email.entity.EmailLog;
import com.vms.email.entity.EmailStatus;
import com.vms.email.entity.EmailType;
import com.vms.email.repository.EmailLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final EmailLogRepository emailLogRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@vms.com}")
    private String fromEmail;

    public EmailLog sendEmail(String to, String subject, String content, EmailType type) {
        String logId = UUID.randomUUID().toString();
        EmailStatus status = EmailStatus.SENT;
        String errorMsg = null;

        String recipient = (to != null && !to.trim().isEmpty()) ? to.trim() : "fleet-admin@vms.com";

        // Fault Isolation: Try sending via SMTP, if fails or mock -> fallback smoothly
        if (mailSender != null && !fromEmail.contains("placeholder")) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(recipient);
                message.setSubject(subject);
                message.setText(content);
                mailSender.send(message);
                log.info("Sent email successfully to: {}", recipient);
            } catch (Exception ex) {
                log.warn("SMTP send failed ({}), recorded as MOCK_SENT for demonstration.", ex.getMessage());
                status = EmailStatus.MOCK_SENT;
                errorMsg = "SMTP Server unavailable: " + ex.getMessage();
            }
        } else {
            log.info("Simulating email send (Stateless Mock): To: {}, Subject: {}", recipient, subject);
            status = EmailStatus.MOCK_SENT;
        }

        EmailLog logEntry = EmailLog.builder()
                .id(logId)
                .recipient(recipient)
                .subject(subject)
                .content(content)
                .type(type)
                .status(status)
                .errorMessage(errorMsg)
                .sentAt(LocalDateTime.now())
                .build();

        return emailLogRepository.save(logEntry);
    }

    public EmailLog sendMaintenanceAlert(MaintenanceAlertRequest request) {
        String subject = "[VMS CẢNH BÁO] Xe " + request.getLicensePlate() + " đã đến kỳ bảo dưỡng định kỳ";
        String content = String.format(
                "Kính gửi Ban Quản trị và Tài xế,\n\n" +
                "Hệ thống VMS phát hiện phương tiện %s đã đạt chỉ số công-tơ-mét: %d km.\n" +
                "Quãng đường kể từ lần bảo dưỡng trước đã vượt mốc định mức 5.000 km (mốc trước: %d km).\n\n" +
                "Danh mục các hạng mục khuyến nghị kiểm tra & bảo dưỡng:\n" +
                " - Thay dầu động cơ và cốc lọc dầu\n" +
                " - Kiểm tra hệ thống phanh trước/sau và dầu phanh\n" +
                " - Đảo lốp và kiểm tra áp suất 4 bánh\n" +
                " - Vệ sinh lọc gió động cơ và điều hòa\n\n" +
                "Vui lòng sớm sắp xếp đưa xe vào xưởng gara để đảm bảo an toàn vận hành.\n\n" +
                "Trân trọng,\nHệ thống Quản lý Đội xe VMS",
                request.getLicensePlate(),
                request.getCurrentOdometer() != null ? request.getCurrentOdometer() : 0,
                request.getLastMaintenanceOdometer() != null ? request.getLastMaintenanceOdometer() : 0
        );

        String recipient = request.getRecipientEmail() != null ? request.getRecipientEmail() : "manager@vms.com";
        return sendEmail(recipient, subject, content, EmailType.MAINTENANCE_ALERT);
    }

    public EmailLog sendHighCostAlert(HighCostAlertRequest request) {
        NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN"));
        String formattedAmount = request.getAmount() != null ? currencyFormat.format(request.getAmount()) : "0 ₫";

        String subject = "[VMS CẢNH BÁO] Phát sinh phiếu chi lớn cho xe " + request.getLicensePlate();
        String content = String.format(
                "Kính gửi Quản lý Đội xe,\n\n" +
                "Hệ thống vừa ghi nhận một khoản chi phí vượt ngưỡng định mức cảnh báo (> 5.000.000 ₫):\n\n" +
                " - Biển số xe: %s\n" +
                " - Loại chi phí: %s\n" +
                " - Số tiền: %s\n" +
                " - Người kê khai: %s\n" +
                " - Nội dung: %s\n\n" +
                "Vui lòng truy cập hệ thống để kiểm tra hóa đơn và phê duyệt phiếu chi.\n\n" +
                "Trân trọng,\nPhòng Kế toán VMS",
                request.getLicensePlate(),
                request.getCostType(),
                formattedAmount,
                request.getDriverName(),
                request.getDescription()
        );

        String recipient = request.getRecipientEmail() != null ? request.getRecipientEmail() : "manager@vms.com";
        return sendEmail(recipient, subject, content, EmailType.HIGH_COST_ALERT);
    }

    public EmailLog sendAssignmentNotification(AssignmentAlertRequest request) {
        String subject = "[VMS] Thông báo điều phối phương tiện: " + request.getLicensePlate();
        String content = String.format(
                "Chào %s,\n\n" +
                "Bạn đã được Ban Quản lý bàn giao phụ trách phương tiện có biển số: %s.\n\n" +
                "Vui lòng kiểm tra tình trạng xe, mức nhiên liệu và chỉ số công-tơ-mét trước khi nhận bàn giao.\n" +
                "Khi kết thúc chuyến công tác, hãy thực hiện bàn giao lại xe và cập nhật chỉ số km chính xác trên hệ thống.\n\n" +
                "Chúc bạn có những chuyến đi thượng lộ bình an!\n\n" +
                "Trân trọng,\nĐội xe VMS",
                request.getDriverName(),
                request.getLicensePlate()
        );

        String recipient = request.getDriverEmail() != null ? request.getDriverEmail() : "driver.an@vms.com";
        return sendEmail(recipient, subject, content, EmailType.ASSIGNMENT_NOTIFICATION);
    }

    public List<EmailLog> getLogs(int days) {
        return emailLogRepository.findPastDays(days);
    }

    public List<EmailLog> getRecentLogs(int limit) {
        return emailLogRepository.findRecent(limit);
    }
}
