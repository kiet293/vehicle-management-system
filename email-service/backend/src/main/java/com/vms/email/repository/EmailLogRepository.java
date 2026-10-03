package com.vms.email.repository;

import com.vms.email.entity.EmailLog;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Repository
public class EmailLogRepository {

    private final List<EmailLog> logs = new CopyOnWriteArrayList<>();

    public EmailLog save(EmailLog log) {
        logs.add(0, log); // Add newest first
        if (logs.size() > 500) {
            logs.remove(logs.size() - 1);
        }
        return log;
    }

    public List<EmailLog> findAll() {
        return Collections.unmodifiableList(new ArrayList<>(logs));
    }

    public List<EmailLog> findRecent(int limit) {
        return logs.stream().limit(limit).collect(Collectors.toList());
    }

    public List<EmailLog> findPastDays(int days) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(days);
        return logs.stream()
                .filter(l -> l.getSentAt() != null && l.getSentAt().isAfter(cutoff))
                .collect(Collectors.toList());
    }
}
