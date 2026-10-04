package com.vms.user.controller;

import com.vms.user.common.ApiResponse;
import com.vms.user.dto.LoginRequest;
import com.vms.user.dto.LoginResponse;
import com.vms.user.dto.RegisterRequest;
import com.vms.user.dto.UserDTO;
import com.vms.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping({"/api/auth/login", "/api/v1/auth/login", "/api/v1/users/login", "/api/users/login"})
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest request) {
        LoginResponse response = userService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công!", response));
    }

    @PostMapping({"/api/auth/register", "/api/v1/auth/register", "/api/v1/users/register", "/api/users/register"})
    public ResponseEntity<ApiResponse<LoginResponse>> register(@RequestBody RegisterRequest request) {
        LoginResponse response = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký tài khoản thành công!", response));
    }

    @GetMapping({"/api/auth/me", "/api/v1/auth/me", "/api/users/me", "/api/v1/users/me"})
    public ResponseEntity<ApiResponse<UserDTO>> me(@RequestHeader(value = "Authorization", required = false) String token) {
        UserDTO user = userService.getCurrentUser(token);
        return ResponseEntity.ok(ApiResponse.success(user));
    }
}
