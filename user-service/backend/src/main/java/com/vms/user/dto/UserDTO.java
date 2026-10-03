package com.vms.user.dto;

import com.vms.user.entity.Role;
import com.vms.user.entity.User;
import com.vms.user.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private Role role;
    private String driverLicenseNumber;
    private String driverLicenseClass;
    private UserStatus status;
    private LocalDateTime createdAt;

    public static UserDTO fromEntity(User user) {
        if (user == null) return null;
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .driverLicenseNumber(user.getDriverLicenseNumber())
                .driverLicenseClass(user.getDriverLicenseClass())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
