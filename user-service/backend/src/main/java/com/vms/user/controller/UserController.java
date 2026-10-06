package com.vms.user.controller;

import com.vms.user.common.ApiResponse;
import com.vms.user.dto.CreateUserRequest;
import com.vms.user.dto.UpdateStatusRequest;
import com.vms.user.dto.UpdateUserRequest;
import com.vms.user.dto.UserDTO;
import com.vms.user.entity.Role;
import com.vms.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping({"/api/users", "/api/v1/users"})
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String search) {
        List<UserDTO> users = userService.getAllUsers(role, search);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(@PathVariable Long id) {
        UserDTO user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserDTO>> createUser(
            @RequestBody CreateUserRequest request,
            @RequestHeader(value = "Authorization", required = false) String tokenHeader) {
        UserDTO created = userService.createUser(request, tokenHeader);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm nhân viên " + created.getFullName() + " thành công!", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request,
            @RequestHeader(value = "Authorization", required = false) String tokenHeader) {
        UserDTO updated = userService.updateUser(id, request, tokenHeader);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin nhân viên thành công!", updated));
    }

    @RequestMapping(value = "/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<ApiResponse<UserDTO>> updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request,
            @RequestHeader(value = "Authorization", required = false) String tokenHeader) {
        UserDTO updated = userService.updateStatus(id, request.getStatus(), tokenHeader);
        String msg = updated.getStatus() != null && updated.getStatus().name().equals("LOCKED")
                ? "Đã khóa tài khoản thành công!"
                : "Đã kích hoạt tài khoản thành công!";
        return ResponseEntity.ok(ApiResponse.success(msg, updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String tokenHeader) {
        userService.deleteUser(id, tokenHeader);
        return ResponseEntity.ok(ApiResponse.success("Xóa nhân viên thành công!", null));
    }

    @GetMapping({"/drivers/available", "/drivers"})
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAvailableDrivers() {
        List<UserDTO> drivers = userService.getAvailableDrivers();
        return ResponseEntity.ok(ApiResponse.success(drivers));
    }
}
