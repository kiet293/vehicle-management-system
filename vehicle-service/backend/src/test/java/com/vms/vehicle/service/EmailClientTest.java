package com.vms.vehicle.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link EmailClient}. The class implements fault isolation: a
 * failing email service must never propagate an exception to the vehicle
 * workflow, otherwise a notification outage would block vehicle dispatch.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("EmailClient")
class EmailClientTest {

    @Mock
    private RestTemplate restTemplate;

    private EmailClient emailClient;

    @BeforeEach
    void setUp() {
        emailClient = new EmailClient(restTemplate);
        ReflectionTestUtils.setField(emailClient, "emailServiceUrl", "http://email-service:8084");
    }

    @Nested
    @DisplayName("sendMaintenanceAlert")
    class SendMaintenanceAlert {

        @Test
        @DisplayName("posts the maintenance payload to the expected endpoint")
        void postsExpectedPayload() {
            when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(Map.of("ok", true));

            emailClient.sendMaintenanceAlert("29A-888.88", 21000, 10000);

            ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
            @SuppressWarnings("rawtypes")
            ArgumentCaptor<Map> bodyCaptor = ArgumentCaptor.forClass(Map.class);
            verify(restTemplate).postForObject(urlCaptor.capture(), bodyCaptor.capture(), eq(Map.class));
            assertThat(urlCaptor.getValue()).isEqualTo("http://email-service:8084/api/email/alerts/maintenance");
            assertThat(bodyCaptor.getValue())
                    .containsEntry("licensePlate", "29A-888.88")
                    .containsEntry("currentOdometer", 21000)
                    .containsEntry("lastMaintenanceOdometer", 10000);
        }

        @Test
        @DisplayName("swallows a transport failure so dispatch is not blocked")
        void swallowsTransportFailure() {
            when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                    .thenThrow(new ResourceAccessException("Connection refused"));

            assertThatCode(() -> emailClient.sendMaintenanceAlert("29A-888.88", 21000, 10000))
                    .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("sendAssignmentNotification")
    class SendAssignmentNotification {

        @Test
        @DisplayName("posts the assignment payload to the expected endpoint")
        void postsExpectedPayload() {
            when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(Map.of("ok", true));

            emailClient.sendAssignmentNotification("29A-888.88", "Nguyen Van An", "an@example.com");

            ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
            @SuppressWarnings("rawtypes")
            ArgumentCaptor<Map> bodyCaptor = ArgumentCaptor.forClass(Map.class);
            verify(restTemplate).postForObject(urlCaptor.capture(), bodyCaptor.capture(), eq(Map.class));
            assertThat(urlCaptor.getValue()).isEqualTo("http://email-service:8084/api/email/alerts/assignment");
            assertThat(bodyCaptor.getValue())
                    .containsEntry("licensePlate", "29A-888.88")
                    .containsEntry("driverName", "Nguyen Van An")
                    .containsEntry("driverEmail", "an@example.com");
        }

        @Test
        @DisplayName("swallows a transport failure so dispatch is not blocked")
        void swallowsTransportFailure() {
            when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                    .thenThrow(new ResourceAccessException("Connection refused"));

            assertThatCode(() -> emailClient.sendAssignmentNotification("29A-888.88", "Nguyen Van An", "an@example.com"))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("swallows an unexpected server error")
        void swallowsServerError() {
            when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                    .thenThrow(new IllegalStateException("unexpected"));

            assertThatCode(() -> emailClient.sendAssignmentNotification("29A-888.88", "Nguyen Van An", "an@example.com"))
                    .doesNotThrowAnyException();
        }
    }
}