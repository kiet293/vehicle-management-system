package com.vms.email.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailLog {
    private String id;
    private String recipient;
    private String subject;
    private String content;
    private EmailType type;
    private EmailStatus status;
    private String errorMessage;
    @Builder.Default
    private LocalDateTime sentAt = LocalDateTime.now();
}
