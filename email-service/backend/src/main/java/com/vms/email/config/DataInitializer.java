package com.vms.email.config;

import com.vms.email.entity.EmailLog;
import com.vms.email.entity.EmailStatus;
import com.vms.email.entity.EmailType;
import com.vms.email.repository.EmailLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final EmailLogRepository emailLogRepository;

    @Override
    public void run(String... args) {
        if (emailLogRepository.findAll().isEmpty()) {
            log.info("Initializing sample notification logs in email-service...");

            EmailLog l1 = EmailLog.builder()
                    .id(UUID.randomUUID().toString())
                    .recipient("manager@vms.com")
                    .subject("[VMS CẢNH BÁO] Xe 29B-456.78 đã đến kỳ bảo dưỡng định kỳ")
                    .content("Xe Ford Transit (29B-456.78) đã đạt 62.000 km, vượt mốc bảo dưỡng định kỳ 5.000 km.")
                    .type(EmailType.MAINTENANCE_ALERT)
                    .status(EmailStatus.SENT)
                    .sentAt(LocalDateTime.now().minusDays(1).minusHours(3))
                    .build();

            EmailLog l2 = EmailLog.builder()
                    .id(UUID.randomUUID().toString())
                    .recipient("manager@vms.com")
                    .subject("[VMS CẢNH BÁO] Phát sinh phiếu chi lớn cho xe 29B-456.78")
                    .content("Phiếu chi bảo dưỡng xe 29B-456.78 với số tiền 6.500.000 ₫ đã được ghi nhận.")
                    .type(EmailType.HIGH_COST_ALERT)
                    .status(EmailStatus.SENT)
                    .sentAt(LocalDateTime.now().minusDays(3).minusHours(5))
                    .build();

            EmailLog l3 = EmailLog.builder()
                    .id(UUID.randomUUID().toString())
                    .recipient("driver.an@vms.com")
                    .subject("[VMS] Thông báo điều phối phương tiện: 30H-123.45")
                    .content("Bạn đã được bàn giao phương tiện Ford Ranger Wildtrak (30H-123.45).")
                    .type(EmailType.ASSIGNMENT_NOTIFICATION)
                    .status(EmailStatus.SENT)
                    .sentAt(LocalDateTime.now().minusDays(5))
                    .build();

            emailLogRepository.save(l3);
            emailLogRepository.save(l2);
            emailLogRepository.save(l1);

            log.info("Seeded 3 sample email notification logs.");
        }
    }
}
