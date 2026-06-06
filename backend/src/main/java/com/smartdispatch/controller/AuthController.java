package com.smartdispatch.controller;

import com.smartdispatch.entity.User;
import com.smartdispatch.repository.UserRepository;
import com.smartdispatch.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String name = body.get("name");
        String phone = body.getOrDefault("phone", "");
        String roleStr = body.getOrDefault("role", "CUSTOMER");

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
        }

        User.Role role = User.Role.valueOf(roleStr.toUpperCase());

        User user = User.builder()
                .name(name)
                .email(email)
                .phone(phone)
                .passwordHash(passwordEncoder.encode(password))
                .role(role)
                .build();

        // Generate worker ID for packers
        if (role == User.Role.PACKER || role == User.Role.DELIVERY) {
            user.setWorkerId("WK-" + String.format("%05d", (int) (Math.random() * 99999)));
            if (body.containsKey("pin")) {
                user.setPinHash(passwordEncoder.encode(body.get("pin")));
            }
        }

        userRepository.save(user);

        String token = jwtService.generateToken(
                user.getId().toString(), user.getEmail(), user.getRole().name());

        return ResponseEntity.ok(Map.of(
                "token", token,
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole(),
                        "workerId", user.getWorkerId() != null ? user.getWorkerId() : "")));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        if (!user.isActive()) {
            return ResponseEntity.status(403).body(Map.of("error", "Account deactivated"));
        }

        String token = jwtService.generateToken(
                user.getId().toString(), user.getEmail(), user.getRole().name());

        return ResponseEntity.ok(Map.of(
                "token", token,
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole(),
                        "workerId", user.getWorkerId() != null ? user.getWorkerId() : "")));
    }

    @PostMapping("/pin-login")
    public ResponseEntity<?> pinLogin(@RequestBody Map<String, String> body) {
        String workerId = body.get("workerId");
        String pin = body.get("pin");

        var userOpt = userRepository.findByWorkerId(workerId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Worker not found"));
        }

        User user = userOpt.get();
        if (user.getPinHash() == null || !passwordEncoder.matches(pin, user.getPinHash())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid PIN"));
        }

        String token = jwtService.generateToken(
                user.getId().toString(), user.getEmail(), user.getRole().name());

        return ResponseEntity.ok(Map.of("token", token, "user", Map.of(
                "id", user.getId(), "name", user.getName(),
                "role", user.getRole(), "workerId", user.getWorkerId())));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String userId = jwtService.getUserId(token);
        var user = userRepository.findById(UUID.fromString(userId));
        return user.map(u -> ResponseEntity.ok(Map.of(
                "id", u.getId(), "name", u.getName(), "email", u.getEmail(),
                "role", u.getRole(), "workerId", u.getWorkerId() != null ? u.getWorkerId() : "")))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(@RequestParam(required = false) String role) {
        List<User> users;
        if (role != null && !role.isEmpty()) {
            users = userRepository.findAll().stream()
                .filter(u -> u.getRole().name().equalsIgnoreCase(role))
                .toList();
        } else {
            users = userRepository.findAll();
        }
        return ResponseEntity.ok(users.stream().map(u -> Map.of(
            "id", u.getId(),
            "name", u.getName(),
            "email", u.getEmail(),
            "phone", u.getPhone() != null ? u.getPhone() : "",
            "role", u.getRole(),
            "workerId", u.getWorkerId() != null ? u.getWorkerId() : "",
            "isActive", u.isActive()
        )).toList());
    }
}
