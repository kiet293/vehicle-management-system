package com.vms.user.repository;

import com.vms.user.entity.Role;
import com.vms.user.entity.User;
import com.vms.user.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    List<Role> findByRole(Role role);
    List<User> findAllByRoleAndStatus(Role role, UserStatus status);
}
