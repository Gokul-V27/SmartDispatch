package com.smartdispatch.repository;

import com.smartdispatch.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByWorkerId(String workerId);
    List<User> findByRole(User.Role role);
    boolean existsByEmail(String email);
}
