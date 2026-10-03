package com.vms.user.dto;

import com.vms.user.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {
    private String username;
    private String password;
    private String fullName;
    private String email;
    private String phone;
    private Role role;
    private String driverLicenseNumber;
    private String driverLicenseClass;
}
