package com.example.rental.controller;

import com.example.rental.dto.*;
import com.example.rental.entity.User;
import com.example.rental.mapper.UserMapper;
import com.example.rental.services.IAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final IAuthService iAuthService;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@RequestBody @Valid RegisterRequest request) {
        return  ResponseEntity.ok(iAuthService.register(request));
    }

    @GetMapping("/verify")
    public ResponseEntity<String> verifyAccount(@RequestParam String email, @RequestParam String code) {
        boolean verified = iAuthService.verify(email, code);
        if (verified) {
            return ResponseEntity.ok("Account verified successfully!");
        }
        return ResponseEntity.status(400).body("Invalid or expired verification link.");
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        return ResponseEntity.ok(iAuthService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshAccessTokenResponse> refreshAccessToken(@RequestBody @Valid RefreshAccessTokenRequest request) {
        return ResponseEntity.ok(iAuthService.refreshAccessToken(request));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal User user) {
        if (user == null) {
            log.warn("AuthController.me() - User is null, authentication failed");
            return ResponseEntity.status(401).body(Map.of(
                    "error", "Authentication failed",
                    "message", "User not authenticated or token invalid"
            ));
        }

        log.info("AuthController.me() - Authenticated user: {} (ID: {})", user.getEmail(), user.getId());
        return ResponseEntity.ok(UserMapper.toDTO(user));
    }
}
