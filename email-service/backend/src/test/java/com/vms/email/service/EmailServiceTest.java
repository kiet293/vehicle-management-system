package com.vms.email.service;

import com.vms.email.dto.AutoNotificationRequest;
import com.vms.email.dto.MaintenanceAlertRequest;
import com.vms.email.entity.EmailLog;
import com.vms.email.entity.EmailStatus;
import com.vms.email.entity.EmailType;
import com.vms.email.repository.EmailLogRepository;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EmailService Unit Tests")
class EmailServiceTest {

    @Mock
    private EmailLogRepository emailLogRepository;

    @Mock
    private JavaMailSender mailSender;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(emailLogRepository);
        ReflectionTestUtils.setField(emailService, "mailSender", mailSender);
        ReflectionTestUtils.setField(emailService, "fromEmail", "vms.sender@gmail.com");
        ReflectionTestUtils.setField(emailService, "productName", "Hệ thống Quản lý Phương tiện VMS");
        ReflectionTestUtils.setField(emailService, "defaultRecipient", "user.target@gmail.com");

        when(emailLogRepository.save(any(EmailLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @DisplayName("Should automatically route notification to default user recipient when no recipient is provided")
    void shouldAutoRouteToUserRecipientWhenEmpty() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        MaintenanceAlertRequest request = MaintenanceAlertRequest.builder()
                .licensePlate("29A-888.88")
                .currentOdometer(25000)
                .lastMaintenanceOdometer(18000)
                .recipientEmail(null) // Không tự nhập
                .build();

        EmailLog log = emailService.sendMaintenanceAlert(request);

        assertThat(log.getRecipient()).isEqualTo("user.target@gmail.com");
        assertThat(log.getType()).isEqualTo(EmailType.MAINTENANCE_ALERT);
        assertThat(log.getStatus()).isEqualTo(EmailStatus.SENT);
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should use Product Name as sender display name instead of personal name")
    void shouldUseProductNameAsSenderName() throws Exception {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        AutoNotificationRequest request = AutoNotificationRequest.builder()
                .title("Thông báo định kỳ")
                .message("Hệ thống hoạt động bình thường")
                .build();

        EmailLog log = emailService.sendAutoNotification(request);

        assertThat(log.getRecipient()).isEqualTo("user.target@gmail.com");
        assertThat(log.getType()).isEqualTo(EmailType.AUTO_NOTIFICATION);

        ArgumentCaptor<MimeMessage> messageCaptor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        MimeMessage captured = messageCaptor.getValue();
        assertThat(captured.getFrom()).isNotNull();
        assertThat(captured.getFrom()[0].toString()).contains("Hệ thống Quản lý Phương tiện VMS");
    }

    @Test
    @DisplayName("Should isolate faults smoothly and record MOCK_SENT when mailSender is null")
    void shouldFallbackToMockSentWhenMailSenderNull() {
        ReflectionTestUtils.setField(emailService, "mailSender", null);

        EmailLog log = emailService.sendEmail("", "Test Subject", "Test Content", EmailType.MANUAL);

        assertThat(log.getStatus()).isEqualTo(EmailStatus.MOCK_SENT);
        assertThat(log.getRecipient()).isEqualTo("user.target@gmail.com");
    }
}
