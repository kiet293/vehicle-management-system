package com.vms.user.config;

import com.vms.user.entity.Role;
import com.vms.user.entity.User;
import com.vms.user.entity.UserStatus;
import com.vms.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            log.info("Initializing default users in user_db...");

            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("Trần Quản Trị")
                    .email("admin@vms.com")
                    .phone("0912345678")
                    .role(Role.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .build();

            User manager = User.builder()
                    .username("manager")
                    .password(passwordEncoder.encode("manager123"))
                    .fullName("Lê Điều Phối")
                    .email("manager@vms.com")
                    .phone("0987654321")
                    .role(Role.MANAGER)
                    .status(UserStatus.ACTIVE)
                    .build();

            User driver1 = User.builder()
                    .username("driver1")
                    .password(passwordEncoder.encode("driver123"))
                    .fullName("Nguyễn Văn An")
                    .email("driver.an@vms.com")
                    .phone("0901234567")
                    .role(Role.DRIVER)
                    .driverLicenseNumber("2901928374")
                    .driverLicenseClass("B2")
                    .status(UserStatus.ACTIVE)
                    .build();

            User driver2 = User.builder()
                    .username("driver2")
                    .password(passwordEncoder.encode("driver123"))
                    .fullName("Phạm Hoàng Bình")
                    .email("driver.binh@vms.com")
                    .phone("0934567890")
                    .role(Role.DRIVER)
                    .driverLicenseNumber("2909876543")
                    .driverLicenseClass("C")
                    .status(UserStatus.ACTIVE)
                    .build();

            userRepository.saveAll(List.of(admin, manager, driver1, driver2));
            log.info("Successfully seeded 4 initial users: admin, manager, driver1, driver2");
        }
    }
}
