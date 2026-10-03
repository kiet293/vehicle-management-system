package com.vms.email.dto;

import com.vms.email.entity.EmailType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendEmailRequest {
    private String to;
    private String subject;
    private String content;
    private EmailType type;
}
