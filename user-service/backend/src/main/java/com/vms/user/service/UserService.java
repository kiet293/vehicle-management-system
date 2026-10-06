package com.vms.user.service;

import com.vms.user.config.JwtTokenProvider;
import com.vms.user.dto.*;
import com.vms.user.entity.Role;
import com.vms.user.entity.User;
import com.vms.user.entity.UserStatus;
import com.vms.user.exception.BadRequestException;
import com.vms.user.exception.ResourceNotFoundException;
import com.vms.user.exception.UnauthorizedException;
import com.vms.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^0\\d{9}$");

    public LoginResponse login(LoginRequest request) {
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new BadRequestException("Vui lòng nhập tên đăng nhập");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new BadRequestException("Vui lòng nhập mật khẩu");
        }

        User user = userRepository.findByUsername(request.getUsername().trim())
                .orElseThrow(() -> new UnauthorizedException("Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại."));

        if (user.getStatus() == UserStatus.LOCKED) {
            throw new UnauthorizedException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên để được hỗ trợ.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại.");
        }

        String token = jwtTokenProvider.generateToken(user);
        return new LoginResponse(token, UserDTO.fromEntity(user));
    }

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        if (request.getPassword() == null || request.getPassword().trim().length() < 6) {
            throw new BadRequestException("Mật khẩu phải có tối thiểu 6 ký tự");
        }
        CreateUserRequest createReq = CreateUserRequest.builder()
                .username(request.getUsername())
                .password(request.getPassword())
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .role(request.getRole() != null ? request.getRole() : Role.DRIVER)
                .driverLicenseNumber(request.getDriverLicenseNumber())
                .driverLicenseClass(request.getDriverLicenseClass())
                .build();
        UserDTO userDTO = createUser(createReq);
        User user = userRepository.findById(userDTO.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng vừa tạo"));
        String token = jwtTokenProvider.generateToken(user);
        return new LoginResponse(token, userDTO);
    }

    public UserDTO getCurrentUser(String tokenHeader) {
        if (tokenHeader == null || !tokenHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Phiên làm việc không hợp lệ hoặc đã hết hạn.");
        }
        String token = tokenHeader.substring(7);
        if (!jwtTokenProvider.validateToken(token)) {
            throw new UnauthorizedException("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
        }
        String username = jwtTokenProvider.getUsernameFromToken(token);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng."));
        return UserDTO.fromEntity(user);
    }

    public List<UserDTO> getAllUsers(Role role, String search) {
        List<User> list = userRepository.findAll();
        return list.stream()
                .filter(u -> role == null || u.getRole() == role)
                .filter(u -> {
                    if (search == null || search.trim().isEmpty()) return true;
                    String s = search.trim().toLowerCase();
                    return (u.getFullName() != null && u.getFullName().toLowerCase().contains(s)) ||
                            (u.getUsername() != null && u.getUsername().toLowerCase().contains(s)) ||
                            (u.getEmail() != null && u.getEmail().toLowerCase().contains(s)) ||
                            (u.getPhone() != null && u.getPhone().contains(s));
                })
                .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + id));
        return UserDTO.fromEntity(user);
    }

    @Transactional
    public UserDTO createUser(CreateUserRequest request) {
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new BadRequestException("Tên đăng nhập không được để trống");
        }
        if (userRepository.existsByUsername(request.getUsername().trim())) {
            throw new BadRequestException("Tên đăng nhập này đã được sử dụng");
        }
        if (request.getFullName() == null || request.getFullName().trim().length() < 2 || request.getFullName().trim().length() > 100) {
            throw new BadRequestException("Họ tên không được để trống (từ 2 đến 100 ký tự)");
        }
        if (request.getEmail() == null || !EMAIL_PATTERN.matcher(request.getEmail().trim()).matches()) {
            throw new BadRequestException("Địa chỉ email không hợp lệ (ví dụ: nguyenvana@gmail.com)");
        }
        if (userRepository.existsByEmail(request.getEmail().trim())) {
            throw new BadRequestException("Email này đã được sử dụng bởi một nhân viên khác");
        }
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty() && !PHONE_PATTERN.matcher(request.getPhone().trim()).matches()) {
            throw new BadRequestException("Số điện thoại không hợp lệ (phải gồm 10 chữ số bắt đầu bằng số 0)");
        }
        if (request.getRole() == Role.DRIVER) {
            if (request.getDriverLicenseClass() == null || request.getDriverLicenseClass().trim().isEmpty()) {
                throw new BadRequestException("Vui lòng chọn hạng bằng lái cho tài xế (B1, B2, C, D, E, FC)");
            }
        }

        String rawPassword = (request.getPassword() != null && !request.getPassword().trim().isEmpty()) 
                ? request.getPassword().trim() 
                : "123456";

        User user = User.builder()
                .username(request.getUsername().trim())
                .password(passwordEncoder.encode(rawPassword))
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim())
                .phone(request.getPhone() != null ? request.getPhone().trim() : "")
                .role(request.getRole() != null ? request.getRole() : Role.DRIVER)
                .driverLicenseNumber(request.getDriverLicenseNumber())
                .driverLicenseClass(request.getRole() == Role.DRIVER ? request.getDriverLicenseClass() : null)
                .status(UserStatus.ACTIVE)
                .build();

        User saved = userRepository.save(user);
        return UserDTO.fromEntity(saved);
    }

    public User getCallerUser(String tokenHeader) {
        if (tokenHeader == null || !tokenHeader.startsWith("Bearer ")) {
            return null;
        }
        try {
            String token = tokenHeader.substring(7);
            if (jwtTokenProvider.validateToken(token)) {
                String username = jwtTokenProvider.getUsernameFromToken(token);
                return userRepository.findByUsername(username).orElse(null);
            }
        } catch (Exception ignored) {}
        return null;
    }

    @Transactional
    public UserDTO createUser(CreateUserRequest request, String tokenHeader) {
        User caller = getCallerUser(tokenHeader);
        if (caller != null && caller.getRole() == Role.MANAGER) {
            if (request.getRole() == Role.ADMIN) {
                throw new BadRequestException("Người điều phối (MANAGER) chỉ có quyền tạo tài khoản Tài xế hoặc Điều phối viên, không được phép tạo Quản trị viên (ADMIN)!");
            }
        }
        return createUser(request);
    }

    @Transactional
    public UserDTO updateUser(Long id, UpdateUserRequest request, String tokenHeader) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + id));

        User caller = getCallerUser(tokenHeader);
        if (caller != null && caller.getRole() == Role.MANAGER) {
            if (user.getRole() == Role.ADMIN) {
                throw new BadRequestException("Người điều phối (MANAGER) không có quyền chỉnh sửa tài khoản Quản trị viên (ADMIN)!");
            }
            if (request.getRole() == Role.ADMIN) {
                throw new BadRequestException("Người điều phối (MANAGER) chỉ có quyền phân quyền Tài xế hoặc Điều phối viên, không được phép chuyển quyền lên Quản trị viên (ADMIN)!");
            }
        }

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            String email = request.getEmail().trim();
            if (!EMAIL_PATTERN.matcher(email).matches()) {
                throw new BadRequestException("Địa chỉ email không hợp lệ");
            }
            if (!email.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(email)) {
                throw new BadRequestException("Email này đã được sử dụng bởi một nhân viên khác");
            }
            user.setEmail(email);
        }
        if (request.getPhone() != null) {
            if (!request.getPhone().trim().isEmpty() && !PHONE_PATTERN.matcher(request.getPhone().trim()).matches()) {
                throw new BadRequestException("Số điện thoại không hợp lệ (10 chữ số bắt đầu bằng 0)");
            }
            user.setPhone(request.getPhone().trim());
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (user.getRole() == Role.DRIVER) {
            if (request.getDriverLicenseClass() != null) {
                user.setDriverLicenseClass(request.getDriverLicenseClass());
            }
            if (request.getDriverLicenseNumber() != null) {
                user.setDriverLicenseNumber(request.getDriverLicenseNumber());
            }
        } else {
            user.setDriverLicenseClass(null);
            user.setDriverLicenseNumber(null);
        }
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            if (request.getPassword().trim().length() < 6) {
                throw new BadRequestException("Mật khẩu mới phải có tối thiểu 6 ký tự");
            }
            user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        }

        User updated = userRepository.save(user);
        return UserDTO.fromEntity(updated);
    }

    @Transactional
    public UserDTO updateUser(Long id, UpdateUserRequest request) {
        return updateUser(id, request, null);
    }

    @Transactional
    public UserDTO updateStatus(Long id, UserStatus status, String tokenHeader) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + id));

        User caller = getCallerUser(tokenHeader);
        if (caller != null && caller.getRole() == Role.MANAGER) {
            if (user.getRole() == Role.ADMIN) {
                throw new BadRequestException("Người điều phối (MANAGER) không có quyền khóa hoặc mở khóa tài khoản Quản trị viên (ADMIN)!");
            }
        }

        user.setStatus(status);
        User updated = userRepository.save(user);
        return UserDTO.fromEntity(updated);
    }

    @Transactional
    public UserDTO updateStatus(Long id, UserStatus status) {
        return updateStatus(id, status, null);
    }

    @Transactional
    public void deleteUser(Long id, String tokenHeader) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + id));

        User caller = getCallerUser(tokenHeader);
        if (caller != null && caller.getRole() == Role.MANAGER) {
            if (user.getRole() == Role.ADMIN) {
                throw new BadRequestException("Người điều phối (MANAGER) không có quyền xóa tài khoản Quản trị viên (ADMIN)!");
            }
        }

        userRepository.deleteById(id);
    }

    @Transactional
    public void deleteUser(Long id) {
        deleteUser(id, null);
    }

    public List<UserDTO> getAvailableDrivers() {
        return userRepository.findAllByRoleAndStatus(Role.DRIVER, UserStatus.ACTIVE).stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }
}
