package com.vms.email.service;

import com.vms.email.dto.AssignmentAlertRequest;
import com.vms.email.dto.AutoNotificationRequest;
import com.vms.email.dto.HighCostAlertRequest;
import com.vms.email.dto.MaintenanceAlertRequest;
import com.vms.email.entity.EmailLog;
import com.vms.email.entity.EmailStatus;
import com.vms.email.entity.EmailType;
import com.vms.email.repository.EmailLogRepository;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final EmailLogRepository emailLogRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired(required = false)
    private RestTemplate restTemplate;

    @Value("${spring.mail.username:noreply@vms.com}")
    private String fromEmail;

    @Value("${app.email.product-name:Hệ thống Quản lý Phương tiện VMS}")
    private String productName;

    @Value("${app.email.default-recipient:${spring.mail.username:admin@vms.com}}")
    private String defaultRecipient;

    @Value("${app.services.user-service-url:http://localhost:8081}")
    private String userServiceUrl;

    /**
     * Tự động giải quyết địa chỉ email nhận thông báo:
     * - Nếu client truyền email thực tế (không phải mock domain ảo @vms.com / @example.com), sử dụng email đó.
     * - Nếu không truyền hoặc là email giả định, hệ thống tự động điều hướng về email người dùng
     *   được cấu hình (NOTIFICATION_RECIPIENT_EMAIL / MAIL_USERNAME) để người dùng không phải tự nhập tay.
     */
    public String resolveRecipient(String requestedRecipient) {
        if (requestedRecipient != null && !requestedRecipient.trim().isEmpty()) {
            String trimmed = requestedRecipient.trim();
            if (!trimmed.endsWith("@vms.com") && !trimmed.endsWith("@example.com") && !trimmed.contains("placeholder")) {
                return trimmed;
            }
        }

        // Tự động dùng email người dùng cấu hình nhận thông báo (email thực tế)
        if (defaultRecipient != null && !defaultRecipient.trim().isEmpty()
                && !defaultRecipient.contains("placeholder")
                && !defaultRecipient.endsWith("@vms.com")
                && !defaultRecipient.endsWith("@example.com")) {
            return defaultRecipient.trim();
        }

        // Fallback về email gửi nếu là tài khoản thực tế (như Gmail)
        if (fromEmail != null && fromEmail.contains("@")
                && !fromEmail.contains("placeholder")
                && !fromEmail.endsWith("@vms.com")
                && !fromEmail.endsWith("@example.com")) {
            return fromEmail.trim();
        }

        return (requestedRecipient != null && !requestedRecipient.trim().isEmpty())
                ? requestedRecipient.trim()
                : "user@vms.com";
    }

    /**
     * Tự động truy vấn email người dùng theo Vai trò từ user-service (với cơ chế cách ly lỗi Fault Isolation)
     */
    public List<String> fetchUserEmailsByRole(String role) {
        List<String> emails = new ArrayList<>();
        if (restTemplate != null && userServiceUrl != null && !userServiceUrl.isEmpty()) {
            try {
                String url = userServiceUrl + "/api/users" + (role != null ? "?role=" + role : "");
                ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        null,
                        new ParameterizedTypeReference<Map<String, Object>>() {}
                );
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    Object dataObj = response.getBody().get("data");
                    if (dataObj instanceof List<?> list) {
                        for (Object item : list) {
                            if (item instanceof Map<?, ?> userMap) {
                                Object emailObj = userMap.get("email");
                                if (emailObj instanceof String em && !em.trim().isEmpty()
                                        && !em.endsWith("@vms.com") && !em.endsWith("@example.com")) {
                                    emails.add(em.trim());
                                }
                            }
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Could not query user-service for user emails (Fault Isolation active): {}", ex.getMessage());
            }
        }
        if (emails.isEmpty()) {
            emails.add(resolveRecipient(null));
        }
        return emails;
    }

    /**
     * Gửi email với Tên người gửi là Tên Sản Phẩm và Người nhận được phân giải tự động
     */
    public EmailLog sendEmail(String to, String subject, String content, EmailType type) {
        String logId = UUID.randomUUID().toString();
        EmailStatus status = EmailStatus.SENT;
        String errorMsg = null;

        String recipient = resolveRecipient(to);
        String emailSubject = (subject != null && !subject.trim().isEmpty())
                ? subject.trim()
                : "[" + productName + "] Thông báo từ Hệ thống Quản lý Phương tiện";
        String emailContent = (content != null) ? content : "";
        EmailType emailType = (type != null) ? type : EmailType.MANUAL;

        // Gửi qua SMTP với MimeMessageHelper để Tên người gửi là Tên Sản Phẩm
        if (mailSender != null && !fromEmail.contains("placeholder") && !fromEmail.contains("example.com")) {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

                // Hiển thị Tên người gửi là Tên Sản Phẩm thay vì tên cá nhân
                helper.setFrom(new InternetAddress(fromEmail, productName, "UTF-8"));
                helper.setTo(recipient);
                helper.setSubject(emailSubject);

                // Hỗ trợ cả định dạng Text thuần và HTML có giao diện thương hiệu sản phẩm
                String htmlContent = buildHtmlTemplate(emailSubject, emailContent);
                helper.setText(emailContent, htmlContent);

                mailSender.send(mimeMessage);
                log.info("Sent email successfully from '{}' to '{}' with subject: {}", productName, recipient, emailSubject);
            } catch (Exception ex) {
                log.warn("SMTP send failed ({}), recorded as FAILED.", ex.getMessage());
                status = EmailStatus.FAILED;
                errorMsg = "Lỗi kết nối máy chủ SMTP Gmail: " + ex.getMessage();
            }
        } else {
            log.info("Simulating email send (Stateless Mock): From: '{}', To: '{}', Subject: '{}'",
                    productName, recipient, emailSubject);
            status = EmailStatus.MOCK_SENT;
        }

        EmailLog logEntry = EmailLog.builder()
                .id(logId)
                .recipient(recipient)
                .subject(emailSubject)
                .content(emailContent)
                .type(emailType)
                .status(status)
                .errorMessage(errorMsg)
                .sentAt(LocalDateTime.now())
                .build();

        return emailLogRepository.save(logEntry);
    }

    /**
     * Tự động gửi thông báo cho Người dùng hệ thống (không cần tự nhập email)
     */
    public EmailLog sendAutoNotification(AutoNotificationRequest request) {
        String recipient = resolveRecipient(request.getRecipientEmail());
        String title = request.getTitle() != null && !request.getTitle().trim().isEmpty()
                ? request.getTitle().trim()
                : "[" + productName + "] Thông báo tự động từ Hệ thống";

        StringBuilder content = new StringBuilder();
        content.append("Kính gửi Quý người dùng hệ thống,\n\n");
        if (request.getMessage() != null && !request.getMessage().trim().isEmpty()) {
            content.append(request.getMessage()).append("\n\n");
        }
        if (request.getReferenceId() != null && !request.getReferenceId().trim().isEmpty()) {
            content.append("Mã tham chiếu / Đối tượng: ").append(request.getReferenceId()).append("\n");
        }
        if (request.getCategory() != null && !request.getCategory().trim().isEmpty()) {
            content.append("Phân loại thông báo: ").append(request.getCategory()).append("\n");
        }
        content.append("\nThông báo này được gửi tự động từ hệ thống quản lý. Vui lòng đăng nhập để kiểm tra chi tiết.\n\n");
        content.append("Trân trọng,\n").append(productName);

        return sendEmail(recipient, title, content.toString(), EmailType.AUTO_NOTIFICATION);
    }

    /**
     * Tự động gửi cảnh báo bảo dưỡng đến người dùng quản lý / phụ trách
     */
    public EmailLog sendMaintenanceAlert(MaintenanceAlertRequest request) {
        String recipient = resolveRecipient(request.getRecipientEmail());
        String subject = "[" + productName + " CẢNH BÁO] Xe " + request.getLicensePlate() + " đã đến kỳ bảo dưỡng định kỳ";
        String content = String.format(
                "Kính gửi Ban Quản trị và Người phụ trách phương tiện,\n\n" +
                "Hệ thống phát hiện phương tiện %s đã đạt chỉ số công-tơ-mét: %d km.\n" +
                "Quãng đường kể từ lần bảo dưỡng trước đã vượt mốc định mức 5.000 km (mốc trước: %d km).\n\n" +
                "Danh mục các hạng mục khuyến nghị kiểm tra & bảo dưỡng:\n" +
                " - Thay dầu động cơ và cốc lọc dầu\n" +
                " - Kiểm tra hệ thống phanh trước/sau và dầu phanh\n" +
                " - Đảo lốp và kiểm tra áp suất 4 bánh\n" +
                " - Vệ sinh lọc gió động cơ và điều hòa\n\n" +
                "Vui lòng sớm sắp xếp đưa xe vào xưởng gara để đảm bảo an toàn vận hành.\n\n" +
                "Trân trọng,\n%s",
                request.getLicensePlate(),
                request.getCurrentOdometer() != null ? request.getCurrentOdometer() : 0,
                request.getLastMaintenanceOdometer() != null ? request.getLastMaintenanceOdometer() : 0,
                productName
        );

        return sendEmail(recipient, subject, content, EmailType.MAINTENANCE_ALERT);
    }

    /**
     * Tự động gửi cảnh báo chi phí lớn phát sinh đến người dùng quản lý
     */
    public EmailLog sendHighCostAlert(HighCostAlertRequest request) {
        String recipient = resolveRecipient(request.getRecipientEmail());
        NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN"));
        String formattedAmount = request.getAmount() != null ? currencyFormat.format(request.getAmount()) : "0 ₫";

        String subject = "[" + productName + " CẢNH BÁO] Phát sinh phiếu chi lớn cho xe " + request.getLicensePlate();
        String content = String.format(
                "Kính gửi Quản lý Đội xe,\n\n" +
                "Hệ thống vừa ghi nhận một khoản chi phí vượt ngưỡng định mức cảnh báo (> 5.000.000 ₫):\n\n" +
                " - Biển số xe: %s\n" +
                " - Loại chi phí: %s\n" +
                " - Số tiền: %s\n" +
                " - Người kê khai: %s\n" +
                " - Nội dung: %s\n\n" +
                "Vui lòng truy cập hệ thống để kiểm tra hóa đơn và phê duyệt phiếu chi.\n\n" +
                "Trân trọng,\nPhòng Quản trị Chi phí - %s",
                request.getLicensePlate(),
                request.getCostType(),
                formattedAmount,
                request.getDriverName(),
                request.getDescription(),
                productName
        );

        return sendEmail(recipient, subject, content, EmailType.HIGH_COST_ALERT);
    }

    /**
     * Tự động gửi thông báo bàn giao phương tiện đến người dùng / tài xế
     */
    public EmailLog sendAssignmentNotification(AssignmentAlertRequest request) {
        String recipient = resolveRecipient(request.getDriverEmail());
        String subject = "[" + productName + "] Thông báo điều phối phương tiện: " + request.getLicensePlate();
        String content = String.format(
                "Chào %s,\n\n" +
                "Bạn đã được Ban Quản lý bàn giao phụ trách phương tiện có biển số: %s.\n\n" +
                "Vui lòng kiểm tra tình trạng xe, mức nhiên liệu và chỉ số công-tơ-mét trước khi nhận bàn giao.\n" +
                "Khi kết thúc chuyến công tác, hãy thực hiện bàn giao lại xe và cập nhật chỉ số km chính xác trên hệ thống.\n\n" +
                "Chúc bạn có những chuyến đi thượng lộ bình an!\n\n" +
                "Trân trọng,\n%s",
                request.getDriverName() != null ? request.getDriverName() : "Quý tài xế",
                request.getLicensePlate(),
                productName
        );

        return sendEmail(recipient, subject, content, EmailType.ASSIGNMENT_NOTIFICATION);
    }

    public List<EmailLog> getLogs(int days) {
        return emailLogRepository.findPastDays(days);
    }

    public List<EmailLog> getRecentLogs(int limit) {
        return emailLogRepository.findRecent(limit);
    }

    /**
     * Tạo template HTML chuyên nghiệp với nhận diện thương hiệu sản phẩm
     */
    private String buildHtmlTemplate(String subject, String plainText) {
        String formattedBody = plainText
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\n", "<br/>");

        return "<!DOCTYPE html>" +
                "<html><head><meta charset='utf-8'>" +
                "<style>" +
                "  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }" +
                "  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }" +
                "  .header { background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); padding: 28px 24px; color: #ffffff; text-align: center; }" +
                "  .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase; }" +
                "  .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.92; }" +
                "  .content { padding: 32px 28px; line-height: 1.65; font-size: 14px; }" +
                "  .subject-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }" +
                "  .message-box { background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 6px; padding: 18px; font-size: 14px; color: #334155; margin-bottom: 20px; line-height: 1.6; }" +
                "  .notice { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 10px 14px; border-radius: 6px; }" +
                "  .footer { background: #f8fafc; padding: 20px 24px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }" +
                "  .footer strong { color: #334155; }" +
                "</style></head>" +
                "<body>" +
                "  <div class='container'>" +
                "    <div class='header'>" +
                "      <h1>" + productName + "</h1>" +
                "      <p>Hệ thống Thông báo &amp; Giám sát Tự động Vận hành</p>" +
                "    </div>" +
                "    <div class='content'>" +
                "      <div class='subject-title'>" + subject + "</div>" +
                "      <div class='message-box'>" + formattedBody + "</div>" +
                "      <div class='notice'>⚡ Thư này được hệ thống gửi tự động đến tài khoản người dùng theo dõi. Bạn không cần thực hiện thêm thao tác nhập lại email.</div>" +
                "    </div>" +
                "    <div class='footer'>" +
                "      <strong>" + productName + "</strong><br/>" +
                "      Email được gửi tự động từ máy chủ dịch vụ. Vui lòng không trả lời trực tiếp thư này." +
                "    </div>" +
                "  </div>" +
                "</body></html>";
    }
}
